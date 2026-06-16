// frontend/src/utils/sync.ts
import { db } from '../db/database';

export async function syncWithServer() {
  if (!navigator.onLine) {
    console.log('📴 Offline mode - data saved locally');
    return { synced: 0, pending: await db.syncQueue.count() };
  }

  const pendingItems = await db.syncQueue.toArray();
  
  if (pendingItems.length === 0) {
    return { synced: 0, pending: 0 };
  }

  console.log(`🔄 Syncing ${pendingItems.length} items...`);
  let syncedCount = 0;

  for (const item of pendingItems) {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation: item.operation,
          table: item.table,
          data: item.data
        })
      });

      if (response.ok) {
        await db.syncQueue.delete(item.id!);
        syncedCount++;
        console.log(`✅ Synced: ${item.table} - ${item.operation}`);
      } else {
        console.error(`❌ Sync failed: ${item.table}`, await response.text());
        await db.syncQueue.update(item.id!, {
          attempts: (item.attempts || 0) + 1,
          lastAttempt: new Date()
        });
      }
    } catch (error) {
      console.error(`❌ Sync error for item ${item.id}:`, error);
      await db.syncQueue.update(item.id!, {
        attempts: (item.attempts || 0) + 1,
        lastAttempt: new Date()
      });
    }
  }

  return { 
    synced: syncedCount, 
    pending: await db.syncQueue.count() 
  };
}

// Функция для автоматической синхронизации
export function setupAutoSync(intervalMinutes: number = 5) {
  // При появлении соединения
  window.addEventListener('online', () => {
    console.log('📶 Connection restored, syncing...');
    syncWithServer();
  });

  // Периодическая синхронизация
  setInterval(() => {
    if (navigator.onLine) {
      syncWithServer();
    }
  }, intervalMinutes * 60 * 1000);
}