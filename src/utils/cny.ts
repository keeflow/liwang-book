/**
 * 金额与中文大写金额互转
 * 1000 -> 壹仟元整
 */

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const UNITS = ['', '拾', '佰', '仟']
const BIG_UNITS = ['', '万', '亿', '万亿']

/** 转换 0 - 9999 的单个小节 */
function sectionToChinese(section: number): string {
  let str = ''
  let unitPos = 0
  let zero = false
  let s = Math.floor(section)
  if (s === 0) return ''
  while (s > 0) {
    const d = s % 10
    if (d === 0) {
      if (!zero) {
        zero = true
        if (str !== '' && !str.startsWith('零')) str = '零' + str
      }
    } else {
      zero = false
      str = DIGITS[d] + UNITS[unitPos] + str
    }
    unitPos++
    s = Math.floor(s / 10)
  }
  return str
}

/** 整数转中文大写 */
export function intToChinese(num: number): string {
  let n = Math.floor(num)
  if (!isFinite(n)) return ''
  if (n === 0) return '零'
  const negative = n < 0
  n = Math.abs(n)
  let result = ''
  let pos = 0
  let lastSection = -1
  let pendingZero = false
  while (n > 0) {
    const section = n % 10000
    if (section !== 0) {
      let s = sectionToChinese(section) + BIG_UNITS[pos]
      if (result !== '' && (pendingZero || (lastSection !== 0 && lastSection < 1000))) {
        s += '零'
      }
      result = s + result
      pendingZero = false
    } else if (result !== '') {
      pendingZero = true
    }
    lastSection = section
    n = Math.floor(n / 10000)
    pos++
  }
  return (negative ? '负' : '') + result
}

/**
 * 数字金额转中文大写金额
 * 1000   -> 壹仟元整
 * 1234.5 -> 壹仟贰佰叁拾肆元伍角
 * 0.5    -> 伍角
 * 0      -> 零元整
 */
export function toChineseAmount(input: number | string): string {
  const raw = typeof input === 'string' ? input.replace(/[^\d.-]/g, '') : input
  const value = typeof raw === 'string' ? parseFloat(raw) : raw
  if (value === null || value === undefined || isNaN(value as number)) return ''
  const num = value as number
  if (num === 0) return '零元整'

  const negative = num < 0
  // 四舍五入到分，避免浮点误差
  const cents = Math.round(Math.abs(num) * 100)
  const intPart = Math.floor(cents / 100)
  const decPart = cents % 100

  let result = ''
  if (intPart > 0) {
    result += intToChinese(intPart) + '元'
  }

  if (decPart === 0) {
    result += '整'
  } else {
    const jiao = Math.floor(decPart / 10)
    const fen = decPart % 10
    if (jiao > 0) result += DIGITS[jiao] + '角'
    else if (fen > 0 && intPart > 0) result += '零'
    if (fen > 0) result += DIGITS[fen] + '分'
  }
  return (negative ? '负' : '') + result
}

/** 金额格式化为 ¥1,000 / ¥1,000.50 */
export function formatMoney(num: number | string, withSymbol = true): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n as number)) return withSymbol ? '¥0' : '0'
  const v = n as number
  const decimals = Math.abs(v % 1) > 0.0001 ? 2 : 0
  const s = v.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  })
  return withSymbol ? '¥' + s : s
}

/** 紧凑金额：¥8.66万 */
export function formatMoneyCompact(num: number): string {
  const n = Number(num) || 0
  if (Math.abs(n) >= 10000) {
    return '¥' + (n / 10000).toFixed(n % 10000 === 0 ? 0 : 2).replace(/\.?0+$/, '') + '万'
  }
  return formatMoney(n)
}
