// frontend/src/components/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, Flight, Task } from '../db/database';

type Period = 'all' | 'week' | 'month' | 'custom';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allFlights, allTasks] = await Promise.all([
          db.flights.toArray(),
          db.tasks.toArray()
        ]);
        
        // Сортируем рейсы по дате (сначала новые)
        const sortedFlights = allFlights.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setFlights(sortedFlights);
        setTasks(allTasks);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Фильтрация рейсов по периоду
  const getFilteredFlights = () => {
    if (period === 'all') return flights;
    
    const now = new Date();
    let start: Date;
    
    if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
    } else {
      if (!startDate || !endDate) return flights;
      start = new Date(startDate);
      const end = new Date(endDate);
      return flights.filter(flight => {
        const flightDate = new Date(flight.date);
        return flightDate >= start && flightDate <= end;
      });
    }
    
    return flights.filter(flight => new Date(flight.date) >= start);
  };

  const filteredFlights = getFilteredFlights();
  
  // Расчет статистики
  const calculateStats = () => {
    const completedFlights = filteredFlights.filter(f => f.status === 'completed');
    const activeFlights = filteredFlights.filter(f => f.status === 'active');
    
    // Все задачи из отфильтрованных рейсов
    const relevantTasks = tasks.filter(t => 
      filteredFlights.some(f => f.id === t.flightId)
    );
    
    const completedTasks = relevantTasks.filter(t => t.completed);
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalMinutes = Math.floor(totalTime / 60);
    const totalSeconds = totalTime % 60;
    
    // Статистика по дням
    const dailyStats = filteredFlights.reduce((acc, flight) => {
      const date = flight.date;
      const flightTasks = tasks.filter(t => t.flightId === flight.id);
      const flightTime = flightTasks
        .filter(t => t.completed)
        .reduce((sum, t) => sum + (t.duration || 0), 0);
      
      if (!acc[date]) {
        acc[date] = {
          date,
          flights: 0,
          completedFlights: 0,
          tasks: 0,
          completedTasks: 0,
          time: 0
        };
      }
      
      acc[date].flights++;
      if (flight.status === 'completed') acc[date].completedFlights++;
      acc[date].tasks += flightTasks.length;
      acc[date].completedTasks += flightTasks.filter(t => t.completed).length;
      acc[date].time += flightTime;
      
      return acc;
    }, {} as Record<string, any>);
    
    return {
      totalFlights: filteredFlights.length,
      completedFlights: completedFlights.length,
      activeFlights: activeFlights.length,
      totalTasks: relevantTasks.length,
      completedTasks: completedTasks.length,
      totalTime: { minutes: totalMinutes, seconds: totalSeconds },
      completionRate: relevantTasks.length ? 
        Math.round((completedTasks.length / relevantTasks.length) * 100) : 0,
      dailyStats: Object.values(dailyStats).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    };
  };

  const stats = calculateStats();

  // Форматирование времени
  const formatTime = (seconds?: number): string => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Генерация отчета
  const generateReport = () => {
    const periodText = period === 'all' ? 'ВСЕ ВРЕМЯ' :
                        period === 'week' ? 'ПОСЛЕДНИЕ 7 ДНЕЙ' :
                        period === 'month' ? 'ПОСЛЕДНИЙ МЕСЯЦ' :
                        `${startDate} — ${endDate}`;
    
    let report = `📊 ОТЧЕТ ПО РЕЙСАМ\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📅 Период: ${periodText}\n`;
    report += `🕐 ${new Date().toLocaleString('ru-RU')}\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📈 ОБЩАЯ СТАТИСТИКА\n\n`;
    report += `✈️ Всего рейсов: ${stats.totalFlights}\n`;
    report += `✅ Завершено: ${stats.completedFlights}\n`;
    report += `🔄 В процессе: ${stats.activeFlights}\n`;
    report += `📋 Всего задач: ${stats.totalTasks}\n`;
    report += `✅ Выполнено задач: ${stats.completedTasks}\n`;
    report += `📊 Выполнение: ${stats.completionRate}%\n`;
    report += `⏱ Общее время: ${stats.totalTime.minutes}м ${stats.totalTime.seconds}с\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📅 ДЕТАЛИЗАЦИЯ ПО ДНЯМ\n\n`;
    
    stats.dailyStats.forEach(day => {
      const date = new Date(day.date).toLocaleDateString('ru-RU');
      const dayMinutes = Math.floor(day.time / 60);
      const daySeconds = day.time % 60;
      
      report += `📆 ${date}\n`;
      report += `   ✈️ Рейсов: ${day.flights} (завершено: ${day.completedFlights})\n`;
      report += `   📋 Задач: ${day.completedTasks}/${day.tasks}\n`;
      report += `   ⏱ Время: ${dayMinutes}м ${daySeconds}с\n\n`;
    });
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📎 Отчет сгенерирован автоматически\n`;
    report += `🕐 ${new Date().toLocaleString('ru-RU')}`;
    
    return report;
  };

  const copyToClipboard = async () => {
    const report = generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
      alert('Не удалось скопировать отчет');
    }
  };

  const shareViaNative = async () => {
    const report = generateReport();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Отчет по рейсам',
          text: report
        });
      } catch (error) {
        console.error('Ошибка шеринга:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      {/* Шапка */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">📊 Отчеты</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Выбор периода */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">📅 Период</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { value: 'all', label: 'Все время' },
              { value: 'week', label: 'Неделя' },
              { value: 'month', label: 'Месяц' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value as Period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === opt.value
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Свой период */}
          <div className="flex gap-3">
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === 'custom'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Свой период
            </button>
          </div>

          {period === 'custom' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">С</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">По</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">📈 Общая статистика</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalFlights}</div>
              <div className="text-xs text-gray-500">рейсов</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedFlights}</div>
              <div className="text-xs text-gray-500">завершено</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalTasks}</div>
              <div className="text-xs text-gray-500">задач</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.completionRate}%</div>
              <div className="text-xs text-gray-500">выполнение</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">⏱ Общее время</span>
              <span className="font-medium">{stats.totalTime.minutes}м {stats.totalTime.seconds}с</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Превью отчета */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">📋 Отчет</h2>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg max-h-80 overflow-y-auto">
            {generateReport()}
          </pre>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col gap-3">
          <button
            onClick={shareViaNative}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Поделиться отчетом
          </button>

          <button
            onClick={copyToClipboard}
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
        </div>

        <div className="text-center text-xs text-gray-400 mt-6 pb-8">
          <p>📊 Данные за выбранный период</p>
          <p className="mt-1">✅ Все данные сохранены локально</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;