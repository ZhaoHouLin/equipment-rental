import jwt from 'jsonwebtoken'
import ldap from 'ldapjs'

export const SESSION_COOKIE = 'access_token'

/** 驗證管理員 JWT cookie，失敗丟 401。通過時回傳 { user } */
export function requireAuth(event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) {
    throw createError({ statusCode: 401, message: '未登入' })
  }
  try {
    return jwt.verify(token, useRuntimeConfig().jwtSecret)
  } catch {
    throw createError({ statusCode: 401, message: 'JWT 無效或過期' })
  }
}

export function issueSession(event, user) {
  const { jwtSecret, sessionMinutes } = useRuntimeConfig()
  const maxAge = Math.max(1, Number(sessionMinutes)) * 60
  const token = jwt.sign({ user }, jwtSecret, { expiresIn: maxAge })
  setCookie(event, SESSION_COOKIE, token, {
    maxAge,
    httpOnly: true,
    secure: getRequestHeader(event, 'x-forwarded-proto') === 'https',
    sameSite: 'strict',
    path: '/',
  })
}

/** 用使用者帳密對 LDAP 做 bind，成功 resolve，失敗 reject */
export function ldapBind(url, userDN, password) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url, connectTimeout: 5000, timeout: 5000 })
    client.on('error', reject)
    client.bind(userDN, password, (err) => {
      client.unbind()
      err ? reject(err) : resolve()
    })
  })
}
