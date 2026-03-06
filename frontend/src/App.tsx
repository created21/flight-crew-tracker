// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FlightList from './components/FlightList';
import FlightNew from './components/FlightNew';
import FlightEdit from './components/FlightEdit';
import FlightDetail from './components/FlightDetail';
import SyncStatus from './components/SyncStatus';
import { API_URL } from './config';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  
  // Получаем токен из URL при заходе через бота
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    console.log('🔑 Токен получен из URL:', token);
    // Сохраняем токен в localStorage
    localStorage.setItem('telegram_token', token);
    
    // Очищаем URL от токена
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Отправляем токен на бэкенд для подтверждения
    fetch(`${API_URL}/api/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Токен подтвержден:', data);
        if (data.valid) {
          // Показываем уведомление
          alert('✅ Авторизация через Telegram успешна!');
        }
      })
      .catch(err => console.error('❌ Ошибка подтверждения токена:', err));
  }
}, []);
  

  const handleSync = async () => {
    // Здесь можно вызвать общую функцию синхронизации
    console.log('🔄 Запуск синхронизации...');
    // Импортируйте и вызовите вашу функцию синхронизации
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FlightList />} />
        <Route path="/flight/new" element={<FlightNew />} />
        <Route path="/flight/edit/:id" element={<FlightEdit />} />
        <Route path="/flight/:id" element={<FlightDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Индикатор синхронизации */}
      <SyncStatus isOnline={isOnline} onSync={handleSync} />
    </BrowserRouter>
  );
}

export default App;