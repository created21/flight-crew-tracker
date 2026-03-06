// frontend/src/components/TelegramShareButton.tsx
import React, { useState } from 'react';
import { Flight, Task } from '../db/database';
import { API_URL } from '../config';

interface TelegramShareButtonProps {
  flight: Flight;
  tasks: Task[];
  className?: string;
}

const TelegramShareButton: React.FC<TelegramShareButtonProps> = ({ flight, tasks, className = '' }) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Форматирование времени
  const formatTime = (seconds?: number) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м ${secs}с`;
  };

  // Подсчет статистики
  const getStats = () => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const totalTime = tasks.reduce((acc, task) => acc + (task.duration || 0), 0);
    const avgTime = completed > 0 ? totalTime / completed : 0;
    
    return { completed, total, totalTime, avgTime };
  };

  // Формирование отчета
  const generateReport = () => {
    const stats = getStats();
    const date = new Date(flight.date).toLocaleDateString('ru-RU');
    
    let report = `✈️ *ОТЧЕТ О РЕЙСЕ*\n`;
    report += `━━━━━━━━━━━━━━━━\n\n`;
    
    // Основная информация
    report += `*Рейс:* ${flight.flightNumber}\n`;
    report += `*Дата:* ${date}\n`;
    if (flight.aircraft) report += `*ВС:* ${flight.aircraft}\n`;
    report += `*Статус:* ${flight.status === 'completed' ? '✅ Завершен' : '🟢 Активный'}\n\n`;
    
    // Статистика
    report += `*📊 СТАТИСТИКА*\n`;
    report += `▸ Выполнено задач: ${stats.completed} из ${stats.total}\n`;
    report += `▸ Процент: ${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%\n`;
    report += `▸ Общее время: ${formatTime(stats.totalTime)}\n`;
    if (stats.completed > 0) {
      report += `▸ Среднее время: ${formatTime(Math.round(stats.avgTime))}\n`;
    }
    
    report += `\n*📋 ЗАДАЧИ*\n`;
    
    // Список задач
    tasks.forEach((task, index) => {
      const status = task.completed ? '✅' : (task.startTime ? '⏳' : '⭕');
      report += `${index + 1}. ${status} ${task.name}`;
      if (task.duration) {
        report += ` (${formatTime(task.duration)})`;
      }
      if (task.description) {
        report += `\n   _${task.description}_`;
      }
      report += '\n';
    });
    
    // Временные метки
    if (tasks.some(t => t.startTime)) {
      report += `\n*⏱ ХРОНОЛОГИЯ*\n`;
      tasks
        .filter(t => t.startTime)
        .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
        .forEach(task => {
          const start = task.startTime ? new Date(task.startTime).toLocaleTimeString() : '—';
          const end = task.endTime ? new Date(task.endTime).toLocaleTimeString() : '—';
          report += `▸ ${task.name}: ${start} → ${end}\n`;
        });
    }
    
    report += `\n━━━━━━━━━━━━━━━━\n`;
    report += `_Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}_`;
    
    return report;
  };

const sendToTelegram = async () => {
  setSending(true);
  setMessage(null);

  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem('telegram_token');
    console.log('📤 Отправка отчета, токен:', token);
    
    if (!token) {
      setMessage({ 
        text: '❌ Не найден токен. Авторизуйтесь через бота Telegram', 
        type: 'error' 
      });
      return;
    }

    const report = generateReport();
    console.log('📄 Отчет сгенерирован:', report.substring(0, 100) + '...');
    
    // Отправляем отчет на бэкенд
    
    const response = await fetch(`${API_URL}/api/send-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        flightId: flight.id,
        report
      }),
    });

    const data = await response.json();
    console.log('📨 Ответ от сервера:', data);

    if (response.ok) {
      setMessage({ text: '✅ Отчет отправлен в Telegram!', type: 'success' });
    } else {
      setMessage({ text: `❌ Ошибка: ${data.error}`, type: 'error' });
    }
  } catch (error) {
    console.error('❌ Ошибка отправки:', error);
    setMessage({ text: '❌ Ошибка отправки отчета', type: 'error' });
  } finally {
    setSending(false);
    setTimeout(() => setMessage(null), 5000);
  }
};

  return (
    <div className="relative">
      <button
        onClick={sendToTelegram}
        disabled={sending}
        className={`flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Отправить отчет в Telegram"
      >
        {sending ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Отправка...</span>
          </>
        ) : (
          <>
            <span className="text-lg">📱</span>
            <span>Telegram</span>
          </>
        )}
      </button>
      
      {message && (
        <div className={`absolute top-full mt-2 left-0 right-0 p-2 rounded-lg text-sm text-center animate-slideDown ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default TelegramShareButton;