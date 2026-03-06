// frontend/src/components/FlightEdit.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, Flight, addToSyncQueue } from '../db/database';

const FlightEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: '',
    date: '',
    aircraft: '',
    status: 'active' as Flight['status']
  });

  useEffect(() => {
    const loadFlight = async () => {
      if (!id) return;
      
      try {
        const flight = await db.flights.get(parseInt(id));
        if (flight) {
          setFormData({
            flightNumber: flight.flightNumber,
            date: flight.date,
            aircraft: flight.aircraft || '',
            status: flight.status
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки рейса:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlight();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      setSaving(true);
      
      const flightId = parseInt(id);
      const updatedFlight = {
        ...formData,
        lastModified: new Date(),
        // status: 'active' as const
      };
      
      await db.flights.update(flightId, updatedFlight);
      await addToSyncQueue('update', 'flights', { id: flightId, ...updatedFlight });
      
      // Возвращаемся на главный экран, а не на детали рейса!
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Ошибка обновления рейса:', error);
      alert('Ошибка при обновлении рейса');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')} // Возвращаемся на главную
                className="mr-2 text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                ←
              </button>
              <h1 className="text-xl font-bold">✏️ Редактировать рейс</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">
                Номер рейса *
              </label>
              <input
                type="text"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Например: SU1234"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">
                Дата *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">
                Воздушное судно
              </label>
              <input
                type="text"
                name="aircraft"
                value={formData.aircraft}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Например: Boeing 737-800"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Статус
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Активный</option>
                <option value="completed">Завершен</option>
                <option value="synced">Синхронизирован</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохранение...' : '💾 Сохранить'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')} // Возвращаемся на главную
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all transform hover:scale-105 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FlightEdit;