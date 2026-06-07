import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isOwner = computed(() => userInfo.value?.role === 'owner')
  const isCaregiver = computed(() => userInfo.value?.role === 'caregiver')
  const userName = computed(() => userInfo.value?.name || userInfo.value?.username || '')
  const userRole = computed(() => userInfo.value?.role || '')

  async function login(username, password) {
    try {
      const res = await request.post('/auth/login', { username, password })
      const { token: newToken, user } = res.data
      token.value = newToken
      userInfo.value = user
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(user))
      return res
    } catch (error) {
      throw error
    }
  }

  async function register(data) {
    try {
      const res = await request.post('/auth/register', data)
      const { token: newToken, user } = res.data
      token.value = newToken
      userInfo.value = user
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(user))
      return res
    } catch (error) {
      throw error
    }
  }

  async function fetchProfile() {
    try {
      const res = await request.get('/auth/profile')
      userInfo.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return res
    } catch (error) {
      throw error
    }
  }

  async function updateProfile(data) {
    try {
      const res = await request.put('/auth/profile', data)
      userInfo.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return res
    } catch (error) {
      throw error
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isOwner,
    isCaregiver,
    userName,
    userRole,
    login,
    register,
    fetchProfile,
    updateProfile,
    changePassword,
    logout
  }
})
