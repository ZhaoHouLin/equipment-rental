// 停用品項（管理員）。有借用紀錄的品項不能真刪，改 active = 0。
export default defineEventHandler((event) => {
  const { user } = requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  tx((d) => {
    const it = d.prepare('SELECT * FROM items WHERE id = ?').get(id)
    if (!it) throw createError({ statusCode: 404, message: '品項不存在' })
    if (it.qty < it.total) throw createError({ statusCode: 409, message: '尚有借出中的數量，不能停用' })
    d.prepare('UPDATE items SET active = 0 WHERE id = ?').run(id)
    d.prepare('INSERT INTO audit_log (at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)').run(Date.now(), user, '停用品項', `${it.category} ${it.asset_no} ${it.name}`.trim(), '')
  })
  return { success: true }
})
