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

// Генерация токена
function generateToken() {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

// Команда /start с подробным логированием
bot.start(async (ctx) => {
  console.log('✅ /start получен от:', ctx.from);
  
  try {
    const userId = ctx.from.id.toString();
    const username = ctx.from.first_name || 'пользователь';
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://flight-crew-tracker.vercel.app';

    console.log('👤 Пользователь:', { userId, username });
    console.log('🔍 Ищем пользователя в БД...');

    // Создаем или получаем пользователя
    let user = await db.getUserByTelegramId(userId);
    console.log('📦 Результат поиска:', user);

    if (!user) {
      console.log('➕ Создаем нового пользователя...');
      const token = generateToken();
      user = await db.createUser({
        telegramId: userId,
        username: username,
        token: token
      });
      console.log('✅ Пользователь создан:', user);
    } else {
      console.log('🔄 Обновляем токен существующего пользователя...');
      const newToken = generateToken();
      user = await db.updateUserToken(user.id, newToken);
      console.log('✅ Токен обновлен:', user);
    }
    
    const pwaUrl = `${FRONTEND_URL}?token=${user.token}`;
    console.log('🔗 URL приложения:', pwaUrl);
    
    await ctx.reply(
      `✈️ Привет, ${username}!\n\n` +
      `Я бот для отслеживания задач бортпроводников.\n\n` +
      `📱 Нажми кнопку ниже, чтобы открыть приложение:`,
      Markup.inlineKeyboard([
        [Markup.button.url('🚀 Открыть PWA', pwaUrl)]
      ])
    );
    
    console.log('✅ Сообщение отправлено пользователю');
    
  } catch (error) {
    console.error('❌ ОШИБКА в /start:', error);
    console.error('Стек ошибки:', error.stack);
    
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.').catch(e => {
      console.error('❌ Не удалось отправить сообщение об ошибке:', e);
    });
  }
});

// Простая команда для теста
bot.command('test', (ctx) => {
  console.log('✅ /test получен');
  ctx.reply('✅ Тестовая команда работает!');
});

// Webhook endpoint
app.post('/api/webhook', (req, res) => {
  console.log('📨 Получен webhook запрос:', new Date().toISOString());
  console.log('📦 Body:', JSON.stringify(req.body).substring(0, 200) + '...');
  
  bot.handleUpdate(req.body, res)
    .then(() => {
      console.log('✅ Webhook обработан');
    })
    .catch((err) => {
      console.error('❌ Ошибка обработки webhook:', err);
      res.status(500).send('Error');
    });
});

// Тестовый endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Бекенд работает',
    botToken: BOT_TOKEN ? 'есть' : 'нет',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/bot-status', (req, res) => {
  res.json({
    status: 'online',
    webhook: 'https://flight-crew-tracker-jsh8.vercel.app/api/webhook',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;