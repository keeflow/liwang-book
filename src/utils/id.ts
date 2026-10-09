export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}${Date.now().toString(36)}${rand}`
}

/** 姓名归一化，用于宾客归并 */
export function normalizeName(name: string): string {
  return (name || '').trim().replace(/\s+/g, '').toLowerCase()
}

export function firstChar(name: string): string {
  return (name || '?').trim().slice(0, 1)
}

/** 常见金额快捷档位（可按使用情况调整） */
export const QUICK_AMOUNTS = [100, 200, 300, 500, 600, 800, 1000, 1200, 2000]
