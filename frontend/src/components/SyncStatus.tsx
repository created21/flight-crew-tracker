// frontend/src/components/SyncStatus.tsx
import React, { useState, useEffect } from 'react';
import { db, getPendingSyncCount, getSyncInfo, clearSyncQueue } from '../db/database';

interface Props {
  isOnline: boolean;
  onSync?: () => void;
}

const SyncStatus: React.FC<Props> = ({ isOnline, onSync }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState<any>(null);

  useEffect(() => {
    loadPendingCount();
    
    // Подписываемся на изменения в базе данных
    const interval = setInterval(loadPendingCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    const count = await getPendingSyncCount();
    setPendingCount(count);
    
    if (showDetails) {
      const info = await getSyncInfo();
      setSyncInfo(info);
    }
  };

  const handleSync = async () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    try {
      if (onSync) {
        await onSync();
      }
      await loadPendingCount();
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('Очистить очередь синхронизации?')) {
      await clearSyncQueue();
      await loadPendingCount();
    }
  };

  if (pendingCount === 0 && !showDetails) {
    return null; // Не показываем если нет ожидающих задач
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Основная кнопка статуса */}
      <div 
        className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg cursor-pointer transition-all transform hover:scale-105 ${
          isOnline 
            ? pendingCount > 0 
              ? 'bg-yellow-500 text-white' 
              : 'bg-green-500 text-white'
            : 'bg-gray-500 text-white'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <span className="text-xl">
          {!isOnline ? '📴' : pendingCount > 0 ? '🔄' : '✅'}
        </span>
        <span className="font-medium">
          {!isOnline 
            ? 'Офлайн' 
            : pendingCount > 0 
              ? `${pendingCount} ожидают` 
              : 'Синхронизировано'}
        </span>
      </div>

      {/* Детальная панель */}
      {showDetails && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-slideUp">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
            <h3 className="font-bold">Статус синхронизации</h3>
            <p className="text-sm text-white/80">
              {isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}
            </p>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Статистика */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ожидают синхронизации:</span>
                <span className="font-medium">{pendingCount}</span>
              </div>
              {syncInfo && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Несинхр. рейсы:</span>
                    <span className="font-medium">{syncInfo.unsyncedFlights}</span>
                  </div>
                </>
              )}
            </div>

            {/* Детали очереди */}
            {syncInfo?.pendingItems?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Очередь:</h4>
                <div className="space-y-2">
                  {syncInfo.pendingItems.map((item: any) => (
                    <div key={item.id} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="font-medium">
                        {item.operation} {item.table}
                      </div>
                      <div className="text-gray-500 mt-1">
                        Попыток: {item.attempts}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={!isOnline || syncing || pendingCount === 0}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isOnline && pendingCount > 0 && !syncing
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {syncing ? '⏳ Синхр...' : '🔄 Синхронизировать'}
              </button>
              
              <button
                onClick={handleClearQueue}
                disabled={pendingCount === 0}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pendingCount > 0
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Стрелка закрытия */}
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SyncStatus;