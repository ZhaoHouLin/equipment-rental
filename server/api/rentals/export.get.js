import * as XLSX from 'xlsx'

// 匯出借用紀錄成 Excel（管理員）。給習慣看表的人；簽名不匯出。
export default defineEventHandler((event) => {
  requireAuth(event)
  const fmt = (t) => (t ? new Date(t).toLocaleString('zh-TW', { hour12: false }) : '')
  const rows = listRentals().map((r) => ({
    單號: r.id,
    借用單位: r.dept,
    借用人: r.name,
    聯絡信箱: r.email,
    聯絡電話: r.phone,
    借用時間: fmt(r.borrowed_at),
    歸還期限: fmt(r.due_at),
    歸還時間: fmt(r.returned_at),
    狀態: r.overdue ? '逾期' : r.status,
    品項: r.items.map((i) => (i.kind === 'bulk' ? `${i.name}×${i.qty}` : `${i.category} ${i.asset_no}`)).join('、'),
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '借用紀錄')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const name = encodeURIComponent(`借用紀錄-${new Date().toISOString().slice(0, 10)}.xlsx`)
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${name}"; filename*=UTF-8''${name}`)
  return buf
})
