// 借用人送出借用單（公開）：交易內檢查庫存、寫單、扣庫存、記錄；再寄信
export default defineEventHandler(async (event) => {
  const settings = getSettings()
  const r = validateRental((await readBody(event))?.data, { mailDomain: settings.mailDomain })

  const { id, items } = tx((d) => {
    const getItem = d.prepare('SELECT * FROM items WHERE id = ? AND active = 1')
    const picked = []
    for (const { itemId, qty } of r.items) {
      const item = getItem.get(itemId)
      if (!item) throw createError({ statusCode: 400, message: `品項 ${itemId} 不存在` })
      const need = item.kind === 'unit' ? 1 : qty
      if (item.qty < need) {
        throw createError({ statusCode: 409, message: item.kind === 'unit' ? `${item.category} ${item.asset_no} 已被借出` : `${item.name} 數量不足` })
      }
      picked.push({ ...item, qty: need })
    }
    const { lastInsertRowid } = d
      .prepare('INSERT INTO rentals (dept, name, email, phone, borrowed_at, due_at, status, signature, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(r.dept, r.name, r.email, r.phone, r.borrowedAt, r.dueAt, '借用中', r.signature, Date.now())
    const insItem = d.prepare('INSERT INTO rental_items (rental_id, item_id, qty) VALUES (?, ?, ?)')
    const dec = d.prepare('UPDATE items SET qty = qty - ? WHERE id = ?')
    for (const p of picked) {
      insItem.run(lastInsertRowid, p.id, p.qty)
      dec.run(p.qty, p.id)
    }
    d.prepare('INSERT INTO audit_log (at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)').run(
      Date.now(), r.name, '借用', `借用單 #${lastInsertRowid}`, picked.map((p) => (p.kind === 'bulk' ? `${p.name}×${p.qty}` : `${p.category} ${p.asset_no}`)).join('、')
    )
    return { id: Number(lastInsertRowid), items: picked }
  })

  await sendMail({
    to: r.email,
    subject: `[${settings.orgName}] 您已成功借用設備`,
    html: `<h2>${escapeHtml(r.name)} 您好!</h2>
      <h3>您於 ${new Date(r.borrowedAt).toLocaleString()} 借用以下設備：</h3>
      <h4>${itemsHtml(items)}</h4>
      <h3>請於 ${new Date(r.dueAt).toLocaleString()} 前歸還，謝謝。</h3>`,
  })
  return { success: true, id }
})
