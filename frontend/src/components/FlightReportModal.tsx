// frontend/src/components/FlightReportModal.tsx
import React, { useState, useRef } from 'react';
import { Flight, Task } from '../db/database';
import ShareMenu from './ShareMenu';

interface FlightReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight;
  tasks: Task[];
}

const FlightReportModal: React.FC<FlightReportModalProps> = ({
  isOpen,
  onClose,
  flight,
  tasks
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateReport = () => {
    const completedTasks = tasks.filter(t => t.completed);
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalMinutes = Math.floor(totalTime / 60);
    const totalSeconds = totalTime % 60;
    
    let report = `✈️ ОТЧЕТ ПО РЕЙСУ\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `📋 Номер рейса: ${flight.flightNumber}\n`;
    report += `📅 Дата: ${new Date(flight.date).toLocaleDateString('ru-RU')}\n`;
    if (flight.aircraft) {
      report += `✈️ Тип ВС: ${flight.aircraft}\n`;
    }
    report += `📊 Статус: ${flight.status === 'completed' ? '✅ Завершен' : '🔄 В процессе'}\n`;
    report += `⏱ Общее время: ${totalMinutes}м ${totalSeconds}с\n`;
    report += `📋 Выполнено задач: ${completedTasks.length}/${tasks.length}\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📋 ДЕТАЛИЗАЦИЯ ЗАДАЧ:\n\n`;
    
    tasks.forEach((task, idx) => {
      const status = task.completed ? '✅' : '⭕';
      const time = task.duration ? formatTime(task.duration) : '—';
      const timeLabel = task.completed ? `⏱ ${time}` : `⏳ не начата`;
      
      report += `${idx + 1}. ${status} ${task.name}\n`;
      report += `   ${timeLabel}\n`;
      
      if (task.description && task.completed) {
        report += `   📝 ${task.description}\n`;
      }
      if (task.startTime && !task.completed) {
        report += `   ▶️ Старт: ${new Date(task.startTime).toLocaleTimeString('ru-RU')}\n`;
      }
      if (task.endTime) {
        report += `   🏁 Завершено: ${new Date(task.endTime).toLocaleTimeString('ru-RU')}\n`;
      }
      report += `\n`;
    });
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📎 Отчет сгенерирован автоматически\n`;
    report += `🕐 ${new Date().toLocaleString('ru-RU')}`;
    
    return report;
  };

  const copyViaSelection = () => {
    const report = generateReport();
    
    const textarea = document.createElement('textarea');
    textarea.value = report;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    
    try {
      const success = document.execCommand('copy');
      if (success) {
        setCopied(true);
        setShowToast(true);
        setTimeout(() => {
          setCopied(false);
          setShowToast(false);
        }, 2000);
        return true;
      }
    } catch (err) {
      console.error('Ошибка копирования:', err);
    } finally {
      document.body.removeChild(textarea);
    }
    return false;
  };

  const copyViaClipboard = async () => {
    const report = generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
      return true;
    } catch (err) {
      console.error('Clipboard API failed:', err);
      return copyViaSelection();
    }
  };

  const handleShare = () => {
    const report = generateReport();
    if (navigator.share) {
      navigator.share({
        title: `Отчет по рейсу ${flight.flightNumber}`,
        text: report
      }).catch((error) => {
        if ((error as Error).name !== 'AbortError') {
          console.error('Ошибка шеринга:', error);
          setShowShareMenu(true);
        }
      });
    } else {
      setShowShareMenu(true);
    }
  };

  const report = generateReport();
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <>
      {/* Универсальное меню шеринга */}
      <ShareMenu
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        title={`Отчет по рейсу ${flight.flightNumber}`}
        text={report}
      />

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Заголовок */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                <h2 className="text-xl font-bold text-gray-800">Отчет по рейсу</h2>
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

          {/* Содержимое */}
          <div className="p-6 space-y-4">
            {/* Краткая информация */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-blue-600">📊 Прогресс</span>
                <span className="text-sm font-medium text-blue-700">{completedCount}/{tasks.length}</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-sm text-blue-600">
                <span>✈️ {flight.flightNumber}</span>
                <span>⏱ {Math.floor(tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60)}м</span>
              </div>
            </div>

            {/* Отчет - с возможностью выделения */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">📋 Текст отчета (нажмите для выделения):</p>
              <textarea
                ref={textAreaRef}
                readOnly
                value={report}
                onClick={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.select();
                }}
                className="w-full text-xs text-gray-700 font-mono bg-white p-3 rounded-lg h-64 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
              />
            </div>

            {/* Всплывающее уведомление */}
            {showToast && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm z-50 animate-fadeIn">
                ✓ Отчет скопирован!
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Поделиться отчетом
              </button>

              <button
                onClick={copyViaClipboard}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Скопировано!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Копировать отчет
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-500 py-2 rounded-xl hover:bg-gray-200 transition-all text-sm"
              >
                Закрыть
              </button>
            </div>

            <div className="text-center text-xs text-gray-400">
              <p>📌 Нажмите «Поделиться» для отправки в Telegram, WhatsApp, MAX, Email</p>
              <p className="mt-1">📋 Или нажмите на текст отчета для выделения и ручного копирования</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FlightReportModal;