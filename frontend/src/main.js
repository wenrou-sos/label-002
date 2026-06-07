import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive, { createDiscreteApi } from 'naive-ui'
import App from './App.vue'
import router from './router'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'
import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

const { message } = createDiscreteApi(['message'])
window.$message = message

app.mount('#app')
