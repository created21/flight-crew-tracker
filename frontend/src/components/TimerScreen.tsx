// frontend/src/components/TimerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, addToSyncQueue } from '../db/database';

const TimerScreen: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [taskName, setTaskName] = useState('');
  const [note, setNote] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    const loadTask = async () => {
      if (taskId) {
        try {
          const task = await db.tasks.get(parseInt(taskId));
          if (task) {
            setTaskName(task.name);
            if (task.startTime) {
              const elapsed = Math.floor(
                (new Date().getTime() - new Date(task.startTime).getTime()) / 1000
              );
              setTime(elapsed);
            }
          } else {
            // Если задачи нет в БД, используем тестовые данные
            setTaskName('Посадка пассажиров');
          }
        } catch (error) {
          console.error('Error loading task:', error);
          setTaskName('Посадка пассажиров');
        }
      }
    };
    
    loadTask();

    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [taskId]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (taskId) {
      const endTime = new Date();
      
      try {
        // Обновляем задачу в локальной БД
        await db.tasks.update(parseInt(taskId), {
          completed: true,
          duration: time,
          endTime,
          synced: false
        });

        await addToSyncQueue('update', 'tasks', {
          id: parseInt(taskId),
          duration: time,
          endTime,
          note
        });

        if (navigator.onLine) {
          try {
            await fetch('/api/tasks/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({
                taskId: parseInt(taskId),
                duration: time,
                note
              })
            });
            
            await db.tasks.update(parseInt(taskId), { synced: true });
          } catch (error) {
            console.error('Sync failed, will retry later:', error);
          }
        }
      } catch (error) {
        console.error('Error saving task:', error);
      }
    }

    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-4">
      <div className="text-center">
        <h1 className="text-white text-2xl mb-2">{taskName || 'Загрузка...'}</h1>
        {!navigator.onLine && (
          <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm mb-4">
            ⚠️ Офлайн режим
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-white font-mono text-8xl font-bold">
          {formatTime(time)}
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Добавить заметку (необязательно)"
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400"
          rows={2}
        />

        <button
          onClick={handleStop}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-4xl font-bold py-8 rounded-2xl active:bg-red-800 transition-colors"
        >
          ⏹ СТОП
        </button>

        <button
          onClick={() => navigate(-1)}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg"
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default TimerScreen;