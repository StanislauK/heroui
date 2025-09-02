import DefaultLayout from "@/layouts/default";
import {Tabs, Tab} from "@heroui/tabs";
import React from "react";
import { getRestaurants, Restaurant } from "@/lib/supabase";
import { RestaurantMenuModal } from "@/components/RestaurantMenuModal";

export default function RestaurantsPage() {
  const [selectedTab, setSelectedTab] = React.useState<string>("map");
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = React.useState(false);

  const openMenuModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsMenuModalOpen(true);
  };

  const closeMenuModal = () => {
    setIsMenuModalOpen(false);
    setSelectedRestaurant(null);
  };

  return (
    <DefaultLayout>
      <div className="min-h-full bg-gradient-to-br from-orange-50 to-yellow-50 -mx-6">
        {/* Toolbar с табами */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-20">
          <div className="flex justify-center py-4">
            <Tabs 
              aria-label="Restaurants view" 
              variant={"solid"} 
              size={"lg"}
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
            >
              <Tab key="map" title="Карта" />
              <Tab key="list" title="Список" />
              <Tab key="favorites" title="Избранное" />
            </Tabs>
          </div>
        </div>
        
                       {/* Контент */}
               <div className="px-4">
                 {selectedTab === "map" && <MapContent onShowMenu={openMenuModal} />}
                 {selectedTab === "list" && <ListContent onShowMenu={openMenuModal} />}
                 {selectedTab === "favorites" && <FavoritesContent />}
               </div>
              </div>
        
        {/* Модальное окно для меню ресторана */}
        <RestaurantMenuModal
          isOpen={isMenuModalOpen}
          onClose={closeMenuModal}
          restaurant={selectedRestaurant}
        />
      </DefaultLayout>
    );
  }

// Компонент для отображения карты (занимает весь экран)
function MapContent({ onShowMenu }: { onShowMenu: (restaurant: Restaurant) => void }) {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Загружаем рестораны
    const fetchRestaurants = async () => {
      try {
        const { data, error } = await getRestaurants();
        if (error) throw error;
        setRestaurants(data || []);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  React.useEffect(() => {
    if (restaurants.length === 0) return;

    // Загружаем Yandex Maps API
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=e1e4aa3e-70a6-4b00-8470-d34f8aff4689&lang=ru_RU';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore
      window.ymaps.ready(() => {
        // @ts-ignore
        const map = new window.ymaps.Map('yandex-map', {
          center: [53.902284, 27.561831], // Координаты центра Минска
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        }, {
          searchControlProvider: 'yandex#search'
        });

        // Добавляем маркеры для каждого ресторана
        restaurants.forEach((restaurant) => {
          if (restaurant.latitude && restaurant.longitude) {
            // Создаем HTML для всплывающего окна
            const balloonContent = `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${restaurant.name}</h3>
                ${restaurant.address ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">📍 ${restaurant.address}</p>` : ''}
                <button 
                  onclick="window.showRestaurantMenu('${restaurant.id}')" 
                  style="
                    background: #3b82f6; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    cursor: pointer; 
                    font-size: 14px;
                    width: 100%;
                  "
                  onmouseover="this.style.background='#2563eb'"
                  onmouseout="this.style.background='#3b82f6'"
                >
                  Смотреть меню
                </button>
              </div>
            `;

            // @ts-ignore
            const placemark = new window.ymaps.Placemark(
              [restaurant.latitude, restaurant.longitude],
              {
                balloonContent: balloonContent,
                hintContent: restaurant.name
              },
              {
                preset: 'islands#redDotIcon',
                iconColor: '#ef4444'
              }
            );

            map.geoObjects.add(placemark);
          }
        });

        // Добавляем глобальную функцию для кнопки
        // @ts-ignore
        window.showRestaurantMenu = (restaurantId: string) => {
          const restaurant = restaurants.find(r => r.id === restaurantId);
          if (restaurant) {
            onShowMenu(restaurant);
          }
        };
      });
    };

    document.head.appendChild(script);

    return () => {
      // Очистка при размонтировании
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // @ts-ignore
      if (window.showRestaurantMenu) {
        // @ts-ignore
        delete window.showRestaurantMenu;
      }
    };
  }, [restaurants]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] -mx-4 -my-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-gray-600">Загружаем карту...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] -mx-4 -my-4">
      <div id="yandex-map" className="w-full h-full"></div>
    </div>
  );
}

// Компонент для отображения списка (с отступом сверху)
function ListContent({ onShowMenu }: { onShowMenu: (restaurant: Restaurant) => void }) {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const { data, error } = await getRestaurants();
        if (error) throw error;
        setRestaurants(data || []);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки ресторанов');
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 pt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Список заведений</h2>
          <p className="text-gray-600">Загружаем рестораны...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ошибка загрузки</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Список заведений</h2>
        <p className="text-gray-600">Найдено {restaurants.length} ресторанов</p>
      </div>
      
      {restaurants.map((restaurant) => (
        <div key={restaurant.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🍽️</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-800 mb-1">{restaurant.name}</h3>
              {restaurant.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{restaurant.description}</p>
              )}
              {restaurant.address && (
                <p className="text-gray-500 text-sm mb-1">📍 {restaurant.address}</p>
              )}
              {restaurant.phone && (
                <p className="text-gray-500 text-sm">📞 {restaurant.phone}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-yellow-500 mb-2">
                <span>⭐</span>
                <span className="font-semibold text-lg">{restaurant.rating}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>🕒 {restaurant.delivery_time_min}-{restaurant.delivery_time_max} мин</p>
                <p className="text-blue-600 font-medium">💰 От {restaurant.min_order_amount} ₽</p>
              </div>
              <div className={`mt-2 px-2 py-1 rounded-full text-xs ${
                restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.is_active ? 'Открыто' : 'Закрыто'}
              </div>
            </div>
          </div>
          
          {/* Кнопка "Смотреть меню" */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onShowMenu(restaurant)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Смотреть меню
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Компонент для отображения избранного (с отступом сверху)
function FavoritesContent() {
  const favorites = [
    { id: 1, name: "Pizza Palace", lastOrder: "2 дня назад", emoji: "🍕" },
    { id: 2, name: "Sushi Master", lastOrder: "Неделю назад", emoji: "🍣" },
  ];

  return (
    <div className="space-y-4 pt-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Избранные заведения</h2>
        <p className="text-gray-600">Ваши любимые рестораны</p>
      </div>
      
      {favorites.length > 0 ? (
        favorites.map((restaurant) => (
          <div key={restaurant.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{restaurant.emoji}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{restaurant.name}</h3>
                <p className="text-gray-600 text-sm">Последний заказ: {restaurant.lastOrder}</p>
              </div>
              <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                Убрать
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Нет избранных</h3>
          <p className="text-gray-600">Добавляйте заведения в избранное, чтобы быстро находить их</p>
        </div>
      )}
    </div>
  );
}
