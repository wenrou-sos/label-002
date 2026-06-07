<template>
  <div class="page-container">
    <n-page-header title="我的订单" subtitle="查看和管理您的订单">
      <template #extra>
        <n-button v-if="userStore.isOwner" type="primary" @click="goToCreateOrder">
          <template #icon>
            <n-icon><Add /></n-icon>
          </template>
          创建订单
        </n-button>
      </template>
    </n-page-header>

    <n-card class="card-shadow mt-16">
      <n-space class="mb-16">
        <n-radio-group v-model:value="filterStatus" size="medium">
          <n-radio-button value="">全部</n-radio-button>
          <n-radio-button value="pending">待接单</n-radio-button>
          <n-radio-button value="accepted">已接单</n-radio-button>
          <n-radio-button value="in_progress">进行中</n-radio-button>
          <n-radio-button value="completed">已完成</n-radio-button>
          <n-radio-button value="cancelled">已取消</n-radio-button>
        </n-radio-group>
        <n-button @click="refreshOrders">
          <template #icon>
            <n-icon><Refresh /></n-icon>
          </template>
          刷新
        </n-button>
      </n-space>

      <n-spin :show="orderStore.loading">
        <n-empty v-if="filteredOrders.length === 0" description="暂无订单" />
        <n-data-table
          v-else
          :columns="columns"
          :data="filteredOrders"
          :pagination="{ pageSize: 10 }"
          @update:checked-row-keys="onCheckedRow"
        >
          <template #status="{ row }">
            <span class="status-tag" :class="`status-${row.status}`">
              {{ getStatusText(row.status) }}
            </span>
          </template>
          <template #pet="{ row }">
            <div class="pet-cell">
              <n-avatar size="small" round>
                {{ row.pet_name?.charAt(0) || '?' }}
              </n-avatar>
              <span style="margin-left: 8px">{{ row.pet_name || '-' }}</span>
            </div>
          </template>
          <template #price="{ row }">
            <span v-if="row.price" style="color: #18a058; font-weight: 500">
              ¥{{ row.price }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
          <template #date="{ row }">
            <div class="date-cell">
              <div>{{ row.start_date }}</div>
              <div class="text-muted" style="font-size: 12px">至 {{ row.end_date }}</div>
            </div>
          </template>
          <template #actions="{ row }">
            <n-space>
              <n-button size="small" @click="goToDetail(row.id)">
                查看
              </n-button>
              <n-button
                v-if="canAccept(row)"
                size="small"
                type="primary"
                @click="acceptOrder(row.id)"
              >
                接单
              </n-button>
              <n-button
                v-if="canStart(row)"
                size="small"
                type="primary"
                @click="startOrder(row.id)"
              >
                开始服务
              </n-button>
              <n-button
                v-if="canComplete(row)"
                size="small"
                type="success"
                @click="completeOrder(row.id)"
              >
                完成
              </n-button>
              <n-button
                v-if="canCancel(row)"
                size="small"
                type="error"
                @click="cancelOrder(row.id)"
              >
                取消
              </n-button>
            </n-space>
          </template>
        </n-data-table>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'
import { Add, Refresh } from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()
const orderStore = useOrderStore()

const filterStatus = ref('')

const filteredOrders = computed(() => {
  if (!filterStatus.value) {
    return orderStore.orders
  }
  return orderStore.orders.filter(o => o.status === filterStatus.value)
})

const columns = [
  {
    title: '订单标题',
    key: 'title',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '宠物',
    key: 'pet',
    width: 120
  },
  {
    title: '状态',
    key: 'status',
    width: 100
  },
  {
    title: '寄养时间段',
    key: 'date',
    width: 180
  },
  {
    title: userStore.isOwner ? '照看人' : '寄养人',
    key: 'counterpart',
    width: 120,
    render: (row) => {
      return userStore.isOwner ? (row.caregiver_name || '-') : (row.owner_name || '-')
    }
  },
  {
    title: '费用',
    key: 'price',
    width: 100
  },
  {
    title: '操作',
    key: 'actions',
    width: 280
  }
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

function canAccept(row) {
  return userStore.isCaregiver && row.status === 'pending' && row.owner_id !== userStore.userInfo?.id
}

function canStart(row) {
  return userStore.isCaregiver && row.status === 'accepted' && row.caregiver_id === userStore.userInfo?.id
}

function canComplete(row) {
  return userStore.isOwner && row.status === 'in_progress' && row.owner_id === userStore.userInfo?.id
}

function canCancel(row) {
  if (row.status === 'completed') return false
  if (row.status === 'in_progress' && userStore.isCaregiver) return false
  if (userStore.isOwner && row.owner_id === userStore.userInfo?.id) {
    return row.status === 'pending' || row.status === 'accepted'
  }
  if (userStore.isCaregiver && row.caregiver_id === userStore.userInfo?.id) {
    return row.status === 'accepted'
  }
  return false
}

async function refreshOrders() {
  await orderStore.fetchOrders(filterStatus.value || undefined)
}

async function acceptOrder(id) {
  dialog.warning({
    title: '确认接单',
    content: '确定要接这个订单吗？接单后请及时联系寄养人确认详情。',
    positiveText: '确认接单',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await orderStore.acceptOrder(id)
        message.success('接单成功')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

async function startOrder(id) {
  dialog.warning({
    title: '确认开始服务',
    content: '确定要开始服务吗？开始后订单状态将变为进行中。',
    positiveText: '开始',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await orderStore.updateOrderStatus(id, 'in_progress')
        message.success('服务已开始')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

async function completeOrder(id) {
  dialog.warning({
    title: '确认完成订单',
    content: '确定要将订单标记为已完成吗？',
    positiveText: '确认完成',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await orderStore.updateOrderStatus(id, 'completed')
        message.success('订单已完成')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

async function cancelOrder(id) {
  dialog.warning({
    title: '确认取消订单',
    content: '确定要取消这个订单吗？取消后无法恢复。',
    positiveText: '取消订单',
    negativeText: '保留订单',
    type: 'error',
    onPositiveClick: async () => {
      try {
        await orderStore.updateOrderStatus(id, 'cancelled')
        message.success('订单已取消')
      } catch (error) {
        // error handled by interceptor
      }
    }
  })
}

function goToDetail(id) {
  router.push({ name: 'OrderDetail', params: { id } })
}

function goToCreateOrder() {
  router.push({ name: 'CreateOrder' })
}

function onCheckedRow(keys) {
  console.log('checked rows:', keys)
}

onMounted(async () => {
  await orderStore.fetchOrders()
})
</script>

<style scoped>
.pet-cell {
  display: flex;
  align-items: center;
}

.date-cell {
  line-height: 1.5;
}
</style>
