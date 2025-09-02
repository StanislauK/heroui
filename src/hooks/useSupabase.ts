import { useState, useEffect } from 'react'
import { supabase, Restaurant, Favorite, Order } from '@/lib/supabase'

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  async function fetchRestaurants() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false })

      if (error) throw error
      setRestaurants(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки ресторанов')
    } finally {
      setLoading(false)
    }
  }

  return { restaurants, loading, error, refetch: fetchRestaurants }
}

export function useFavorites(userId: string) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchFavorites()
    }
  }, [userId])

  async function fetchFavorites() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFavorites(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки избранного')
    } finally {
      setLoading(false)
    }
  }

  async function addToFavorites(restaurantId: number) {
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({ restaurant_id: restaurantId, user_id: userId })

      if (error) throw error
      await fetchFavorites()
    } catch (err) {
      throw err
    }
  }

  async function removeFromFavorites(restaurantId: number) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('user_id', userId)

      if (error) throw error
      await fetchFavorites()
    } catch (err) {
      throw err
    }
  }

  return { 
    favorites, 
    loading, 
    error, 
    addToFavorites, 
    removeFromFavorites,
    refetch: fetchFavorites 
  }
}

export function useOrders(userId: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchOrders()
    }
  }, [userId])

  async function fetchOrders() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }

  return { orders, loading, error, refetch: fetchOrders }
}
