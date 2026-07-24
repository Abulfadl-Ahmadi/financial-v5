import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Authorization token to requests if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || getCookieToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function getCookieToken(): string {
  const match = document.cookie.match(/thisisjustarandomstring=([^;]+)/)
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1]))
    } catch {
      return match[1]
    }
  }
  return ''
}
