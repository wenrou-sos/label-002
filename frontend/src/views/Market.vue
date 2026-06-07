<template>
  <div class="page-container">
    <n-page-header title="订单大厅" subtitle="浏览并接受待接单的寄养订单">
      <template #extra>
        <n-button @click="refreshOrders">
          <template #icon>
            <n-icon><Refresh /></n-icon>
          </template>
          刷新
        </n-button>
      </template>
    </n-page-header>

    <n-spin :show="loading" class="mt-16">
      <n-empty v-if="pendingOrders.length === 0" description="暂无待接单的订单" />
      <n-grid :cols="2" :x-gap="24" :y-gap="24" v-else class="mt-16">
        <n-grid-item v-for="order in pendingOrders" :key="order.id">
          <n-card class="order-card hover-scale" :bordered="false">
            <div class="order-header">
              <div class="order-header-left">
                <n-avatar :size="56" round>
                  {{ order.pet_name?.charAt(0) || '?' }}
                </n-avatar>
                <div class="order-title-info">
                  <h3 class="order-title">{{ order.title }}</h3>
                  <div class="order-meta">
                    <n-tag type="info" size="small">{{ order.pet_species || '-' }}</n-tag>
                    <n-tag v-if="order.pet_breed" size="small" style="margin-left: 4px">
                      {{ order.pet_breed }}
                    </n-tag>
                    <span class="text-muted ml-8">{{ order.pet_age ? order.pet_age + '岁' : '' }}</span>
                  </div>
                </div>
              </div>
              <div class="order-price" v-if="order.price">
                <div class="price-label">预算</div>
                <div class="price-value">¥{{ order.price }}</div>
              </div>
            </div>

            <n-descriptions :column="2" size="small" class="mt-16">
              <n-descriptions-item label="寄养时间">
                {{ order.start_date }} ~ {{ order.end_date }}
              </n-descriptions-item>
              <n-descriptions-item label="寄养人">
                {{ order.owner_name || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="联系电话">
                {{ order.owner_phone || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="所在地区">
                {{ order.owner_address || '-' }}
              </n-descriptions-item>
            </n-descriptions>

            <n-divider style="margin: 16px 0" />

            <div class="order-description">
              <h4>订单描述</h4>
              <p>{{ order.description || '暂无描述' }}</p>
            </div>

            <div class="order-special" v-if="order.special_needs">
              <h4>特殊需求</h4>
              <p>{{ order.special_needs }}</p>
            </div>

            <div class="order-actions">
              <n-space>
                <n-button @click="viewDetail(order.id)">
                  <template #icon>
                    <n-icon><Eye /></n-icon>
                  </template>
                  查看详情
                </n-button>
                <n-button
                  type="primary"
                  size="large"
                  :loading="acceptingId === order.id"
                  @click="acceptOrder(order.id)"
                >
                  <template #icon>
                    <n-icon><CheckmarkCircle /></n-icon>
                  </template>
                  立即接单
                </n-button>
              </n-space>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useOrderStore } from '@/stores/order'
import { Refresh, Eye, CheckmarkCircle } from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const orderStore = useOrderStore()

const loading = ref(false)
const acceptingId = ref(null)

const pendingOrders = orderStore.pendingOrders

async function refreshOrders() {
  loading.value = true
  try {
    await orderStore.fetchPendingOrders()
  } finally {
    loading.value = false
  }
}

function viewDetail(id) {
  router.push({ name: 'OrderDetail', params: { id } })
}

async function acceptOrder(id) {
  dialog.warning({
    title: '确认接单',
    content: '确定要接这个订单吗？接单后请及时联系寄养人确认详情。',
    positiveText: '确认接单',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        acceptingId.value = id
        await orderStore.acceptOrder(id)
        message.success('接单成功')
        await refreshOrders()
      } catch (error) {
        // error handled by interceptor
      } finally {
        acceptingId.value = null
      }
    }
  })
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      orderStore.fetchOrders(),
      orderStore.fetchPendingOrders()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.order-card {
  border-radius: 12px;
  background: #fff;
  transition: all 0.3s ease;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.order-title-info {
  flex: 1;
}

.order-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.order-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.order-price {
  text-align: right;
}

.price-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.price-value {
  font-size: 24px;
  font-weight: 700;
  color: #18a058;
}

.order-description h4,
.order-special h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.order-description p,
.order-special p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.order-special {
  margin-top: 16px;
  padding: 12px;
  background: #fffbe6;
  border-radius: 8px;
  border-left: 4px solid #faad14;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}
</style>
