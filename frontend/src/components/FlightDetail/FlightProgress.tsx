// frontend/src/components/FlightDetail/FlightProgress.tsx
import React from 'react';

interface FlightProgressProps {
  completed: number;
  total: number;
}

const FlightProgress: React.FC<FlightProgressProps> = ({ completed, total }) => {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Прогресс рейса</span>
        <span>{percentage}% ({completed}/{total})</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default FlightProgress;