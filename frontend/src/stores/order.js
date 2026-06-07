import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const pendingOrders = ref([])
  const currentOrder = ref(null)
  const loading = ref(false)

  async function fetchOrders(status) {
    loading.value = true
    try {
      const params = status ? { status } : {}
      const res = await request.get('/orders', { params })
      orders.value = res.data
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchPendingOrders() {
    try {
      const res = await request.get('/orders/pending/all')
      pendingOrders.value = res.data
      return res
    } catch (error) {
      throw error
    }
  }

  async function fetchOrder(id) {
    try {
      const res = await request.get(`/orders/${id}`)
      currentOrder.value = res.data
      return res
    } catch (error) {
      throw error
    }
  }

  async function createOrder(data) {
    try {
      const res = await request.post('/orders', data)
      orders.value.unshift(res.data)
      return res
    } catch (error) {
      throw error
    }
  }

  async function acceptOrder(id) {
    try {
      const res = await request.post(`/orders/${id}/accept`)
      const index = orders.value.findIndex(o => o.id === id)
      if (index !== -1) {
        orders.value[index] = res.data
      }
      const pendingIndex = pendingOrders.value.findIndex(o => o.id === id)
      if (pendingIndex !== -1) {
        pendingOrders.value.splice(pendingIndex, 1)
      }
      return res
    } catch (error) {
      throw error
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      const res = await request.put(`/orders/${id}/status`, { status })
      const index = orders.value.findIndex(o => o.id === id)
      if (index !== -1) {
        orders.value[index] = res.data
      }
      return res
    } catch (error) {
      throw error
    }
  }

  async function updateOrder(id, data) {
    try {
      const res = await request.put(`/orders/${id}`, data)
      const index = orders.value.findIndex(o => o.id === id)
      if (index !== -1) {
        orders.value[index] = res.data
      }
      return res
    } catch (error) {
      throw error
    }
  }

  return {
    orders,
    pendingOrders,
    currentOrder,
    loading,
    fetchOrders,
    fetchPendingOrders,
    fetchOrder,
    createOrder,
    acceptOrder,
    updateOrderStatus,
    updateOrder
  }
})
