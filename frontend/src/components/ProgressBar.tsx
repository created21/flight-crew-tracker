// frontend/src/components/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  completed: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Прогресс</span>
        <span className="font-medium">
          {completed} / {total} задач
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;