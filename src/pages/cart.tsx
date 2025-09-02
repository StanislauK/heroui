import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useTelegram } from "@/hooks/useTelegram";
import { getCartItemsByTelegramId, updateCartItemQuantity, removeFromCart } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface CartItem {
  id: string;
  quantity: number;
  menu_item: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category?: string;
  };
  restaurant: {
    id: string;
    name: string;
    address?: string;
  };
}

export default function CartPage() {
  const { user: telegramUser, supabaseProfile } = useTelegram();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем корзину пользователя
  useEffect(() => {
    if (telegramUser) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [telegramUser]);

  const loadCart = async () => {
    if (!telegramUser) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await getCartItemsByTelegramId(telegramUser.id);
      
      if (error) throw error;
      
      setCartItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки корзины');
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Обновляем количество товара
  const handleQuantityChange = async (cartItemId: string, change: number) => {
    const item = cartItems.find(item => item.id === cartItemId);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);
    
    if (newQuantity === 0) {
      // Удаляем товар
      await handleRemoveItem(cartItemId);
    } else {
      // Обновляем количество
      try {
        const { error } = await updateCartItemQuantity(cartItemId, newQuantity);
        if (error) throw error;
        
        // Обновляем локальное состояние
        setCartItems(prev => prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: newQuantity }
            : item
        ));
      } catch (err: any) {
        console.error('Error updating quantity:', err);
      }
    }
  };

  // Удаляем товар из корзины
  const handleRemoveItem = async (cartItemId: string) => {
    try {
      const { error } = await removeFromCart(cartItemId);
      if (error) throw error;
      
      // Удаляем из локального состояния
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    } catch (err: any) {
      console.error('Error removing item:', err);
    }
  };

  // Вычисляем общую сумму
  const totalAmount = cartItems.reduce((sum, item) => 
    sum + (item.menu_item.price * item.quantity), 0
  );

  // Группируем товары по ресторанам
  const itemsByRestaurant = cartItems.reduce((groups, item) => {
    const restaurantId = item.restaurant.id;
    if (!groups[restaurantId]) {
      groups[restaurantId] = {
        restaurant: item.restaurant,
        items: []
      };
    }
    groups[restaurantId].items.push(item);
    return groups;
  }, {} as Record<string, { restaurant: any, items: CartItem[] }>);

  if (!telegramUser) {
    return (
      <DefaultLayout>
        <div className="min-h-full bg-gradient-to-br from-blue-50 to-cyan-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="text-6xl mb-4">🔐</div>
              <h1 className={title()}>Корзина недоступна</h1>
              <p className="text-gray-600 mt-2">
                Войдите через Telegram, чтобы просмотреть корзину
              </p>
            </div>
          </section>
        </div>
      </DefaultLayout>
    );
  }

  if (loading) {
    return (
      <DefaultLayout>
        <div className="min-h-full bg-gradient-to-br from-blue-50 to-cyan-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Загружаем корзину...</p>
            </div>
          </section>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="min-h-full bg-gradient-to-br from-blue-50 to-cyan-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className={title()}>Ошибка загрузки</h1>
              <p className="text-red-600 mt-2">{error}</p>
              <button 
                onClick={loadCart}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </section>
        </div>
      </DefaultLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <DefaultLayout>
        <div className="min-h-full bg-gradient-to-br from-blue-50 to-cyan-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="text-6xl mb-4">🛒</div>
              <h1 className={title()}>Корзина пуста</h1>
              <p className="text-gray-600 mt-2">
                Добавьте блюда из ресторанов в корзину
              </p>
            </div>
          </section>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-cyan-50 -mx-6">
        <div className="px-4 py-6">
          <h1 className={title({ size: "lg" })}>Корзина</h1>
          
          {/* Список товаров по ресторанам */}
          <div className="space-y-6 mt-6">
            {Object.values(itemsByRestaurant).map(({ restaurant, items }) => (
              <div key={restaurant.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Заголовок ресторана */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <h3 className="text-lg font-semibold text-gray-800">{restaurant.name}</h3>
                  {restaurant.address && (
                    <p className="text-sm text-gray-600">📍 {restaurant.address}</p>
                  )}
                </div>
                
                {/* Товары ресторана */}
                <div className="p-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      {/* Картинка блюда */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.menu_item.image_url ? (
                          <img 
                            src={item.menu_item.image_url} 
                            alt={item.menu_item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-2xl">🍽️</div>
                        )}
                      </div>
                      
                      {/* Информация о блюде */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-lg mb-1">
                          {item.menu_item.name}
                        </h4>
                        {item.menu_item.description && (
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {item.menu_item.description}
                          </p>
                        )}
                        {item.menu_item.category && (
                          <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                            {item.menu_item.category}
                          </p>
                        )}
                      </div>
                      
                      {/* Цена и управление количеством */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <p className="text-xl font-bold text-blue-600">
                          {item.menu_item.price} ₽
                        </p>
                        
                        {/* Кнопки количества */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors font-medium text-sm"
                          >
                            -
                          </button>
                          <span className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors font-medium text-sm"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Общая цена за товар */}
                        <p className="text-sm text-gray-600">
                          Итого: <span className="font-semibold">{item.menu_item.price * item.quantity} ₽</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Итоговая информация */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Итого к оплате:</h3>
              <span className="text-2xl font-bold text-blue-600">{totalAmount} ₽</span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={loadCart}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Обновить
              </button>
              <button 
                className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
