import type { GiftRecord } from '@/types'
import { toChineseAmount } from './cny'

export interface BookStats {
  total: number
  totalCN: string
  people: number
  count: number
  giftCount: number
  average: number
  max: number
  maxName: string
  /** 常见金额分布，按人数降序 */
  distribution: { amount: number; count: number }[]
  /** 关系分布 */
  relations: { name: string; count: number }[]
}

export function computeStats(records: GiftRecord[]): BookStats {
  const cash = records.filter((r) => Number(r.amount) > 0)
  const total = cash.reduce((s, r) => s + Number(r.amount), 0)
  const people = new Set(records.map((r) => r.name.trim())).size
  const giftCount = records.filter((r) => r.kind === 'gift' || !!r.gift).length

  const counter = new Map<number, number>()
  for (const r of cash) {
    const a = Number(r.amount)
    counter.set(a, (counter.get(a) || 0) + 1)
  }
  const distribution = [...counter.entries()]
    .map(([amount, count]) => ({ amount, count }))
    .sort((a, b) => b.count - a.count || b.amount - a.amount)

  const relCounter = new Map<string, number>()
  for (const r of records) {
    const rel = (r.relation || '').trim()
    if (!rel) continue
    relCounter.set(rel, (relCounter.get(rel) || 0) + 1)
  }
  const relations = [...relCounter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  let max = 0
  let maxName = ''
  for (const r of cash) {
    if (Number(r.amount) > max) {
      max = Number(r.amount)
      maxName = r.name
    }
  }

  return {
    total,
    totalCN: toChineseAmount(total),
    people,
    count: records.length,
    giftCount,
    average: cash.length ? Math.round(total / cash.length) : 0,
    max,
    maxName,
    distribution,
    relations,
  }
}
