# Flight Crew Tracker ✈️

Приложение для отслеживания задач бортпроводников.

## 🚀 Демо
- Frontend: https://your-frontend.vercel.app
- Telegram Bot: https://t.me/your_bot

## 🛠 Технологии
- React + TypeScript
- Node.js + Express
- MySQL
- Telegram Bot API

## 📦 Локальный запуск

1. Клонировать репозиторий
2. `cd flight-crew-tracker`
3. `docker-compose up -d`
4. Открыть http://localhost:3000

## 🌍 Деплой
- Frontend: Vercel
- Backend: Render
- Database: PlanetScale

## 📱 Telegram бот
@your_bot - для получения отчетов






6. Получите URL вашего фронтенда
После деплоя вы увидите что-то вроде:

text
https://flight-crew-tracker.vercel.app
Запишите этот URL, он понадобится для:

Настройки бекенда (CORS)

Telegram бота (кнопка "Открыть PWA")

Тестирования

7. Настройте автоматический деплой (опционально)
Vercel автоматически настроит деплой при каждом push в GitHub:

Сделайте изменения в коде

git add . && git commit -m "update" && git push

Vercel автоматически передеплоит сайт через минуту

