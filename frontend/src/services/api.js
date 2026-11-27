import axios from 'axios'

const authPaths = {
  session: 'auth/me',
  login: 'auth/login',
  register: 'auth/register',
  logout: 'auth/logout',
}

const http = axios.create({
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

export async function request(path, method = 'GET', data, responseType) {
  try {
    if (method !== 'GET' && !document.cookie.split('; ').some(cookie => cookie.startsWith('XSRF-TOKEN='))) {
      await http.get('/sanctum/csrf-cookie')
    }
    const response = await http.request({ url: '/api/v1/' + (authPaths[path] ?? path), method, data, responseType })
    if (responseType === 'blob') return response
    return response.data
  } catch (failure) {
    if (axios.isAxiosError(failure)) {
      if (failure.response?.status === 419) throw new Error('Votre session a expiré. Actualisez la page.')
      const body = failure.response?.data
      const message = typeof body?.error === 'string' ? body.error : body?.error?.message
      const error = new Error(message ?? body?.message ?? 'Le serveur StageLik est indisponible.')
      error.status = failure.response?.status
      if (failure.response?.status === 422) error.fields = body?.error?.fields ?? body?.errors
      throw error
    }
    throw failure
  }
}
