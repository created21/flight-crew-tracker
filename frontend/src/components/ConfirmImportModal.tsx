// frontend/src/components/ConfirmImportModal.tsx
import React from 'react';

interface ConfirmImportModalProps {
  isOpen: boolean;
  flightNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmImportModal: React.FC<ConfirmImportModalProps> = ({
  isOpen,
  flightNumber,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
        <div className="p-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Рейс уже существует
          </h3>
          <p className="text-gray-600 mb-4">
            Рейс {flightNumber} уже есть в вашем списке.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Открыть существующий рейс вместо импорта?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Открыть рейс
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmImportModal;