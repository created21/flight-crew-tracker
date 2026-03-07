// backend/telegram/bot.js
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const db = require('../database/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8743924213:AAEE4bpiE44js43cY2s53o_uEipKXLg3Y-o';
const bot = new Telegraf(BOT_TOKEN);

// Функция для генерации токена
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
      const newToken = generateToken();
      user = await db.updateUserToken(user.id, newToken);
    }
    
    const pwaUrl = `${FRONTEND_URL}?token=${user.token}`;
    
    await ctx.reply(
      `✈️ Привет, ${username}!\n\n` +
      `Я бот для отслеживания задач бортпроводников.\n\n` +
      `📱 Нажми кнопку ниже, чтобы открыть приложение:`,
      Markup.inlineKeyboard([
        [Markup.button.url('🚀 Открыть PWA', pwaUrl)]
      ])
    );
    
  } catch (error) {
    console.error('Error in /start:', error);
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
});

// Остальные команды бота...
bot.command('flight', (ctx) => {
  ctx.reply(
    '✈️ Текущий рейс: SU1234\n' +
    '📍 Москва → Сочи\n' +
    '⏱ Время: 14:30\n' +
    '📊 Прогресс: 45%'
  );
});

bot.command('tasks', (ctx) => {
  ctx.reply(
    '📋 Задачи на рейс:\n\n' +
    '✅ Посадка пассажиров (15:23)\n' +
    '⏳ Закрытие дверей\n' +
    '⏳ Демонстрация безопасности\n' +
    '⏳ Разнос питания'
  );
});

bot.command('stats', (ctx) => {
  ctx.reply(
    '📊 Статистика за сегодня:\n\n' +
    '✈️ Выполнено рейсов: 3\n' +
    '📋 Выполнено задач: 12\n' +
    '⏱ Общее время: 2ч 45м\n' +
    '📈 Среднее время рейса: 55м'
  );
});

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

// Обработка callback запросов
bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  
  if (callbackData.startsWith('timer_')) {
    const task = callbackData.replace('timer_', '');
    
    if (task === 'cancel') {
      await ctx.reply('❌ Таймер отменен');
      await ctx.answerCbQuery();
      return;
    }
    
    // Здесь логика таймера
    await ctx.reply(
      `⏱ Таймер для "${getTaskName(task)}" запущен!\n\n` +
      `Чтобы остановить, нажми кнопку ниже:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⏹ СТОП', `stop_timer_${task}`)]
      ])
    );
    await ctx.answerCbQuery();
  }
  
  else if (callbackData.startsWith('stop_timer_')) {
    const task = callbackData.replace('stop_timer_', '');
    
    // Генерируем случайное время для демо
    const duration = Math.floor(Math.random() * 300) + 60;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    await ctx.reply(
      `✅ Задача "${getTaskName(task)}" выполнена!\n` +
      `⏱ Время: ${minutes}:${seconds.toString().padStart(2, '0')}`
    );
    await ctx.answerCbQuery();
  }
});

// ==================== API ENDPOINTS ====================

// Эндпоинт для webhook Telegram
app.post('/api/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// API для проверки токена
app.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;
  
  try {
    const user = await db.getUserByToken(token);
    if (user) {
      res.json({ valid: true, userId: user.telegramId, username: user.username });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// API для отправки отчета
app.post('/api/send-report', async (req, res) => {
  const { token, flightId, report } = req.body;
  
  try {
    const user = await db.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Неверный токен' });
    }
    
    await bot.telegram.sendMessage(user.telegramId, report, { parse_mode: 'Markdown' });
    
    await db.saveReport({
      userId: user.id,
      flightId,
      report,
      sentAt: new Date()
    });
    
    res.json({ success: true, message: 'Отчет успешно отправлен' });
    
  } catch (error) {
    console.error('❌ Ошибка отправки отчета:', error);
    res.status(500).json({ error: 'Ошибка отправки отчета' });
  }
});

// API для статуса бота
app.get('/api/bot-status', (req, res) => {
  res.json({
    status: 'online',
    botToken: BOT_TOKEN ? 'configured' : 'missing',
    webhook: 'https://flight-crew-tracker-jsh8.vercel.app/api/webhook'
  });
});

// Экспортируем app для Vercel
module.exports = app;