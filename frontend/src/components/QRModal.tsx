// frontend/src/components/QRModal.tsx
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Flight, Task } from '../db/database';
import ShareMenu from './ShareMenu';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight;
  tasks: Task[];
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, flight, tasks }) => {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (!isOpen) return null;

  // Генерируем компактные данные
  const generateCompactData = () => {
    const compact = {
      v: '2',
      fn: flight.flightNumber,
      d: flight.date,
      a: flight.aircraft || '',
      ts: tasks.slice(0, 15).map(t => ({
        n: t.name.substring(0, 50),
        desc: t.description?.substring(0, 100) || '',
      }))
    };
    
    const jsonStr = JSON.stringify(compact);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return base64;
  };

  const compressedData = generateCompactData();
  const shareUrl = `${window.location.origin}/import?d=${compressedData}`;

  // Текст для шеринга
  const shareText = `✈️ Рейс ${flight.flightNumber}\n📅 ${new Date(flight.date).toLocaleDateString('ru-RU')}\n🔗 Ссылка: ${shareUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
      alert('Не удалось скопировать ссылку');
    }
  };

  const shareViaNative = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Рейс ${flight.flightNumber}`,
        text: shareText,
        url: shareUrl
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Ошибка шеринга:', error);
        setShowShareMenu(true);
      }
    }
  } else {
    setShowShareMenu(true);
  }
};

  return (
    <>
      <ShareMenu
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        title={`Рейс ${flight.flightNumber}`}
        text={shareText}
      />

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* <span className="text-2xl">📱</span> */}
                <h2 className="text-xl font-bold text-gray-800">Поделиться рейсом</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Информация о рейсе */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800">{flight.flightNumber}</h3>
              <p className="text-gray-500">
                {new Date(flight.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {flight.aircraft && (
                <p className="text-sm text-gray-400 mt-1">✈️ {flight.aircraft}</p>
              )}
            </div>

            {/* QR-код */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG
                  value={shareUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Инструкция */}
            {/* <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-700 mb-2">📱 Как отсканировать QR-код:</p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• iOS: Камера → наведите на QR-код</p>
                <p>• Android: Камера или Google Lens</p>
                <p>• Telegram: Иконка камеры в чате</p>
              </div>
            </div> */}

            {/* Ссылка и кнопки */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">Ссылка для обмена:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3">
              <button
                onClick={shareViaNative}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Поделиться
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                Закрыть
              </button>
            </div>

            {/* <div className="text-center text-xs text-gray-400">
              <p>✅ QR-код содержит все данные рейса</p>
              <p className="mt-1">🌍 Работает на любом устройстве без интернета</p>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default QRModal;