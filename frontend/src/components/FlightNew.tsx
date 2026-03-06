// frontend/src/components/FlightNew.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, addToSyncQueue } from '../db/database';

const FlightNew: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    flightNumber: '',
    date: new Date().toISOString().split('T')[0],
    aircraft: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const newFlight = {
        ...formData,
        status: 'active' as const,
        lastModified: new Date()
      };
      
      const id = await db.flights.add(newFlight);
      await addToSyncQueue('create', 'flights', { id, ...newFlight });
      
      // Возвращаемся на главный экран
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Ошибка сохранения рейса:', error);
      alert('Ошибка при сохранении рейса');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-2 text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                ←
              </button>
              <h1 className="text-xl font-bold">✈️ Новый рейс</h1>
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

            <div className="mb-6">
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
                onClick={() => navigate('/')}
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

export default FlightNew;