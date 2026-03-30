// frontend/src/components/FlightDetail/FlightHeader.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Flight } from '../../db/database';

interface FlightHeaderProps {
  flight: Flight;
}

const FlightHeader: React.FC<FlightHeaderProps> = ({ flight }) => {
  const isCompleted = flight.status === 'completed';

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="text-white/80 hover:text-white mb-4 inline-block">
          ← Назад к рейсам
        </Link>

        <div className="flex justify-between items-start mt-2">
          <div>
            <h1 className="text-3xl font-bold">{flight.flightNumber}</h1>
            <p className="text-white/80 mt-1">
              {new Date(flight.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            {flight.aircraft && (
              <p className="text-white/70 text-sm mt-1">✈️ {flight.aircraft}</p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCompleted
              ? 'bg-white/20 text-white'
              : 'bg-green-500 text-white'
          }`}>
            {isCompleted ? 'Завершен' : 'Активный'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightHeader;