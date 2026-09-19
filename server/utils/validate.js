const SIGNATURE_MAX = 200_000
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max)
const bad = (msg) => {
  throw createError({ statusCode: 400, message: msg })
}

/** 借用單輸入驗證，回傳乾淨物件 */
export function validateRental(input, { mailDomain = '' } = {}) {
  if (!input || typeof input !== 'object') bad('資料格式不正確')

  const name = str(input.name, 60)
  if (!name) bad('請輸入姓名')

  const email = str(input.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad('聯絡信箱格式不正確')
  if (mailDomain && !email.toLowerCase().endsWith('@' + mailDomain.toLowerCase())) bad(`請使用 @${mailDomain} 信箱`)

  const borrowedAt = Number(input.borrowedAt)
  const dueAt = Number(input.dueAt)
  if (!Number.isFinite(borrowedAt) || !Number.isFinite(dueAt) || dueAt < borrowedAt) bad('借用時間不正確')

  const items = Array.isArray(input.items) ? input.items : []
  const clean = items
    .map((i) => ({ itemId: Math.floor(Number(i?.itemId)), qty: Math.floor(Number(i?.qty)) || 1 }))
    .filter((i) => Number.isInteger(i.itemId) && i.itemId > 0 && i.qty > 0)
  if (!clean.length) bad('請至少選擇一項設備或配件')

  const signature = str(input.signature, SIGNATURE_MAX)
  if (!signature.startsWith('data:image/png;base64,')) bad('請簽名')

  return {
    dept: str(input.dept, 60),
    name,
    email,
    phone: str(input.phone, 40),
    borrowedAt,
    dueAt,
    items: clean,
    signature,
  }
}

export function validateItem(input) {
  if (!input || typeof input !== 'object') bad('資料格式不正確')
  const kind = input.kind === 'bulk' ? 'bulk' : 'unit'
  const category = str(input.category, 40)
  if (!category) bad('請輸入類別')
  const total = Math.max(0, Math.floor(Number(input.total) || 0))
  return {
    category,
    assetNo: str(input.assetNo, 40),
    name: str(input.name, 80),
    kind,
    total: kind === 'unit' ? 1 : total,
    active: input.active === false || input.active === 0 ? 0 : 1,
  }
}
