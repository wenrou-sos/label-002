<template>
  <div class="page-container">
    <n-spin :show="loading">
      <template v-if="order">
        <n-page-header :title="order.title" :subtitle="`订单号: #${order.id}`">
          <template #extra>
            <n-space>
              <span class="status-tag" :class="`status-${order.status}`" style="font-size: 14px">
                {{ getStatusText(order.status) }}
              </span>
              <n-button @click="goBack">
                <template #icon>
                  <n-icon><ArrowBack /></n-icon>
                </template>
                返回
              </n-button>
            </n-space>
          </template>
        </n-page-header>

        <n-row :gutter="24" class="mt-16">
          <n-col :span="16">
            <n-card title="订单详情" class="card-shadow">
              <n-descriptions :column="2" size="medium" bordered>
                <n-descriptions-item label="订单标题">
                  {{ order.title }}
                </n-descriptions-item>
                <n-descriptions-item label="订单状态">
                  <span class="status-tag" :class="`status-${order.status}`">
                    {{ getStatusText(order.status) }}
                  </span>
                </n-descriptions-item>
                <n-descriptions-item label="开始日期">
                  {{ order.start_date }}
                </n-descriptions-item>
                <n-descriptions-item label="结束日期">
                  {{ order.end_date }}
                </n-descriptions-item>
                <n-descriptions-item label="费用">
                  <span v-if="order.price" style="color: #18a058; font-weight: 500; font-size: 16px">
                    ¥{{ order.price }}
                  </span>
                  <span v-else class="text-muted">待定</span>
                </n-descriptions-item>
                <n-descriptions-item label="创建时间">
                  {{ formatDateTime(order.created_at) }}
                </n-descriptions-item>
              </n-descriptions>

              <n-divider title="详细描述" />
              <p class="detail-text">{{ order.description || '暂无描述' }}</p>

              <n-divider title="特殊需求" />
              <p class="detail-text">{{ order.special_needs || '暂无特殊需求' }}</p>

              <div class="action-buttons">
                <n-space>
                  <n-button
                    v-if="canAccept"
                    type="primary"
                    size="large"
                    @click="acceptOrder"
                  >
                    <template #icon>
                      <n-icon><CheckmarkCircle /></n-icon>
                    </template>
                    接单
                  </n-button>
                  <n-button
                    v-if="canStart"
                    type="primary"
                    size="large"
                    @click="startOrder"
                  >
                    <template #icon>
                      <n-icon><Play /></n-icon>
                    </template>
                    开始服务
                  </n-button>
                  <n-button
                    v-if="canComplete"
                    type="success"
                    size="large"
                    @click="completeOrder"
                  >
                    <template #icon>
                      <n-icon><CheckmarkDone /></n-icon>
                    </template>
                    完成订单
                  </n-button>
                  <n-button
                    v-if="canCancel"
                    type="error"
                    size="large"
                    @click="cancelOrder"
                  >
                    <template #icon>
                      <n-icon><CloseCircle /></n-icon>
                    </template>
                    取消订单
                  </n-button>
                </n-space>
              </div>
            </n-card>
          </n-col>

          <n-col :span="8">
            <n-card title="宠物信息" class="card-shadow mb-16">
              <div class="pet-info-header">
                <n-avatar :size="64" round>
                  {{ order.pet_name?.charAt(0) || '?' }}
                </n-avatar>
                <div class="pet-info-content">
                  <h3>{{ order.pet_name || '-' }}</h3>
                  <div class="pet-tags">
                    <n-tag size="small" type="info">{{ order.pet_species || '-' }}</n-tag>
                    <n-tag v-if="order.pet_breed" size="small" style="margin-left: 4px">
                      {{ order.pet_breed }}
                    </n-tag>
                  </div>
                </div>
              </div>
              <n-divider style="margin: 16px 0" />
              <n-descriptions :column="1" size="small">
                <n-descriptions-item label="年龄">
                  {{ order.pet_age !== null && order.pet_age !== undefined ? order.pet_age + '岁' : '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="性别">
                  {{ getGenderText(order.pet_gender) }}
                </n-descriptions-item>
                <n-descriptions-item label="体重">
                  {{ order.pet_weight ? order.pet_weight + 'kg' : '-' }}
                </n-descriptions-item>
              </n-descriptions>
              <n-divider style="margin: 16px 0" />
              <h4>宠物描述</h4>
              <p class="detail-text">{{ order.pet_description || '暂无描述' }}</p>
              <h4>健康信息</h4>
              <p class="detail-text">{{ order.pet_health_info || '暂无健康信息' }}</p>
            </n-card>

            <n-card title="寄养人信息" class="card-shadow mb-16">
              <div class="user-info-row">
                <n-avatar size="small" round>
                  {{ order.owner_name?.charAt(0) || '?' }}
                </n-avatar>
                <div class="user-info-text">
                  <div class="user-name">{{ order.owner_name || '-' }}</div>
                  <div class="user-role role-tag role-owner">寄养人</div>
                </div>
              </div>
              <n-divider style="margin: 12px 0" />
              <n-descriptions :column="1" size="small">
                <n-descriptions-item label="电话">
                  {{ order.owner_phone || '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="邮箱">
                  {{ order.owner_email || '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="地址">
                  {{ order.owner_address || '-' }}
                </n-descriptions-item>
              </n-descriptions>
            </n-card>

            <n-card v-if="order.caregiver_name" title="照看人信息" class="card-shadow">
              <div class="user-info-row">
                <n-avatar size="small" round>
                  {{ order.caregiver_name?.charAt(0) || '?' }}
                </n-avatar>
                <div class="user-info-text">
                  <div class="user-name">{{ order.caregiver_name || '-' }}</div>
                  <div class="user-role role-tag role-caregiver">照看人</div>
                </div>
              </div>
              <n-divider style="margin: 12px 0" />
              <n-descriptions :column="1" size="small">
                <n-descriptions-item label="电话">
                  {{ order.caregiver_phone || '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="邮箱">
                  {{ order.caregiver_email || '-' }}
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-col>
        </n-row>
      </template>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'
import { ArrowBack, CheckmarkCircle, CloseCircle, Play, CheckmarkDone } from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()
const orderStore = useOrderStore()

const loading = ref(false)
const order = ref(null)

const canAccept = computed(() => {
  return userStore.isCaregiver && order.value?.status === 'pending' && order.value?.owner_id !== userStore.userInfo?.id
})

const canStart = computed(() => {
  return userStore.isCaregiver && order.value?.status === 'accepted' && order.value?.caregiver_id === userStore.userInfo?.id
})

const canComplete = computed(() => {
  return userStore.isOwner && order.value?.status === 'in_progress' && order.value?.owner_id === userStore.userInfo?.id
})

const canCancel = computed(() => {
  if (!order.value) return false
  if (order.value.status === 'completed') return false
  if (order.value.status === 'in_progress' && userStore.isCaregiver) return false
  if (userStore.isOwner && order.value.owner_id === userStore.userInfo?.id) {
    return order.value.status === 'pending' || order.value.status === 'accepted'
  }
  if (userStore.isCaregiver && order.value.caregiver_id === userStore.userInfo?.id) {
    return order.value.status === 'accepted'
  }
  return false
})

function getStatusText(status) {
  const map = {
    pending: '待接单',
    accepted: '已接单',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function getGenderText(gender) {
  const map = { male: '公', female: '母', unknown: '未知' }
  return map[gender] || '-'
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function fetchOrder() {
  loading.value = true
  try {
    const res = await orderStore.fetchOrder(route.params.id)
    order.value = res.data
  } finally {
    loading.value = false
  }
}

async function acceptOrder() {
  dialog.warning({
    title: '确认接单',
    content: '确定要接这个订单吗？接单后请及时联系寄养人确认详情。',
    positiveText: '确认接单',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await orderStore.acceptOrder(order.value.id)
        order.value = res.data
        message.success('接单成功')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

async function startOrder() {
  dialog.warning({
    title: '确认开始服务',
    content: '确定要开始服务吗？开始后订单状态将变为进行中。',
    positiveText: '开始',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await orderStore.updateOrderStatus(order.value.id, 'in_progress')
        order.value = res.data
        message.success('服务已开始')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

async function completeOrder() {
  dialog.warning({
    title: '确认完成订单',
    content: '确定要将订单标记为已完成吗？',
    positiveText: '确认完成',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await orderStore.updateOrderStatus(order.value.id, 'completed')
        order.value = res.data
        message.success('订单已完成')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

async function cancelOrder() {
  dialog.warning({
    title: '确认取消订单',
    content: '确定要取消这个订单吗？取消后无法恢复。',
    positiveText: '取消订单',
    negativeText: '保留订单',
    type: 'error',
    onPositiveClick: async () => {
      try {
        const res = await orderStore.updateOrderStatus(order.value.id, 'cancelled')
        order.value = res.data
        message.success('订单已取消')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

function goBack() {
  router.push({ name: 'Orders' })
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.detail-text {
  color: #666;
  line-height: 1.6;
  margin: 8px 0;
}

.pet-info-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pet-info-content h3 {
  margin: 0 0 4px 0;
}

.pet-tags {
  display: flex;
  align-items: center;
}

.user-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 500;
  font-size: 16px;
}

.user-role {
  display: inline-block;
  width: fit-content;
}

.action-buttons {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
