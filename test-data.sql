-- Тестовые данные для ресторанов
INSERT INTO restaurants (name, description, address, phone, website, latitude, longitude, rating, delivery_time_min, delivery_time_max, min_order_amount) VALUES
('Пиццерия "Домашняя"', 'Лучшая пицца в городе с домашними рецептами', 'ул. Ленина, 15', '+375 29 123-45-67', 'https://domashnya.by', 53.902284, 27.561831, 4.8, 25, 45, 1500),
('Ресторан "Итальянский"', 'Аутентичная итальянская кухня', 'пр. Независимости, 25', '+375 29 234-56-78', 'https://italiano.by', 53.908284, 27.571831, 4.6, 30, 50, 2000),
('Кафе "Суши Бар"', 'Свежие суши и роллы', 'ул. Толстого, 8', '+375 29 345-67-89', 'https://sushibar.by', 53.905284, 27.565831, 4.7, 20, 35, 1200),
('Ресторан "Белорусский"', 'Традиционная белорусская кухня', 'ул. Мясникова, 7', '+375 29 456-78-90', 'https://belarus.by', 53.906284, 27.566831, 4.5, 35, 55, 1800),
('Кафе "Кофейня"', 'Авторский кофе и десерты', 'пр. Победителей, 12', '+375 29 567-89-01', 'https://coffee.by', 53.904284, 27.564831, 4.9, 15, 25, 800)
ON CONFLICT DO NOTHING;

-- Получаем ID ресторанов для создания меню
DO $$
DECLARE
    pizza_restaurant_id UUID;
    italian_restaurant_id UUID;
    sushi_restaurant_id UUID;
    belarus_restaurant_id UUID;
    coffee_restaurant_id UUID;
BEGIN
    SELECT id INTO pizza_restaurant_id FROM restaurants WHERE name = 'Пиццерия "Домашняя"';
    SELECT id INTO italian_restaurant_id FROM restaurants WHERE name = 'Ресторан "Итальянский"';
    SELECT id INTO sushi_restaurant_id FROM restaurants WHERE name = 'Кафе "Суши Бар"';
    SELECT id INTO belarus_restaurant_id FROM restaurants WHERE name = 'Ресторан "Белорусский"';
    SELECT id INTO coffee_restaurant_id FROM restaurants WHERE name = 'Кафе "Кофейня"';

    -- Меню для пиццерии
    INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
    (pizza_restaurant_id, 'Пицца Маргарита', 'Классическая пицца с томатами и моцареллой', 800, 'Пицца'),
    (pizza_restaurant_id, 'Пицца Пепперони', 'Острая пицца с пепперони и сыром', 950, 'Пицца'),
    (pizza_restaurant_id, 'Пицца Четыре сыра', 'Пицца с четырьмя видами сыра', 1100, 'Пицца'),
    (pizza_restaurant_id, 'Напиток Кола', 'Газированный напиток', 150, 'Напитки'),
    (pizza_restaurant_id, 'Напиток Спрайт', 'Лимонный газированный напиток', 150, 'Напитки')
    ON CONFLICT DO NOTHING;

    -- Меню для итальянского ресторана
    INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
    (italian_restaurant_id, 'Паста Карбонара', 'Паста с беконом, яйцом и сыром', 650, 'Паста'),
    (italian_restaurant_id, 'Паста Болоньезе', 'Паста с мясным соусом', 700, 'Паста'),
    (italian_restaurant_id, 'Ризотто с грибами', 'Кремовое ризотто с белыми грибами', 850, 'Основные блюда'),
    (italian_restaurant_id, 'Тирамису', 'Классический итальянский десерт', 400, 'Десерты'),
    (italian_restaurant_id, 'Вино красное', 'Бокал красного вина', 300, 'Напитки')
    ON CONFLICT DO NOTHING;

    -- Меню для суши-бара
    INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
    (sushi_restaurant_id, 'Ролл Калифорния', 'Ролл с крабом, авокадо и огурцом', 450, 'Роллы'),
    (sushi_restaurant_id, 'Ролл Филадельфия', 'Ролл с лососем и сливочным сыром', 550, 'Роллы'),
    (sushi_restaurant_id, 'Ролл Дракон', 'Ролл с угрем и авокадо', 650, 'Роллы'),
    (sushi_restaurant_id, 'Суп Мисо', 'Традиционный японский суп', 250, 'Супы'),
    (sushi_restaurant_id, 'Зеленый чай', 'Традиционный японский чай', 100, 'Напитки')
    ON CONFLICT DO NOTHING;

    -- Меню для белорусского ресторана
    INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
    (belarus_restaurant_id, 'Борщ', 'Традиционный белорусский борщ', 350, 'Супы'),
    (belarus_restaurant_id, 'Драники', 'Картофельные оладьи со сметаной', 280, 'Основные блюда'),
    (belarus_restaurant_id, 'Колдуны', 'Картофельные зразы с мясом', 420, 'Основные блюда'),
    (belarus_restaurant_id, 'Квас', 'Традиционный белорусский квас', 120, 'Напитки'),
    (belarus_restaurant_id, 'Компот', 'Компот из сухофруктов', 100, 'Напитки')
    ON CONFLICT DO NOTHING;

    -- Меню для кофейни
    INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
    (coffee_restaurant_id, 'Капучино', 'Классический капучино', 180, 'Кофе'),
    (coffee_restaurant_id, 'Латте', 'Нежный латте с молоком', 200, 'Кофе'),
    (coffee_restaurant_id, 'Эспрессо', 'Крепкий эспрессо', 120, 'Кофе'),
    (coffee_restaurant_id, 'Тирамису', 'Итальянский десерт', 350, 'Десерты'),
    (coffee_restaurant_id, 'Чизкейк', 'Классический чизкейк', 400, 'Десерты')
    ON CONFLICT DO NOTHING;
END $$;
