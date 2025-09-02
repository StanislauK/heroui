import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { getMenuItems, MenuItem, Restaurant, addToCart, getCartItemsByTelegramId, clearCartAfterOrder } from '@/lib/supabase';
import { useTelegram } from '@/hooks/useTelegram';

interface RestaurantMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
}

export const RestaurantMenuModal: React.FC<RestaurantMenuModalProps> = ({
  isOpen,
  onClose,
  restaurant
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: telegramUser, supabaseProfile } = useTelegram();
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [currentCartRestaurant, setCurrentCartRestaurant] = useState<string | null>(null);
  const [showRestaurantConflictDialog, setShowRestaurantConflictDialog] = useState(false);
  const [conflictItem, setConflictItem] = useState<{itemId: string, quantity: number} | null>(null);

  useEffect(() => {
    if (isOpen && restaurant) {
      loadMenuItems();
      if (telegramUser) {
        loadUserCart();
      }
    }
  }, [isOpen, restaurant, telegramUser]);

  // Автоматически обновляем корзину каждые 30 секунд при открытом модальном окне
  useEffect(() => {
    if (!isOpen || !telegramUser) return;

    const interval = setInterval(() => {
      loadUserCart();
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, [isOpen, telegramUser]);

  // Функция для получения количества товара
  const getItemQuantity = (itemId: string): number => {
    return itemQuantities[itemId] || 0;
  };

  // Функция для изменения количества товара
  const handleQuantityChange = async (itemId: string, change: number) => {
    if (!telegramUser || !restaurant) return;

    const currentQuantity = getItemQuantity(itemId);
    const newQuantity = Math.max(0, currentQuantity + change);

    // Проверяем конфликт ресторанов при добавлении нового товара
    if (newQuantity > currentQuantity && currentCartRestaurant && currentCartRestaurant !== restaurant.id) {
      // Показываем диалог конфликта
      setConflictItem({ itemId, quantity: newQuantity });
      setShowRestaurantConflictDialog(true);
      return;
    }

    // Оптимистично обновляем UI
    if (newQuantity === 0) {
      setItemQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[itemId];
        return newQuantities;
      });
    } else {
      setItemQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }

    // Синхронизируем с Supabase
    try {
      const result = await addToCart(
        telegramUser.id,
        itemId,
        restaurant.id,
        newQuantity
      );

      if (result.error) {
        console.error('Error updating cart:', result.error);
        // Откатываем изменения при ошибке
        setItemQuantities(prev => ({
          ...prev,
          [itemId]: currentQuantity
        }));
      } else {
        // Обновляем корзину после успешного изменения
        await loadUserCart();
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      // Откатываем изменения при ошибке
      setItemQuantities(prev => ({
        ...prev,
        [itemId]: currentQuantity
      }));
    }
  };

  // Функция для загрузки корзины пользователя
  const loadUserCart = async () => {
    if (!telegramUser) return;

    try {
      setCartLoading(true);
      const { data: cartItems, error } = await getCartItemsByTelegramId(telegramUser.id);
      
      if (error) {
        console.error('Error loading cart:', error);
        return;
      }

      // Определяем текущий ресторан в корзине
      if (cartItems.length > 0) {
        const firstItem = cartItems[0];
        setCurrentCartRestaurant(firstItem.restaurant_id);
      } else {
        setCurrentCartRestaurant(null);
      }

      // Фильтруем товары только для текущего ресторана
      const restaurantCartItems = cartItems.filter(item => item.restaurant_id === restaurant?.id);
      
      // Создаем объект с количествами
      const quantities: Record<string, number> = {};
      restaurantCartItems.forEach(item => {
        quantities[item.menu_item_id] = item.quantity;
      });
      
      setItemQuantities(quantities);
    } catch (err) {
      console.error('Error loading user cart:', err);
    } finally {
      setCartLoading(false);
    }
  };

  // Функция для принудительного обновления корзины
  const refreshCart = async () => {
    if (telegramUser) {
      await loadUserCart();
    }
  };

  // Функция для замены корзины
  const handleReplaceCart = async () => {
    if (!telegramUser || !restaurant || !conflictItem) return;

    try {
      // Очищаем текущую корзину
      await clearCartAfterOrder(telegramUser.id);
      
      // Добавляем новый товар
      const result = await addToCart(
        telegramUser.id,
        conflictItem.itemId,
        restaurant.id,
        conflictItem.quantity
      );

      if (result.error) {
        console.error('Error replacing cart:', result.error);
      } else {
        // Обновляем корзину и закрываем диалог
        await loadUserCart();
        setShowRestaurantConflictDialog(false);
        setConflictItem(null);
      }
    } catch (err) {
      console.error('Error replacing cart:', err);
    }
  };

  // Функция для отмены добавления
  const handleCancelAddition = () => {
    setShowRestaurantConflictDialog(false);
    setConflictItem(null);
  };

  const loadMenuItems = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await getMenuItems(restaurant.id);
      if (error) throw error;
      
      setMenuItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки меню');
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMenuItems([]);
    setItemQuantities({});
    setError(null);
    onClose();
  };

  if (!restaurant) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      placement="bottom"
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: "h-[70vh] max-h-[70vh]",
        wrapper: "h-[70vh] max-h-[70vh]",
        body: "h-full overflow-y-auto"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{restaurant.name}</h2>
              {restaurant.address && (
                <p className="text-sm text-gray-600">📍 {restaurant.address}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {telegramUser ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    ✅ Telegram
                  </span>
                  {supabaseProfile ? (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      ✅ Supabase
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                      ⏳ Загрузка профиля...
                    </span>
                  )}
                  <button
                    onClick={refreshCart}
                    disabled={cartLoading}
                    className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Обновить корзину"
                  >
                    {cartLoading ? '⏳' : '🔄'}
                  </button>
                  {currentCartRestaurant && currentCartRestaurant !== restaurant?.id && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      ⚠️ Другой ресторан в корзине
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  ❌ Не авторизован
                </span>
              )}
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="h-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Загружаем меню...</p>
            </div>
          ) : error ? (
            <div className="text-center h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">❌</div>
              <p className="text-red-600 mb-2">Ошибка загрузки меню</p>
              <p className="text-gray-600 text-sm">{error}</p>
              <button 
                onClick={loadMenuItems}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-gray-600">Меню пока не доступно</p>
            </div>
          ) : (
            <div className="space-y-6 h-full">
              {/* Группируем блюда по категориям */}
              {Array.from(new Set(menuItems.map(item => item.category))).map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {category}
                  </h3>
                  <div className="grid gap-4">
                    {menuItems
                      .filter(item => item.category === category)
                      .map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-b-0"
                        >
                          {/* Картинка блюда */}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-2xl">🍽️</div>
                            )}
                          </div>
                          
                          {/* Информация о блюде */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-lg mb-1">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Цена и кнопки */}
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <p className="text-xl font-bold text-blue-600">
                              {item.price} ₽
                            </p>
                            
                            {/* Кнопки количества */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleQuantityChange(item.id, -1)}
                                disabled={getItemQuantity(item.id) === 0}
                                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className={`w-7 h-7 rounded-full font-semibold text-sm flex items-center justify-center ${
                                getItemQuantity(item.id) > 0 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {getItemQuantity(item.id)}
                              </span>
                              <button 
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors font-medium text-sm"
                              >
                                +
                              </button>
                            </div>
                            
                            {/* Индикатор добавления в корзину */}
                            {getItemQuantity(item.id) > 0 && (
                              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full text-center">
                                ✅ В корзине
                              </div>
                            )}
                            
                            {!item.is_available && (
                              <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Недоступно
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
      </ModalContent>
      
      {/* Диалог конфликта ресторанов */}
      {showRestaurantConflictDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Конфликт ресторанов
              </h3>
              <p className="text-gray-600">
                На данный момент мы не поддерживаем добавление в корзину блюд из разных заведений
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelAddition}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleReplaceCart}
                className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Заменить корзину
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
