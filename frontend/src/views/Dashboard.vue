<template>
  <div class="page-container">
    <n-page-header title="首页" subtitle="欢迎使用宠物寄养平台">
      <template #extra>
        <n-tag :class="userStore.isOwner ? 'role-owner' : 'role-caregiver'" size="large">
          {{ userStore.isOwner ? '寄养人' : '照看人' }}
        </n-tag>
      </template>
    </n-page-header>

    <n-grid :cols="3" :x-gap="24" class="mt-16">
      <n-grid-item v-for="stat in stats" :key="stat.label">
        <n-card class="stat-card hover-scale">
          <div class="stat-content">
            <div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
            <n-icon :size="48" :color="stat.color">
              <component :is="stat.icon" />
            </n-icon>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-row :gutter="24" class="mt-16">
      <n-col :span="16">
        <n-card title="最近订单" class="card-shadow">
          <template #header-extra>
            <n-button text type="primary" @click="goToOrders">
              查看全部
            </n-button>
          </template>
          <n-spin :show="orderStore.loading">
            <n-empty v-if="recentOrders.length === 0" description="暂无订单" />
            <n-list v-else hoverable clickable>
              <n-list-item
                v-for="order in recentOrders"
                :key="order.id"
                @click="goToOrderDetail(order.id)"
              >
                <template #prefix>
                  <n-avatar :size="48" round>
                    {{ order.pet_name?.charAt(0) || '?' }}
                  </n-avatar>
                </template>
                <template #default>
                  <div class="order-item">
                    <div class="order-title">{{ order.title }}</div>
                    <div class="order-meta">
                      <span class="status-tag" :class="`status-${order.status}`">
                        {{ getStatusText(order.status) }}
                      </span>
                      <span class="text-muted ml-8">
                        {{ order.start_date }} ~ {{ order.end_date }}
                      </span>
                    </div>
                  </div>
                </template>
                <template #suffix>
                  <n-tag v-if="order.price" type="success">¥{{ order.price }}</n-tag>
                </template>
              </n-list-item>
            </n-list>
          </n-spin>
        </n-card>
      </n-col>

      <n-col :span="8">
        <n-card title="快捷操作" class="card-shadow">
          <n-space vertical style="width: 100%">
            <n-button
              v-if="userStore.isOwner"
              block size="large" type="primary"
              @click="goToCreateOrder"
            >
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              创建寄养订单
            </n-button>
            <n-button
              v-if="userStore.isOwner"
              block size="large"
              @click="goToPets"
            >
              <template #icon>
                <n-icon><Paw /></n-icon>
              </template>
              管理宠物档案
            </n-button>
            <n-button
              v-if="userStore.isCaregiver"
              block size="large" type="primary"
              @click="goToMarket"
            >
              <template #icon>
                <n-icon><Search /></n-icon>
              </template>
              浏览可接订单
            </n-button>
            <n-button
              block size="large"
              @click="goToOrders"
            >
              <template #icon>
                <n-icon><List /></n-icon>
              </template>
              查看我的订单
            </n-button>
          </n-space>
        </n-card>

        <n-card title="平台公告" class="card-shadow mt-16">
          <n-timeline>
            <n-timeline-item
              v-for="(notice, index) in notices"
              :key="index"
              :title="notice.title"
              :time="notice.time"
              :type="notice.type"
            >
              {{ notice.content }}
            </n-timeline-item>
          </n-timeline>
        </n-card>
      </n-col>
    </n-row>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'
import { usePetStore } from '@/stores/pet'
import { Paw, Home, Search, List, Add, Calendar, People, Heart } from '@vicons/ionicons5'

const router = useRouter()
const userStore = useUserStore()
const orderStore = useOrderStore()
const petStore = usePetStore()

const recentOrders = computed(() => orderStore.orders.slice(0, 5))

const stats = computed(() => {
  if (userStore.isOwner) {
    return [
      { label: '宠物数量', value: petStore.pets.length, icon: Paw, color: '#18a058' },
      { label: '我的订单', value: orderStore.orders.length, icon: List, color: '#1890ff' },
      { label: '进行中', value: orderStore.orders.filter(o => o.status === 'in_progress').length, icon: Calendar, color: '#faad14' }
    ]
  } else {
    return [
      { label: '可接订单', value: orderStore.pendingOrders.length, icon: Search, color: '#18a058' },
      { label: '已接订单', value: orderStore.orders.filter(o => o.caregiver_id === userStore.userInfo?.id).length, icon: List, color: '#1890ff' },
      { label: '进行中', value: orderStore.orders.filter(o => o.status === 'in_progress').length, icon: Calendar, color: '#faad14' }
    ]
  }
})

const notices = [
  { title: '欢迎使用宠物寄养平台', time: '2026-06-01', type: 'success', content: '平台正式上线，欢迎体验！' },
  { title: '安全提醒', time: '2026-05-28', type: 'warning', content: '请在交易前确认对方身份信息。' },
  { title: '新功能上线', time: '2026-05-20', type: 'info', content: '支持在线支付功能啦！' }
]

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

function goToOrders() {
  router.push({ name: 'Orders' })
}

function goToOrderDetail(id) {
  router.push({ name: 'OrderDetail', params: { id } })
}

function goToCreateOrder() {
  router.push({ name: 'CreateOrder' })
}

function goToPets() {
  router.push({ name: 'Pets' })
}

function goToMarket() {
  router.push({ name: 'Market' })
}

onMounted(async () => {
  await Promise.all([
    orderStore.fetchOrders(),
    petStore.fetchPets(),
    userStore.isCaregiver ? orderStore.fetchPendingOrders() : null
  ])
})
</script>

<style scoped>
.stat-card {
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  border-radius: 12px;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.order-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.order-meta {
  display: flex;
  align-items: center;
  font-size: 13px;
}
</style>
