const CN_NUM = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function yearToChinese(year: number): string {
  return String(year)
    .split('')
    .map((d) => CN_NUM[Number(d)])
    .join('')
}

/** 2026-10-01 -> 二〇二六年十月一日 */
export function toChineseDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-').map((p) => Number(p))
  if (parts.length < 3 || parts.some((p) => isNaN(p))) return dateStr
  const [y, m, d] = parts
  const monthCN = (n: number) => (n < 10 ? CN_NUM[n] : n === 10 ? '十' : '十' + CN_NUM[n - 10])
  const dayCN = (n: number) => {
    if (n === 10) return '十'
    if (n < 10) return CN_NUM[n]
    if (n < 20) return '十' + CN_NUM[n - 10]
    if (n % 10 === 0) return CN_NUM[Math.floor(n / 10)] + '十'
    return CN_NUM[Math.floor(n / 10)] + '十' + CN_NUM[n % 10]
  }
  return `${yearToChinese(y)}年${monthCN(m)}月${dayCN(d)}日`
}

/** 2026-10-01 -> 2026年10月1日 */
export function toDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map((p) => Number(p))
  if (!y || !m || !d) return dateStr
  return `${y}年${m}月${d}日`
}

export function todayISO(): string {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`
}

/** 相对时间：刚刚 / 5分钟前 / 昨天 */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}小时前`
  const day = Math.floor(hour / 24)
  if (day === 1) return '昨天'
  if (day < 30) return `${day}天前`
  return formatTime(ts).slice(0, 10)
}

/** 依据当前小时返回问候语 */
export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}
