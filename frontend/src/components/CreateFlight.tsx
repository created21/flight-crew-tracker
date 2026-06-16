// frontend/src/components/CreateFlight.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, addToSyncQueue } from '../db/database';

const CreateFlight: React.FC = () => {
  const navigate = useNavigate();
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [aircraft, setAircraft] = useState('Boeing 737-800');
  const [route, setRoute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const aircraftTypes = [
    'Boeing 737-800',
    'Boeing 777-300',
    'Airbus A320',
    'Airbus A330',
    'Sukhoi Superjet 100'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flightNumber.trim()) {
      alert('Введите номер рейса');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Создаем рейс в локальной БД
      const flightId = await db.flights.add({
        flightNumber: flightNumber.toUpperCase(),
        date,
        aircraft,
        status: 'active',
        lastModified: new Date()
      });

      // Добавляем стандартные задачи для этого рейса
      const defaultTasks = [
        { name: 'Посадка пассажиров', order: 1 },
        { name: 'Закрытие дверей', order: 2 },
        { name: 'Демонстрация безопасности', order: 3 },
        { name: 'Разнос питания', order: 4 },
        { name: 'Уборка кабины', order: 5 }
      ];

      for (const task of defaultTasks) {
        await db.tasks.add({
          flightId: flightId as number,
          name: task.name,
          order: task.order,
          completed: false,
          synced: false
        });
      }

      // Добавляем в очередь синхронизации
      await addToSyncQueue('create', 'flights', {
        flightNumber: flightNumber.toUpperCase(),
        date,
        aircraft,
        route,
        status: 'active'
      });

      console.log('Flight created successfully:', flightId);
      navigate(`/flight/${flightId}`);
    } catch (error) {
      console.error('Error creating flight:', error);
      alert('Ошибка при создании рейса. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <button
        onClick={() => navigate('/')}
        className="text-blue-500 mb-4 flex items-center"
      >
        ← Назад к рейсам
      </button>

      <h1 className="text-2xl font-bold mb-4">✈️ Новый рейс</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Номер рейса *
          </label>
          <input
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            placeholder="SU1234"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Дата *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Тип ВС *
          </label>
          <select
            value={aircraft}
            onChange={(e) => setAircraft(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          >
            {aircraftTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Маршрут
          </label>
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="Москва - Сочи"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSubmitting ? 'Создание...' : 'Создать рейс'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
            className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFlight;