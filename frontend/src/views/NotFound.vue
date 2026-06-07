<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-icon">
        <n-icon size="120" color="#18a058">
          <Paw />
        </n-icon>
      </div>
      <h1 class="not-found-code">404</h1>
      <p class="not-found-title">页面走丢了</p>
      <p class="not-found-desc">抱歉，您访问的页面不存在或已被移除</p>
      <n-space>
        <n-button type="primary" size="large" @click="goHome">
          <template #icon>
            <n-icon><Home /></n-icon>
          </template>
          返回首页
        </n-button>
        <n-button size="large" @click="goBack">
          <template #icon>
            <n-icon><ArrowBack /></n-icon>
          </template>
          返回上一页
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Paw, Home, ArrowBack } from '@vicons/ionicons5'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}

function goBack() {
  router.go(-1)
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.not-found-content {
  text-align: center;
  padding: 40px;
}

.not-found-icon {
  margin-bottom: 24px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.not-found-code {
  font-size: 120px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #18a058 0%, #36ad6a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.not-found-title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 8px;
}

.not-found-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}
</style>
