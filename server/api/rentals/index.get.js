// 借用清單（管理員）。?status=借用中|已歸還；?overdue=1 只看逾期
export default defineEventHandler((event) => {
  requireAuth(event)
  const q = getQuery(event)
  let rows = listRentals({ status: q.status ? String(q.status) : undefined })
  if (q.overdue) rows = rows.filter((r) => r.overdue)
  return rows
})
