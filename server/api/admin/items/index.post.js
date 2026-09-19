// 新增品項（管理員）
export default defineEventHandler(async (event) => {
  const { user } = requireAuth(event)
  const it = validateItem(await readBody(event))
  const { lastInsertRowid } = getDb()
    .prepare('INSERT INTO items (category, asset_no, name, kind, qty, total, active) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(it.category, it.assetNo, it.name, it.kind, it.total, it.total, it.active)
  audit(user, '新增品項', `${it.category} ${it.assetNo} ${it.name}`.trim(), `數量 ${it.total}`)
  return { id: Number(lastInsertRowid) }
})
