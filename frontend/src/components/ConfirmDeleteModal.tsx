// frontend/src/components/ConfirmDeleteModal.tsx
import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  taskName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  taskName,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full animate-slideDown">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-t-2xl">
          <h3 className="text-lg font-bold">🗑️ Удаление задачи</h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            Вы уверены, что хотите удалить задачу?
          </p>
          <p className="text-gray-900 font-medium mb-6">
            "{taskName}"
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              🗑️ Удалить
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;