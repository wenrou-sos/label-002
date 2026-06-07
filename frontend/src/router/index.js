import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false, title: '注册' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'pets',
        name: 'Pets',
        component: () => import('@/views/Pets.vue'),
        meta: { title: '宠物档案', roles: ['owner'] }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '我的订单' }
      },
      {
        path: 'orders/create',
        name: 'CreateOrder',
        component: () => import('@/views/CreateOrder.vue'),
        meta: { title: '创建寄养订单', roles: ['owner'] }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'market',
        name: 'Market',
        component: () => import('@/views/Market.vue'),
        meta: { title: '订单大厅', roles: ['caregiver'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '宠物寄养平台'} - 宠物寄养预约平台`

  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && userStore.isLoggedIn) {
    const hasRole = to.meta.roles.includes(userStore.userRole)
    if (!hasRole) {
      next({ name: 'Dashboard' })
      return
    }
  }

  if ((to.name === 'Login' || to.name === 'Register') && userStore.isLoggedIn) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router
