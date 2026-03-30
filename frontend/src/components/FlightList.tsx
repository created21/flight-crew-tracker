// frontend/src/components/FlightList.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, Flight } from '../db/database';
import TemplateLibrary from './TemplateLibrary';

type TabType = 'active' | 'completed';

const FlightList: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');
  
  // Состояние для хранения прогресса каждого рейса
  const [flightProgress, setFlightProgress] = useState<Map<number, number>>(new Map());
  
  const navigate = useNavigate();

  // Загрузка рейсов
  useEffect(() => {
    let isActive = true;

    const loadFlights = async () => {
      try {
        setLoading(true);
        const allFlights = await db.flights.toArray();
        const sorted = allFlights.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        if (isActive) {
          setFlights(sorted);
        }
      } catch (error) {
        console.error('Ошибка загрузки рейсов:', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadFlights();

    return () => {
      isActive = false;
    };
  }, []);

  // Загрузка прогресса для всех рейсов
  useEffect(() => {
    const loadProgressForFlights = async () => {
      const progressMap = new Map<number, number>();
      
      for (const flight of flights) {
        if (flight.id) {
          if (flight.status === 'completed') {
            progressMap.set(flight.id, 100);
          } else {
            try {
              // Получаем задачи для этого рейса
              const tasks = await db.tasks.where('flightId').equals(flight.id).toArray();
              
              if (tasks.length === 0) {
                progressMap.set(flight.id, 0);
              } else {
                const completedCount = tasks.filter(t => t.completed).length;
                const progress = Math.round((completedCount / tasks.length) * 100);
                progressMap.set(flight.id, progress);
              }
            } catch (error) {
              console.error('Error loading tasks for flight:', flight.id, error);
              progressMap.set(flight.id, 0);
            }
          }
        }
      }
      
      setFlightProgress(progressMap);
    };
    
    if (flights.length > 0) {
      loadProgressForFlights();
    }
  }, [flights]);

  // Фильтрация рейсов по статусу и поиску
  const getFilteredFlights = (tab: TabType) => {
    return flights
      .filter(flight => {
        if (tab === 'active') {
          return flight.status !== 'completed';
        } else {
          return flight.status === 'completed';
        }
      })
      .filter(flight => 
        flight.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (flight.aircraft && flight.aircraft.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  };

  const activeFlights = getFilteredFlights('active');
  const completedFlights = getFilteredFlights('completed');
  const currentFlights = activeTab === 'active' ? activeFlights : completedFlights;

  const handleFlightClick = (flightId: number | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    if (flightId) {
      navigate(`/flight/${flightId}`);
    }
  };

  const handleDeleteFlight = async (flightId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Удаляем все задачи этого рейса
      const tasks = await db.tasks.where('flightId').equals(flightId).toArray();
      for (const task of tasks) {
        if (task.id) await db.tasks.delete(task.id);
      }
      
      await db.flights.delete(flightId);
      setFlights(prev => prev.filter(f => f.id !== flightId));
      setDeleteConfirm(null);
      
      setSyncMessage({ text: '✅ Рейс успешно удален', type: 'success' });
      setTimeout(() => setSyncMessage(null), 3000);
      
    } catch (error) {
      console.error('Ошибка удаления рейса:', error);
      setSyncMessage({ text: '❌ Ошибка при удалении рейса', type: 'error' });
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const handleEditFlight = (flightId: number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (flightId) {
      navigate(`/flight/edit/${flightId}`);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    setSyncMessage(null);
    let isActive = true;

    try {
      const unsyncedFlights = await db.flights
        .where('status')
        .notEqual('synced')
        .toArray();

      if (unsyncedFlights.length === 0) {
        setSyncMessage({ 
          text: '✨ Все данные уже синхронизированы', 
          type: 'success' 
        });
        setTimeout(() => setSyncMessage(null), 3000);
        return;
      }

      for (let i = 0; i < unsyncedFlights.length; i++) {
        if (!isActive) break;
        
        const flight = unsyncedFlights[i];
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (flight.id && isActive) {
          let newStatus: Flight['status'] = 'synced';
          if (flight.status === 'completed') {
            newStatus = 'completed';
          }
          
          await db.flights.update(flight.id, { 
            status: newStatus,
            lastModified: new Date()
          });
        }
      }

      if (isActive) {
        const updatedFlights = await db.flights.toArray();
        const sorted = updatedFlights.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setFlights(sorted);
        
        setSyncMessage({ 
          text: `✅ Успешно синхронизировано ${unsyncedFlights.length} рейсов`, 
          type: 'success' 
        });
        setTimeout(() => setSyncMessage(null), 3000);
      }

    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      if (isActive) {
        setSyncMessage({ 
          text: '❌ Ошибка синхронизации', 
          type: 'error' 
        });
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } finally {
      if (isActive) {
        setSyncing(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusInfo = (status: Flight['status']) => {
    switch (status) {
      case 'active':
        return { 
          color: 'bg-green-100 text-green-800', 
          dot: 'bg-green-500',
          text: 'Активный',
          progressColor: 'bg-green-500'
        };
      case 'completed':
        return { 
          color: 'bg-blue-100 text-blue-800', 
          dot: 'bg-blue-500',
          text: 'Завершен',
          progressColor: 'bg-blue-500'
        };
      case 'synced':
        return { 
          color: 'bg-purple-100 text-purple-800',
          dot: 'bg-purple-500',
          text: 'Синхронизирован',
          progressColor: 'bg-purple-500'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          dot: 'bg-gray-300',
          text: 'Черновик',
          progressColor: 'bg-gray-300'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">✈️</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Загружаем ваши рейсы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      <TemplateLibrary
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />

      {/* Шапка */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">✈️</span>
              <h1 className="text-2xl font-bold">Мои рейсы</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center"
                title="Управление шаблонами"
              >
                <span className="mr-1">📚</span>
                Шаблоны
              </button>
            <button
  onClick={() => navigate('/reports')}
  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center"
  title="Отчеты"
>
  <span className="mr-1">📊</span>
  Отчеты
</button>
            </div>
          </div>
          
          {/* Поиск */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="🔍 Поиск по номеру или борту..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-md">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            ✈️ Активные ({activeFlights.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            📦 Завершенные ({completedFlights.length})
          </button>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Уведомление о синхронизации */}
        {syncMessage && (
          <div className={`mb-4 p-3 rounded-lg shadow-lg transform transition-all duration-500 animate-slideDown ${
            syncMessage.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">{syncMessage.type === 'success' ? '✅' : '❌'}</span>
              <span className="flex-1">{syncMessage.text}</span>
            </div>
          </div>
        )}

        {/* Кнопки действий (только для активных рейсов) */}
        {activeTab === 'active' && (
          <div className="flex gap-3 mb-6">
            {/* <button
              onClick={handleSync}
              disabled={syncing}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl shadow-md transition-all transform hover:scale-105 ${
                syncing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              {syncing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Синхронизация...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🔄</span>
                  <span>Синхронизировать</span>
                </>
              )}
            </button> */}

            <Link 
              to="/flight/new" 
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              <span className="text-xl">✈️</span>
              <span>Новый рейс</span>
            </Link>
          </div>
        )}

        {/* Счетчик для завершенных */}
        {activeTab === 'completed' && completedFlights.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 mb-4 text-center text-sm text-gray-600">
            📦 В архиве {completedFlights.length} {completedFlights.length === 1 ? 'рейс' : 'рейсов'}
          </div>
        )}

        {/* Список рейсов */}
        {currentFlights.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-8xl mb-4 animate-float">
              {activeTab === 'active' ? '✈️' : '📦'}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {searchTerm 
                ? 'Ничего не найдено' 
                : activeTab === 'active' 
                  ? 'Нет активных рейсов' 
                  : 'Нет завершенных рейсов'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Попробуйте изменить параметры поиска' 
                : activeTab === 'active'
                  ? 'Создайте свой первый рейс и начните планирование'
                  : 'Завершенные рейсы появятся здесь'}
            </p>
            {!searchTerm && activeTab === 'active' && (
              <Link 
                to="/flight/new" 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                <span>✈️</span>
                <span>Создать первый рейс</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentFlights.map((flight, index) => {
              const statusInfo = getStatusInfo(flight.status);
              // Получаем прогресс из состояния, если нет - 0
              const progress = flightProgress.get(flight.id!) ?? 0;
              
              return (
                <div
                  key={flight.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer overflow-hidden animate-fadeIn relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={(e) => flight.id && handleFlightClick(flight.id, e)}
                >
                  {/* Подтверждение удаления */}
                  {deleteConfirm === flight.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-white rounded-lg p-4 mx-4">
                        <p className="text-gray-800 mb-3">Удалить рейс {flight.flightNumber}?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => flight.id && handleDeleteFlight(flight.id, e)}
                            className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                          >
                            Удалить
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(null);
                            }}
                            className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-gray-800">{flight.flightNumber}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>

                      </div>
                                              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                          <span>{formatDate(flight.date)}</span>
                          {flight.aircraft && (
                            <>
                              {/* <span>•</span> */}
                              <span>✈️ {flight.aircraft}</span>
                            </>
                          )}
                        </div>
                      {/* <div className="relative">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{progress}%</span>
                        </div>
                      </div> */}
                    </div>

                    {/* Прогресс бар (только для активных) */}
                    {activeTab === 'active' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Прогресс</span>
                          <span className="font-medium text-gray-800">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${statusInfo.progressColor}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Для завершенных показываем дату завершения */}
                    {activeTab === 'completed' && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <span className="text-blue-500 mr-1">✓</span>
                          Завершен: {new Date(flight.lastModified).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    )}

                    {/* Дополнительная информация и действия */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-1"></span>
                          Обновлен: {new Date(flight.lastModified).toLocaleTimeString()}
                        </span>
                        {flight.status === 'synced' && (
                          <span className="flex items-center text-green-500">
                            <span className="mr-1">✓</span>
                            Синхр.
                          </span>
                        )}
                      </div>
                      
                      {/* Кнопки действий (только для активных) */}
                      {activeTab === 'active' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => handleEditFlight(flight.id, e)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(flight.id!);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      )}

                      {/* Для завершенных - только просмотр */}
                      {activeTab === 'completed' && (
                        <div className="text-xs text-gray-400">
                          👁️ Просмотр
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Стили для анимаций */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FlightList;