// frontend/src/components/FlightDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, Flight, Task, addToSyncQueue } from '../db/database';

// Импорты компонентов
import FlightHeader from './FlightHeader';
import ProgressBar from './ProgressBar';
import TaskControls from './TaskControls';
import AddTaskForm from './AddTaskForm';
import TaskCard from './TaskCard';
import EmptyState from './EmptyState';
import ConfirmModal from './ConfirmModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import TaskEditModal from './TaskEditModal';
import TemplateManager from './TemplateManager';

// Импорт данных
import { getTemplatesByCategory } from '../data/taskTemplates';

const FlightDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Состояния
  const [flight, setFlight] = useState<Flight | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI состояния
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Редактирование и удаление
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  // Таймер
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // Загрузка данных
  useEffect(() => {
    const loadFlightData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const flightId = parseInt(id);
        
        const [flightData, taskData] = await Promise.all([
          db.flights.get(flightId),
          db.tasks.where('flightId').equals(flightId).toArray()
        ]);
        
        setFlight(flightData || null);
        setTasks(taskData.sort((a, b) => a.order - b.order));
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlightData();
  }, [id]);

  // Очистка таймера
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  // Форматирование времени
  const formatTime = (seconds: number = 0): string => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeOfDay = (date?: Date): string => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Управление задачами (только для активных рейсов)
  const startTask = async (taskId: number) => {
    if (flight?.status === 'completed') {
      alert('Нельзя изменять задачи завершенного рейса');
      return;
    }
    
    if (activeTimer) await stopTask(activeTimer);

    const now = new Date();
    await db.tasks.update(taskId, {
      startTime: now,
      endTime: undefined,
      completed: false
    });

    setActiveTimer(taskId);
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, startTime: now, endTime: undefined } : t
    ));

    const interval = setInterval(async () => {
      const currentTask = await db.tasks.get(taskId);
      if (currentTask?.startTime) {
        const elapsed = Math.floor((Date.now() - new Date(currentTask.startTime).getTime()) / 1000);
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, duration: elapsed } : t
        ));
      }
    }, 1000);
    
    setTimerInterval(interval);
  };

  const stopTask = async (taskId: number) => {
    if (flight?.status === 'completed') return;

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    const task = tasks.find(t => t.id === taskId);
    if (task?.startTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(task.startTime).getTime()) / 1000);
      
      await db.tasks.update(taskId, {
        endTime,
        duration,
        completed: true
      });

      await addToSyncQueue('update', 'tasks', {
        id: taskId,
        flightId: parseInt(id!),
        duration,
        completed: true
      });

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, endTime, duration, completed: true } : t
      ));
    }

    setActiveTimer(null);
  };

  const addTask = async (name: string, description: string, duration: number) => {
    if (!id || !name) return;
    if (flight?.status === 'completed') {
      alert('Нельзя добавлять задачи в завершенный рейс');
      return;
    }

    const flightId = parseInt(id);
    const taskData = {
      flightId,
      name,
      description,
      order: tasks.length,
      completed: false,
      duration: duration || undefined,
      startTime: undefined,
      endTime: undefined,
      synced: false
    };

    const taskId = await db.tasks.add(taskData);
    await addToSyncQueue('create', 'tasks', { ...taskData, id: taskId });

    setTasks(prev => [...prev, { ...taskData, id: taskId }]);
    setShowAddTask(false);
  };

  const addTaskFromTemplate = async (template: any) => {
    if (!id) return;
    if (flight?.status === 'completed') {
      alert('Нельзя добавлять задачи в завершенный рейс');
      return;
    }

    await addTask(
      template.name,
      template.description,
      template.defaultDuration || 0
    );
    setShowTemplateManager(false);
  };

  const saveEditedTask = async (updatedData: Partial<Task>) => {
    if (!editingTask?.id) return;
    if (flight?.status === 'completed') {
      alert('Нельзя редактировать задачи завершенного рейса');
      return;
    }

    await db.tasks.update(editingTask.id, {
      ...updatedData,
      lastModified: new Date()
    });

    await addToSyncQueue('update', 'tasks', {
      id: editingTask.id,
      flightId: parseInt(id!),
      ...updatedData
    });

    setTasks(prev => prev.map(t => 
      t.id === editingTask.id ? { ...t, ...updatedData } : t
    ));
    setEditingTask(null);
  };

  const confirmDeleteTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (flight?.status === 'completed') {
      alert('Нельзя удалять задачи завершенного рейса');
      return;
    }
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const deleteTask = async () => {
    if (!taskToDelete?.id) return;

    if (activeTimer === taskToDelete.id) {
      await stopTask(taskToDelete.id);
    }

    await db.tasks.delete(taskToDelete.id);
    await addToSyncQueue('delete', 'tasks', { id: taskToDelete.id });

    setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const duplicateTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (flight?.status === 'completed') {
      alert('Нельзя копировать задачи завершенного рейса');
      return;
    }

    const { id, ...taskData } = task;
    const newTaskData = {
      ...taskData,
      name: `${task.name} (копия)`,
      order: tasks.length,
      completed: false,
      startTime: undefined,
      endTime: undefined,
      synced: false
    };

    const newId = await db.tasks.add(newTaskData);
    await addToSyncQueue('create', 'tasks', { ...newTaskData, id: newId });

    setTasks(prev => [...prev, { ...newTaskData, id: newId }]);
  };

  const completeFlight = async () => {
    if (!id) return;

    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0) {
      setShowCompleteModal(true);
      return;
    }

    await finishFlight();
  };

  const finishFlight = async () => {
  if (!id) return;

  const flightId = parseInt(id);
  
  // Завершаем рейс (статус completed)
  await db.flights.update(flightId, {
    status: 'completed',
    lastModified: new Date()
  });

  // Добавляем в очередь синхронизации как completed
  await addToSyncQueue('update', 'flights', {
    id: flightId,
    status: 'completed',
    completedAt: new Date()
  });

  // Обновляем локальное состояние
  setFlight(prev => prev ? { 
    ...prev, 
    status: 'completed', 
    lastModified: new Date() 
  } : null);
  
  // Показываем сообщение и возвращаемся на главную
  setTimeout(() => navigate('/'), 2000);
};

  const toggleTaskDetails = (taskId: number) => {
    setExpandedTask(prev => prev === taskId ? null : taskId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Рейс не найден</h2>
          <button
            onClick={() => navigate('/')}
            className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const templatesByCategory = getTemplatesByCategory();
  const isCompleted = flight.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      {/* Модальные окна */}
      <ConfirmModal
        isOpen={showCompleteModal}
        title="Завершить рейс?"
        message="Есть незавершенные задачи. Вы уверены, что хотите завершить рейс?"
        onConfirm={() => {
          setShowCompleteModal(false);
          finishFlight();
        }}
        onCancel={() => setShowCompleteModal(false)}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        taskName={taskToDelete?.name || ''}
        onConfirm={deleteTask}
        onCancel={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
      />

      <TaskEditModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={saveEditedTask}
      />

      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onSelectTemplate={addTaskFromTemplate}
      />

      {/* Шапка */}
      <FlightHeader 
        flight={flight} 
        tasks={tasks}
        onBack={() => navigate('/')} 
      />

      {/* Основной контент */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        <ProgressBar completed={completedCount} total={tasks.length} />

        {/* Управление задачами - показываем только для активных рейсов */}
        {!isCompleted && (
          <TaskControls
            showAddTask={showAddTask}
            onToggleAdd={() => setShowAddTask(!showAddTask)}
            onOpenTemplates={() => setShowTemplateManager(true)}
          />
        )}

        {/* Форма добавления - только для активных */}
        {showAddTask && !isCompleted && (
          <AddTaskForm
            onAdd={addTask}
            onCancel={() => setShowAddTask(false)}
          />
        )}

        {/* Список задач */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <EmptyState
              onAddClick={() => setShowAddTask(true)}
              onTemplatesClick={() => setShowTemplateManager(true)}
            />
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={activeTimer === task.id}
                activeTimer={activeTimer}
                expandedTask={expandedTask}
                onToggleDetails={toggleTaskDetails}
                onStart={startTask}
                onStop={stopTask}
                onEdit={setEditingTask}
                onDelete={confirmDeleteTask}
                onDuplicate={duplicateTask}
                formatTime={formatTime}
                formatTimeOfDay={formatTimeOfDay}
                readOnly={isCompleted} // Передаем проп readOnly для заблокированных действий
              />
            ))
          )}
        </div>

        {/* Кнопка завершения рейса - только для активных */}
        {!isCompleted && (
          <button
            onClick={completeFlight}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] font-medium text-lg mt-6"
          >
            ✈️ Завершить рейс
          </button>
        )}

        {/* Информация для завершенных рейсов */}
        {isCompleted && (
          <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-xl font-medium text-blue-800 mb-2">Рейс завершен</h3>
            <p className="text-blue-600">
              Завершен: {new Date(flight.lastModified).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-sm text-blue-500 mt-2">
              Выполнено задач: {completedCount} из {tasks.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightDetail;