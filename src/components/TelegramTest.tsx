import React from 'react';
import { useTelegram } from '@/hooks/useTelegram';

export const TelegramTest: React.FC = () => {
  const {
    user,
    initData,
    isReady,
    error,
    supabaseProfile,
    isProfileLoading,
    showAlert,
    showConfirm,
    showPopup,
    expand,
    close,
    requestPhone,
    requestContact,
    requestLocation,
    setMainButton,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    sendData,
    readTextFromClipboard,
    refreshProfile
  } = useTelegram();

  const handleShowAlert = () => {
    showAlert('Это тестовое сообщение от Telegram Mini App!');
  };

  const handleShowConfirm = () => {
    showConfirm('Вы уверены, что хотите продолжить?', (confirmed) => {
      if (confirmed) {
        showAlert('Пользователь подтвердил действие!');
      } else {
        showAlert('Пользователь отменил действие!');
      }
    });
  };

  const handleShowPopup = () => {
    showPopup(
      'Тестовый Popup',
      'Это тестовое popup окно с кнопками',
      [
        { id: 'ok', type: 'ok', text: 'OK' },
        { id: 'cancel', type: 'cancel', text: 'Отмена' }
      ]
    );
  };

  const handleRequestPhone = async () => {
    try {
      const phone = await requestPhone();
      if (phone) {
        showAlert(`Получен номер телефона: ${phone}`);
      } else {
        showAlert('Пользователь не предоставил номер телефона');
      }
    } catch (err) {
      showAlert('Ошибка при запросе номера телефона');
    }
  };

  const handleRequestContact = async () => {
    try {
      const contact = await requestContact();
      if (contact) {
        showAlert(`Получен контакт: ${(contact as any).first_name} ${(contact as any).last_name || ''}`);
      } else {
        showAlert('Пользователь не предоставил контакт');
      }
    } catch (err) {
      showAlert('Ошибка при запросе контакта');
    }
  };

  const handleRequestLocation = async () => {
    try {
      const location = await requestLocation();
      if (location) {
        showAlert(`Получена локация: ${location.latitude}, ${location.longitude}`);
      } else {
        showAlert('Пользователь не предоставил локацию');
      }
    } catch (err) {
      showAlert('Ошибка при запросе локации');
    }
  };

  const handleSetMainButton = () => {
    setMainButton({
      text: 'Тестовая кнопка',
      color: '#3b82f6',
      text_color: '#ffffff',
      is_visible: true,
      is_active: true
    });
    showMainButton();
  };

  const handleShowBackButton = () => {
    showBackButton(() => {
      showAlert('Нажата кнопка "Назад"');
    });
  };

  const handleSendData = () => {
    sendData('test_data_from_mini_app');
    showAlert('Данные отправлены в Telegram!');
  };

  const handleReadClipboard = async () => {
    try {
      const text = await readTextFromClipboard();
      if (text) {
        showAlert(`Текст из буфера обмена: ${text}`);
      } else {
        showAlert('Буфер обмена пуст');
      }
    } catch (err) {
      showAlert('Ошибка при чтении буфера обмена');
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Ошибка Telegram Mini App</h3>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-red-500 mt-2">
          Убедитесь, что приложение запущено внутри Telegram
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-blue-800">Инициализация Telegram Mini App...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Информация о пользователе */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Информация о пользователе</h3>
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {user.photo_url && (
                <img 
                  src={user.photo_url} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {user?.first_name} {user?.last_name || ''}
                </p>
                {user.username && (
                  <p className="text-sm text-gray-600">@{user.username}</p>
                )}
                <p className="text-xs text-gray-500">ID: {user.id}</p>
              </div>
            </div>
            {user.is_premium && (
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Premium пользователь
              </span>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Пользователь не авторизован</p>
        )}
      </div>

      {/* Supabase профиль */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Supabase профиль</h3>
          <button
            onClick={refreshProfile}
            disabled={isProfileLoading}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProfileLoading ? 'Обновление...' : 'Обновить'}
          </button>
        </div>
        
        {isProfileLoading ? (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Загрузка профиля...</span>
          </div>
        ) : supabaseProfile ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-gray-600">Supabase ID:</span>
                <p className="text-gray-800">{supabaseProfile.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">User ID:</span>
                <p className="text-gray-800">{supabaseProfile.user_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Telegram ID:</span>
                <p className="text-gray-800">{supabaseProfile.telegram_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Роль:</span>
                <p className="text-gray-800">{supabaseProfile.role}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-600">Создан:</span>
              <p className="text-gray-800">{new Date(supabaseProfile.created_at).toLocaleString('ru-RU')}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="text-green-800 text-xs">
                ✅ Профиль успешно создан в Supabase! Теперь пользователь может работать с защищенными данными.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-red-600 text-sm">Профиль в Supabase не найден</p>
            <p className="text-gray-500 text-xs mt-1">
              Попробуйте нажать "Обновить" или перезагрузить страницу
            </p>
          </div>
        )}
      </div>

      {/* Основные функции */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Основные функции</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShowAlert}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Показать Alert
          </button>
          <button
            onClick={handleShowConfirm}
            className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            Показать Confirm
          </button>
          <button
            onClick={handleShowPopup}
            className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
          >
            Показать Popup
          </button>
          <button
            onClick={expand}
            className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            Расширить окно
          </button>
        </div>
      </div>

      {/* Запросы разрешений */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Запросы разрешений</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleRequestPhone}
            className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors text-sm"
          >
            Номер телефона
          </button>
          <button
            onClick={handleRequestContact}
            className="bg-teal-500 text-white px-3 py-2 rounded-lg hover:bg-teal-600 transition-colors text-sm"
          >
            Контакт
          </button>
          <button
            onClick={handleRequestLocation}
            className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm"
          >
            Локация
          </button>
        </div>
      </div>

      {/* Кнопки */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Управление кнопками</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSetMainButton}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Показать главную кнопку
          </button>
          <button
            onClick={hideMainButton}
            className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Скрыть главную кнопку
          </button>
          <button
            onClick={handleShowBackButton}
            className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
          >
            Показать кнопку "Назад"
          </button>
          <button
            onClick={hideBackButton}
            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Скрыть кнопку "Назад"
          </button>
        </div>
      </div>

      {/* Дополнительные функции */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Дополнительные функции</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSendData}
            className="bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm"
          >
            Отправить данные
          </button>
          <button
            onClick={handleReadClipboard}
            className="bg-violet-500 text-white px-3 py-2 rounded-lg hover:bg-violet-600 transition-colors text-sm"
          >
            Читать буфер обмена
          </button>
        </div>
      </div>

      {/* Тестирование Supabase функций */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Тестирование Supabase</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={async () => {
              if (user) {
                try {
                  const { addToCart } = await import('@/lib/supabase');
                  const result = await addToCart(user.id, 'test-menu-item-id', 'test-restaurant-id', 1);
                  if (result.error) {
                    showAlert('Ошибка добавления в корзину: ' + (result.error as any).message);
                  } else {
                    showAlert('Товар добавлен в корзину!');
                  }
                } catch (err) {
                  showAlert('Ошибка импорта функции');
                }
              } else {
                showAlert('Пользователь не авторизован');
              }
            }}
            className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm"
          >
            Тест корзины
          </button>
          <button
            onClick={async () => {
              if (user) {
                try {
                  const { getCartItemsByTelegramId } = await import('@/lib/supabase');
                  const result = await getCartItemsByTelegramId(user.id);
                  if (result.error) {
                    showAlert('Ошибка получения корзины: ' + (result.error as any).message);
                  } else {
                    showAlert(`В корзине ${result.data.length} товаров`);
                  }
                } catch (err) {
                  showAlert('Ошибка импорта функции');
                }
              } else {
                showAlert('Пользователь не авторизован');
              }
            }}
            className="bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm"
          >
            Получить корзину
          </button>
        </div>
      </div>

      {/* Кнопка закрытия */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Закрытие приложения</h3>
        <button
          onClick={close}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          Закрыть Mini App
        </button>
      </div>

      {/* Отладочная информация */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Отладочная информация</h3>
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600">Показать initData</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(initData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};
