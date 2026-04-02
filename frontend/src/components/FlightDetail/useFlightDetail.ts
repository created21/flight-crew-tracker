// frontend/src/components/FlightDetail/useFlightDetail.ts
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, Flight, Task, addToSyncQueue } from '../../db/database';

export const useFlightDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Состояния
  const [flight, setFlight] = useState<Flight | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  // UI состояния
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);  // Добавляем
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // Таймер
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeOfDay = (date?: Date): string => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Запуск задачи
  const startTask = async (taskId: number) => {
    console.log('▶️ startTask вызван, taskId:', taskId);
    
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
      t.id === taskId ? { ...t, startTime: now, endTime: undefined, completed: false } : t
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

  // Остановка задачи
  const stopTask = async (taskId: number) => {
    console.log('⏹️ stopTask вызван, taskId:', taskId);
    
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
        completed: true,
        endTime
      });

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, endTime, duration, completed: true } : t
      ));
    }

    setActiveTimer(null);
  };

  // Добавление задачи
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
    setIsAddModalOpen(false);  // Закрываем модальное окно после добавления
  };

  const addTaskFromTemplate = async (template: any) => {
    if (!id) return;
    if (flight?.status === 'completed') {
      alert('Нельзя добавлять задачи в завершенный рейс');
      return;
    }
    await addTask(template.name, template.description, template.defaultDuration || 0);
    setShowTemplateManager(false);
  };

  // Редактирование
  const handleEditTask = (task: Task) => {
    console.log('✏️ handleEditTask вызван, task:', task.name);
    if (flight?.status === 'completed') {
      alert('Нельзя редактировать задачи завершенного рейса');
      return;
    }
    setEditingTask(task);
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

  // Удаление
  const handleDeleteTask = (task: Task, e: React.MouseEvent) => {
    console.log('🗑️ handleDeleteTask вызван, task:', task.name);
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

  // Копирование
  const handleDuplicateTask = async (task: Task, e: React.MouseEvent) => {
    console.log('📋 handleDuplicateTask вызван, task:', task.name);
    e.stopPropagation();
    if (flight?.status === 'completed') {
      alert('Нельзя копировать задачи завершенного рейса');
      return;
    }

    const { id: _, ...taskData } = task;
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

  // Переупорядочивание задач
  const reorderTasks = async (newTasks: Task[]) => {
    console.log('🔄 reorderTasks вызван');
    if (flight?.status === 'completed') return;
    
    setTasks(newTasks);
    
    try {
      for (const task of newTasks) {
        await db.tasks.update(task.id!, { order: task.order });
      }
      console.log('✅ Порядок задач сохранен');
    } catch (error) {
      console.error('❌ Ошибка сохранения порядка:', error);
    }
  };

  const toggleTaskDetails = (taskId: number) => {
    setExpandedTask(prev => prev === taskId ? null : taskId);
  };

  // Завершение рейса
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
  await db.flights.update(flightId, {
    status: 'completed',
    lastModified: new Date()
  });

  await addToSyncQueue('update', 'flights', {
    id: flightId,
    status: 'completed',
    completedAt: new Date()
  });

  setFlight(prev => prev ? { ...prev, status: 'completed', lastModified: new Date() } : null);
  setTimeout(() => navigate('/'), 2000);
};

  const isCompleted = flight?.status === 'completed';
  const completedCount = tasks.filter(t => t.completed).length;

  return {
    // Состояния
    flight,
    tasks,
    loading,
    isAddModalOpen,           // Добавляем
    showTemplateManager,
    showCompleteModal,
    showDeleteModal,
    editingTask,
    taskToDelete,
    expandedTask,
    activeTimer,
    isCompleted,
    completedCount,
    showQRModal,
    setShowQRModal,
    
    // Сеттеры
    setIsAddModalOpen,        // Добавляем
    setShowTemplateManager,
    setShowCompleteModal,
    setShowDeleteModal,
    setEditingTask,
    setTaskToDelete,
    
    // Функции
    startTask,
    stopTask,
    addTask,
    addTaskFromTemplate,
    handleEditTask,
    saveEditedTask,
    handleDeleteTask,
    deleteTask,
    handleDuplicateTask,
    reorderTasks,
    toggleTaskDetails,
    completeFlight,
    finishFlight,
    formatTime,
    formatTimeOfDay,
    navigate
  };
};