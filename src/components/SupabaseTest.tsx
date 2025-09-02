import React, { useState, useEffect } from 'react';
import { getRestaurants, Restaurant } from '@/lib/supabase';

export const SupabaseTest = () => {
  const [status, setStatus] = useState<string>('Проверяем подключение...');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setStatus('Подключаемся к Supabase...');
      
      // Получаем все рестораны через новую функцию
      const { data, error } = await getRestaurants();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setStatus(`✅ Подключение успешно! Получено ${data.length} ресторанов`);
        setData(data);
      } else {
        setStatus('⚠️ Подключение работает, но данных нет');
        setData([]);
      }
    } catch (err: any) {
      setStatus('❌ Ошибка подключения к Supabase');
      setError(err.message || 'Неизвестная ошибка');
      console.error('Supabase connection error:', err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Тест подключения к Supabase</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Статус:</p>
        <p className={`font-medium ${
          status.includes('✅') ? 'text-green-600' : 
          status.includes('⚠️') ? 'text-yellow-600' : 
          status.includes('❌') ? 'text-red-600' : 'text-blue-600'
        }`}>
          {status}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 text-sm">Ошибка: {error}</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Список всех ресторанов ({data.length}):</p>
          <div className="space-y-3">
            {data.map((restaurant, index) => (
              <div key={restaurant.id || index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">🍽️</div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{restaurant.name}</h3>
                        {restaurant.description && (
                          <p className="text-gray-600 text-sm">{restaurant.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {restaurant.address && (
                        <p className="text-gray-500">📍 {restaurant.address}</p>
                      )}
                      {restaurant.phone && (
                        <p className="text-gray-500">📞 {restaurant.phone}</p>
                      )}
                      {restaurant.website && (
                        <p className="text-gray-500">🌐 <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{restaurant.website}</a></p>
                      )}
                      {restaurant.latitude && restaurant.longitude && (
                        <p className="text-gray-500">📍 Координаты: {restaurant.latitude.toFixed(4)}, {restaurant.longitude.toFixed(4)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 text-yellow-500 mb-2">
                      <span>⭐</span>
                      <span className="font-bold text-lg">{restaurant.rating}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>🕒 {restaurant.delivery_time_min}-{restaurant.delivery_time_max} мин</p>
                      <p>💰 От {restaurant.min_order_amount} ₽</p>
                    </div>
                    <div className={`mt-2 px-2 py-1 rounded-full text-xs ${
                      restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.is_active ? 'Активно' : 'Неактивно'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={testSupabaseConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Обновить список
        </button>
        <button
          onClick={() => {
            setData([]);
            setError(null);
            setStatus('Проверяем подключение...');
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Очистить
        </button>
      </div>
    </div>
  );
};
