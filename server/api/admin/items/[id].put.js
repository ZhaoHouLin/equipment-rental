// 修改品項（管理員）：改總量時，庫存同步加減
export default defineEventHandler(async (event) => {
  const { user } = requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  const it = validateItem(await readBody(event))
  tx((d) => {
    const old = d.prepare('SELECT * FROM items WHERE id = ?').get(id)
    if (!old) throw createError({ statusCode: 404, message: '品項不存在' })
    const qty = Math.max(0, old.qty + (it.total - old.total))
    d.prepare('UPDATE items SET category = ?, asset_no = ?, name = ?, kind = ?, qty = ?, total = ?, active = ? WHERE id = ?')
      .run(it.category, it.assetNo, it.name, it.kind, qty, it.total, it.active, id)
    const changes = []
    for (const [k, a, b] of [['類別', old.category, it.category], ['財編', old.asset_no, it.assetNo], ['名稱', old.name, it.name], ['總量', old.total, it.total], ['啟用', old.active, it.active]]) {
      if (String(a) !== String(b)) changes.push(`${k}：${a} → ${b}`)
    }
    d.prepare('INSERT INTO audit_log (at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)').run(Date.now(), user, '修改品項', `${it.category} ${it.assetNo} ${it.name}`.trim(), changes.join('、'))
  })
  return { success: true }
})
