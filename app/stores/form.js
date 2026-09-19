// 借用單的多步驟表單狀態
const DAY = 86400000

const blank = () => ({
  dept: null,
  name: '',
  email: '',
  phone: '',
  range: [Date.now(), Date.now() + DAY],
  units: [], // 單品 item id
  bulk: {}, // { itemId: qty }
  signature: '',
})

export const useFormStore = defineStore('form', () => {
  const step = ref(0) // 0 借用人 1 時間 2 設備 3 配件 4 簽名
  const model = ref(blank())

  const next = () => (step.value = Math.min(4, step.value + 1))
  const prev = () => (step.value = Math.max(0, step.value - 1))
  const reset = () => {
    model.value = blank()
    step.value = 0
  }

  const payload = () => ({
    dept: model.value.dept ?? '',
    name: model.value.name,
    email: model.value.email,
    phone: model.value.phone,
    borrowedAt: model.value.range[0],
    dueAt: model.value.range[1],
    items: [
      ...model.value.units.map((id) => ({ itemId: id, qty: 1 })),
      ...Object.entries(model.value.bulk)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ itemId: Number(id), qty: q })),
    ],
    signature: model.value.signature,
  })

  const submit = async () => {
    const res = await $fetch('/api/rentals', { method: 'POST', body: { data: payload() } })
    reset()
    return res
  }

  return { step, model, next, prev, reset, payload, submit }
})
