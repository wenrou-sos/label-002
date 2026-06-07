<template>
  <n-layout style="min-height: 100vh">
    <n-layout-header style="background: #fff; border-bottom: 1px solid #f0f0f0">
      <div class="header-content">
        <div class="logo" @click="goHome">
          <n-icon size="24" style="margin-right: 8px; color: #18a058">
            <Paw />
          </n-icon>
          <span class="logo-text">宠物寄养平台</span>
        </div>
        <n-menu
          mode="horizontal"
          :options="menuOptions"
          :value="activeMenu"
          @update:value="handleMenuClick"
          class="main-menu"
        />
        <div class="user-area">
          <n-dropdown :options="userOptions" @select="handleUserSelect">
            <div class="user-info cursor-pointer">
              <n-avatar round size="small">
                {{ userStore.userName.charAt(0) }}
              </n-avatar>
              <span class="username">{{ userStore.userName }}</span>
              <n-tag :class="userStore.isOwner ? 'role-owner' : 'role-caregiver'" size="small" style="margin-left: 8px">
                {{ userStore.isOwner ? '寄养人' : '照看人' }}
              </n-tag>
            </div>
          </n-dropdown>
        </div>
      </div>
    </n-layout-header>
    <n-layout-content>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </n-layout-content>
  </n-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Paw } from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.name)

const menuOptions = computed(() => {
  const options = [
    {
      label: '首页',
      key: 'Dashboard'
    },
    {
      label: '我的订单',
      key: 'Orders'
    }
  ]

  if (userStore.isOwner) {
    options.splice(1, 0, {
      label: '宠物档案',
      key: 'Pets'
    })
    options.push({
      label: '创建订单',
      key: 'CreateOrder'
    })
  }

  if (userStore.isCaregiver) {
    options.push({
      label: '订单大厅',
      key: 'Market'
    })
  }

  return options
})

const userOptions = [
  {
    label: '个人中心',
    key: 'profile'
  },
  {
    label: '退出登录',
    key: 'logout'
  }
]

function handleMenuClick(key) {
  router.push({ name: key })
}

function handleUserSelect(key) {
  if (key === 'profile') {
    router.push({ name: 'Profile' })
  } else if (key === 'logout') {
    userStore.logout()
    router.push({ name: 'Login' })
  }
}

function goHome() {
  router.push({ name: 'Dashboard' })
}
</script>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 700;
  font-size: 20px;
  color: #333;
}

.logo-text {
  background: linear-gradient(135deg, #18a058 0%, #36ad6a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-menu {
  flex: 1;
  justify-content: center;
  border-bottom: none;
}

.user-area {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 24px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
