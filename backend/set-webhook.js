// backend/set-webhook.js
const axios = require('axios');
require('dotenv').config();

// Токен вашего бота
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8743924213:AAEE4bpiE44js43cY2s53o_uEipKXLg3Y-o';
// URL вашего бекенда на Vercel
const WEBHOOK_URL = 'https://flight-crew-tracker-jsh8.vercel.app/api/webhook';

async function setWebhook() {
  console.log('🔄 Начинаем установку webhook...');
  console.log('📌 URL webhook:', WEBHOOK_URL);
  
  try {
    // Сначала проверим текущий webhook
    console.log('\n📊 Проверяем текущий webhook...');
    const getInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    console.log('Текущий webhook:', getInfo.data);
    
    // Удалим старый webhook
    console.log('\n🗑 Удаляем старый webhook...');
    const deleteResult = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
    console.log('Результат удаления:', deleteResult.data);
    
    // Установим новый webhook
    console.log('\n🔄 Устанавливаем новый webhook...');
    const setResult = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query', 'inline_query'],
      max_connections: 40
    });
    console.log('Результат установки:', setResult.data);
    
    // Проверим финальный результат
    console.log('\n📊 Проверяем финальный результат...');
    const finalInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    console.log('Финальный webhook:', finalInfo.data);
    
    if (finalInfo.data.result.url === WEBHOOK_URL) {
      console.log('\n✅ Webhook успешно установлен!');
    } else {
      console.log('\n❌ Что-то пошло не так');
    }
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Детали ошибки:', error.response.data);
    }
  }
}

// Запускаем функцию
setWebhook();