<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <n-icon size="48" style="color: #18a058">
          <Paw />
        </n-icon>
        <h1>宠物寄养平台</h1>
        <p class="subtitle">欢迎回来，请登录您的账户</p>
      </div>

      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        class="login-form"
      >
        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="form.username"
            placeholder="请输入用户名"
            size="large"
            clearable
          >
            <template #prefix>
              <n-icon><Person /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password-on="click"
          >
            <template #prefix>
              <n-icon><LockClosed /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-button
          type="primary"
          size="large"
          block
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </n-button>
      </n-form>

      <div class="login-footer">
        <span>还没有账户？</span>
        <n-button text type="primary" @click="goRegister">
          立即注册
        </n-button>
      </div>

      <n-divider>测试账号</n-divider>
      <div class="test-accounts">
        <div class="account-item">
          <strong>寄养人：</strong> owner1 / 123456
        </div>
        <div class="account-item">
          <strong>照看人：</strong> caregiver1 / 123456
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { Paw, Person, LockClosed } from '@vicons/ionicons5'

const formRef = ref(null)
const loading = ref(false)
const message = useMessage()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

async function handleLogin() {
  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.login(form.value.username, form.value.password)
    message.success('登录成功')
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (error) {
    if (error.errors) {
      return
    }
  } finally {
    loading.value = false
  }
}

function goRegister() {
  router.push({ name: 'Register' })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.subtitle {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.login-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.test-accounts {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  color: #666;
}

.account-item {
  margin-bottom: 8px;
}

.account-item:last-child {
  margin-bottom: 0;
}

.account-item strong {
  color: #333;
}
</style>
