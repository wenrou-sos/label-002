import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

function showError(msg) {
  if (window.$message) {
    window.$message.error(msg)
  } else {
    console.error(msg)
  }
}

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200 && res.code !== 201) {
      showError(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        showError('登录已过期，请重新登录')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (status === 403) {
        showError('权限不足')
      } else if (status === 404) {
        showError('资源不存在')
      } else if (status >= 500) {
        showError('服务器错误')
      } else {
        showError(error.response.data?.message || '请求失败')
      }
    } else {
      showError('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
