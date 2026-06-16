// frontend/src/components/FlightHeader.tsx
import React from 'react';
import { Flight } from '../db/database';
import TelegramShareButton from './TelegramShareButton';

interface FlightHeaderProps {
  flight: Flight;
  tasks: any[]; // Добавляем проп tasks
  onBack: () => void;
}

const FlightHeader: React.FC<FlightHeaderProps> = ({ flight, tasks, onBack }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            ← Назад
          </button>
          
          {/* Кнопка Telegram */}
          <TelegramShareButton flight={flight} tasks={tasks} />
        </div>
        
        <div className="mt-2">
          <div className="text-2xl font-bold">{flight.flightNumber}</div>
          <div className="text-white/80">
            {formatDate(flight.date)}
            {flight.aircraft && ` • ${flight.aircraft}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightHeader;