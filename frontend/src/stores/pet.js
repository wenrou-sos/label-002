import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const usePetStore = defineStore('pet', () => {
  const pets = ref([])
  const currentPet = ref(null)
  const loading = ref(false)

  async function fetchPets() {
    loading.value = true
    try {
      const res = await request.get('/pets')
      pets.value = res.data
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchPet(id) {
    try {
      const res = await request.get(`/pets/${id}`)
      currentPet.value = res.data
      return res
    } catch (error) {
      throw error
    }
  }

  async function createPet(data) {
    try {
      const res = await request.post('/pets', data)
      pets.value.unshift(res.data)
      return res
    } catch (error) {
      throw error
    }
  }

  async function updatePet(id, data) {
    try {
      const res = await request.put(`/pets/${id}`, data)
      const index = pets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        pets.value[index] = res.data
      }
      return res
    } catch (error) {
      throw error
    }
  }

  async function deletePet(id) {
    try {
      const res = await request.delete(`/pets/${id}`)
      pets.value = pets.value.filter(p => p.id !== id)
      return res
    } catch (error) {
      throw error
    }
  }

  return {
    pets,
    currentPet,
    loading,
    fetchPets,
    fetchPet,
    createPet,
    updatePet,
    deletePet
  }
})
