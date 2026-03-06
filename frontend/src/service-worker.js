// frontend/src/service-worker.js
/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

clientsClaim();

// Кэшируем статические файлы
precacheAndRoute(self.__WB_MANIFEST);

// Кэшируем изображения
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// Кэшируем API запросы
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] })
    ]
  })
);

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-flight-data') {
    event.waitUntil(syncFlightData());
  }
});

async function syncFlightData() {
  try {
    // Получаем несинхронизированные данные из IndexedDB
    const db = await openDB();
    const unsynced = await db.getAll('syncQueue');
    
    for (const item of unsynced) {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
      });
      
      await db.delete('syncQueue', item.id);
    }
    
    // Уведомляем пользователя
    self.registration.showNotification('✅ Данные синхронизированы', {
      body: 'Все записи отправлены на сервер',
      icon: '/icon-192.png'
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FlightTracker', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}