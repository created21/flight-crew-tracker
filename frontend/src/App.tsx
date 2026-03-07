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
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    localStorage.setItem('telegram_token', token);
    console.log('✅ Токен сохранен:', token);
    
    // Проверяем токен на бекенде
    fetch(`${API_URL}/api/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        console.log('✅ Токен подтвержден');
      }
    });
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