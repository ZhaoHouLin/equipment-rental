// 管理員標記歸還：庫存加回、狀態更新、記錄；再寄信
export default defineEventHandler(async (event) => {
  const { user } = requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, message: 'id 不正確' })

  const rental = tx((d) => {
    const r = d.prepare('SELECT * FROM rentals WHERE id = ?').get(id)
    if (!r) throw createError({ statusCode: 404, message: '借用單不存在' })
    if (r.status === '已歸還') throw createError({ statusCode: 409, message: '已經歸還過了' })
    // ri.qty 要放在 i.* 後面取別名，否則會被 items.qty 蓋掉
    const items = d
      .prepare('SELECT i.*, ri.qty AS borrowed_qty FROM rental_items ri JOIN items i ON i.id = ri.item_id WHERE ri.rental_id = ?')
      .all(id)
      .map((it) => ({ ...it, qty: it.borrowed_qty }))
    const inc = d.prepare('UPDATE items SET qty = MIN(total, qty + ?) WHERE id = ?')
    for (const it of items) inc.run(it.qty, it.id)
    d.prepare("UPDATE rentals SET status = '已歸還', returned_at = ? WHERE id = ?").run(Date.now(), id)
    d.prepare('INSERT INTO audit_log (at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)').run(Date.now(), user, '歸還', `借用單 #${id}`, r.name)
    return { ...r, items }
  })

  const { orgName } = getSettings()
  await sendMail({
    to: rental.email,
    subject: `[${orgName}] 您已成功歸還設備`,
    html: `<h2>${escapeHtml(rental.name)} 您好!</h2>
      <h3>您於 ${new Date().toLocaleString()} 歸還以下設備：</h3>
      <h4>${itemsHtml(rental.items)}</h4>
      <h3>歡迎再度使用，謝謝!</h3>`,
  })
  return { success: true }
})
