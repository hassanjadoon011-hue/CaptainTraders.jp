import api from './axiosClient'

let cache = null
let pending = null

// Public: used by the calculator and the home page
export function getShippingSettings() {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = api
      .get('/shipping')
      .then(({ data }) => {
        cache = data
        return data
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

// Admin: save and refresh the cache
export async function saveShippingSettings(payload) {
  const { data } = await api.put('/shipping', payload)
  cache = data
  return data
}

// Public: server-side price estimate (the same numbers saved on the order)
export async function getQuote(payload) {
  const { data } = await api.post('/shipping/quote', payload)
  return data.data
}

/* Import duties & taxes (admin) */
export const getImportRules = async () => (await api.get('/import-rules')).data.data
export const createImportRule = async (data) => (await api.post('/import-rules', data)).data.data
export const updateImportRule = async (id, data) => (await api.put(`/import-rules/${id}`, data)).data.data
export const deleteImportRule = async (id) => (await api.delete(`/import-rules/${id}`)).data
