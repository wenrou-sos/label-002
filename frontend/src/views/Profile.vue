<template>
  <div class="page-container">
    <n-page-header title="个人中心" subtitle="管理您的个人信息">
    </n-page-header>

    <n-row :gutter="24" class="mt-16">
      <n-col :span="8">
        <n-card class="card-shadow">
          <div class="profile-header">
            <n-avatar :size="96" round>
              {{ userStore.userName.charAt(0) }}
            </n-avatar>
            <div class="profile-info">
              <h2 class="profile-name">{{ userStore.userInfo?.name || userStore.userName }}</h2>
              <div class="profile-meta">
                <n-tag :class="userStore.isOwner ? 'role-owner' : 'role-caregiver'" size="large">
                  {{ userStore.isOwner ? '寄养人' : '照看人' }}
                </n-tag>
              </div>
              <p class="profile-username">@{{ userStore.userInfo?.username }}</p>
            </div>
          </div>
          <n-divider style="margin: 20px 0" />
          <n-descriptions :column="1" size="medium">
            <n-descriptions-item label="注册时间">
              {{ formatDateTime(userStore.userInfo?.created_at) }}
            </n-descriptions-item>
            <n-descriptions-item label="用户ID">
              #{{ userStore.userInfo?.id }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <n-card title="统计数据" class="card-shadow mt-16">
          <n-statistic label="我的订单" :value="orderCount" />
          <n-divider style="margin: 16px 0" />
          <n-statistic label="宠物数量" :value="petCount" v-if="userStore.isOwner" />
        </n-card>
      </n-col>

      <n-col :span="16">
        <n-card title="编辑资料" class="card-shadow">
          <n-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-placement="top"
            class="form-content"
          >
            <n-row :gutter="16">
              <n-col :span="12">
                <n-form-item label="姓名" path="name">
                  <n-input v-model:value="form.name" placeholder="请输入姓名" size="large" />
                </n-form-item>
              </n-col>
              <n-col :span="12">
                <n-form-item label="邮箱" path="email">
                  <n-input v-model:value="form.email" placeholder="请输入邮箱" size="large" />
                </n-form-item>
              </n-col>
            </n-row>
            <n-row :gutter="16">
              <n-col :span="12">
                <n-form-item label="手机号" path="phone">
                  <n-input v-model:value="form.phone" placeholder="请输入手机号" size="large" />
                </n-form-item>
              </n-col>
              <n-col :span="12">
                <n-form-item label="联系地址" path="address">
                  <n-input v-model:value="form.address" placeholder="请输入联系地址" size="large" />
                </n-form-item>
              </n-col>
            </n-row>
            <n-form-item label="个人简介" path="bio">
              <n-input
                v-model:value="form.bio"
                type="textarea"
                :rows="4"
                placeholder="请输入个人简介"
              />
            </n-form-item>

            <n-space justify="end" style="margin-top: 24px">
              <n-button size="large" @click="resetForm">重置</n-button>
              <n-button
                type="primary"
                size="large"
                :loading="saving"
                @click="handleSubmit"
              >
                保存修改
              </n-button>
            </n-space>
          </n-form>
        </n-card>

        <n-card title="安全设置" class="card-shadow mt-16">
          <n-list>
            <n-list-item>
              <template #prefix>
                <n-icon size="20" color="#1890ff"><Key /></n-icon>
              </template>
              修改密码
              <template #suffix>
                <n-button text type="primary">修改</n-button>
              </template>
            </n-list-item>
            <n-list-item>
              <template #prefix>
                <n-icon size="20" color="#52c41a"><ShieldCheckmark /></n-icon>
              </template>
              账号安全
              <template #suffix>
                <n-tag type="success">安全</n-tag>
              </template>
            </n-list-item>
            <n-list-item>
              <template #prefix>
                <n-icon size="20" color="#faad14"><Notifications /></n-icon>
              </template>
              消息通知
              <template #suffix>
                <n-switch v-model:value="notificationsEnabled" />
              </template>
            </n-list-item>
          </n-list>
        </n-card>
      </n-col>
    </n-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'
import { usePetStore } from '@/stores/pet'
import { Key, ShieldCheckmark, Notifications } from '@vicons/ionicons5'

const message = useMessage()
const userStore = useUserStore()
const orderStore = useOrderStore()
const petStore = usePetStore()

const formRef = ref(null)
const saving = ref(false)
const notificationsEnabled = ref(true)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  bio: ''
})

const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度为2-50个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const orderCount = computed(() => orderStore.orders.length)
const petCount = computed(() => petStore.pets.length)

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

function initForm() {
  const user = userStore.userInfo
  if (user) {
    form.name = user.name || ''
    form.email = user.email || ''
    form.phone = user.phone || ''
    form.address = user.address || ''
    form.bio = user.bio || ''
  }
}

function resetForm() {
  initForm()
  message.info('已重置')
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    saving.value = true
    await userStore.updateProfile(form)
    message.success('个人信息已更新')
  } catch (error) {
    if (error.errors) return
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  initForm()
  await Promise.all([
    orderStore.fetchOrders(),
    userStore.isOwner ? petStore.fetchPets() : null
  ])
})
</script>

<style scoped>
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.profile-info {
  margin-top: 16px;
}

.profile-name {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.profile-meta {
  margin-bottom: 4px;
}

.profile-username {
  margin: 8px 0 0 0;
  color: #999;
  font-size: 14px;
}

.form-content {
  max-width: 600px;
}

.mt-16 {
  margin-top: 16px;
}
</style>
