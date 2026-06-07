<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <n-icon size="48" style="color: #18a058">
          <Paw />
        </n-icon>
        <h1>注册账户</h1>
        <p class="subtitle">创建您的宠物寄养平台账户</p>
      </div>

      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        class="register-form"
      >
        <n-form-item label="用户角色" path="role">
          <n-radio-group v-model:value="form.role">
            <n-space>
              <n-radio value="owner">
                <div class="role-option">
                  <n-icon size="20" color="#1890ff"><Home /></n-icon>
                  <span>寄养人</span>
                  <span class="role-desc">需要寄养宠物</span>
                </div>
              </n-radio>
              <n-radio value="caregiver">
                <div class="role-option">
                  <n-icon size="20" color="#52c41a"><Heart /></n-icon>
                  <span>照看人</span>
                  <span class="role-desc">提供寄养服务</span>
                </div>
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="form.username"
            placeholder="请输入用户名（3-50个字符）"
            size="large"
            clearable
          >
            <template #prefix>
              <n-icon><Person /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="姓名" path="name">
          <n-input
            v-model:value="form.name"
            placeholder="请输入真实姓名"
            size="large"
            clearable
          />
        </n-form-item>

        <n-form-item label="邮箱" path="email">
          <n-input
            v-model:value="form.email"
            placeholder="请输入邮箱地址"
            size="large"
            clearable
          >
            <template #prefix>
              <n-icon><Mail /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="手机号" path="phone">
          <n-input
            v-model:value="form.phone"
            placeholder="请输入手机号"
            size="large"
            clearable
          >
            <template #prefix>
              <n-icon><Call /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            size="large"
            show-password-on="click"
          >
            <template #prefix>
              <n-icon><LockClosed /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="确认密码" path="confirmPassword">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
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
          @click="handleRegister"
        >
          注册
        </n-button>
      </n-form>

      <div class="register-footer">
        <span>已有账户？</span>
        <n-button text type="primary" @click="goLogin">
          立即登录
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { Paw, Person, LockClosed, Mail, Call, Home, Heart } from '@vicons/ionicons5'

const formRef = ref(null)
const loading = ref(false)
const message = useMessage()
const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'owner'
})

const validateConfirmPassword = (rule, value) => {
  if (value !== form.value.password) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

const rules = {
  role: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度为2-50个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度为6-50个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleRegister() {
  try {
    await formRef.value.validate()
    loading.value = true
    const { confirmPassword, ...registerData } = form.value
    await userStore.register(registerData)
    message.success('注册成功')
    router.push('/dashboard')
  } catch (error) {
    if (error.errors) {
      return
    }
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.subtitle {
  color: #999;
  font-size: 14px;
}

.register-form {
  margin-bottom: 24px;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  transition: all 0.2s;
}

.role-option:hover {
  border-color: #18a058;
}

.role-desc {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.register-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}
</style>
