// 啟動時檢查必要環境變數；缺少就讓 server 起不來
export default defineNitroPlugin(() => {
  const c = useRuntimeConfig()
  const missing = []
  if (!c.jwtSecret) missing.push('NUXT_JWT_SECRET')
  if (c.authMode === 'ldap') {
    if (!c.ldapUrl) missing.push('NUXT_LDAP_URL')
    if (!c.ldapDomain) missing.push('NUXT_LDAP_DOMAIN')
  } else if (!c.adminPasswordHash) {
    missing.push('NUXT_ADMIN_PASSWORD_HASH')
  }
  if (missing.length) {
    throw new Error(`缺少環境變數：${missing.join(', ')}`)
  }
  getDb() // 開資料庫、建表、需要時塞示範資料
})
