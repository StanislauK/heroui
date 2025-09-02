-- Создание таблицы ресторанов
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0.0,
  delivery_time INTEGER DEFAULT 30,
  emoji VARCHAR(10) DEFAULT '🍽️',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы избранного
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- Создание таблицы заказов
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для улучшения производительности
CREATE INDEX idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_restaurant_id ON favorites(restaurant_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Вставка тестовых данных
INSERT INTO restaurants (name, cuisine, rating, delivery_time, emoji, latitude, longitude, address) VALUES
('Pizza Palace', 'Итальянская', 4.8, 25, '🍕', 53.902284, 27.561831, 'ул. Ленина, 1, Минск'),
('Sushi Master', 'Японская', 4.9, 30, '🍣', 53.9045, 27.5615, 'пр. Независимости, 25, Минск'),
('Burger House', 'Американская', 4.6, 20, '🍔', 53.9000, 27.5600, 'ул. Калинина, 15, Минск'),
('Pasta Corner', 'Итальянская', 4.7, 28, '🍝', 53.9050, 27.5620, 'ул. Свердлова, 8, Минск'),
('Kebab King', 'Турецкая', 4.5, 22, '🥙', 53.9030, 27.5630, 'пр. Победителей, 12, Минск'),
('Coffee Lab', 'Кофейня', 4.8, 15, '☕', 53.9010, 27.5640, 'ул. Бобруйская, 3, Минск');

-- Включение Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для ресторанов (все могут читать)
CREATE POLICY "Restaurants are viewable by everyone" ON restaurants
  FOR SELECT USING (true);

-- Политики безопасности для избранного (пользователи видят только свое)
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для заказов (пользователи видят только свои)
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);
