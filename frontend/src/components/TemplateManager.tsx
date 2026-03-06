// frontend/src/components/TemplateManager.tsx
import React, { useState } from 'react';
import { TaskTemplate, taskTemplates, categoryNames } from '../data/taskTemplates';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Object.keys(categoryNames)];

  const filteredTemplates = taskTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-slideDown">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">📚 Библиотека шаблонов</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="🔍 Поиск шаблонов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Все категории</option>
              {Object.entries(categoryNames).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Шаблоны не найдены
              </div>
            ) : (
              filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {categoryNames[template.category]}
                    </span>
                  </div>
                  {template.defaultDuration && (
                    <div className="mt-2 text-xs text-gray-400">
                      ⏱️ {Math.floor(template.defaultDuration / 60)} мин
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;