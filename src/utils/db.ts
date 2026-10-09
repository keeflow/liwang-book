/**
 * 礼往 · 本地存储层（IndexedDB）
 *
 * 使用一个名为 `kv` 的对象仓库做键值存取，键名与旧版 localStorage 保持一致，
 * 便于首次启动时从 localStorage 平滑迁移。
 */

const DB_NAME = 'liwang-book'
const DB_VERSION = 1
const STORE_NAME = 'kv'

/** 旧版 localStorage 键名 */
export const LEGACY_KEYS = ['liwang.books.v1', 'liwang.records.v1', 'liwang.settings.v1'] as const
const MIGRATION_FLAG = 'liwang.migrated.idb.v1'

let dbPromise: Promise<IDBDatabase> | null = null

export function isSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!isSupported()) {
      reject(new Error('当前环境不支持 IndexedDB'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 打开失败'))
    req.onblocked = () => reject(new Error('IndexedDB 被其他标签页阻塞'))
  })
  return dbPromise
}

/** 在一个事务中执行操作，自动处理成功 / 失败 / 事务中止 */
function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE_NAME, mode)
        let result: unknown
        t.oncomplete = () => resolve(result as T)
        t.onabort = () => reject(t.error ?? new Error('IndexedDB 事务中止'))
        t.onerror = () => reject(t.error ?? new Error('IndexedDB 事务失败'))
        try {
          const req = action(t.objectStore(STORE_NAME))
          req.onsuccess = () => {
            result = req.result
          }
        } catch (e) {
          reject(e)
        }
      }),
  )
}

/** 读取，不存在返回 undefined */
export function idbGet<T>(key: string): Promise<T | undefined> {
  return run<unknown>('readonly', (store) => store.get(key)).then((v) => v as T | undefined)
}

/**
 * 写入。注意：Pinia 的响应式对象是 Proxy，无法被结构化克隆，
 * 这里统一做一次 JSON 序列化，落库的一定是纯数据。
 */
export function idbSet(key: string, value: unknown): Promise<void> {
  const plain = value === undefined ? undefined : JSON.parse(JSON.stringify(value))
  return run<void>('readwrite', (store) => store.put(plain, key))
}

export function idbDel(key: string): Promise<void> {
  return run<void>('readwrite', (store) => store.delete(key))
}

export function idbClear(): Promise<void> {
  return run<void>('readwrite', (store) => store.clear())
}

/**
 * 首次启动时把旧版 localStorage 里的数据搬进 IndexedDB。
 * 只在没有迁移标记时执行一次；迁移完成后保留 localStorage 旧数据作为冷备份，不再读写。
 * @returns 是否真的迁移了数据
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    if (!isSupported()) return false
    if (localStorage.getItem(MIGRATION_FLAG)) return false

    const existing = await idbGet<unknown>(LEGACY_KEYS[0])
    let moved = false

    // 库里已有数据则不覆盖，直接打标记
    if (existing === undefined) {
      for (const key of LEGACY_KEYS) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        try {
          await idbSet(key, JSON.parse(raw))
          moved = true
        } catch (e) {
          console.warn('[礼往] 迁移失败：', key, e)
        }
      }
    }

    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString())
    return moved
  } catch (e) {
    console.warn('[礼往] localStorage 迁移检查失败', e)
    return false
  }
}
