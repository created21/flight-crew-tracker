// frontend/src/components/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  onAddClick: () => void;
  onTemplatesClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick, onTemplatesClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      <div className="text-4xl mb-2">📋</div>
      <p className="text-gray-500">Нет задач</p>
      <p className="text-sm text-gray-400 mt-1">
        Добавьте первую задачу или выберите из шаблонов
      </p>
      <div className="flex gap-2 justify-center mt-4">
        <button
          onClick={onAddClick}
          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
        >
          + Создать
        </button>
        <button
          onClick={onTemplatesClick}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600"
        >
          📚 Шаблоны
        </button>
      </div>
    </div>
  );
};

export default EmptyState;