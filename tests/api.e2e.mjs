// 端到端：公開借用、庫存、驗證、管理員 401、登入、歸還、逾期、品項、設定、修改紀錄、匯出、並發
// 前提：server 以 NUXT_SEED_DEMO=1 與空資料庫啟動，管理員 admin / test-password-123
const B = process.argv[2] || 'http://localhost:3095'
const j = (r) => r.json()
const init = (method, body, extra = {}) => ({ method, headers: { 'content-type': 'application/json', ...extra }, body: body === undefined ? undefined : JSON.stringify(body) })
const status = async (p, i) => (await fetch(B + p, i)).status
let fails = 0
const ok = (name, cond) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' ' + name) }

const items = await fetch(B + '/api/items').then(j)
ok('items public (seeded)', items.length === 14)
const settings = await fetch(B + '/api/settings').then(j)
ok('settings public', Array.isArray(settings.departments) && settings.departments.length > 0)
const nb = items.find((i) => i.category === '筆電')
const hdmi = items.find((i) => i.name === 'HDMI 轉接頭')

// 管理 API 未登入 401
for (const [p, i] of [['/api/rentals'], ['/api/admin/audit'], ['/api/rentals/export'], ['/api/admin/items', init('POST', {})], ['/api/rentals/1/return', init('PUT')], ['/api/admin/settings', init('PUT', {})]]) {
  ok(`401 ${p}`, (await status(p, i)) === 401)
}

// 驗證
const sig = 'data:image/png;base64,' + 'A'.repeat(2000)
const base = { dept: '資訊室', name: '王小明', email: 'wang@example.com', phone: '1234', borrowedAt: Date.now(), dueAt: Date.now() + 86400000, signature: sig }
ok('no items 400', (await status('/api/rentals', init('POST', { data: { ...base, items: [] } }))) === 400)
ok('bad email 400', (await status('/api/rentals', init('POST', { data: { ...base, email: 'x', items: [{ itemId: nb.id, qty: 1 }] } }))) === 400)
ok('no signature 400', (await status('/api/rentals', init('POST', { data: { ...base, signature: '', items: [{ itemId: nb.id, qty: 1 }] } }))) === 400)
ok('due before borrow 400', (await status('/api/rentals', init('POST', { data: { ...base, dueAt: base.borrowedAt - 1, items: [{ itemId: nb.id, qty: 1 }] } }))) === 400)

// 借用
const r1 = await fetch(B + '/api/rentals', init('POST', { data: { ...base, items: [{ itemId: nb.id, qty: 1 }, { itemId: hdmi.id, qty: 2 }] } })).then(j)
ok('borrow ok', r1.success && r1.id > 0)
const items2 = await fetch(B + '/api/items').then(j)
ok('stock decremented', items2.find((i) => i.id === nb.id).qty === 0 && items2.find((i) => i.id === hdmi.id).qty === 3)
ok('double borrow 409', (await status('/api/rentals', init('POST', { data: { ...base, items: [{ itemId: nb.id, qty: 1 }] } }))) === 409)
ok('bulk shortage 409', (await status('/api/rentals', init('POST', { data: { ...base, items: [{ itemId: hdmi.id, qty: 99 }] } }))) === 409)

// 逾期單：歸還期限已過
const nb2 = items.filter((i) => i.category === '筆電')[1]
const r2 = await fetch(B + '/api/rentals', init('POST', { data: { ...base, name: '逾期的人', borrowedAt: Date.now() - 3 * 86400000, dueAt: Date.now() - 86400000, items: [{ itemId: nb2.id, qty: 1 }] } })).then(j)
ok('overdue borrow ok', r2.success)

// 登入
ok('wrong password 401', (await status('/api/auth/login', init('POST', { username: 'admin', password: 'nope' }))) === 401)
const login = await fetch(B + '/api/auth/login', init('POST', { username: 'admin', password: 'test-password-123' }))
const sc = login.headers.get('set-cookie') || ''
ok('login ok + cookie flags', login.status === 200 && /HttpOnly/i.test(sc) && /SameSite=Strict/i.test(sc))
const auth = { cookie: sc.split(';')[0] }
const me = await fetch(B + '/api/auth/me', { headers: auth }).then(j)
ok('me', me.loggedIn && me.user === 'admin')

// 清單與逾期
const list = await fetch(B + '/api/rentals', { headers: auth }).then(j)
ok('rentals listed with items', list.length === 2 && list.every((r) => Array.isArray(r.items) && r.items.length))
ok('signature stored', list.find((r) => r.id === r1.id).signature === sig)
const overdue = await fetch(B + '/api/rentals?overdue=1', { headers: auth }).then(j)
ok('overdue filter', overdue.length === 1 && overdue[0].name === '逾期的人')

// 歸還
const ret = await fetch(B + `/api/rentals/${r1.id}/return`, init('PUT', undefined, auth))
ok('return ok', ret.status === 200)
ok('return twice 409', (await status(`/api/rentals/${r1.id}/return`, init('PUT', undefined, auth))) === 409)
const items3 = await fetch(B + '/api/items').then(j)
ok('stock restored', items3.find((i) => i.id === nb.id).qty === 1 && items3.find((i) => i.id === hdmi.id).qty === 5)

// 品項 CRUD
const added = await fetch(B + '/api/admin/items', init('POST', { category: '配件', name: '滑鼠', kind: 'bulk', total: 4 }, auth)).then(j)
ok('item added', added.id > 0)
ok('item update', (await status(`/api/admin/items/${added.id}`, init('PUT', { category: '配件', name: '滑鼠', kind: 'bulk', total: 6 }, auth))) === 200)
const items4 = await fetch(B + '/api/items').then(j)
ok('item total & qty adjusted', items4.find((i) => i.id === added.id).total === 6 && items4.find((i) => i.id === added.id).qty === 6)
ok('disable borrowed item 409', (await status(`/api/admin/items/${nb2.id}`, init('DELETE', undefined, auth))) === 409)
ok('disable free item 200', (await status(`/api/admin/items/${added.id}`, init('DELETE', undefined, auth))) === 200)
ok('disabled item hidden', !(await fetch(B + '/api/items').then(j)).some((i) => i.id === added.id))

// 設定
const s2 = await fetch(B + '/api/admin/settings', init('PUT', { orgName: '測試公司', departments: ['A部', 'B部'], mailDomain: 'example.com' }, auth)).then(j)
ok('settings saved', s2.orgName === '測試公司' && s2.departments.length === 2)
ok('mail domain enforced 400', (await status('/api/rentals', init('POST', { data: { ...base, email: 'x@other.com', items: [{ itemId: nb.id, qty: 1 }] } }))) === 400)

// 修改紀錄
const audit = await fetch(B + '/api/admin/audit', { headers: auth }).then(j)
const actions = audit.map((a) => a.action)
ok('audit has borrow/return/item/settings/login', ['借用', '歸還', '新增品項', '修改品項', '停用品項', '修改設定', '登入'].every((a) => actions.includes(a)))

// 匯出
const exp = await fetch(B + '/api/rentals/export', { headers: auth })
ok('export xlsx', exp.status === 200 && (exp.headers.get('content-type') || '').includes('spreadsheetml'))

// 並發：三人同時借同一台
const nb3 = items.filter((i) => i.category === '筆電')[2]
const race = await Promise.all([1, 2, 3].map(() => fetch(B + '/api/rentals', init('POST', { data: { ...base, name: 'racer', items: [{ itemId: nb3.id, qty: 1 }] } })).then((r) => r.status)))
ok('concurrent: one 200, two 409', race.filter((s) => s === 200).length === 1 && race.filter((s) => s === 409).length === 2)

// 登出
const out = await fetch(B + '/api/auth/logout', init('POST', undefined, auth))
ok('logout clears cookie', /Max-Age=0|expires=Thu, 01 Jan 1970/i.test(out.headers.get('set-cookie') || ''))

console.log(fails ? `\n${fails} FAILED` : '\nALL PASS')
process.exit(fails ? 1 : 0)
