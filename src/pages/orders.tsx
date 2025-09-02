import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useTelegram } from "@/hooks/useTelegram";
import { getOrders } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';
  delivery_address?: string;
  delivery_instructions?: string;
  created_at: string;
  updated_at: string;
  restaurant: {
    id: string;
    name: string;
    address?: string;
  };
  order_items: Array<{
    id: string;
    order_id: string;
    menu_item_id: string;
    quantity: number;
    price: number;
    menu_item: {
      id: string;
      name: string;
      description?: string;
      image_url?: string;
      category?: string;
    };
  }>;
}

export default function OrdersPage() {
  const { user: telegramUser } = useTelegram();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  // Загружаем заказы пользователя
  useEffect(() => {
    if (telegramUser) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [telegramUser]);

  const loadOrders = async () => {
    if (!telegramUser) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await getOrders(`telegram_${telegramUser.id}`);
      
      if (error) throw error;
      
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки заказов');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Отменяем заказ
  const handleCancelOrder = async (orderId: string) => {
    if (!telegramUser) return;

    try {
      setCancellingOrder(orderId);
      
      // Пока просто обновляем локальное состояние
      // TODO: Добавить функцию updateOrderStatus в Supabase
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' }
          : order
      ));
      
      alert('Заказ отменен!');
      
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert('Ошибка при отмене заказа: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setCancellingOrder(null);
    }
  };

  // Получаем цвет для статуса заказа
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'primary';
      case 'preparing':
        return 'secondary';
      case 'ready':
        return 'success';
      case 'delivering':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Получаем текст для статуса заказа
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает подтверждения';
      case 'confirmed':
        return 'Подтвержден';
      case 'preparing':
        return 'Готовится';
      case 'ready':
        return 'Готов';
      case 'delivering':
        return 'Доставляется';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  if (!telegramUser) {
    return (
      <DefaultLayout>
        <div className="min-h-full bg-gradient-to-br from-green-50 to-emerald-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="text-6xl mb-4">🔐</div>
              <h1 className={title()}>Заказы недоступны</h1>
              <p className="text-gray-600 mt-2">
                Войдите через Telegram, чтобы просмотреть заказы
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
        <div className="min-h-full bg-gradient-to-br from-green-50 to-emerald-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-600">Загружаем заказы...</p>
            </div>
          </section>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="min-h-full bg-gradient-to-br from-green-50 to-emerald-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className={title()}>Ошибка загрузки</h1>
              <p className="text-red-600 mt-2">{error}</p>
              <button 
                onClick={loadOrders}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </section>
        </div>
      </DefaultLayout>
    );
  }

  if (orders.length === 0) {
    return (
      <DefaultLayout>
        <div className="min-h-full bg-gradient-to-br from-green-50 to-emerald-50 -mx-6">
          <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
              <div className="text-6xl mb-4">📋</div>
              <h1 className={title()}>Заказов пока нет</h1>
              <p className="text-gray-600 mt-2">
                Сделайте заказ в любом ресторане, чтобы увидеть его здесь
              </p>
            </div>
          </section>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="min-h-full bg-gradient-to-br from-green-50 to-emerald-50 -mx-6">
        <div className="px-4 py-6">
          <h1 className={title({ size: "lg" })}>Мои заказы</h1>
          
          {/* Список заказов */}
          <div className="space-y-6 mt-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Заголовок заказа с рестораном и статусом */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{order.restaurant.name}</h3>
                      {order.restaurant.address && (
                        <p className="text-sm text-gray-600">📍 {order.restaurant.address}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Заказ от {new Date(order.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                                         <div className="flex flex-col items-end gap-2">
                       <div 
                         className={`px-3 py-1 rounded-full text-xs font-medium ${
                           getStatusColor(order.status) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                           getStatusColor(order.status) === 'primary' ? 'bg-blue-100 text-blue-800' :
                           getStatusColor(order.status) === 'secondary' ? 'bg-purple-100 text-purple-800' :
                           getStatusColor(order.status) === 'success' ? 'bg-green-100 text-green-800' :
                           getStatusColor(order.status) === 'danger' ? 'bg-red-100 text-red-800' :
                           'bg-gray-100 text-gray-800'
                         }`}
                       >
                         {getStatusText(order.status)}
                       </div>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrder === order.id}
                          className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingOrder === order.id ? 'Отмена...' : 'Отменить заказ'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Товары заказа */}
                <div className="p-4 space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      {/* Картинка блюда */}
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
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
                      
                      {/* Цена и количество */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p className="text-xl font-bold text-green-600">
                          {item.price * item.quantity} ₽
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.price} ₽ × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Итоговая информация */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Итого к оплате:</span>
                    <span className="text-2xl font-bold text-green-600">{order.total_amount} ₽</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
