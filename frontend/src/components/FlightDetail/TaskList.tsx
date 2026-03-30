// frontend/src/components/FlightDetail/TaskList.tsx
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task } from '../../db/database';
import TaskCard from '../TaskCard';

interface TaskListProps {
  tasks: Task[];
  activeTimer: number | null;
  expandedTask: number | null;
  isCompleted: boolean;
  onToggleDetails: (taskId: number) => void;
  onStart: (taskId: number) => void;
  onStop: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task, e: React.MouseEvent) => void;
  onDuplicate: (task: Task, e: React.MouseEvent) => void;
  onReorder: (tasks: Task[]) => Promise<void> | void;
  formatTime: (seconds?: number) => string;
  formatTimeOfDay: (date?: Date) => string;
  onOpenAddModal: () => void;      // новое имя
  onOpenTemplates: () => void;     // новое имя
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTimer,
  expandedTask,
  isCompleted,
  onToggleDetails,
  onStart,
  onStop,
  onEdit,
  onDelete,
  onDuplicate,
  onReorder,
  formatTime,
  formatTimeOfDay,
  onOpenAddModal,      // новое имя
  onOpenTemplates      // новое имя
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    const updatedTasks = newTasks.map((task, index) => ({ ...task, order: index }));
    
    await onReorder(updatedTasks);
  };

  return (
    <div className="space-y-4">
      {/* Кнопки управления - показываем только для активных рейсов */}
      {!isCompleted && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={onOpenAddModal}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Добавить задачу</span>
          </button>
          
          <button
            onClick={onOpenTemplates}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl transition-colors shadow-md"
          >
            {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg> */}
            <span>📚 Шаблоны</span>
          </button>
        </div>
      )}

      {/* Список задач */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Нет задач</h3>
          <p className="text-gray-500 mb-4">
            {isCompleted 
              ? 'Этот рейс завершен, задачи не добавляются'
              : 'Добавьте первую задачу или выберите из шаблонов'}
          </p>
          {!isCompleted && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Создать задачу
              </button>
              <button
                onClick={onOpenTemplates}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                📚 Из шаблонов
              </button>
            </div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map(t => t.id!)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isActive={activeTimer === task.id}
                  activeTimer={activeTimer}
                  expandedTask={expandedTask}
                  onToggleDetails={onToggleDetails}
                  onStart={() => onStart(task.id!)}
                  onStop={() => onStop(task.id!)}
                  onEdit={() => onEdit(task)}
                  onDelete={(e) => onDelete(task, e)}
                  onDuplicate={(e) => onDuplicate(task, e)}
                  formatTime={formatTime}
                  formatTimeOfDay={formatTimeOfDay}
                  readOnly={isCompleted}
                  isDraggable={!isCompleted && !task.completed}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default TaskList;