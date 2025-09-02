# Telegram Mini App Setup

Этот проект интегрирован с официальным Telegram Mini App SDK для создания полнофункционального мини-приложения внутри Telegram.

## 🚀 Что уже настроено

### 1. **Установленные пакеты**
- `@twa-dev/sdk` - официальный SDK для Telegram Mini App

### 2. **Созданные компоненты**
- `useTelegram` - хук для работы с Telegram WebApp API
- `TelegramTest` - компонент для тестирования всех функций
- `telegram-web-app.js` - скрипт инициализации

### 3. **Интеграция**
- Добавлен тест на страницу `/test` в таб "Telegram Mini App"
- Автоматическая загрузка Telegram WebApp скрипта

## 📱 Основные возможности

### **Информация о пользователе**
- Получение данных пользователя (имя, фамилия, username, фото)
- Определение Premium статуса
- Языковые настройки

### **Основные функции**
- `showAlert()` - показать уведомление
- `showConfirm()` - показать диалог подтверждения
- `showPopup()` - показать popup с кнопками
- `expand()` - расширить окно приложения
- `close()` - закрыть приложение

### **Запросы разрешений**
- `requestPhone()` - запрос номера телефона
- `requestContact()` - запрос контакта
- `requestLocation()` - запрос геолокации
- `requestWriteAccess()` - запрос доступа к записи

### **Управление кнопками**
- `setMainButton()` - настройка главной кнопки
- `showBackButton()` - показать кнопку "Назад"
- `hideMainButton()` - скрыть главную кнопку

### **Дополнительные функции**
- `sendData()` - отправить данные в Telegram
- `readTextFromClipboard()` - читать буфер обмена
- `openLink()` - открыть ссылку
- `switchInlineQuery()` - переключиться на inline режим

## 🛠️ Настройка для продакшена

### 1. **Создание бота в BotFather**
```
/newapp
```
- Выберите бота
- Укажите название мини-приложения
- Получите `bot_token` и `app_name`

### 2. **Настройка веб-приложения**
```
/setapp
```
- Выберите бота
- Укажите URL вашего приложения
- Настройте описание и фото

### 3. **Валидация initData**
В продакшене обязательно валидируйте `initData.hash` для безопасности:

```typescript
import crypto from 'crypto';

const validateInitData = (initData: string, botToken: string): boolean => {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  
  if (!hash) return false;
  
  // Сортируем параметры по алфавиту
  const params = Array.from(urlParams.entries())
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Создаем секретный ключ
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  
  // Вычисляем хеш
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(params).digest('hex');
  
  return calculatedHash === hash;
};
```

### 4. **Переменные окружения**
Создайте `.env.production`:
```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_APP_NAME=your_app_name_here
```

## 🧪 Тестирование

### **В браузере (разработка)**
- Откройте `/test` → таб "Telegram Mini App"
- Все функции будут работать через mock объекты
- Проверьте консоль для отладочной информации

### **В Telegram (продакшен)**
- Запустите приложение через бота
- Все функции будут работать нативно
- Проверьте интеграцию с Telegram

## 🔧 Кастомизация

### **Настройка темы**
```typescript
const { WebApp } = useTelegram();

// Установка цветов
WebApp?.setHeaderColor('#3b82f6');
WebApp?.setBackgroundColor('#f8fafc');

// Адаптация под тему пользователя
useEffect(() => {
  if (WebApp?.colorScheme === 'dark') {
    // Применить темную тему
  }
}, [WebApp?.colorScheme]);
```

### **Главная кнопка**
```typescript
const { setMainButton, showMainButton } = useTelegram();

setMainButton({
  text: 'Оформить заказ',
  color: '#10b981',
  text_color: '#ffffff',
  is_visible: true,
  is_active: true
});

showMainButton();
```

### **Кнопка "Назад"**
```typescript
const { showBackButton } = useTelegram();

showBackButton(() => {
  // Обработка нажатия кнопки "Назад"
  navigate(-1);
});
```

## 📚 Полезные ссылки

- [Официальная документация](https://core.telegram.org/bots/webapps)
- [Telegram Mini App SDK](https://github.com/twa-dev/sdk)
- [Примеры использования](https://github.com/twa-dev/sdk/tree/main/examples)
- [BotFather команды](https://t.me/botfather)

## 🚨 Важные замечания

1. **Безопасность**: Всегда валидируйте `initData.hash`
2. **Тестирование**: Используйте TestNet для разработки
3. **Размер**: Приложение должно быть легким и быстрым
4. **UX**: Следуйте гайдлайнам Telegram для лучшего опыта

## 🎯 Следующие шаги

1. Протестируйте все функции в браузере
2. Создайте бота в BotFather
3. Настройте веб-приложение
4. Протестируйте в реальном Telegram
5. Добавьте валидацию `initData` для продакшена
6. Интегрируйте с основным функционалом приложения
