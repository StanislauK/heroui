# Настройка Supabase для проекта

## 1. Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь завершения инициализации

## 2. Получение ключей

1. В настройках проекта найдите раздел "API"
2. Скопируйте:
   - **Project URL** (например: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** ключ

## 3. Настройка переменных окружения

1. Создайте файл `.env.local` в корне проекта
2. Добавьте следующие строки:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Создание таблиц в базе данных

1. В Supabase Dashboard перейдите в "SQL Editor"
2. Скопируйте содержимое файла `supabase-schema.sql`
3. Выполните SQL скрипт

## 5. Настройка аутентификации (опционально)

1. В Dashboard перейдите в "Authentication" → "Settings"
2. Настройте провайдеры аутентификации (Email, Google, GitHub)
3. Настройте URL для перенаправления

## 6. Проверка подключения

После настройки вы можете использовать хуки:

```tsx
import { useRestaurants, useFavorites, useOrders } from '@/hooks/useSupabase'

function MyComponent() {
  const { restaurants, loading, error } = useRestaurants()
  // ...
}
```

## Структура базы данных

### Таблица `restaurants`
- Основная информация о ресторанах
- Координаты для отображения на карте
- Рейтинг и время доставки

### Таблица `favorites`
- Связь пользователей с избранными ресторанами
- Защищена RLS (пользователи видят только свое)

### Таблица `orders`
- История заказов пользователей
- Статусы заказов
- Защищена RLS

## Безопасность

- Включен Row Level Security (RLS)
- Пользователи видят только свои данные
- Рестораны доступны всем для чтения
- Аутентификация через Supabase Auth
