// backend/set-webhook.js
const { Telegraf } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8743924213:AAEE4bpiE44js43cY2s53o_uEipKXLg3Y-o';
const bot = new Telegraf(BOT_TOKEN);

const WEBHOOK_URL = 'https://flight-crew-tracker-jsh8.vercel.app/api/webhook';

bot.telegram.setWebhook(WEBHOOK_URL)
  .then(() => {
    console.log('✅ Webhook установлен на:', WEBHOOK_URL);
    return bot.telegram.getWebhookInfo();
  })
  .then((info) => {
    console.log('📊 Информация о webhook:', info);
  })
  .catch((err) => {
    console.error('❌ Ошибка установки webhook:', err);
  });