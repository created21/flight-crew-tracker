// backend/database/db.js
// Временная реализация с файловым хранилищем (для прототипа)
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

async function readData() {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Если файла нет, создаем структуру
    const initialData = {
      users: [],
      flights: [],
      tasks: [],
      timeEntries: [],
      reports: [] // Добавляем массив для отчетов
    };
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

async function writeData(data) {
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  // ==== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ ====
  
  async getUserByTelegramId(telegramId) {
    try {
      const data = await readData();
      return data.users.find(u => u.telegramId === telegramId);
    } catch (error) {
      console.error('Error in getUserByTelegramId:', error);
      return null;
    }
  },
  
  async getUserByToken(token) {
    try {
      const data = await readData();
      return data.users.find(u => u.token === token);
    } catch (error) {
      console.error('Error in getUserByToken:', error);
      return null;
    }
  },
  
  async createUser(userData) {
    try {
      const data = await readData();
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      data.users.push(newUser);
      await writeData(data);
      return newUser;
    } catch (error) {
      console.error('Error in createUser:', error);
      return null;
    }
  },
  
  async updateUserToken(userId, token) {
    try {
      const data = await readData();
      const userIndex = data.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return null;
      }
      
      data.users[userIndex].token = token;
      data.users[userIndex].updatedAt = new Date().toISOString();
      
      await writeData(data);
      return data.users[userIndex];
    } catch (error) {
      console.error('Error in updateUserToken:', error);
      return null;
    }
  },
  
  async getAllUsers() {
    try {
      const data = await readData();
      return data.users;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  },

  // ==== РАБОТА С РЕЙСАМИ ====
  
  async getCurrentFlight(userId) {
    try {
      const data = await readData();
      const flight = data.flights.find(f => 
        f.userId === userId && f.status === 'active'
      );
      
      if (!flight) return null;
      
      // Добавляем задачи к рейсу
      const tasks = data.tasks.filter(t => t.flightId === flight.id);
      const completedTasks = tasks.filter(t => t.completed).length;
      
      return {
        ...flight,
        tasks,
        progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
        activeTasks: tasks.filter(t => !t.completed).length
      };
    } catch (error) {
      console.error('Error in getCurrentFlight:', error);
      return null;
    }
  },
  
  async getFlightById(flightId) {
    try {
      const data = await readData();
      return data.flights.find(f => f.id === flightId) || null;
    } catch (error) {
      console.error('Error in getFlightById:', error);
      return null;
    }
  },
  
  async getFlightsByUser(userId) {
    try {
      const data = await readData();
      return data.flights
        .filter(f => f.userId === userId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error in getFlightsByUser:', error);
      return [];
    }
  },
  
  async createFlight(flightData) {
    try {
      const data = await readData();
      const newFlight = {
        id: Date.now().toString(),
        ...flightData,
        createdAt: new Date().toISOString(),
        status: flightData.status || 'active'
      };
      data.flights.push(newFlight);
      await writeData(data);
      return newFlight;
    } catch (error) {
      console.error('Error in createFlight:', error);
      return null;
    }
  },
  
  async updateFlight(flightId, updates) {
    try {
      const data = await readData();
      const flightIndex = data.flights.findIndex(f => f.id === flightId);
      
      if (flightIndex === -1) {
        return null;
      }
      
      data.flights[flightIndex] = {
        ...data.flights[flightIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await writeData(data);
      return data.flights[flightIndex];
    } catch (error) {
      console.error('Error in updateFlight:', error);
      return null;
    }
  },
  
  async deleteFlight(flightId) {
    try {
      const data = await readData();
      const flightIndex = data.flights.findIndex(f => f.id === flightId);
      
      if (flightIndex === -1) {
        return false;
      }
      
      // Удаляем связанные задачи
      data.tasks = data.tasks.filter(t => t.flightId !== flightId);
      // Удаляем рейс
      data.flights.splice(flightIndex, 1);
      
      await writeData(data);
      return true;
    } catch (error) {
      console.error('Error in deleteFlight:', error);
      return false;
    }
  },

  // ==== РАБОТА С ЗАДАЧАМИ ====
  
  async getTasksByFlight(flightId) {
    try {
      const data = await readData();
      return data.tasks
        .filter(t => t.flightId === flightId)
        .sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error in getTasksByFlight:', error);
      return [];
    }
  },
  
  async createTask(taskData) {
    try {
      const data = await readData();
      const newTask = {
        id: Date.now().toString(),
        ...taskData,
        createdAt: new Date().toISOString(),
        completed: false,
        synced: false
      };
      data.tasks.push(newTask);
      await writeData(data);
      return newTask;
    } catch (error) {
      console.error('Error in createTask:', error);
      return null;
    }
  },
  
  async updateTask(taskId, updates) {
    try {
      const data = await readData();
      const taskIndex = data.tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return null;
      }
      
      data.tasks[taskIndex] = {
        ...data.tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await writeData(data);
      return data.tasks[taskIndex];
    } catch (error) {
      console.error('Error in updateTask:', error);
      return null;
    }
  },
  
  async deleteTask(taskId) {
    try {
      const data = await readData();
      const taskIndex = data.tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return false;
      }
      
      data.tasks.splice(taskIndex, 1);
      await writeData(data);
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return false;
    }
  },

  // ==== РАБОТА С ЗАПИСЯМИ ВРЕМЕНИ ====
  
  async saveTimeEntry(entry) {
    try {
      const data = await readData();
      const newEntry = {
        id: Date.now().toString(),
        ...entry,
        synced: true,
        createdAt: new Date().toISOString()
      };
      data.timeEntries.push(newEntry);
      await writeData(data);
      return newEntry;
    } catch (error) {
      console.error('Error in saveTimeEntry:', error);
      return null;
    }
  },
  
  async getTimeEntriesByFlight(flightId) {
    try {
      const data = await readData();
      return data.timeEntries
        .filter(e => e.flightId === flightId)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } catch (error) {
      console.error('Error in getTimeEntriesByFlight:', error);
      return [];
    }
  },

  // ==== РАБОТА С ОТЧЕТАМИ ====
  
  async saveReport(report) {
    try {
      const data = await readData();
      const newReport = {
        id: Date.now().toString(),
        ...report,
        createdAt: new Date().toISOString()
      };
      
      if (!data.reports) {
        data.reports = [];
      }
      
      data.reports.push(newReport);
      await writeData(data);
      return newReport;
    } catch (error) {
      console.error('Error in saveReport:', error);
      return null;
    }
  },
  
  async getReportsByUser(userId) {
    try {
      const data = await readData();
      if (!data.reports) return [];
      
      return data.reports
        .filter(r => r.userId === userId)
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    } catch (error) {
      console.error('Error in getReportsByUser:', error);
      return [];
    }
  },
  
  async getReportsByFlight(flightId) {
    try {
      const data = await readData();
      if (!data.reports) return [];
      
      return data.reports
        .filter(r => r.flightId === flightId)
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    } catch (error) {
      console.error('Error in getReportsByFlight:', error);
      return [];
    }
  },

  // ==== СТАТИСТИКА ====
  
  async getStats(userId) {
    try {
      const data = await readData();
      const userFlights = data.flights.filter(f => f.userId === userId);
      const userTasks = data.tasks.filter(t => 
        userFlights.some(f => f.id === t.flightId)
      );
      const userTimeEntries = data.timeEntries.filter(e => 
        userFlights.some(f => f.id === e.flightId)
      );
      
      const completedFlights = userFlights.filter(f => f.status === 'completed').length;
      const completedTasks = userTasks.filter(t => t.completed).length;
      const totalTime = userTimeEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
      
      return {
        totalFlights: userFlights.length,
        completedFlights,
        activeFlights: userFlights.filter(f => f.status === 'active').length,
        totalTasks: userTasks.length,
        completedTasks,
        taskProgress: userTasks.length ? Math.round((completedTasks / userTasks.length) * 100) : 0,
        totalTime,
        averageFlightTime: completedFlights ? Math.round(totalTime / completedFlights) : 0
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return null;
    }
  },

  // ==== ОЧИСТКА ДАННЫХ (для тестирования) ====
  
  async clearAllData() {
    try {
      const initialData = {
        users: [],
        flights: [],
        tasks: [],
        timeEntries: [],
        reports: []
      };
      await fs.promises.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
      return true;
    } catch (error) {
      console.error('Error in clearAllData:', error);
      return false;
    }
  }
};