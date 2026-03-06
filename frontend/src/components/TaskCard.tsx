// frontend/src/components/TaskCard.tsx
// import React, { useState } from 'react';
import React from 'react';
import { Task } from '../db/database';

interface TaskCardProps {
  task: Task;
  isActive: boolean;
  activeTimer: number | null;
  expandedTask: number | null;
  onToggleDetails: (taskId: number) => void;
  onStart: (taskId: number) => void;
  onStop: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task, e: React.MouseEvent) => void;
  onDuplicate: (task: Task, e: React.MouseEvent) => void;
  formatTime: (seconds?: number) => string;
  formatTimeOfDay: (date?: Date) => string;
  readOnly?: boolean; // Новый проп
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
  readOnly = false // По умолчанию false
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
      readOnly ? 'opacity-90' : ''
    }`}>
      {/* Основная информация задачи */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => task.id && onToggleDetails(task.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {task.completed ? '✅' : activeTimer === task.id ? '⏳' : '⭕'}
              </span>
              <div>
                <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                  {task.name}
                </h3>
              </div>
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              {task.duration ? (
                <span className="flex items-center">
                  ⏱️ {formatTime(task.duration)}
                </span>
              ) : activeTimer === task.id ? (
                <span className="flex items-center text-green-500">
                  🔵 Выполняется... {formatTime(task.duration || 0)}
                </span>
              ) : (
                <span className="flex items-center">
                  ⏱️ Не начато
                </span>
              )}
              
              <span className="ml-3 text-xs text-gray-400">
                {expandedTask === task.id ? '▲' : '▼'}
              </span>
            </div>
          </div>

          {/* Кнопки действий - показываем только если не readOnly */}
          {!readOnly && (
            <div className="flex items-center space-x-1">
              {!task.completed && (
                <>
                  {activeTimer === task.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        task.id && onStop(task.id);
                      }}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 transition-colors"
                      title="Остановить"
                    >
                      ⏹️
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        task.id && onStart(task.id);
                      }}
                      className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors"
                      title="Старт"
                    >
                      ▶️
                    </button>
                  )}
                </>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="text-gray-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                title="Редактировать"
              >
                ✏️
              </button>

              <button
                onClick={(e) => onDuplicate(task, e)}
                className="text-gray-400 hover:text-green-500 p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                title="Копировать"
              >
                📋
              </button>

              <button
                onClick={(e) => onDelete(task, e)}
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Удалить"
              >
                🗑️
              </button>
            </div>
          )}

          {/* Для readOnly режима показываем только иконку просмотра */}
          {readOnly && (
            <div className="text-gray-400 px-2">
              👁️
            </div>
          )}
        </div>
      </div>

      {/* Детальная информация задачи (всегда показываем) */}
      {expandedTask === task.id && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          {task.description && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Описание</div>
              <div className="text-sm">{task.description}</div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-400 mb-1">Начало</div>
              <div className="font-medium">
                {task.startTime ? formatTimeOfDay(task.startTime) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Завершение</div>
              <div className="font-medium">
                {task.endTime ? formatTimeOfDay(task.endTime) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Длительность</div>
              <div className="font-medium">
                {task.duration ? formatTime(task.duration) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Статус</div>
              <div className="font-medium">
                {task.completed ? '✅ Завершена' : activeTimer === task.id ? '⏳ Выполняется' : '⭕ Ожидает'}
              </div>
            </div>
          </div>

          {task.startTime && task.endTime && (
            <div className="mt-3 text-xs text-gray-400">
              Интервал: {formatTimeOfDay(task.startTime)} - {formatTimeOfDay(task.endTime)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;