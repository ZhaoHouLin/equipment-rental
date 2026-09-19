// 管理端資料與操作
export const useAdminStore = defineStore('admin', () => {
  const rentals = ref([])
  const audit = ref([])
  const items = ref([])

  const loadRentals = async () => (rentals.value = await $fetch('/api/rentals'))
  const loadAudit = async () => (audit.value = await $fetch('/api/admin/audit'))
  const loadItems = async () => (items.value = await $fetch('/api/items'))
  const loadAll = () => Promise.all([loadRentals(), loadAudit(), loadItems()])

  const returnRental = async (id) => {
    await $fetch(`/api/rentals/${id}/return`, { method: 'PUT' })
    await loadAll()
  }
  const addItem = async (item) => {
    await $fetch('/api/admin/items', { method: 'POST', body: item })
    await Promise.all([loadItems(), loadAudit()])
  }
  const updateItem = async (id, item) => {
    await $fetch(`/api/admin/items/${id}`, { method: 'PUT', body: item })
    await Promise.all([loadItems(), loadAudit()])
  }
  const disableItem = async (id) => {
    await $fetch(`/api/admin/items/${id}`, { method: 'DELETE' })
    await Promise.all([loadItems(), loadAudit()])
  }
  const saveSettings = async (settings) => {
    const s = await $fetch('/api/admin/settings', { method: 'PUT', body: settings })
    await loadAudit()
    return s
  }

  return { rentals, audit, items, loadRentals, loadAudit, loadItems, loadAll, returnRental, addItem, updateItem, disableItem, saveSettings }
})
