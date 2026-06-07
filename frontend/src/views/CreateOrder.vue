<template>
  <div class="page-container">
    <n-page-header title="创建寄养订单" subtitle="填写宠物寄养需求信息">
      <template #extra>
        <n-button @click="goBack">
          <template #icon>
            <n-icon><ArrowBack /></n-icon>
          </template>
          返回
        </n-button>
      </template>
    </n-page-header>

    <n-card class="card-shadow form-container mt-16">
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        label-width="auto"
      >
        <n-form-item label="选择宠物" path="pet_id">
          <n-select
            v-model:value="form.pet_id"
            :options="petOptions"
            placeholder="请选择要寄养的宠物"
            size="large"
          />
          <template v-if="selectedPet">
            <n-descriptions :column="2" size="small" class="mt-8">
              <n-descriptions-item label="品种">
                {{ selectedPet.breed || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="年龄">
                {{ selectedPet.age !== null && selectedPet.age !== undefined ? selectedPet.age + '岁' : '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="性别">
                {{ getGenderText(selectedPet.gender) }}
              </n-descriptions-item>
              <n-descriptions-item label="体重">
                {{ selectedPet.weight ? selectedPet.weight + 'kg' : '-' }}
              </n-descriptions-item>
            </n-descriptions>
          </template>
        </n-form-item>

        <n-form-item label="订单标题" path="title">
          <n-input
            v-model:value="form.title"
            placeholder="请输入订单标题，例如：周末寄养橘猫大橘"
            size="large"
          />
        </n-form-item>

        <n-form-item label="寄养时间段" path="dateRange">
          <n-date-picker
            v-model:value="form.dateRange"
            type="daterange"
            size="large"
            style="width: 100%"
            :disabled-date="disabledDate"
            @update:value="handleDateChange"
          />
          <div v-if="days > 0" class="mt-8 text-muted">
            共 {{ days }} 天
          </div>
        </n-form-item>

        <n-row :gutter="16">
          <n-col :span="12">
            <n-form-item label="开始日期" path="start_date">
              <n-input v-model:value="form.start_date" disabled />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="结束日期" path="end_date">
              <n-input v-model:value="form.end_date" disabled />
            </n-form-item>
          </n-col>
        </n-row>

        <n-form-item label="详细描述" path="description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您的寄养需求，如宠物的生活习惯、注意事项等"
          />
        </n-form-item>

        <n-form-item label="特殊需求" path="special_needs">
          <n-input
            v-model:value="form.special_needs"
            type="textarea"
            :rows="3"
            placeholder="请输入特殊需求，如喂食要求、用药说明等"
          />
        </n-form-item>

        <n-form-item label="预算价格(元)" path="price">
          <n-input-number
            v-model:value="form.price"
            :min="0"
            placeholder="可填写您的预算价格"
            size="large"
            style="width: 100%"
          />
        </n-form-item>

        <n-space justify="end" style="margin-top: 24px">
          <n-button size="large" @click="goBack">取消</n-button>
          <n-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSubmit"
          >
            提交订单
          </n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { usePetStore } from '@/stores/pet'
import { useOrderStore } from '@/stores/order'
import { ArrowBack } from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const petStore = usePetStore()
const orderStore = useOrderStore()

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  pet_id: null,
  title: '',
  description: '',
  dateRange: null,
  start_date: '',
  end_date: '',
  special_needs: '',
  price: null
})

const rules = {
  pet_id: [
    { required: true, message: '请选择宠物', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入订单标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度为2-100个字符', trigger: 'blur' }
  ],
  start_date: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  end_date: [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ]
}

const petOptions = computed(() => {
  return petStore.pets.map(pet => ({
    label: `${pet.name} (${pet.species}${pet.breed ? ' - ' + pet.breed : ''})`,
    value: pet.id
  }))
})

const selectedPet = computed(() => {
  if (!form.pet_id) return null
  return petStore.pets.find(p => p.id === form.pet_id)
})

const days = computed(() => {
  if (!form.start_date || !form.end_date) return 0
  const start = new Date(form.start_date)
  const end = new Date(form.end_date)
  const diffTime = end - start
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
})

function getGenderText(gender) {
  const map = { male: '公', female: '母', unknown: '未知' }
  return map[gender] || '-'
}

function disabledDate(current) {
  return current && current.getTime() < Date.now() - 86400000
}

function handleDateChange(value) {
  if (value && value.length === 2) {
    const start = new Date(value[0])
    const end = new Date(value[1])
    form.start_date = formatDate(start)
    form.end_date = formatDate(end)
  } else {
    form.start_date = ''
    form.end_date = ''
  }
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    const submitData = {
      pet_id: form.pet_id,
      title: form.title,
      description: form.description,
      start_date: form.start_date,
      end_date: form.end_date,
      special_needs: form.special_needs,
      price: form.price
    }

    await orderStore.createOrder(submitData)
    message.success('订单创建成功')
    router.push({ name: 'Orders' })
  } catch (error) {
    if (error.errors) return
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push({ name: 'Orders' })
}

onMounted(async () => {
  await petStore.fetchPets()
})
</script>

<style scoped>
.mt-8 {
  margin-top: 8px;
}
</style>
