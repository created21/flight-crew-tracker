// frontend/src/components/TaskCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../db/database';

interface TaskCardProps {
  task: Task;
  isActive: boolean;
  activeTimer: number | null;
  expandedTask: number | null;
  onToggleDetails: (taskId: number) => void;
  onStart: () => void;
  onStop: () => void;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  formatTime: (seconds?: number) => string;
  formatTimeOfDay: (date?: Date) => string;
  readOnly?: boolean;
  isDraggable?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isActive,
  activeTimer,
  expandedTask,
  onToggleDetails,
  onStart,
  onStop,
  onEdit,
  onDelete,
  onDuplicate,
  formatTime,
  formatTimeOfDay,
  readOnly = false,
  isDraggable = true
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id!,
    disabled: readOnly || task.completed
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDraggable && !readOnly && !task.completed ? 'grab' : 'default'
  };

  const isExpanded = expandedTask === task.id;
  const hasDescription = task.description && task.description.trim().length > 0;
  
  // Вычисляем длительность, если таймер активен
  const getCurrentDuration = () => {
    if (task.startTime && !task.completed) {
      const startTime = new Date(task.startTime);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      return elapsed;
    }
    return task.duration || 0;
  };

  const currentDuration = getCurrentDuration();

  // Получаем статус и иконку
  const getStatusInfo = () => {
    if (task.completed) {
      return { text: 'Выполнена', icon: '✅', color: 'text-green-600' };
    }
    if (isActive) {
      return { text: 'В процессе', icon: '⏱️', color: 'text-green-600 font-medium' };
    }
    return { text: 'Ожидает', icon: '⭕', color: 'text-gray-500' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable && !readOnly && !task.completed ? attributes : {})}
      {...(isDraggable && !readOnly && !task.completed ? listeners : {})}
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all ${
        isActive ? 'ring-2 ring-green-500 ring-opacity-50' : ''
      } ${task.completed ? 'opacity-80' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            {/* Drag handle */}
            {isDraggable && !readOnly && !task.completed && (
              <div className="mr-2 text-gray-400 cursor-grab active:cursor-grabbing">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 8h16M4 16h16" />
                </svg>
              </div>
            )}
            
            {/* Статус иконка */}
            <div className="mr-3">
              {task.completed ? (
                <span className="text-green-500 text-xl">✅</span>
              ) : isActive ? (
                <div className="relative">
                  <span className="text-green-500 text-xl animate-pulse">⏱️</span>
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                </div>
              ) : (
                <span className="text-gray-400 text-xl">○</span>
              )}
            </div>

            {/* Название задачи */}
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {task.name}
                </h3>
                {currentDuration > 0 && !task.completed && isActive && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full animate-pulse">
                    ⏱️ {formatTime(currentDuration)}
                  </span>
                )}
                {task.duration && task.completed && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                    ⏱️ {formatTime(task.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          {!readOnly && (
            <div className="flex items-center space-x-1">
              {/* Кнопка старт/стоп */}
              {!task.completed && (
                isActive ? (
                  <button
                    onClick={onStop}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Остановить"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={onStart}
                    className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    title="Запустить"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )
              )}

              {/* Кнопка копирования */}
              <button
                onClick={onDuplicate}
                className="p-2 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
                title="Копировать"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Кнопка редактирования */}
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg transition-colors"
                title="Редактировать"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Кнопка удаления */}
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                title="Удалить"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Кнопка развернуть/свернуть */}
              <button
                onClick={() => onToggleDetails(task.id!)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title={isExpanded ? "Свернуть" : "Подробнее"}
              >
                <svg 
                  className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Развернутая информация - сетка 2x2 */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Блок описания */}
            {hasDescription && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">📝 Описание</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {task.description}
                </div>
              </div>
            )}

            {/* Сетка 2x2 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Начало */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500 mb-1">⏰ Начало</div>
                <div className="text-gray-700 font-mono">
                  {task.startTime ? formatTimeOfDay(task.startTime) : '—'}
                </div>
              </div>

              {/* Завершение */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500 mb-1">🏁 Завершение</div>
                <div className="text-gray-700 font-mono">
                  {task.endTime ? formatTimeOfDay(task.endTime) : '—'}
                </div>
              </div>

              {/* Длительность */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500 mb-1">⏱️ Длительность</div>
                <div className={`font-mono ${isActive ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                  {currentDuration > 0 ? formatTime(currentDuration) : '—'}
                  {isActive && ' (идет)'}
                </div>
              </div>

              {/* Статус */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500 mb-1">📌 Статус</div>
                <div className={`flex items-center gap-1 ${statusInfo.color}`}>
                  <span>{statusInfo.icon}</span>
                  <span>{statusInfo.text}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;