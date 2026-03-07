// backend/telegram/bot.js
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const db = require('../database/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Токен от @BotFather
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8743924213:AAEE4bpiE44js43cY2s53o_uEipKXLg3Y-o';
const bot = new Telegraf(BOT_TOKEN);

// Хранилище сессий (в памяти, для Vercel лучше использовать Redis)
const sessions = new Map();

// Генерация простого токена
function generateToken() {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

// Получение имени задачи
function getTaskName(taskId) {
  const tasks = {
    boarding: 'Посадка пассажиров',
    doors: 'Закрытие дверей',
    meal: 'Разнос питания',
    safety: 'Демонстрация безопасности'
  };
  return tasks[taskId] || taskId;
}

// Команда /start
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const username = ctx.from.first_name || 'пользователь';
  
  // URL фронтенда из переменных окружения
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://flight-crew-tracker.vercel.app';

  try {
    // Создаем или получаем пользователя
    let user = await db.getUserByTelegramId(userId);
    if (!user) {
      user = await db.createUser({
        telegramId: userId,
        username: username,
        token: generateToken()
      });
    } else {
      // Обновляем токен
      const newToken = generateToken();
      user = await db.updateUserToken(user.id, newToken);
    }
    
    // URL для открытия приложения с токеном
    const pwaUrl = `${FRONTEND_URL}?token=${user.token}`;
    
    await ctx.reply(
      `✈️ Привет, ${username}!\n\n` +
      `Я бот для отслеживания задач бортпроводников.\n\n` +
      `📱 Нажми кнопку ниже, чтобы открыть приложение:`,
      Markup.inlineKeyboard([
        [Markup.button.url('🚀 Открыть PWA', pwaUrl)]
      ])
    );
    
    sessions.set(userId, { userId: user.id, token: user.token, username });
  } catch (error) {
    console.error('Error in /start:', error);
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
});

// Информация о рейсе
bot.command('flight', (ctx) => {
  ctx.reply(
    '✈️ Текущий рейс: SU1234\n' +
    '📍 Москва → Сочи\n' +
    '⏱ Время: 14:30\n' +
    '📊 Прогресс: 45%'
  );
});

// Список задач
bot.command('tasks', (ctx) => {
  ctx.reply(
    '📋 Задачи на рейс:\n\n' +
    '✅ Посадка пассажиров (15:23)\n' +
    '⏳ Закрытие дверей\n' +
    '⏳ Демонстрация безопасности\n' +
    '⏳ Разнос питания'
  );
});

// Статистика
bot.command('stats', (ctx) => {
  ctx.reply(
    '📊 Статистика за сегодня:\n\n' +
    '✈️ Выполнено рейсов: 3\n' +
    '📋 Выполнено задач: 12\n' +
    '⏱ Общее время: 2ч 45м\n' +
    '📈 Среднее время рейса: 55м'
  );
});

// Запуск задачи
bot.command('start_task', (ctx) => {
  ctx.reply(
    '⏱ Выберите задачу:',
    Markup.inlineKeyboard([
      [Markup.button.callback('👥 Посадка', 'timer_boarding')],
      [Markup.button.callback('🚪 Закрытие дверей', 'timer_doors')],
      [Markup.button.callback('🍽 Разнос питания', 'timer_meal')],
      [Markup.button.callback('🛡 Безопасность', 'timer_safety')],
      [Markup.button.callback('❌ Отмена', 'cancel_timer')]
    ])
  );
});

// Обработка таймеров
bot.action(/timer_(.+)/, async (ctx) => {
  const task = ctx.match[1];
  
  if (task === 'cancel') {
    return ctx.reply('❌ Таймер отменен');
  }
  
  const userId = ctx.from.id.toString();
  
  sessions.set(`${userId}_timer`, {
    task,
    startTime: Date.now()
  });
  
  await ctx.reply(
    `⏱ Таймер для "${getTaskName(task)}" запущен!\n\n` +
    `Чтобы остановить, нажми кнопку ниже:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⏹ СТОП', `stop_timer_${task}`)]
    ])
  );
});

// Остановка задачи
bot.action(/stop_timer_(.+)/, async (ctx) => {
  const task = ctx.match[1];
  const userId = ctx.from.id.toString();
  
  const timerData = sessions.get(`${userId}_timer`);
  if (!timerData) {
    return ctx.reply('❌ Нет активного таймера');
  }
  
  const duration = Math.floor((Date.now() - timerData.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  await ctx.reply(
    `✅ Задача "${getTaskName(task)}" выполнена!\n` +
    `⏱ Время: ${minutes}:${seconds.toString().padStart(2, '0')}`
  );
  
  sessions.delete(`${userId}_timer`);
});

// Остановка задачи через команду
bot.command('stop_task', (ctx) => {
  const userId = ctx.from.id.toString();
  const timerData = sessions.get(`${userId}_timer`);
  
  if (!timerData) {
    return ctx.reply('❌ Нет активного таймера');
  }
  
  const duration = Math.floor((Date.now() - timerData.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  ctx.reply(
    `✅ Задача "${getTaskName(timerData.task)}" завершена!\n` +
    `⏱ Время выполнения: ${minutes}:${seconds.toString().padStart(2, '0')}`
  );
  
  sessions.delete(`${userId}_timer`);
});

// ==================== API ENDPOINTS ====================

// API для проверки токена
app.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;
  
  try {
    let valid = false;
    let userData = null;
    
    // Ищем пользователя по токену в сессиях
    for (const [userId, session] of sessions.entries()) {
      if (session.token === token) {
        valid = true;
        userData = { userId, username: session.username };
        break;
      }
    }
    
    // Если не нашли в сессиях, ищем в БД
    if (!valid) {
      const user = await db.getUserByToken(token);
      if (user) {
        valid = true;
        userData = { userId: user.telegramId, username: user.username };
        // Сохраняем в сессию
        sessions.set(user.telegramId, { userId: user.id, token: user.token, username: user.username });
      }
    }
    
    res.json({ valid, ...userData });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// API для отправки отчета
app.post('/api/send-report', async (req, res) => {
  const { token, flightId, report } = req.body;
  
  console.log('📨 Получен запрос на отправку отчета:', { token, flightId });
  
  try {
    // Ищем пользователя по токену
    let user = null;
    let chatId = null;
    
    // Сначала ищем в сессиях
    for (const [userId, session] of sessions.entries()) {
      if (session.token === token) {
        user = session;
        chatId = userId;
        break;
      }
    }
    
    // Если не нашли в сессиях, ищем в БД
    if (!user) {
      console.log('Поиск в БД по токену:', token);
      const dbUser = await db.getUserByToken(token);
      if (dbUser) {
        user = dbUser;
        chatId = dbUser.telegramId;
        sessions.set(chatId, { userId: dbUser.id, token, username: dbUser.username });
      }
    }
    
    if (!user || !chatId) {
      console.log('❌ Пользователь не найден для токена:', token);
      return res.status(401).json({ error: 'Неверный токен или пользователь не найден' });
    }
    
    // Отправляем сообщение через бота
    console.log('📤 Отправка сообщения в Telegram:', { chatId });
    await bot.telegram.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    console.log('✅ Сообщение отправлено');
    
    // Сохраняем отчет в историю
    try {
      await db.saveReport({
        userId: user.userId || user.id,
        flightId,
        report,
        sentAt: new Date()
      });
    } catch (dbError) {
      console.error('Error saving report to DB:', dbError);
    }
    
    res.json({ success: true, message: 'Отчет успешно отправлен' });
    
  } catch (error) {
    console.error('❌ Ошибка отправки отчета:', error);
    res.status(500).json({ error: 'Ошибка отправки отчета' });
  }
});

// API для получения статуса бота
app.get('/api/bot-status', (req, res) => {
  res.json({
    status: 'online',
    botToken: BOT_TOKEN ? 'configured' : 'missing',
    sessionsCount: sessions.size,
    uptime: process.uptime()
  });
});

// Запускаем бота (важно для Vercel - запускаем без app.listen())
bot.launch().then(() => {
  console.log('🤖 Telegram бот запущен');
  console.log('👤 Бот: @' + (bot.botInfo?.username || 'unknown'));
}).catch(err => {
  console.error('❌ Ошибка запуска бота:', err);
});

// ВАЖНО: Экспортируем app для Vercel
module.exports = app;

// НЕ ИСПОЛЬЗУЕМ app.listen() - Vercel вызывает app сам!
// Удаляем или комментируем:
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => { ... });