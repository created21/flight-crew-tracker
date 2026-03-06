// frontend/src/components/TemplateLibrary.tsx
import React, { useState } from 'react';
// import { taskTemplates, TaskTemplate, categoryNames, getTemplatesByCategory } from '../data/taskTemplates';
import { taskTemplates, TaskTemplate, categoryNames } from '../data/taskTemplates';


interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // const categories = ['all', ...Object.keys(categoryNames)];
  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
  >
    <option value="all">Все категории</option>
    {Object.entries(categoryNames).map(([key, name]) => (
      <option key={key} value={key}>{name}</option>
    ))}
  </select>
  const filteredTemplates = taskTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
  };

  const handleSave = (updatedTemplate: TaskTemplate) => {
    // В реальном приложении здесь было бы сохранение в базу данных
    // Пока просто показываем уведомление
    alert(`Шаблон "${updatedTemplate.name}" сохранен`);
    setEditingTemplate(null);
  };

  const handleDelete = (templateId: string) => {
    // В реальном приложении здесь было бы удаление из базы
    alert(`Шаблон удален`);
    setShowDeleteConfirm(null);
  };

  const handleCreateNew = () => {
    const newTemplate: TaskTemplate = {
      id: `new-${Date.now()}`,
      name: 'Новый шаблон',
      description: 'Описание шаблона',
      category: 'other',
      defaultDuration: 300
    };
    setEditingTemplate(newTemplate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-slideDown">
        {/* Шапка */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📚 Библиотека шаблонов</h2>
              <p className="text-white/80 mt-1">Управляйте шаблонами задач для рейсов</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="p-6 border-b">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Поиск по названию или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Все категории</option>
              {Object.entries(categoryNames).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <button
              onClick={handleCreateNew}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <span className="mr-1">+</span> Новый шаблон
            </button>
          </div>
        </div>

        {/* Список шаблонов */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Шаблоны не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="border rounded-xl p-5 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{template.name}</h3>
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {categoryNames[template.category]}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-gray-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(template.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">{template.description}</p>

                  {template.defaultDuration && (
                    <div className="text-xs text-gray-400 flex items-center">
                      <span className="mr-1">⏱️</span>
                      Длительность: {Math.floor(template.defaultDuration / 60)} мин
                    </div>
                  )}

                  {/* Подтверждение удаления */}
                  {showDeleteConfirm === template.id && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-2">Удалить шаблон "{template.name}"?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                        >
                          Удалить
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-300"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования */}
      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          onSave={handleSave}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
};

// Модальное окно редактирования шаблона
interface TemplateEditModalProps {
  template: TaskTemplate;
  onSave: (template: TaskTemplate) => void;
  onClose: () => void;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({ template, onSave, onClose }) => {
  const [formData, setFormData] = useState<TaskTemplate>(template);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-slideDown">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
          <h3 className="text-lg font-bold">
            {template.id.startsWith('new-') ? '➕ Новый шаблон' : '✏️ Редактировать шаблон'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">Категория</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(categoryNames).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Длительность по умолчанию (секунды)
            </label>
            <input
              type="number"
              value={formData.defaultDuration || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                defaultDuration: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="300"
              min="0"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
            >
              💾 Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateLibrary;