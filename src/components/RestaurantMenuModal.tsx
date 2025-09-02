import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { getMenuItems, MenuItem, Restaurant, addToCart, getCartItemsByTelegramId } from '@/lib/supabase';
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
  const [error, setError] = useState<string | null>(null);
  const { user: telegramUser, supabaseProfile } = useTelegram();
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && restaurant) {
      loadMenuItems();
      if (telegramUser) {
        loadUserCart();
      }
    }
  }, [isOpen, restaurant, telegramUser]);

  // Функция для получения количества товара
  const getItemQuantity = (itemId: string): number => {
    return itemQuantities[itemId] || 0;
  };

  // Функция для изменения количества товара
  const handleQuantityChange = async (itemId: string, change: number) => {
    if (!telegramUser || !restaurant) return;

    const currentQuantity = getItemQuantity(itemId);
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity === 0) {
      // Удаляем товар из корзины
      const newQuantities = { ...itemQuantities };
      delete newQuantities[itemId];
      setItemQuantities(newQuantities);
    } else {
      // Обновляем количество
      setItemQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));

      // Добавляем в Supabase корзину
      try {
        const result = await addToCart(
          telegramUser.id,
          itemId,
          restaurant.id,
          newQuantity
        );

        if (result.error) {
          console.error('Error updating cart:', result.error);
        }
      } catch (err) {
        console.error('Error adding to cart:', err);
      }
    }
  };

  // Функция для загрузки корзины пользователя
  const loadUserCart = async () => {
    if (!telegramUser) return;

    try {
      const { data: cartItems, error } = await getCartItemsByTelegramId(telegramUser.id);
      
      if (error) {
        console.error('Error loading cart:', error);
        return;
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
    }
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
                </div>
              ) : (
                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  ❌ Не авторизован
                </span>
              )}
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Загружаем меню...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
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
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-gray-600">Меню пока не доступно</p>
            </div>
          ) : (
            <div className="space-y-6">
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
                                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors font-medium text-sm"
                              >
                                -
                              </button>
                              <span className="w-7 h-7 bg-blue-500 text-white rounded-full font-semibold text-sm flex items-center justify-center">
                                {getItemQuantity(item.id)}
                              </span>
                              <button 
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors font-medium text-sm"
                              >
                                +
                              </button>
                            </div>
                            
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
    </Modal>
  );
};
