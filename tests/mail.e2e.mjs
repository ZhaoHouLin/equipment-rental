// 通知信測試：借用與歸還各寄一封，到 maildev 收件匣確認收件人、主旨、內容
// 前提：npx maildev（SMTP 1025、網頁 1080），server 以 NUXT_SMTP_HOST=localhost NUXT_SMTP_PORT=1025 啟動
const B = process.argv[2] || 'http://localhost:3095'
const M = process.argv[3] || 'http://localhost:1080'
const j = (r) => r.json()
const init = (method, body, extra = {}) => ({ method, headers: { 'content-type': 'application/json', ...extra }, body: body === undefined ? undefined : JSON.stringify(body) })
let fails = 0
const ok = (name, cond) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' ' + name) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// maildev 3.x 的 API 在 /api/email
await fetch(M + '/api/email/all', { method: 'DELETE' }).catch(() => {})
const items = await fetch(B + '/api/items').then(j)
const nb = items.find((i) => i.kind === 'unit' && i.qty > 0)
const bulk = items.find((i) => i.kind === 'bulk' && i.qty > 0)

// 借用 → 一封借用通知
const r = await fetch(B + '/api/rentals', init('POST', { data: {
  dept: '資訊室', name: '<王小明>', email: 'wang@example.com', phone: '', borrowedAt: Date.now(), dueAt: Date.now() + 86400000,
  items: [{ itemId: nb.id, qty: 1 }, { itemId: bulk.id, qty: 2 }], signature: 'data:image/png;base64,AAAA',
} })).then(j)
ok('borrow ok', r.success)
await sleep(1500)
let mails = await fetch(M + '/api/email').then(j)
const m1 = mails.find((m) => m.subject.includes('借用'))
ok('borrow mail received', !!m1)
ok('borrow mail to borrower', m1?.to?.[0]?.address === 'wang@example.com')
ok('borrow mail lists items', !!m1 && m1.html.includes(nb.assetNo) && m1.html.includes(`${bulk.name} × 2`))
ok('borrow mail escapes html', !!m1 && m1.html.includes('&lt;王小明&gt;') && !m1.html.includes('<王小明>'))

// 歸還 → 一封歸還通知
const login = await fetch(B + '/api/auth/login', init('POST', { username: 'admin', password: 'test-password-123' }))
const cookie = (login.headers.get('set-cookie') || '').split(';')[0]
ok('return ok', (await fetch(B + `/api/rentals/${r.id}/return`, init('PUT', undefined, { cookie }))).status === 200)
await sleep(1500)
mails = await fetch(M + '/api/email').then(j)
const m2 = mails.find((m) => m.subject.includes('歸還'))
ok('return mail received', !!m2 && m2.to?.[0]?.address === 'wang@example.com')
ok('two mails total', mails.length === 2)

console.log(fails ? `\n${fails} FAILED` : '\nALL PASS')
process.exit(fails ? 1 : 0)
