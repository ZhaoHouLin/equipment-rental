import nodemailer from 'nodemailer'

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export const itemsHtml = (items) =>
  items.map((i) => escapeHtml(i.kind === 'bulk' ? `${i.name} × ${i.qty}` : `${i.category} ${i.asset_no} ${i.name}`.trim())).join('<br>')

/** 寄通知信；未設定 SMTP 主機時略過。失敗只記 log，不影響流程。 */
export async function sendMail({ to, subject, html }) {
  const { smtpHost, smtpPort, mailFrom } = useRuntimeConfig()
  if (!smtpHost || !to) return
  const transport = nodemailer.createTransport({ host: smtpHost, port: Number(smtpPort), secure: false })
  try {
    await transport.sendMail({ from: mailFrom, to, subject, html })
  } catch (err) {
    console.error('寄信失敗:', err.message)
  }
}
