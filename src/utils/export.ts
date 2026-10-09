import * as XLSX from 'xlsx'
import type { Book, Contact, GiftRecord } from '@/types'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { formatTime } from '@/utils/date'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadJSON(data: unknown, filename: string) {
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename)
}

/** 导出单本礼簿为 Excel */
export function exportBookExcel(book: Book, records: GiftRecord[]) {
  const rows = records.map((r, i) => ({
    序号: i + 1,
    姓名: r.name,
    类型: r.kind === 'gift' ? '礼品' : '礼金',
    金额: Number(r.amount) || 0,
    '中文大写金额': Number(r.amount) ? toChineseAmount(r.amount) : '',
    礼品: r.gift || '',
    关系: r.relation || '',
    手机号: r.phone || '',
    备注: r.note || '',
    登记时间: formatTime(r.createdAt),
    登记人员: r.createdBy || '',
  }))

  const total = records.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  rows.push({
    序号: null as unknown as number,
    姓名: '合计',
    类型: '',
    金额: total,
    '中文大写金额': toChineseAmount(total),
    礼品: '',
    关系: '',
    手机号: '',
    备注: '',
    登记时间: '',
    登记人员: '',
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 8 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 10 },
  ]
  const wb = XLSX.utils.book_new()
  const sheetName = `${book.name}`.slice(0, 28).replace(/[\\/?*[\]:]/g, '') || '礼簿'
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  download(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${book.name}-${book.date}.xlsx`,
  )
}

/** 导出全部礼簿为多 Sheet Excel */
export function exportAllExcel(books: Book[], recordsByBook: Map<string, GiftRecord[]>) {
  const wb = XLSX.utils.book_new()
  for (const book of books) {
    const records = recordsByBook.get(book.id) ?? []
    const rows = records.map((r, i) => ({
      序号: i + 1,
      姓名: r.name,
      金额: Number(r.amount) || 0,
      '中文大写金额': Number(r.amount) ? toChineseAmount(r.amount) : '',
      礼品: r.gift || '',
      关系: r.relation || '',
      备注: r.note || '',
      登记时间: formatTime(r.createdAt),
    }))
    const total = records.reduce((s, r) => s + (Number(r.amount) || 0), 0)
    rows.push({
      序号: null as unknown as number,
      姓名: '合计',
      金额: total,
      '中文大写金额': toChineseAmount(total),
      礼品: '',
      关系: '',
      备注: '',
      登记时间: '',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 20 }, { wch: 18 }]
    const name = `${book.name}`.slice(0, 28).replace(/[\\/?*[\]:]/g, '') || `礼簿${book.id.slice(-4)}`
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  download(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `礼往-全部礼簿-${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}

export function exportContactsExcel(contacts: Contact[]) {
  const rows = contacts.map((c, i) => ({
    序号: i + 1,
    姓名: c.name,
    关系: c.relation || '',
    手机号: c.phone || '',
    '累计收到': c.received,
    '累计送出': c.sent,
    '往来差额': c.balance,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '人情往来')
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  download(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `礼往-人情往来-${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}
