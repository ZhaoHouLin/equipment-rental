// 可借品項（公開）：借用頁要選設備
export default defineEventHandler(() =>
  getDb().prepare('SELECT id, category, asset_no AS assetNo, name, kind, qty, total FROM items WHERE active = 1 ORDER BY category, asset_no, name').all()
)
