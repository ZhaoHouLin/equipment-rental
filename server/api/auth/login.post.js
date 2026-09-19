import bcrypt from 'bcryptjs'

// 管理員登入：local 比對環境變數的帳號與雜湊；ldap 對 AD 做 bind
export default defineEventHandler(async (event) => {
  const { username, password } = (await readBody(event)) ?? {}
  if (!username || !password) {
    throw createError({ statusCode: 400, message: '請輸入帳號與密碼' })
  }
  const c = useRuntimeConfig()
  const user = String(username).slice(0, 80)

  if (c.authMode === 'ldap') {
    try {
      await ldapBind(c.ldapUrl, `${user}@${c.ldapDomain}`, String(password))
    } catch (err) {
      if (err?.name === 'InvalidCredentialsError') {
        throw createError({ statusCode: 401, message: '帳號或密碼錯誤' })
      }
      console.error('LDAP 連線失敗：', err)
      throw createError({ statusCode: 502, message: 'LDAP 伺服器無法連線' })
    }
  } else {
    const ok = user === c.adminUser && (await bcrypt.compare(String(password), c.adminPasswordHash))
    if (!ok) {
      throw createError({ statusCode: 401, message: '帳號或密碼錯誤' })
    }
  }

  issueSession(event, user)
  audit(user, '登入')
  return { success: true, user }
})
