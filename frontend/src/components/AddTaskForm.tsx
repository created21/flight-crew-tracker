// frontend/src/components/AddTaskForm.tsx
import React, { useState } from 'react';

interface AddTaskFormProps {
  onAdd: (name: string, description: string, duration: number) => Promise<void>;
  onCancel: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAdd, onCancel }) => {
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    duration: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.name) return;

    setSubmitting(true);
    try {
      await onAdd(newTask.name, newTask.description, newTask.duration);
      setNewTask({ name: '', description: '', duration: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 mb-4">
      <h3 className="font-medium mb-3">Новая задача</h3>
      
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">
          Название *
        </label>
        <input
          type="text"
          value={newTask.name}
          onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Например: Посадка пассажиров"
          required
          autoFocus
          disabled={submitting}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">
          Описание
        </label>
        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Дополнительные детали"
          disabled={submitting}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">
          Плановая длительность (сек)
        </label>
        <input
          type="number"
          value={newTask.duration}
          onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="300"
          min="0"
          disabled={submitting}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {submitting ? 'Добавление...' : '✅ Добавить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

export default AddTaskForm;