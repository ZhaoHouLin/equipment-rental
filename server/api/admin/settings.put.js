// 修改設定（管理員）：單位清單、信箱網域、掃描規則、系統名稱
export default defineEventHandler(async (event) => {
  const { user } = requireAuth(event)
  const body = (await readBody(event)) ?? {}
  const before = getSettings()
  setSettings(body)
  const after = getSettings()
  const changes = []
  for (const k of ['orgName', 'mailDomain', 'scanSuffixLen']) if (before[k] !== after[k]) changes.push(`${k}：${before[k]} → ${after[k]}`)
  if (JSON.stringify(before.departments) !== JSON.stringify(after.departments)) changes.push(`單位清單：${after.departments.join('、')}`)
  if (changes.length) audit(user, '修改設定', '', changes.join('；'))
  return after
})
