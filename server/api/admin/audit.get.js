// 修改紀錄（管理員），最新 300 筆
export default defineEventHandler((event) => {
  requireAuth(event)
  return getDb().prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 300').all()
})
