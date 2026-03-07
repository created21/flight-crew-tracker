// backend/telegram/bot.js
const express = require('express');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');
const db = require('../database/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8743924213:AAEE4bpiE44js43cY2s53o_uEipKXLg3Y-o';
const bot = new Telegraf(BOT_TOKEN);

console.log('🚀 Бот инициализирован');
console.log('🔑 Токен:', BOT_TOKEN ? 'есть' : 'нет');

// Хранилище сессий (добавим для отладки)
const sessions = new Map();

// Генерация токена
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

// Команда /start с максимальным логированием
bot.start(async (ctx) => {
  console.log('========== /start ==========');
  console.log('📅 Время:', new Date().toISOString());
  console.log('👤 От:', ctx.from);
  
  try {
    const userId = ctx.from.id.toString();
    const username = ctx.from.first_name || 'пользователь';
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://flight-crew-tracker.vercel.app';

    console.log('👤 userId:', userId);
    console.log('👤 username:', username);
    console.log('🌐 FRONTEND_URL:', FRONTEND_URL);

    // Шаг 1: Ищем пользователя в БД
    console.log('🔍 Шаг 1: Поиск пользователя в БД...');
    let user;
    try {
      user = await db.getUserByTelegramId(userId);
      console.log('📦 Результат поиска:', user);
    } catch (dbError) {
      console.error('❌ Ошибка БД при поиске:', dbError);
      throw new Error('Database error in getUserByTelegramId');
    }

    // Шаг 2: Создаем или обновляем пользователя
    if (!user) {
      console.log('➕ Шаг 2: Создание нового пользователя...');
      const token = generateToken();
      console.log('🔑 Сгенерирован токен:', token);
      
      try {
        user = await db.createUser({
          telegramId: userId,
          username: username,
          token: token
        });
        console.log('✅ Пользователь создан:', user);
      } catch (createError) {
        console.error('❌ Ошибка создания пользователя:', createError);
        throw new Error('Database error in createUser');
      }
    } else {
      console.log('🔄 Шаг 2: Обновление токена существующего пользователя...');
      const newToken = generateToken();
      console.log('🔑 Новый токен:', newToken);
      
      try {
        user = await db.updateUserToken(user.id, newToken);
        console.log('✅ Токен обновлен:', user);
      } catch (updateError) {
        console.error('❌ Ошибка обновления токена:', updateError);
        throw new Error('Database error in updateUserToken');
      }
    }

    // Шаг 3: Проверяем, что пользователь создан
    if (!user || !user.token) {
      console.error('❌ Шаг 3: Пользователь или токен отсутствуют');
      throw new Error('User or token is missing');
    }

    // Шаг 4: Сохраняем в сессию
    console.log('💾 Шаг 4: Сохранение в сессию...');
    sessions.set(userId, { userId: user.id, token: user.token, username });
    console.log('✅ Сессий в памяти:', sessions.size);

    // Шаг 5: Формируем URL
    const pwaUrl = `${FRONTEND_URL}?token=${user.token}`;
    console.log('🔗 Шаг 5: URL приложения:', pwaUrl);

    // Шаг 6: Отправляем сообщение
    console.log('📤 Шаг 6: Отправка сообщения...');
    await ctx.reply(
      `✈️ Привет, ${username}!\n\n` +
      `Я бот для отслеживания задач бортпроводников.\n\n` +
      `📱 Нажми кнопку ниже, чтобы открыть приложение:`,
      Markup.inlineKeyboard([
        [Markup.button.url('🚀 Открыть PWA', pwaUrl)]
      ])
    );
    
    console.log('✅ Шаг 6: Сообщение отправлено успешно');
    console.log('========== /start завершен успешно ==========\n');
    
  } catch (error) {
    console.error('❌ ОШИБКА В /start ==========');
    console.error('Тип ошибки:', error.name);
    console.error('Сообщение:', error.message);
    console.error('Стек:', error.stack);
    console.error('================================\n');
    
    try {
      await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    } catch (replyError) {
      console.error('❌ Не удалось отправить сообщение об ошибке:', replyError);
    }
  }
});

// Остальные команды для отладки
bot.command('test', (ctx) => {
  console.log('✅ /test получен');
  ctx.reply('✅ Тестовая команда работает!');
});

bot.command('db_test', async (ctx) => {
  console.log('🔍 /db_test получен');
  try {
    const userId = ctx.from.id.toString();
    const user = await db.getUserByTelegramId(userId);
    ctx.reply(`📊 Результат: ${user ? JSON.stringify(user) : 'Пользователь не найден'}`);
  } catch (error) {
    ctx.reply('❌ Ошибка БД');
  }
});

// ==================== API ENDPOINTS ====================

// Webhook endpoint
app.post('/api/webhook', (req, res) => {
  console.log('📨 Получен webhook запрос');
  console.log('📦 Body:', JSON.stringify(req.body).substring(0, 200));
  
  bot.handleUpdate(req.body, res)
    .then(() => {
      console.log('✅ Webhook обработан');
    })
    .catch((err) => {
      console.error('❌ Ошибка webhook:', err);
    });
});

// API для проверки токена
app.post('/api/verify-token', async (req, res) => {
  const { token } = req.body;
  console.log('🔍 verify-token:', token);
  
  try {
    // Ищем в сессиях
    let valid = false;
    let userData = null;
    
    for (const [userId, session] of sessions.entries()) {
      if (session.token === token) {
        valid = true;
        userData = { userId, username: session.username };
        break;
      }
    }
    
    // Если не нашли в сессиях, ищем в БД
    if (!valid) {
      console.log('Поиск в БД...');
      const user = await db.getUserByToken(token);
      if (user) {
        valid = true;
        userData = { userId: user.telegramId, username: user.username };
        sessions.set(user.telegramId, { userId: user.id, token: user.token, username: user.username });
      }
    }
    
    console.log('Результат verify-token:', { valid, userData });
    res.json({ valid, ...userData });
    
  } catch (error) {
    console.error('Ошибка verify-token:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// API для отправки отчета
app.post('/api/send-report', async (req, res) => {
  const { token, flightId, report } = req.body;
  console.log('📨 send-report:', { token, flightId });
  
  try {
    let chatId = null;
    let user = null;
    
    // Ищем в сессиях
    for (const [userId, session] of sessions.entries()) {
      if (session.token === token) {
        chatId = userId;
        user = session;
        break;
      }
    }
    
    // Если не нашли в сессиях, ищем в БД
    if (!user) {
      console.log('Поиск в БД...');
      const dbUser = await db.getUserByToken(token);
      if (dbUser) {
        chatId = dbUser.telegramId;
        user = dbUser;
        sessions.set(chatId, { userId: dbUser.id, token, username: dbUser.username });
      }
    }
    
    if (!user || !chatId) {
      console.log('❌ Пользователь не найден');
      return res.status(401).json({ error: 'Неверный токен' });
    }
    
    console.log('📤 Отправка сообщения в Telegram...');
    await bot.telegram.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    console.log('✅ Сообщение отправлено');
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: 'Ошибка отправки' });
  }
});

// API для проверки статуса
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    sessionsCount: sessions.size,
    nodeEnv: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/bot-status', (req, res) => {
  res.json({
    status: 'online',
    botToken: BOT_TOKEN ? 'configured' : 'missing',
    sessionsCount: sessions.size,
    webhook: 'https://flight-crew-tracker-jsh8.vercel.app/api/webhook',
    uptime: process.uptime()
  });
});

module.exports = app;