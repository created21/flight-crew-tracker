// frontend/src/components/QuickTemplates.tsx
import React from 'react';
import { TaskTemplate, categoryNames } from '../data/taskTemplates';

interface QuickTemplatesProps {
  templatesByCategory: Record<string, TaskTemplate[]>;
  onSelectTemplate: (template: TaskTemplate) => void;
  onClose: () => void;
}

const QuickTemplates: React.FC<QuickTemplatesProps> = ({
  templatesByCategory,
  onSelectTemplate,
  onClose
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Быстрые шаблоны</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(templatesByCategory).map(([category, templates]) => {
          const categoryTemplates = templates as TaskTemplate[];
          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                {categoryNames[category] || category}
              </h4>
              <div className="space-y-2">
                {categoryTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.description}</div>
                    {template.defaultDuration && (
                      <div className="text-xs text-gray-400 mt-1">
                        ⏱️ {Math.floor(template.defaultDuration / 60)} мин
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickTemplates;