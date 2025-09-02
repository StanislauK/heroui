import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { upsertTelegramProfile, getUserProfileByTelegramId } from '@/lib/supabase';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id: string;
  user: TelegramUser;
  auth_date: string;
  hash: string;
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<TelegramInitData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    try {
      // Инициализируем Telegram Mini App
      WebApp.ready();
      setIsReady(true);

      // Получаем данные пользователя
      if (WebApp.initDataUnsafe?.user) {
        setUser(WebApp.initDataUnsafe.user);
        
        // Создаем/обновляем профиль в Supabase
        createOrUpdateSupabaseProfile(WebApp.initDataUnsafe.user);
      }

      // Получаем initData если есть
      if (WebApp.initData) {
        // В реальном приложении здесь нужно валидировать hash
        // для безопасности
        try {
          const urlParams = new URLSearchParams(WebApp.initData);
          const userData = urlParams.get('user');
          if (userData) {
            const userObj = JSON.parse(decodeURIComponent(userData));
            setInitData({
              query_id: urlParams.get('query_id') || '',
              user: userObj,
              auth_date: urlParams.get('auth_date') || '',
              hash: urlParams.get('hash') || ''
            });
          }
        } catch (e) {
          console.warn('Could not parse initData:', e);
        }
      }

      // Настраиваем тему
      WebApp.setHeaderColor('#ffffff');
      WebApp.setBackgroundColor('#f0f0f0');

      // Обработчик изменения темы
      WebApp.onEvent('themeChanged', () => {
        console.log('Theme changed:', WebApp.colorScheme);
      });

      // Обработчик изменения размера окна
      WebApp.onEvent('viewportChanged', () => {
        console.log('Viewport changed:', WebApp.viewportHeight);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Telegram Mini App initialization error:', err);
    }
  }, []);

  // Функции для взаимодействия с Telegram
  const showAlert = (message: string) => {
    if (isReady) {
      WebApp.showAlert(message);
    }
  };

  const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
    if (isReady) {
      WebApp.showConfirm(message, callback);
    }
  };

  const showPopup = (title: string, message: string, buttons: Array<{id: string, type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive', text: string}>) => {
    if (isReady) {
      WebApp.showPopup(title, message, buttons);
    }
  };

  const expand = () => {
    if (isReady) {
      WebApp.expand();
    }
  };

  const close = () => {
    if (isReady) {
      WebApp.close();
    }
  };

  const requestWriteAccess = () => {
    if (isReady) {
      return WebApp.requestWriteAccess();
    }
    return Promise.resolve(false);
  };

  const requestPhone = () => {
    if (isReady) {
      return WebApp.requestPhone();
    }
    return Promise.resolve(null);
  };

  const requestContact = () => {
    if (isReady) {
      return WebApp.requestContact();
    }
    return Promise.resolve(null);
  };

  const requestLocation = () => {
    if (isReady) {
      return WebApp.requestLocation();
    }
    return Promise.resolve(null);
  };

  const requestInvoice = (params: any) => {
    if (isReady) {
      return WebApp.requestInvoice(params);
    }
    return Promise.resolve(null);
  };

  const openTelegramLink = (url: string) => {
    if (isReady) {
      WebApp.openTelegramLink(url);
    }
  };

  const openLink = (url: string) => {
    if (isReady) {
      WebApp.openLink(url);
    }
  };

  const switchInlineQuery = (query: string, choose_chat_types?: string[]) => {
    if (isReady) {
      WebApp.switchInlineQuery(query, choose_chat_types);
    }
  };

  const sendData = (data: string) => {
    if (isReady) {
      WebApp.sendData(data);
    }
  };

  const showScanQrPopup = (params: any) => {
    if (isReady) {
      WebApp.showScanQrPopup(params);
    }
  };

  const closeScanQrPopup = () => {
    if (isReady) {
      WebApp.closeScanQrPopup();
    }
  };

  const readTextFromClipboard = () => {
    if (isReady) {
      return WebApp.readTextFromClipboard();
    }
    return Promise.resolve('');
  };

  const showBackButton = (callback?: () => void) => {
    if (isReady) {
      WebApp.showBackButton(callback);
    }
  };

  const hideBackButton = () => {
    if (isReady) {
      WebApp.hideBackButton();
    }
  };

  const setBackButtonCallback = (callback: () => void) => {
    if (isReady) {
      WebApp.setBackButtonCallback(callback);
    }
  };

  const setMainButton = (params: {
    text: string;
    color?: string;
    text_color?: string;
    is_visible?: boolean;
    is_progress_visible?: boolean;
    is_active?: boolean;
  }) => {
    if (isReady) {
      WebApp.setMainButton(params);
    }
  };

  const showMainButton = () => {
    if (isReady) {
      WebApp.showMainButton();
    }
  };

  const hideMainButton = () => {
    if (isReady) {
      WebApp.hideMainButton();
    }
  };

  const enableClosingConfirmation = () => {
    if (isReady) {
      WebApp.enableClosingConfirmation();
    }
  };

  const disableClosingConfirmation = () => {
    if (isReady) {
      WebApp.disableClosingConfirmation();
    }
  };

  // Функция для создания/обновления профиля в Supabase
  const createOrUpdateSupabaseProfile = async (telegramUser: TelegramUser) => {
    try {
      setIsProfileLoading(true);
      
      // Создаем/обновляем профиль
      const { data: profileData, error: profileError } = await upsertTelegramProfile(telegramUser);
      
      if (profileError) {
        console.error('Error creating/updating profile:', profileError);
        return;
      }
      
      // Получаем обновленный профиль
      const { data: userProfile, error: fetchError } = await getUserProfileByTelegramId(telegramUser.id);
      
      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return;
      }
      
      setSupabaseProfile(userProfile);
      
    } catch (err) {
      console.error('Error in createOrUpdateSupabaseProfile:', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Функция для обновления профиля
  const refreshProfile = async () => {
    if (user) {
      await createOrUpdateSupabaseProfile(user);
    }
  };

  return {
    // Состояние
    user,
    initData,
    isReady,
    error,
    supabaseProfile,
    isProfileLoading,
    
    // Основные функции
    showAlert,
    showConfirm,
    showPopup,
    expand,
    close,
    
    // Запросы разрешений
    requestWriteAccess,
    requestPhone,
    requestContact,
    requestLocation,
    requestInvoice,
    
    // Навигация
    openTelegramLink,
    openLink,
    switchInlineQuery,
    
    // Взаимодействие
    sendData,
    showScanQrPopup,
    closeScanQrPopup,
    readTextFromClipboard,
    
    // Кнопки
    showBackButton,
    hideBackButton,
    setBackButtonCallback,
    setMainButton,
    showMainButton,
    hideMainButton,
    
    // Настройки
    enableClosingConfirmation,
    disableClosingConfirmation,
    
    // Прямой доступ к WebApp для продвинутых случаев
    WebApp: isReady ? WebApp : null,
    
    // Supabase функции
    createOrUpdateSupabaseProfile,
    refreshProfile
  };
};
