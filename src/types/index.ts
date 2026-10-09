/** 礼簿宴席类型 */
export type BookType =
  | '婚礼'
  | '满月'
  | '百日'
  | '周岁'
  | '生日'
  | '乔迁'
  | '寿宴'
  | '白事'
  | '其他'

export const BOOK_TYPES: BookType[] = [
  '婚礼',
  '满月',
  '百日',
  '周岁',
  '生日',
  '乔迁',
  '寿宴',
  '白事',
  '其他',
]

/** 礼簿方向：收礼（我办席） / 送礼（我赴席） */
export type BookDirection = 'in' | 'out'

export interface Book {
  id: string
  /** 礼簿名称，如「王强 & 李雪婚礼」 */
  name: string
  type: BookType
  /** YYYY-MM-DD */
  date: string
  location?: string
  /** 主人姓名，收礼时为本人/本家，送礼时为对方 */
  host?: string
  note?: string
  direction: BookDirection
  /** 封存后不可修改 */
  sealed: boolean
  createdAt: number
  updatedAt: number
}

/** 一条记录的类型：礼金 / 礼品 / 兼有 */
export type RecordKind = 'cash' | 'gift'

export interface GiftRecord {
  id: string
  bookId: string
  /** 宾客姓名 */
  name: string
  /** 金额，纯礼品时为 0 */
  amount: number
  kind: RecordKind
  /** 礼品描述，如「五粮液 × 2」 */
  gift?: string
  relation?: string
  phone?: string
  note?: string
  /** 登记时间戳 */
  createdAt: number
  /** 登记人员（家庭成员协同时的署名） */
  createdBy?: string
}

/** 聚合出的宾客档案 */
export interface Contact {
  /** 归一化后的 key */
  id: string
  name: string
  phone?: string
  relation?: string
  /** 累计收到（我 -> 对方赠我） */
  received: number
  /** 累计送出（我 -> 赠对方） */
  sent: number
  /** 往来差额 = 收到 - 送出 */
  balance: number
  records: GiftRecord[]
}

/** 一条人情往来记录（含方向） */
export interface DealRow {
  record: GiftRecord
  book: Book
  /** in = 对方赠我；out = 我赠对方 */
  direction: BookDirection
  /** 对方姓名 */
  counterpart: string
}

export interface Settings {
  /** 金额显示模式：traditional = 中文大写优先 */
  moneyStyle: 'traditional' | 'numeric'
  /** 主人/家庭名称，用于封面与导出 */
  familyName?: string
  /** 首页问候语是否展示 */
  greeting: boolean
}

export interface BackupPayload {
  app: 'liwang-book'
  version: 1
  exportedAt: string
  books: Book[]
  records: GiftRecord[]
  settings: Settings
}
