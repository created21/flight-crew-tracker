// frontend/src/components/TaskControls.tsx
import React from 'react';

interface TaskControlsProps {
  showAddTask: boolean;
  onToggleAdd: () => void;
  onOpenTemplates: () => void;
}

const TaskControls: React.FC<TaskControlsProps> = ({
  showAddTask,
  onToggleAdd,
  onOpenTemplates
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-lg font-semibold">📋 Задачи</h2>
      <div className="flex gap-2">
        <button
          onClick={onOpenTemplates}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors"
          title="Библиотека шаблонов"
        >
          📚 Шаблоны
        </button>
        <button
          onClick={onToggleAdd}
          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
        >
          {showAddTask ? '✕' : '+ Добавить'}
        </button>
      </div>
    </div>
  );
};

export default TaskControls;