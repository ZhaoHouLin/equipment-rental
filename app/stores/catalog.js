// 公開資料：可借品項與設定
export const useCatalogStore = defineStore('catalog', () => {
  const items = ref([])
  const settings = ref({ orgName: '設備借用系統', departments: [], mailDomain: '', scanSuffixLen: 4 })

  const load = async () => {
    const [i, s] = await Promise.all([$fetch('/api/items'), $fetch('/api/settings')])
    items.value = i
    settings.value = s
  }

  const unitItems = computed(() => items.value.filter((i) => i.kind === 'unit'))
  const bulkItems = computed(() => items.value.filter((i) => i.kind === 'bulk'))

  // 類別 → 單品，給 NCascader
  const unitOptions = computed(() => {
    const byCat = new Map()
    for (const it of unitItems.value) {
      if (!byCat.has(it.category)) byCat.set(it.category, [])
      byCat.get(it.category).push({
        label: `${it.assetNo} ${it.name}`.trim(),
        value: it.id,
        disabled: it.qty < 1,
      })
    }
    return [...byCat].map(([category, children]) => ({ label: category, value: `cat:${category}`, children }))
  })

  // 每類剩餘 / 總數
  const summary = computed(() => {
    const m = new Map()
    for (const it of items.value) {
      const key = it.kind === 'unit' ? it.category : it.name
      const cur = m.get(key) ?? { remaining: 0, total: 0 }
      cur.remaining += it.qty
      cur.total += it.total
      m.set(key, cur)
    }
    return [...m].map(([label, v]) => ({ label, ...v }))
  })

  const findByAssetSuffix = (text) => {
    const n = settings.value.scanSuffixLen || 4
    const suffix = String(text).slice(-n)
    return unitItems.value.find((i) => i.assetNo.endsWith(suffix))
  }

  return { items, settings, load, unitItems, bulkItems, unitOptions, summary, findByAssetSuffix }
})
