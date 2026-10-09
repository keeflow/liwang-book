import { defineStore } from 'pinia'
import type {
  BackupPayload,
  Book,
  BookDirection,
  Contact,
  DealRow,
  GiftRecord,
  Settings,
} from '@/types'
import { normalizeName, uid } from '@/utils/id'

const BOOKS_KEY = 'liwang.books.v1'
const RECORDS_KEY = 'liwang.records.v1'
const SETTINGS_KEY = 'liwang.settings.v1'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('[礼往] 本地存储写入失败', e)
  }
}

export type NewBookInput = Omit<Book, 'id' | 'sealed' | 'createdAt' | 'updatedAt'>
export type NewRecordInput = Omit<GiftRecord, 'id' | 'createdAt'> & { createdAt?: number }

function isDemo(): boolean {
  const params = new URLSearchParams(location.search)
  return params.get('demo') === '1' || location.hash.includes('demo')
}

export const useLedgerStore = defineStore('ledger', {
  state: () => ({
    books: load<Book[]>(BOOKS_KEY, []),
    records: load<GiftRecord[]>(RECORDS_KEY, []),
    settings: load<Settings>(SETTINGS_KEY, {
      moneyStyle: 'traditional',
      familyName: '',
      greeting: true,
    } as Settings),
    ready: false,
  }),

  getters: {
    /** 未封存的礼簿 */
    activeBooks: (s) => s.books.filter((b) => !b.sealed),
    /** 按日期倒序 */
    sortedBooks: (s) =>
      [...s.books].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt,
      ),

    recordsByBook: (s) => {
      const map = new Map<string, GiftRecord[]>()
      for (const r of s.records) {
        if (!map.has(r.bookId)) map.set(r.bookId, [])
        map.get(r.bookId)!.push(r)
      }
      for (const list of map.values()) list.sort((a, b) => a.createdAt - b.createdAt)
      return map
    },

    /** 全部人情往来（含方向） */
    deals(): DealRow[] {
      const bookMap = new Map(this.books.map((b) => [b.id, b]))
      const rows: DealRow[] = []
      for (const r of this.records) {
        const book = bookMap.get(r.bookId)
        if (!book) continue
        rows.push({
          record: r,
          book,
          direction: book.direction,
          counterpart: r.name,
        })
      }
      return rows.sort(
        (a, b) => new Date(b.book.date).getTime() - new Date(a.book.date).getTime(),
      )
    },

    /** 宾客档案（按姓名归并） */
    contacts(): Contact[] {
      const map = new Map<string, Contact>()
      const bookMap = new Map(this.books.map((b) => [b.id, b]))
      for (const r of this.records) {
        const book = bookMap.get(r.bookId)
        if (!book) continue
        const key = normalizeName(r.name) || r.id
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: r.name.trim(),
            phone: r.phone,
            relation: r.relation,
            received: 0,
            sent: 0,
            balance: 0,
            records: [],
          })
        }
        const c = map.get(key)!
        c.records.push(r)
        if (book.direction === 'in') c.received += Number(r.amount) || 0
        else c.sent += Number(r.amount) || 0
        if (!c.phone && r.phone) c.phone = r.phone
        if (!c.relation && r.relation) c.relation = r.relation
        c.name = c.name || r.name.trim()
      }
      const list = [...map.values()]
      for (const c of list) {
        c.balance = c.received - c.sent
        c.records.sort((a, b) => b.createdAt - a.createdAt)
      }
      return list.sort((a, b) => b.received + b.sent - (a.received + a.sent))
    },

    totalReceived(): number {
      return this.books
        .filter((b) => b.direction === 'in')
        .reduce(
          (sum, b) =>
            sum + (this.recordsByBook.get(b.id) ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0),
          0,
        )
    },

    totalSent(): number {
      return this.books
        .filter((b) => b.direction === 'out')
        .reduce(
          (sum, b) =>
            sum + (this.recordsByBook.get(b.id) ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0),
          0,
        )
    },
  },

  actions: {
    init() {
      if (isDemo()) this.loadDemo()
      this.ready = true
    },

    // ---------- 礼簿 ----------
    createBook(input: NewBookInput): Book {
      const now = Date.now()
      const book: Book = { ...input, id: uid('bk_'), sealed: false, createdAt: now, updatedAt: now }
      this.books.push(book)
      this.persistBooks()
      return book
    },

    updateBook(id: string, patch: Partial<Book>) {
      const book = this.books.find((b) => b.id === id)
      if (!book) return
      Object.assign(book, patch, { updatedAt: Date.now() })
      this.persistBooks()
    },

    deleteBook(id: string) {
      this.books = this.books.filter((b) => b.id !== id)
      this.records = this.records.filter((r) => r.bookId !== id)
      this.persistBooks()
      this.persistRecords()
    },

    toggleSeal(id: string) {
      const book = this.books.find((b) => b.id === id)
      if (!book) return
      book.sealed = !book.sealed
      book.updatedAt = Date.now()
      this.persistBooks()
    },

    getBook(id: string): Book | undefined {
      return this.books.find((b) => b.id === id)
    },

    // ---------- 记录 ----------
    addRecord(input: NewRecordInput): GiftRecord {
      const record: GiftRecord = {
        ...input,
        id: uid('rc_'),
        createdAt: input.createdAt ?? Date.now(),
      }
      this.records.push(record)
      const book = this.books.find((b) => b.id === record.bookId)
      if (book) book.updatedAt = Date.now()
      this.persistRecords()
      return record
    },

    updateRecord(id: string, patch: Partial<GiftRecord>) {
      const r = this.records.find((x) => x.id === id)
      if (!r) return
      Object.assign(r, patch)
      this.persistRecords()
    },

    deleteRecord(id: string) {
      this.records = this.records.filter((r) => r.id !== id)
      this.persistRecords()
    },

    getRecord(id: string): GiftRecord | undefined {
      return this.records.find((r) => r.id === id)
    },

    recordsOf(bookId: string): GiftRecord[] {
      return this.recordsByBook.get(bookId) ?? []
    },

    bookTotal(bookId: string): number {
      return (this.recordsByBook.get(bookId) ?? []).reduce(
        (s, r) => s + (Number(r.amount) || 0),
        0,
      )
    },

    bookPeople(bookId: string): number {
      const list = this.recordsByBook.get(bookId) ?? []
      return new Set(list.map((r) => normalizeName(r.name))).size
    },

    /** 今日已收 + 笔数 */
    todayStats(bookId: string) {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const list = (this.recordsByBook.get(bookId) ?? []).filter(
        (r) => r.createdAt >= start.getTime(),
      )
      return {
        amount: list.reduce((s, r) => s + (Number(r.amount) || 0), 0),
        count: list.length,
      }
    },

    // ---------- 设置 ----------
    updateSettings(patch: Partial<Settings>) {
      this.settings = { ...this.settings, ...patch }
      save(SETTINGS_KEY, this.settings)
    },

    toggleMoneyStyle() {
      this.settings.moneyStyle =
        this.settings.moneyStyle === 'traditional' ? 'numeric' : 'traditional'
      save(SETTINGS_KEY, this.settings)
    },

    // ---------- 备份 ----------
    exportBackup(): BackupPayload {
      return {
        app: 'liwang-book',
        version: 1,
        exportedAt: new Date().toISOString(),
        books: this.books,
        records: this.records,
        settings: this.settings,
      }
    },

    importBackup(payload: BackupPayload, mode: 'merge' | 'replace' = 'replace') {
      if (!payload || !Array.isArray(payload.books) || !Array.isArray(payload.records)) {
        throw new Error('备份文件格式不正确')
      }
      if (mode === 'replace') {
        this.books = payload.books
        this.records = payload.records
        if (payload.settings) this.settings = { ...this.settings, ...payload.settings }
      } else {
        const bookIds = new Set(this.books.map((b) => b.id))
        const recIds = new Set(this.records.map((r) => r.id))
        for (const b of payload.books) if (!bookIds.has(b.id)) this.books.push(b)
        for (const r of payload.records) if (!recIds.has(r.id)) this.records.push(r)
      }
      this.persistAll()
    },

    clearAll() {
      this.books = []
      this.records = []
      this.persistAll()
    },

    persistBooks() {
      save(BOOKS_KEY, this.books)
    },
    persistRecords() {
      save(RECORDS_KEY, this.records)
    },
    persistAll() {
      this.persistBooks()
      this.persistRecords()
      save(SETTINGS_KEY, this.settings)
    },

    /** 演示数据，仅在 ?demo=1 时载入 */
    loadDemo() {
      if (this.books.length) return
      const mk = (
        name: string,
        type: Book['type'],
        date: string,
        host: string,
        direction: BookDirection,
        location: string,
      ) => this.createBook({ name, type, date, host, direction, location, note: '' })

      const b1 = mk('王强 & 李雪婚礼', '婚礼', '2026-10-01', '王强', 'in', '锦江饭店 三楼宴会厅')
      const b2 = mk('新居乔迁', '乔迁', '2026-08-18', '王强', 'in', '新家')
      const b3 = mk('张三结婚', '婚礼', '2025-05-12', '张三', 'out', '望江楼')

      const seed: [Book, string, number, string, string][] = [
        [b1, '张建国', 1000, '同事', ''],
        [b1, '李明', 500, '朋友', ''],
        [b1, '王海', 1000, '亲戚', ''],
        [b1, '刘强', 2000, '同学', ''],
        [b1, '赵伟', 500, '邻居', ''],
        [b1, '张三', 1000, '朋友', ''],
        [b1, '陈晓梅', 600, '同事', ''],
        [b1, '周斌', 800, '朋友', ''],
        [b1, '郑海涛', 1200, '亲戚', ''],
        [b1, '孙丽', 500, '同事', ''],
        [b2, '张三', 1000, '朋友', ''],
        [b2, '李明', 600, '朋友', ''],
        [b2, '王海', 500, '亲戚', ''],
        [b3, '张三', 800, '朋友', ''],
      ]
      const base = Date.now() - seed.length * 60000
      seed.forEach(([book, name, amount, relation], i) => {
        this.addRecord({
          bookId: book.id,
          name,
          amount,
          relation,
          kind: 'cash',
          createdAt: base + i * 60000,
        })
      })
      this.addRecord({
        bookId: b1.id,
        name: '吴老板',
        amount: 0,
        kind: 'gift',
        gift: '五粮液 × 2',
        note: '另送香烟两条',
        relation: '生意伙伴',
        createdAt: base + seed.length * 60000,
      })
    },
  },
})
