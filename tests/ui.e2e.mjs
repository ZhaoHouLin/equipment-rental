// UI 走查：借用五步驟、管理頁四分頁，桌機與手機兩種寬度，收集 console 錯誤
import { chromium } from 'playwright-core'

const B = process.argv[2] || 'http://localhost:3095'
const OUT = process.argv[3] || './shots'
const browser = await chromium.launch({ channel: 'chrome' })
const problems = []

async function run(label, viewport) {
  const ctx = await browser.newContext({ viewport, locale: 'zh-TW' })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`[${label}] console: ${m.text().slice(0, 200)}`) })
  page.on('pageerror', (e) => problems.push(`[${label}] pageerror: ${String(e).slice(0, 200)}`))
  const shot = (n) => page.screenshot({ path: `${OUT}/${label}-${n}.png`, fullPage: true })
  const step = async () => {
    const compact = page.locator('.step-compact')
    if (await compact.count()) return (await compact.textContent()).trim().split('：').pop()
    return (await page.locator('.n-step--process-status .n-step-content-header__title').first().textContent().catch(() => '?')).trim()
  }

  // 步驟 1
  await page.goto(B + '/')
  await page.waitForSelector('.rental .n-card')
  await shot('1-borrower')
  await page.locator('.n-select .n-base-selection').click()
  await page.locator('.n-base-select-option').first().click()
  await page.getByPlaceholder('請輸入姓名').fill('測試員')
  await page.getByPlaceholder('請輸入聯絡信箱').fill('tester@example.com')
  await page.getByRole('button', { name: '下一步' }).click()
  console.log(label, 'after step1 ->', await step())

  // 步驟 2
  await shot('2-date')
  await page.getByRole('button', { name: '下一步' }).click()
  console.log(label, 'after step2 ->', await step())

  // 步驟 3：選設備
  await shot('3-equipment')
  const boxes = page.locator('.groups .n-checkbox:not(.n-checkbox--disabled)')
  const childText = (await boxes.first().textContent().catch(() => '')).trim()
  await boxes.first().click()
  await boxes.nth(1).click()
  await page.waitForTimeout(300)
  await shot('3-equipment-selected')
  const nextBtn = page.getByRole('button', { name: '下一步' })
  console.log(label, 'picked:', childText, '| next visible:', await nextBtn.isVisible(), '| enabled:', await nextBtn.isEnabled())
  const before = await step()
  await nextBtn.click({ timeout: 5000 }).catch((e) => problems.push(`[${label}] click next after cascader failed: ${e.message.split('\n')[0]}`))
  await page.waitForTimeout(500)
  const after = await step()
  console.log(label, 'step3 next:', before, '->', after)
  if (after === before) {
    // 再試一次：先點空白處
    await page.mouse.click(5, 5)
    await nextBtn.click({ force: true }).catch(() => {})
    await page.waitForTimeout(500)
    console.log(label, 'retry ->', await step())
  }
  await page.getByRole('button', { name: '上一步' }).click().catch((e) => problems.push(`[${label}] prev failed: ${e.message.split('\n')[0]}`))
  await page.waitForTimeout(400)
  console.log(label, 'prev ->', await step())
  await page.getByRole('button', { name: '下一步' }).click()
  await page.waitForTimeout(400)

  // 步驟 4
  await shot('4-device')
  const num = page.locator('.n-input-number input').first()
  if (await num.count()) { await num.fill('1'); await num.press('Tab') }
  await page.getByRole('button', { name: '下一步' }).click()
  await page.waitForTimeout(400)
  console.log(label, 'after step4 ->', await step())

  // 步驟 5：簽名並送出
  await shot('5-signature')
  const canvas = page.locator('.pad canvas')
  const box = await canvas.boundingBox()
  await page.mouse.move(box.x + 20, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 90, { steps: 8 })
  await page.mouse.move(box.x + 200, box.y + 50, { steps: 8 })
  await page.mouse.up()
  await page.getByRole('button', { name: '確認送出' }).click()
  await page.waitForSelector('.n-message', { timeout: 8000 }).catch(() => {})
  const msg = (await page.locator('.n-message').first().textContent().catch(() => '(no message)')).trim()
  console.log(label, 'submit ->', msg)
  await shot('5-submitted')

  // 管理頁
  await page.goto(B + '/login')
  await page.getByPlaceholder('帳號').fill('admin')
  await page.getByPlaceholder('密碼').fill('test-password-123')
  await page.getByRole('button', { name: '登入' }).click()
  await page.waitForURL('**/management', { timeout: 8000 }).catch(() => problems.push(`[${label}] login did not reach /management`))
  await page.waitForSelector('.n-data-table', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot('6-rentals')
  for (const [n, tab] of [['7-items', '庫存'], ['8-audit', '修改紀錄'], ['9-settings', '設定']]) {
    await page.locator('.n-tabs-tab', { hasText: tab }).click()
    await page.waitForTimeout(600)
    await shot(n)
  }
  // 表格是否有換行的儲存格（桌機）
  const wrapped = await page.evaluate(() => {
    const tds = [...document.querySelectorAll('.n-data-table td')]
    return tds.filter((td) => td.getBoundingClientRect().height > 60).length
  })
  console.log(label, 'tall cells (wrapped):', wrapped)
  await ctx.close()
}

await run('desktop', { width: 1280, height: 900 })
await run('mobile', { width: 390, height: 844 })
await browser.close()
console.log('\nproblems:', problems.length ? '\n' + problems.join('\n') : 'none')
