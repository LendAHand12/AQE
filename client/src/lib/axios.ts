import axios from "axios"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    const lang = localStorage.getItem("i18nextLng") || "vi"
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['Accept-Language'] = lang
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // On 401 (e.g. account locked, deleted, or session expired), force an immediate logout
    // so an already-logged-in session is kicked out right away, not just blocked at next login.
    // Admin pages/tokens are handled separately and are left untouched here.
    if (error.response?.status === 401) {
      const isAdminPath = window.location.pathname.startsWith('/admin')
      if (!isAdminPath) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
