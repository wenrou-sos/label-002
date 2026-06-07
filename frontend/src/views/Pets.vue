<template>
  <div class="page-container">
    <n-page-header title="宠物档案" subtitle="管理您的宠物信息">
      <template #extra>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon>
            <n-icon><Add /></n-icon>
          </template>
          添加宠物
        </n-button>
      </template>
    </n-page-header>

    <n-spin :show="petStore.loading" class="mt-16">
      <n-empty v-if="petStore.pets.length === 0" description="暂无宠物档案，点击上方按钮添加">
        <template #action>
          <n-button type="primary" @click="showCreateModal = true">
            添加第一只宠物
          </n-button>
        </template>
      </n-empty>

      <n-grid :cols="3" :x-gap="24" :y-gap="24" v-else class="mt-16">
        <n-grid-item v-for="pet in petStore.pets" :key="pet.id">
          <n-card class="pet-card hover-scale">
            <div class="pet-header">
              <n-avatar :size="64" round>
                {{ pet.name.charAt(0) }}
              </n-avatar>
              <div class="pet-info">
                <h3 class="pet-name">{{ pet.name }}</h3>
                <div class="pet-meta">
                  <n-tag size="small" type="info">{{ pet.species }}</n-tag>
                  <n-tag v-if="pet.breed" size="small" style="margin-left: 4px">{{ pet.breed }}</n-tag>
                </div>
              </div>
            </div>
            <n-descriptions :column="2" size="small" class="mt-16">
              <n-descriptions-item label="年龄">
                {{ pet.age !== null && pet.age !== undefined ? pet.age + '岁' : '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="性别">
                {{ getGenderText(pet.gender) }}
              </n-descriptions-item>
              <n-descriptions-item label="体重">
                {{ pet.weight ? pet.weight + 'kg' : '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="主人">
                {{ pet.owner_name || '-' }}
              </n-descriptions-item>
            </n-descriptions>
            <n-divider style="margin: 12px 0" />
            <div class="pet-description" v-if="pet.description">
              {{ pet.description }}
            </div>
            <div class="pet-actions">
              <n-button size="small" @click="viewPet(pet)">
                <template #icon>
                  <n-icon><Eye /></n-icon>
                </template>
                查看
              </n-button>
              <n-button size="small" type="primary" @click="editPet(pet)">
                <template #icon>
                  <n-icon><Create /></n-icon>
                </template>
                编辑
              </n-button>
              <n-button size="small" type="error" @click="deletePet(pet)">
                <template #icon>
                  <n-icon><Trash /></n-icon>
                </template>
                删除
              </n-button>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>

    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="isEdit ? '编辑宠物' : '添加宠物'"
      style="width: 600px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        class="modal-content"
      >
        <n-row :gutter="16">
          <n-col :span="12">
            <n-form-item label="宠物名称" path="name">
              <n-input v-model:value="form.name" placeholder="请输入宠物名称" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="物种" path="species">
              <n-select
                v-model:value="form.species"
                :options="speciesOptions"
                placeholder="请选择物种"
              />
            </n-form-item>
          </n-col>
        </n-row>
        <n-row :gutter="16">
          <n-col :span="12">
            <n-form-item label="品种" path="breed">
              <n-input v-model:value="form.breed" placeholder="请输入品种" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="年龄" path="age">
              <n-input-number
                v-model:value="form.age"
                :min="0"
                placeholder="年龄"
                style="width: 100%"
              />
            </n-form-item>
          </n-col>
        </n-row>
        <n-row :gutter="16">
          <n-col :span="12">
            <n-form-item label="性别" path="gender">
              <n-select
                v-model:value="form.gender"
                :options="genderOptions"
                placeholder="请选择性别"
              />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="体重(kg)" path="weight">
              <n-input-number
                v-model:value="form.weight"
                :min="0"
                :step="0.1"
                placeholder="体重"
                style="width: 100%"
              />
            </n-form-item>
          </n-col>
        </n-row>
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入宠物描述"
          />
        </n-form-item>
        <n-form-item label="健康信息" path="health_info">
          <n-input
            v-model:value="form.health_info"
            type="textarea"
            :rows="3"
            placeholder="请输入健康信息（疫苗、病史等）"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showViewModal" preset="card" title="宠物详情" style="width: 600px">
      <div v-if="currentPet" class="modal-content">
        <div class="pet-detail-header">
          <n-avatar :size="80" round>
            {{ currentPet.name.charAt(0) }}
          </n-avatar>
          <div>
            <h2>{{ currentPet.name }}</h2>
            <div class="pet-meta">
              <n-tag type="info">{{ currentPet.species }}</n-tag>
              <n-tag v-if="currentPet.breed" style="margin-left: 4px">{{ currentPet.breed }}</n-tag>
            </div>
          </div>
        </div>
        <n-descriptions :column="2" class="mt-16">
          <n-descriptions-item label="年龄">
            {{ currentPet.age !== null && currentPet.age !== undefined ? currentPet.age + '岁' : '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="性别">
            {{ getGenderText(currentPet.gender) }}
          </n-descriptions-item>
          <n-descriptions-item label="体重">
            {{ currentPet.weight ? currentPet.weight + 'kg' : '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="主人">
            {{ currentPet.owner_name || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="主人电话">
            {{ currentPet.owner_phone || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="主人邮箱">
            {{ currentPet.owner_email || '-' }}
          </n-descriptions-item>
        </n-descriptions>
        <n-divider />
        <h4>宠物描述</h4>
        <p class="detail-content">{{ currentPet.description || '暂无描述' }}</p>
        <h4>健康信息</h4>
        <p class="detail-content">{{ currentPet.health_info || '暂无健康信息' }}</p>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showViewModal = false">关闭</n-button>
          <n-button type="primary" @click="editCurrentPet">编辑</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { usePetStore } from '@/stores/pet'
import { Add, Eye, Create, Trash } from '@vicons/ionicons5'

const message = useMessage()
const dialog = useDialog()
const petStore = usePetStore()

const formRef = ref(null)
const showCreateModal = ref(false)
const showModal = ref(false)
const showViewModal = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const currentPet = ref(null)
const editingId = ref(null)

const speciesOptions = [
  { label: '猫', value: 'cat' },
  { label: '狗', value: 'dog' },
  { label: '鸟', value: 'bird' },
  { label: '兔', value: 'rabbit' },
  { label: '仓鼠', value: 'hamster' },
  { label: '其他', value: 'other' }
]

const genderOptions = [
  { label: '公', value: 'male' },
  { label: '母', value: 'female' },
  { label: '未知', value: 'unknown' }
]

const form = reactive({
  name: '',
  species: '',
  breed: '',
  age: null,
  gender: 'unknown',
  weight: null,
  description: '',
  health_info: ''
})

const rules = {
  name: [
    { required: true, message: '请输入宠物名称', trigger: 'blur' }
  ],
  species: [
    { required: true, message: '请选择物种', trigger: 'change' }
  ]
}

function getGenderText(gender) {
  const map = { male: '公', female: '母', unknown: '未知' }
  return map[gender] || '-'
}

function resetForm() {
  form.name = ''
  form.species = ''
  form.breed = ''
  form.age = null
  form.gender = 'unknown'
  form.weight = null
  form.description = ''
  form.health_info = ''
  editingId.value = null
}

function editPet(pet) {
  isEdit.value = true
  editingId.value = pet.id
  form.name = pet.name
  form.species = pet.species
  form.breed = pet.breed || ''
  form.age = pet.age
  form.gender = pet.gender || 'unknown'
  form.weight = pet.weight
  form.description = pet.description || ''
  form.health_info = pet.health_info || ''
  showModal.value = true
}

function viewPet(pet) {
  currentPet.value = pet
  showViewModal.value = true
}

function editCurrentPet() {
  showViewModal.value = false
  editPet(currentPet.value)
}

function deletePet(pet) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除宠物"${pet.name}"吗？删除后无法恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await petStore.deletePet(pet.id)
        message.success('删除成功')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    saving.value = true
    if (isEdit.value) {
      await petStore.updatePet(editingId.value, form)
      message.success('修改成功')
    } else {
      await petStore.createPet(form)
      message.success('创建成功')
    }
    showModal.value = false
    resetForm()
  } catch (error) {
    if (error.errors) return
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await petStore.fetchPets()
})

watch(showCreateModal, (val) => {
  if (val) {
    isEdit.value = false
    resetForm()
    showModal.value = true
    showCreateModal.value = false
  }
})
</script>

<style scoped>
.pet-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.pet-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pet-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
}

.pet-meta {
  display: flex;
  align-items: center;
}

.pet-description {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  min-height: 40px;
}

.pet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.pet-detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.pet-detail-header h2 {
  margin: 0 0 8px 0;
}

.detail-content {
  color: #666;
  line-height: 1.6;
  margin: 8px 0 16px 0;
}

h4 {
  margin: 16px 0 8px 0;
}
</style>
