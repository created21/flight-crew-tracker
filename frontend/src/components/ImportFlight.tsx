// frontend/src/components/ImportFlight.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, addToSyncQueue } from '../db/database';
import ConfirmImportModal from './ConfirmImportModal';

interface ImportedTask {
  name: string;
  description?: string;
  order: number;
  duration?: number;
  completed: boolean;
}

interface ImportedFlight {
  id?: number;
  flightNumber: string;
  date: string;
  aircraft: string;
  status: string;
  lastModified: Date;
}

const ImportFlight: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importedData, setImportedData] = useState<{ flight: ImportedFlight; tasks: ImportedTask[] } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingFlightId, setExistingFlightId] = useState<number | null>(null);

// frontend/src/components/ImportFlight.tsx
// Замените существующий useEffect на этот:

useEffect(() => {
  const importData = async () => {
    try {
      const params = new URLSearchParams(location.search);
      const encodedData = params.get('d'); // Новый параметр с данными
      const key = params.get('key');       // Старый параметр (для совместимости)
      const oldData = params.get('data');  // Еще старее
      
      // ===== НОВЫЙ СПОСОБ: данные прямо в QR =====
      if (encodedData) {
        console.log('📦 Импорт из QR-кода');
        
        // Декодируем base64
        const jsonStr = decodeURIComponent(escape(atob(encodedData)));
        const data = JSON.parse(jsonStr);
        
        if (data.v === '2') {
          // Новый формат
          setImportedData({
            flight: {
              flightNumber: data.fn,
              date: data.d,
              aircraft: data.a,
              status: 'active',
              lastModified: new Date()
            },
            tasks: data.ts.map((t: any, idx: number) => ({
              name: t.n,
              description: t.desc,
              order: idx,
              duration: t.dur,
              completed: false
            }))
          });
          setLoading(false);
          return;
        }
      }
      
      // ===== НОВЫЙ СПОСОБ: импорт по ключу из localStorage =====
      if (key) {
        console.log('🔑 Импорт по ключу:', key);
        const storageKey = `flight_share_${key}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (!storedData) {
          setError('Данные не найдены. Возможно, срок хранения истек (7 дней).');
          setLoading(false);
          return;
        }

        const data = JSON.parse(storedData);
        
        // Проверяем структуру данных
        if (!data.flight || !data.tasks) {
          setError('Неверный формат данных');
          setLoading(false);
          return;
        }

        setImportedData({
          flight: data.flight,
          tasks: data.tasks
        });
        setLoading(false);
        return; // Важно: выходим, чтобы не проверять старый способ
      }
      
      // ===== СТАРЫЙ СПОСОБ: импорт по прямой ссылке (для обратной совместимости) =====
      if (encodedData) {
        console.log('📦 Импорт по прямой ссылке');
        const decodedData = decodeURIComponent(encodedData);
        const data = JSON.parse(decodedData);

        if (data.type !== 'flight_share' || !data.flight || !data.tasks) {
          setError('Неверный формат данных');
          setLoading(false);
          return;
        }

        setImportedData({
          flight: data.flight,
          tasks: data.tasks
        });
        setLoading(false);
        return;
      }
      
      // ===== НЕТ ДАННЫХ =====
      setError('Нет данных для импорта');
      setLoading(false);
      
    } catch (error) {
      console.error('Ошибка импорта:', error);
      setError('Ошибка при импорте данных. Проверьте ссылку.');
      setLoading(false);
    }
  };

  importData();
}, [location]);

  const handleImport = async () => {
    if (!importedData) return;

    try {
      // Проверяем, есть ли уже такой рейс
      const existingFlight = await db.flights
        .where('flightNumber')
        .equals(importedData.flight.flightNumber)
        .and(f => f.date === importedData.flight.date)
        .first();

      if (existingFlight && existingFlight.id) {
        setExistingFlightId(existingFlight.id);
        setShowConfirmModal(true);
        return;
      }

      await createNewFlight();
    } catch (error) {
      console.error('Ошибка при импорте:', error);
      alert('Ошибка при импорте рейса');
    }
  };

  const createNewFlight = async () => {
    if (!importedData) return;

    try {
      // Создаем новый рейс
      const flightId = await db.flights.add({
        flightNumber: importedData.flight.flightNumber,
        date: importedData.flight.date,
        aircraft: importedData.flight.aircraft,
        status: 'active',
        lastModified: new Date()
      });

      // Добавляем задачи
      for (const task of importedData.tasks) {
        await db.tasks.add({
          flightId: flightId as number,
          name: task.name,
          description: task.description,
          order: task.order,
          completed: false, // Всегда создаем как невыполненные
          duration: undefined,
          startTime: undefined,
          endTime: undefined,
          synced: false
        });
      }

      await addToSyncQueue('create', 'flights', {
        id: flightId,
        ...importedData.flight
      });

      alert(`✅ Рейс ${importedData.flight.flightNumber} успешно импортирован!`);
      navigate(`/flight/${flightId}`);
    } catch (error) {
      console.error('Ошибка при импорте:', error);
      alert('Ошибка при импорте рейса');
    }
  };

  const openExistingFlight = () => {
    if (existingFlightId) {
      navigate(`/flight/${existingFlightId}`);
    }
    setShowConfirmModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ошибка импорта</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <ConfirmImportModal
        isOpen={showConfirmModal}
        flightNumber={importedData?.flight.flightNumber || ''}
        onConfirm={openExistingFlight}
        onCancel={() => setShowConfirmModal(false)}
      />

      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-gray-800">Импорт рейса</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-bold text-lg text-gray-800">{importedData?.flight.flightNumber}</h3>
            <p className="text-gray-600">
              {importedData?.flight.date && new Date(importedData.flight.date).toLocaleDateString('ru-RU')}
            </p>
            {importedData?.flight.aircraft && (
              <p className="text-sm text-gray-500 mt-1">✈️ {importedData.flight.aircraft}</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Задачи ({importedData?.tasks.length}):</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {importedData?.tasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">{idx + 1}.</span>
                  <span className="text-gray-700">{task.name}</span>
                  {task.completed && <span className="text-green-500 text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleImport}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
            >
              Импортировать рейс
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium"
            >
              Отмена
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Рейс будет добавлен в ваш список с невыполненными задачами
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportFlight;