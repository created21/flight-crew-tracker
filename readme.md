# ✈️ Flight Crew Tracker

**Приложение для отслеживания задач бортпроводников** — таймер, шаблоны задач и отчетностью.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-green.svg)](https://web.dev/progressive-web-apps/)

---

## 📱 Демо

| Среда | Ссылка |
|-------|--------|
| **Production (стабильная)** | [https://flight-crew-tracker.vercel.app](https://flight-crew-tracker.vercel.app) |
| **Preview (новая версия)** | [https://flight-crew-tracker-git-feature-v2.vercel.app](https://flight-crew-tracker-git-feature-v2.vercel.app) |

> ⚠️ **Важно**: Данные сохраняются локально на устройстве. 

---

## 🎯 Возможности

### 📋 Управление рейсами
- Создание, редактирование, удаление рейсов
- Статусы: активный / завершен 
- Поиск по номеру рейса 
- Прогресс выполнения 

### ⏱️ Таймеры задач
- Запуск/остановка таймера для каждой задачи
- Автоматический подсчет времени
- Режим офлайн (работает без интернета)
- Заметки к задачам

### 📚 Шаблоны задач
- Создание и редактирование шаблонов
- Быстрое добавление из шаблонов

### 📊 Отчеты
- **Отчет по рейсу** — детализация по задачам с временем
- **Сводный отчет** — статистика за период (день/неделя/месяц/свой)
- Экспорт в Telegram, WhatsApp, MAX, Email
- Копирование отчета в буфер обмена

### 📱 PWA (Progressive Web App)
- Установка на домашний экран
- Работа офлайн

### 🔗 Обмен рейсами
- **QR-код** с данными рейса (работает без интернета)
- Импорт рейсов по QR или ссылке
- Шеринг через Telegram, WhatsApp, MAX

---

## 🛠 Технологический стек

| Компонент | Технология |
|-----------|------------|
| **Фронтенд** | React 18 + TypeScript + TailwindCSS |
| **PWA** | Service Worker + Workbox |
| **Локальное хранилище** | IndexedDB (Dexie.js) |
| **Маршрутизация** | React Router v6 |
| **Drag & Drop** | @dnd-kit/sortable |
| **QR-коды** | qrcode.react |
| **Деплой** | Vercel (frontend) |

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/flight-crew-tracker.git
cd flight-crew-tracker