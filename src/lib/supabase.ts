import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для базы данных
export interface UserProfile {
  id: string
  user_id: string
  telegram_id?: number
  telegram_username?: string
  first_name?: string
  last_name?: string
  language_code?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface Restaurant {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  website?: string
  latitude?: number
  longitude?: number
  rating: number
  delivery_time_min: number
  delivery_time_max: number
  min_order_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  is_available: boolean
  created_at: string
  updated_at: string
  restaurant?: Restaurant
}

export interface CartItem {
  id: string
  user_id: string
  menu_item_id: string
  restaurant_id: string
  quantity: number
  created_at: string
  updated_at: string
  menu_item?: MenuItem
  restaurant?: Restaurant
}

export interface Order {
  id: string
  user_id: string
  restaurant_id: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
  delivery_address?: string
  delivery_instructions?: string
  created_at: string
  updated_at: string
  restaurant?: Restaurant
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  created_at: string
  menu_item?: MenuItem
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: string
  changed_by?: string
  created_at: string
}

// Функции для работы с ресторанами
export const getRestaurants = async () => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return { data: [], error };
  }
};

export const getRestaurantById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return { data: null, error };
  }
};

export const getMenuItems = async (restaurantId: string) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return { data: [], error };
  }
};

export const getCartItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        menu_item:menu_items(*),
        restaurant:restaurants(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { data: [], error };
  }
};

export const getOrders = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(*),
        order_items:order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { data: [], error };
  }
};

// Функция для создания/обновления профиля через Telegram
export const upsertTelegramProfile = async (telegramUser: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}) => {
  try {
    const { data, error } = await supabase.rpc('upsert_user_profile', {
      p_user_id: `telegram_${telegramUser.id}`,
      p_telegram_id: telegramUser.id,
      p_telegram_username: telegramUser.username || null,
      p_first_name: telegramUser.first_name,
      p_last_name: telegramUser.last_name || null,
      p_language_code: telegramUser.language_code || null
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error upserting telegram profile:', error);
    return { data: null, error };
  }
};

// Функция для получения профиля пользователя по Telegram ID
export const getUserProfileByTelegramId = async (telegramId: number) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

// Функция для получения корзины пользователя по Telegram ID
export const getCartItemsByTelegramId = async (telegramId: number) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        menu_item:menu_items(*),
        restaurant:restaurants(*)
      `)
      .eq('user_id', `telegram_${telegramId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { data: [], error };
  }
};

// Функция для добавления товара в корзину
export const addToCart = async (telegramId: number, menuItemId: string, restaurantId: string, quantity: number = 1) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert({
        user_id: `telegram_${telegramId}`,
        menu_item_id: menuItemId,
        restaurant_id: restaurantId,
        quantity: quantity
      }, {
        onConflict: 'user_id,menu_item_id'
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { data: null, error };
  }
};

// Функция для обновления количества товара в корзине
export const updateCartItemQuantity = async (cartItemId: string, quantity: number) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: quantity })
      .eq('id', cartItemId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { data: null, error };
  }
};

// Функция для удаления товара из корзины
export const removeFromCart = async (cartItemId: string) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { error };
  }
};

// Функция для создания заказа
export const createOrder = async (telegramId: number, restaurantId: string, totalAmount: number, deliveryAddress?: string, deliveryInstructions?: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: `telegram_${telegramId}`,
        restaurant_id: restaurantId,
        total_amount: totalAmount,
        delivery_address: deliveryAddress,
        delivery_instructions: deliveryInstructions
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating order:', error);
    return { data: null, error };
  }
};

// Функция для добавления элементов заказа
export const addOrderItems = async (orderId: string, items: Array<{menu_item_id: string, quantity: number, price: number}>) => {
  try {
    const orderItems = items.map(item => ({
      order_id: orderId,
      ...item
    }));

    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding order items:', error);
    return { data: null, error };
  }
};

// Функция для очистки корзины после создания заказа
export const clearCartAfterOrder = async (telegramId: number) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', `telegram_${telegramId}`);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { error };
  }
};
