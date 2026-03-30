// frontend/src/components/FlightDetail/index.tsx
import React, { useState } from 'react'; // Добавьте useState
import { useFlightDetail } from './useFlightDetail';
import FlightHeader from './FlightHeader';
import FlightProgress from './FlightProgress';
import TaskList from './TaskList';
import AddTaskModal from '../AddTaskModal';
import ConfirmModal from '../ConfirmModal';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import TaskEditModal from '../TaskEditModal';
import TemplateManager from '../TemplateManager';
import QRModal from '../QRModal';
import FlightReportModal from '../FlightReportModal';

const FlightDetail: React.FC = () => {
  const {
    flight,
    tasks,
    loading,
    isAddModalOpen,
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
    setIsAddModalOpen,
    setShowTemplateManager,
    setShowCompleteModal,
    setShowDeleteModal,
    setShowQRModal,
    setEditingTask,
    setTaskToDelete,
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
    navigate,
  } = useFlightDetail();

const [showReportModal, setShowReportModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      {/* Модальное окно добавления задачи */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTask}
      />

      {/* Модальное окно шаблонов */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onSelectTemplate={addTaskFromTemplate}
      />

      {/* Модальное окно подтверждения завершения рейса */}
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

      {/* Модальное окно подтверждения удаления */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        taskName={taskToDelete?.name || ''}
        onConfirm={deleteTask}
        onCancel={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
      />

      {/* Модальное окно редактирования задачи */}
      <TaskEditModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={saveEditedTask}
      />

      {/* Модальное окно QR-кода */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        flight={flight}
        tasks={tasks}
      />

<FlightReportModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  flight={flight}
  tasks={tasks}
/>

      {/* Шапка */}
      <FlightHeader flight={flight} />

      {/* Основной контент */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        <FlightProgress completed={completedCount} total={tasks.length} />

        {/* Список задач */}
        <TaskList
          tasks={tasks}
          activeTimer={activeTimer}
          expandedTask={expandedTask}
          isCompleted={isCompleted}
          onToggleDetails={toggleTaskDetails}
          onStart={startTask}
          onStop={stopTask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onDuplicate={handleDuplicateTask}
          onReorder={reorderTasks}
          formatTime={formatTime}
          formatTimeOfDay={formatTimeOfDay}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenTemplates={() => setShowTemplateManager(true)}
        />

        {/* Кнопки управления */}
        {!isCompleted && (
          <div className="space-y-2 mt-6">
            <button
              onClick={completeFlight}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] font-medium text-lg"
            >
              ✈️ Завершить рейс
            </button>

            <button
  onClick={() => setShowReportModal(true)}
  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl shadow-md hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
>
  {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg> */}
  📄 Отчет по рейсу
</button>

            <button
              onClick={() => setShowQRModal(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl shadow-md hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
            >
              {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg> */}
              📱 Поделиться рейсом (QR-код)
            </button>
          </div>
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