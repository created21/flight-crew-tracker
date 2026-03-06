// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы для PWA
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API роуты
app.use('/api/flights', require('./routes/flights'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/sync', require('./routes/sync'));

// Запускаем Telegram бота
require('./telegram/bot');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});