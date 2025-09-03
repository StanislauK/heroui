import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useTelegram } from "@/hooks/useTelegram";
import { getCartItemsByTelegramId, updateCartItemQuantity, removeFromCart, createOrder, addOrderItems, clearCartAfterOrder, getOrders } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const { user: telegramUser } = useTelegram();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  // Загружаем корзину пользователя
  useEffect(() => {
    if (telegramUser) {
      loadCart();
      checkActiveOrders();
    } else {
      setLoading(false);
    }
  }, [telegramUser]);

  // Проверяем активные заказы пользователя
  const checkActiveOrders = async () => {
    if (!telegramUser) return;

    try {
      const { data: orders, error } = await getOrders(`telegram_${telegramUser.id}`);
      
      if (error) {
        console.error('Error checking orders:', error);
        return;
      }

      // Проверяем есть ли заказы не в статусе completed или cancelled
      const activeOrders = orders?.filter(order => 
        order.status !== 'completed' && order.status !== 'cancelled'
      ) || [];

      setHasActiveOrder(activeOrders.length > 0);
    } catch (err) {
      console.error('Error checking active orders:', err);
    }
  };

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

  // Создаем заказ
  const handleCreateOrder = async () => {
    if (!telegramUser || cartItems.length === 0) return;

    // Проверяем есть ли активные заказы
    if (hasActiveOrder) {
      alert('У вас имеется активный заказ\n\nПожалуйста дождитесь выполнения предыдущего заказа');
      return;
    }

    try {
      setOrderLoading(true);
      
      // Получаем информацию о ресторане (все товары должны быть из одного ресторана)
      const restaurantId = cartItems[0].restaurant.id;
      
      // Создаем заказ
      const { data: order, error: orderError } = await createOrder(
        telegramUser.id,
        restaurantId,
        totalAmount
      );

      if (orderError) throw orderError;

      // Добавляем элементы заказа
      const orderItems = cartItems.map(item => ({
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        price: item.menu_item.price
      }));

      const { error: itemsError } = await addOrderItems(order.id, orderItems);
      if (itemsError) throw itemsError;

      // Очищаем корзину
      await clearCartAfterOrder(telegramUser.id);
      
      // Обновляем локальное состояние
      setCartItems([]);
      
      // Перенаправляем на страницу заказов
      navigate('/orders');
      
    } catch (err: any) {
      console.error('Error creating order:', err);
      alert('Ошибка при создании заказа: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setOrderLoading(false);
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

  // Проверяем, есть ли товары из разных ресторанов
  const hasMultipleRestaurants = Object.keys(itemsByRestaurant).length > 1;

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
        <div className="px-4 py-3">
          {/* <h1 className={title({ size: "lg" })}>Корзина</h1> */}
          
          {/* Предупреждение о конфликте ресторанов */}
          {hasMultipleRestaurants && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="text-red-600">⚠️</div>
                <div className="text-sm text-red-800">
                  <p className="font-medium">В корзине товары из разных ресторанов</p>
                  <p>Для оформления заказа оставьте товары только из одного ресторана</p>
                </div>
              </div>
            </div>
          )}

          {/* Список товаров по ресторанам */}
          <div className="space-y-6 mt-2">
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
                        

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Итоговая информация */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Итого к оплате:</h3>
              <span className="text-2xl font-bold text-blue-600">{totalAmount} ₽</span>
            </div>
            
            <button 
              onClick={handleCreateOrder}
              disabled={orderLoading || hasActiveOrder || hasMultipleRestaurants}
              className={`w-full py-3 px-4 rounded-lg transition-colors font-medium ${
                hasActiveOrder || hasMultipleRestaurants
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {orderLoading ? 'Создание заказа...' : 
               hasActiveOrder ? 'Активный заказ в процессе' : 
               hasMultipleRestaurants ? 'Уберите товары из разных ресторанов' : 'Оформить заказ'}
            </button>
            
            {/* Информация об активном заказе */}
            {hasActiveOrder && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="text-yellow-600">⚠️</div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">У вас имеется активный заказ</p>
                    <p>Пожалуйста дождитесь выполнения предыдущего заказа</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
