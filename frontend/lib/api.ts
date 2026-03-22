// API configuration and utility functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

// Get refresh token from localStorage
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

// API request helper
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.error || data.detail || 'An error occurred',
      }
    }

    return { data }
  } catch (error) {
    console.error('API request error:', error)
    return {
      error: 'Network error. Please check your connection.',
    }
  }
}

// Auth API functions
export const authApi = {
  signup: async (userData: {
    email: string
    password: string
    password_confirm: string
    name: string
    business_type: 'hospital' | 'pharmacy'
  }) => {
    return apiRequest<{
      user: {
        id: string
        email: string
        name: string
        business_type: string
      }
      tokens: {
        access: string
        refresh: string
      }
      website_setup_id: string
    }>('/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  login: async (email: string, password: string) => {
    return apiRequest<{
      user: {
        id: string
        email: string
        name: string
        business_type: string
      }
      tokens: {
        access: string
        refresh: string
      }
    }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  getCurrentUser: async () => {
    return apiRequest<{
      id: string
      email: string
      name: string
      business_type: string
    }>('/auth/me/')
  },
}

// Website Setup API functions
export const websiteSetupApi = {
  get: async () => {
    return apiRequest('/website-setups/')
  },

  update: async (data: any) => {
    return apiRequest('/website-setups/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// Business Info API functions
export const businessInfoApi = {
  get: async () => {
    return apiRequest('/business-info/')
  },

  create: async (data: any) => {
    return apiRequest('/business-info/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (data: any) => {
    return apiRequest('/business-info/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  publish: async () => {
    return apiRequest('/business-info/publish/', {
      method: 'POST',
    })
  },
}

// Website Setup API functions (template selection, paid status, features)
export const websiteSetupApiV2 = {
  get: async () => {
    return apiRequest('/website-setups/')
  },

  update: async (data: {
    template_id?: number | null
    is_paid?: boolean
    total_price?: number
    review_system?: boolean
    ai_chatbot?: boolean
    ambulance_ordering?: boolean
    patient_portal?: boolean
    prescription_refill?: boolean
  }) => {
    return apiRequest('/website-setups/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

