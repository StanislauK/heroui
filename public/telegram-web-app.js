// Telegram Mini App initialization script
// This file is loaded before the main app to ensure Telegram WebApp is available

(function() {
  // Check if we're running inside Telegram
  if (window.Telegram && window.Telegram.WebApp) {
    console.log('Telegram WebApp detected');
    
    // Initialize the WebApp
    window.Telegram.WebApp.ready();
    
    // Set default theme
    window.Telegram.WebApp.setHeaderColor('#ffffff');
    window.Telegram.WebApp.setBackgroundColor('#f0f0f0');
    
    // Log WebApp info
    console.log('WebApp version:', window.Telegram.WebApp.version);
    console.log('Platform:', window.Telegram.WebApp.platform);
    console.log('Color scheme:', window.Telegram.WebApp.colorScheme);
    console.log('Theme params:', window.Telegram.WebApp.themeParams);
    
  } else {
    console.log('Not running inside Telegram WebApp');
    
    // Create a mock WebApp for development/testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating mock WebApp for development');
      
      window.Telegram = {
        WebApp: {
          ready: () => console.log('Mock WebApp ready'),
          setHeaderColor: (color) => console.log('Mock setHeaderColor:', color),
          setBackgroundColor: (color) => console.log('Mock setBackgroundColor:', color),
          initDataUnsafe: {
            user: {
              id: 123456789,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'ru',
              is_premium: false
            }
          },
          initData: '',
          version: '6.0',
          platform: 'web',
          colorScheme: 'light',
          themeParams: {},
          viewportHeight: 600,
          viewportStableHeight: 600,
          headerColor: '#ffffff',
          backgroundColor: '#f0f0f0',
          isExpanded: false,
          isClosingConfirmationEnabled: false,
          
          // Mock methods
          showAlert: (message) => alert('Mock Alert: ' + message),
          showConfirm: (message, callback) => {
            const confirmed = confirm('Mock Confirm: ' + message);
            if (callback) callback(confirmed);
          },
          showPopup: (title, message, buttons) => {
            console.log('Mock Popup:', { title, message, buttons });
            alert('Mock Popup: ' + title + '\n' + message);
          },
          expand: () => console.log('Mock expand'),
          close: () => console.log('Mock close'),
          requestWriteAccess: () => Promise.resolve(true),
          requestPhone: () => Promise.resolve('+1234567890'),
          requestContact: () => Promise.resolve({
            first_name: 'Test',
            last_name: 'Contact',
            phone_number: '+1234567890'
          }),
          requestLocation: () => Promise.resolve({
            latitude: 53.902284,
            longitude: 27.561831
          }),
          requestInvoice: (params) => Promise.resolve('invoice_id'),
          openTelegramLink: (url) => console.log('Mock openTelegramLink:', url),
          openLink: (url) => window.open(url, '_blank'),
          switchInlineQuery: (query, choose_chat_types) => console.log('Mock switchInlineQuery:', query),
          sendData: (data) => console.log('Mock sendData:', data),
          showScanQrPopup: (params) => console.log('Mock showScanQrPopup:', params),
          closeScanQrPopup: () => console.log('Mock closeScanQrPopup'),
          readTextFromClipboard: () => Promise.resolve('Mock clipboard text'),
          showBackButton: (callback) => {
            console.log('Mock showBackButton');
            if (callback) window.mockBackButtonCallback = callback;
          },
          hideBackButton: () => console.log('Mock hideBackButton'),
          setBackButtonCallback: (callback) => {
            console.log('Mock setBackButtonCallback');
            window.mockBackButtonCallback = callback;
          },
          setMainButton: (params) => console.log('Mock setMainButton:', params),
          showMainButton: () => console.log('Mock showMainButton'),
          hideMainButton: () => console.log('Mock hideMainButton'),
          enableClosingConfirmation: () => console.log('Mock enableClosingConfirmation'),
          disableClosingConfirmation: () => console.log('Mock disableClosingConfirmation'),
          onEvent: (eventType, eventHandler) => console.log('Mock onEvent:', eventType),
          offEvent: (eventType, eventHandler) => console.log('Mock offEvent:', eventType)
        }
      };
    }
  }
})();
