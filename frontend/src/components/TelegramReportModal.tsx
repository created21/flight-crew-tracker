// frontend/src/components/TelegramReportModal.tsx
import React, { useState } from 'react';
import { Flight, Task } from '../db/database';

interface TelegramReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight;
  tasks: Task[];
  onSuccess?: () => void;
}

const TelegramReportModal: React.FC<TelegramReportModalProps> = ({
  isOpen,
  onClose,
  flight,
  tasks,
  onSuccess
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Форматирование времени
  const formatTime = (seconds?: number): string => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Формирование отчета
  const generateReport = () => {
    const completedTasks = tasks.filter(t => t.completed);
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalMinutes = Math.floor(totalTime / 60);
    const totalSeconds = totalTime % 60;
    
    let report = `✈️ *ОТЧЕТ ПО РЕЙСУ*\n\n`;
    report += `📋 *Номер рейса:* ${flight.flightNumber}\n`;
    report += `📅 *Дата:* ${new Date(flight.date).toLocaleDateString('ru-RU')}\n`;
    if (flight.aircraft) {
      report += `✈️ *Тип ВС:* ${flight.aircraft}\n`;
    }
    report += `📊 *Статус:* ${flight.status === 'completed' ? '✅ Завершен' : '🔄 В процессе'}\n`;
    report += `⏱ *Общее время:* ${totalMinutes}м ${totalSeconds}с\n`;
    report += `📋 *Выполнено задач:* ${completedTasks.length}/${tasks.length}\n\n`;
    
    report += `*Детализация задач:*\n`;
    tasks.forEach((task, idx) => {
      const status = task.completed ? '✅' : '⏳';
      const time = task.duration ? formatTime(task.duration) : '—';
      report += `${idx + 1}. ${status} *${task.name}* — ${time}\n`;
      if (task.description && task.completed) {
        report += `   📝 ${task.description.substring(0, 50)}\n`;
      }
    });
    
    report += `\n📎 *Отчет сгенерирован автоматически*\n`;
    report += `🕐 ${new Date().toLocaleString('ru-RU')}`;
    
    return report;
  };

  // Отправка через Telegram API напрямую (без бэкенда)
  const sendToTelegram = async () => {
    if (!phoneNumber.trim()) {
      setError('Введите номер телефона');
      return;
    }

    setIsSending(true);
    setError(null);

    const report = generateReport();
    const botToken = '8743924213:AAEE4bpiE44js43cY2s53o_uEipKXLg3Y-o';
    
    // Форматируем номер телефона (убираем лишние символы)
    let chatId = phoneNumber.replace(/[^0-9]/g, '');
    if (!chatId.startsWith('7') && !chatId.startsWith('8')) {
      chatId = '7' + chatId;
    }
    if (chatId.startsWith('8')) {
      chatId = '7' + chatId.substring(1);
    }

    try {
      // Отправляем сообщение через Telegram Bot API
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: report,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        setSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setPhoneNumber('');
        }, 2000);
      } else {
        setError('Не удалось отправить. Проверьте номер телефона.');
        console.error('Telegram API error:', data);
      }
    } catch (err) {
      console.error('Ошибка отправки:', err);
      setError('Ошибка сети. Попробуйте позже.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📨</span>
              <h2 className="text-xl font-bold text-gray-800">Отправить отчет в Telegram</h2>
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

        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-green-600 mb-2">Отчет отправлен!</h3>
              <p className="text-gray-500 text-sm">Проверьте Telegram</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                📌 Отчет будет отправлен в ваш Telegram. 
                Введите номер телефона, который привязан к аккаунту Telegram.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📱 Номер телефона
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+7 900 123-45-67"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSending}
                />
                <p className="text-xs text-gray-400 mt-1">
                  В формате: 79001234567 или +7 900 123-45-67
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Превью отчета */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  📄 Предпросмотр отчета
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded-lg overflow-x-auto text-xs text-gray-600 whitespace-pre-wrap">
                  {generateReport()}
                </pre>
              </details>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={sendToTelegram}
                  disabled={isSending}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isSending
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      Отправить в Telegram
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Отмена
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramReportModal;