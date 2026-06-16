// frontend/src/data/taskTemplates.ts
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  defaultDuration?: number;
  category: 'boarding' | 'flight' | 'service' | 'security' | 'other';
}

export const taskTemplates: TaskTemplate[] = [
  // Посадка
  { 
    id: 'boarding-start', 
    name: 'Начало посадки', 
    description: 'Объявить начало посадки на рейс',
    defaultDuration: 1800, // 30 минут
    category: 'boarding'
  },
  { 
    id: 'boarding-end', 
    name: 'Окончание посадки', 
    description: 'Закрыть посадку, проверить списки',
    defaultDuration: 300, // 5 минут
    category: 'boarding'
  },
  { 
    id: 'door-close', 
    name: 'Закрытие дверей', 
    description: 'Проверить закрытие всех дверей',
    defaultDuration: 60, // 1 минута
    category: 'boarding'
  },
  
  // Предполетные процедуры
  { 
    id: 'safety-demo', 
    name: 'Демонстрация безопасности', 
    description: 'Показать правила безопасности',
    defaultDuration: 300, // 5 минут
    category: 'flight'
  },
  { 
    id: 'seatbelt-check', 
    name: 'Проверка ремней', 
    description: 'Убедиться, что все пристегнуты',
    defaultDuration: 120, // 2 минуты
    category: 'flight'
  },
  { 
    id: 'takeoff', 
    name: 'Взлет', 
    description: 'Взлет, убрать шасси',
    defaultDuration: 600, // 10 минут
    category: 'flight'
  },
  
  // Обслуживание
  { 
    id: 'meal-service', 
    name: 'Разнос питания', 
    description: 'Подать обед/ужин пассажирам',
    defaultDuration: 1800, // 30 минут
    category: 'service'
  },
  { 
    id: 'drink-service', 
    name: 'Разнос напитков', 
    description: 'Подать напитки',
    defaultDuration: 900, // 15 минут
    category: 'service'
  },
  { 
    id: 'duty-free', 
    name: 'Продажа duty-free', 
    description: 'Предложить товары из магазина',
    defaultDuration: 1200, // 20 минут
    category: 'service'
  },
  
  // Безопасность
  { 
    id: 'security-check', 
    name: 'Проверка салона', 
    description: 'Осмотр салона перед вылетом',
    defaultDuration: 300, // 5 минут
    category: 'security'
  },
  { 
    id: 'turbulence', 
    name: 'Зона турбулентности', 
    description: 'Объявить о турбулентности, пристегнуться',
    defaultDuration: 600, // 10 минут
    category: 'security'
  },
  
  // Посадка
  { 
    id: 'landing', 
    name: 'Подготовка к посадке', 
    description: 'Подготовить кабину к посадке',
    defaultDuration: 900, // 15 минут
    category: 'flight'
  },
  { 
    id: 'landing-complete', 
    name: 'Посадка', 
    description: 'Приземление, заруливание на стоянку',
    defaultDuration: 600, // 10 минут
    category: 'flight'
  },
  { 
    id: 'disembark', 
    name: 'Высадка пассажиров', 
    description: 'Открыть двери, высадка',
    defaultDuration: 1200, // 20 минут
    category: 'boarding'
  },
];

// Группировка по категориям
export const getTemplatesByCategory = () => {
  return taskTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, TaskTemplate[]>);
};

// Русские названия категорий
export const categoryNames: Record<string, string> = {
  boarding: 'Посадка',
  flight: 'Полет',
  service: 'Обслуживание',
  security: 'Безопасность',
  other: 'Другое'
};