<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { useIsDesktop } from '@/composables/useMediaQuery'
import type { GiftRecord } from '@/types'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { toChineseDate, toDisplayDate, timeAgo } from '@/utils/date'
import { exportBookExcel } from '@/utils/export'
import { computeStats } from '@/utils/stats'
import AppIcon from '@/components/AppIcon.vue'
import MoneyText from '@/components/MoneyText.vue'
import QuickAddSheet from '@/components/QuickAddSheet.vue'
import RecordSheet from '@/components/RecordSheet.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()
const toast = useToast()
const isDesktop = useIsDesktop()

const id = computed(() => route.params.id as string)
const book = computed(() => store.getBook(id.value))
const records = computed(() => store.recordsOf(id.value))
const total = computed(() => store.bookTotal(id.value))
const people = computed(() => store.bookPeople(id.value))
const stats = computed(() => computeStats(records.value))

const PAGE_SIZE = computed(() => (isDesktop.value ? 16 : 8))

const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(records.value.length / PAGE_SIZE.value)))
const turnDir = ref<'next' | 'prev'>('next')

watch(records, () => {
  if (page.value > pages.value) page.value = pages.value
})

const pageRows = computed(() => {
  const size = PAGE_SIZE.value
  const start = (page.value - 1) * size
  const slice = records.value.slice(start, start + size)
  const rows: (GiftRecord | null)[] = [...slice]
  while (rows.length < size) rows.push(null)
  return rows
})

const startIndex = computed(() => (page.value - 1) * PAGE_SIZE.value)

function go(delta: number) {
  const next = page.value + delta
  if (next < 1 || next > pages.value) return
  turnDir.value = delta > 0 ? 'next' : 'prev'
  page.value = next
}

/** 桌面端支持方向键翻页 */
function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (quickOpen.value || recordOpen.value || confirmOpen.value || menuOpen.value) return
  if (e.key === 'ArrowRight') go(1)
  if (e.key === 'ArrowLeft') go(-1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const relations = computed(() => {
  const set = new Set<string>()
  for (const r of records.value) if (r.relation) set.add(r.relation)
  return [...set]
})

const recentRecords = computed(() => [...records.value].reverse().slice(0, 6))

// ---------- 交互 ----------
const quickOpen = ref(false)
const editing = ref<GiftRecord | null>(null)
const recordOpen = ref(false)
const activeRecord = ref<GiftRecord | null>(null)
const activeIndex = ref(0)
const confirmOpen = ref(false)
const confirmMode = ref<'seal' | 'delete-record' | 'delete-book'>('seal')
const menuOpen = ref(false)

function onRowClick(r: GiftRecord | null, i: number) {
  if (!r) return
  activeRecord.value = r
  activeIndex.value = startIndex.value + i + 1
  recordOpen.value = true
}

function openQuickAdd() {
  if (book.value?.sealed) {
    toast.error('礼簿已封存，请先解除封存')
    return
  }
  editing.value = null
  quickOpen.value = true
}

function onEditRecord() {
  editing.value = activeRecord.value
  recordOpen.value = false
  quickOpen.value = true
}

function askDeleteRecord() {
  confirmMode.value = 'delete-record'
  confirmOpen.value = true
}

function askSeal() {
  menuOpen.value = false
  if (book.value?.sealed) {
    store.toggleSeal(id.value)
    toast.success('已解除封存')
    return
  }
  confirmMode.value = 'seal'
  confirmOpen.value = true
}

function askDeleteBook() {
  menuOpen.value = false
  confirmMode.value = 'delete-book'
  confirmOpen.value = true
}

function onConfirm() {
  if (confirmMode.value === 'seal') {
    store.toggleSeal(id.value)
    toast.success('礼簿已封存')
  } else if (confirmMode.value === 'delete-record' && activeRecord.value) {
    store.deleteRecord(activeRecord.value.id)
    toast.success('已删除该笔记录')
    recordOpen.value = false
  } else if (confirmMode.value === 'delete-book') {
    store.deleteBook(id.value)
    toast.success('礼簿已删除')
    router.replace('/')
  }
  confirmOpen.value = false
}

function onExport() {
  if (!book.value) return
  menuOpen.value = false
  exportBookExcel(book.value, records.value)
  toast.success('已导出 Excel')
}

watch(quickOpen, async (v) => {
  if (!v) {
    editing.value = null
    await nextTick()
  }
})

function toggleMoneyStyle() {
  store.toggleMoneyStyle()
  toast.show(store.settings.moneyStyle === 'traditional' ? '显示中文大写' : '显示数字金额')
}

const confirmText = computed(() => {
  if (confirmMode.value === 'seal') return '封存后礼簿将不可修改，确定封存这本礼簿吗？'
  if (confirmMode.value === 'delete-record')
    return `将删除「${activeRecord.value?.name}」的这笔记录，删除后不可恢复。`
  return `将删除礼簿「${book.value?.name}」及其全部 ${records.value.length} 笔记录，删除后不可恢复。`
})
</script>

<template>
  <div v-if="book" class="page detail">
    <!-- 顶部工具条 -->
    <header class="topbar no-print">
      <button class="icon-btn" @click="router.push(`/book/${id}/cover`)">
        <AppIcon name="left" :size="19" />
      </button>
      <div style="min-width: 0; flex: 1">
        <h1 class="topbar__title">{{ book.name }}</h1>
        <p class="topbar__sub">
          {{ book.type }} · {{ toDisplayDate(book.date)
          }}<template v-if="book.location"> · {{ book.location }}</template>
          <template v-if="book.sealed"> · 已封存</template>
        </p>
      </div>
      <div class="topbar__actions">
        <button class="btn btn--primary no-m" :disabled="book.sealed" @click="openQuickAdd">
          <AppIcon name="plus" :size="18" />
          记一笔
        </button>
        <button class="icon-btn" title="统计" @click="router.push(`/book/${id}/stats`)">
          <AppIcon name="chart" :size="18" />
        </button>
        <button class="icon-btn no-m" title="导出 Excel" @click="onExport">
          <AppIcon name="download" :size="18" />
        </button>
        <button class="icon-btn" title="更多" @click="menuOpen = true">
          <AppIcon name="more" :size="18" />
        </button>
      </div>
    </header>

    <div class="detail-grid">
      <!-- 左：礼簿纸面 -->
      <div class="detail-grid__main">
        <div class="ledger">
          <div class="ledger__frame">
            <header class="ledger__head">
              <h2 class="ledger__title serif">{{ book.name }}</h2>
              <p class="ledger__date serif">{{ toChineseDate(book.date) }}</p>
              <p v-if="book.location" class="ledger__place">{{ book.location }}</p>
            </header>

            <div class="ledger__table">
              <div class="ledger__row ledger__row--head">
                <span class="ledger__cell ledger__cell--idx serif">序号</span>
                <span class="ledger__cell ledger__cell--name serif">姓　名</span>
                <span class="ledger__cell ledger__cell--rel serif">关　系</span>
                <button class="ledger__cell ledger__cell--money serif" @click="toggleMoneyStyle">
                  礼　金
                  <span class="ledger__swap"><AppIcon name="swap" :size="12" /></span>
                </button>
              </div>

              <Transition :name="turnDir === 'next' ? 'turn-next' : 'turn-prev'" mode="out-in">
                <div :key="page" class="ledger__rows">
                  <div
                    v-for="(r, i) in pageRows"
                    :key="r ? r.id : `blank-${i}`"
                    class="ledger__row"
                    :class="{ 'ledger__row--blank': !r, 'is-clickable': !!r }"
                    @click="onRowClick(r, i)"
                  >
                    <span class="ledger__cell ledger__cell--idx serif mono">
                      {{ r ? String(startIndex + i + 1).padStart(2, '0') : '' }}
                    </span>
                    <span class="ledger__cell ledger__cell--name serif">{{ r ? r.name : '' }}</span>
                    <span class="ledger__cell ledger__cell--rel">{{ r?.relation || '' }}</span>
                    <span class="ledger__cell ledger__cell--money">
                      <template v-if="r">
                        <MoneyText
                          v-if="Number(r.amount) > 0"
                          :amount="r.amount"
                          size="sm"
                          :toggleable="false"
                        />
                        <span v-else class="ledger__gift serif">{{ r.gift || '礼品' }}</span>
                        <span v-if="Number(r.amount) > 0 && r.gift" class="ledger__gifttag">礼</span>
                      </template>
                    </span>
                  </div>
                </div>
              </Transition>
            </div>

            <footer class="ledger__foot serif">
              第 {{ page }} 页 / 共 {{ pages }} 页
            </footer>
          </div>
        </div>

        <div v-if="pages > 1" class="pager no-print">
          <button class="pager__btn" :disabled="page <= 1" @click="go(-1)">
            <AppIcon name="left" :size="16" /> 上一页
          </button>
          <div class="pager__dots">
            <span
              v-for="p in pages"
              :key="p"
              class="pager__dot"
              :class="{ 'is-active': p === page }"
              @click="p !== page && (turnDir = p > page ? 'next' : 'prev', (page = p))"
            />
          </div>
          <button class="pager__btn" :disabled="page >= pages" @click="go(1)">
            下一页 <AppIcon name="right" :size="16" />
          </button>
        </div>
        <p v-if="isDesktop && pages > 1" class="kbd-hint no-print">← → 方向键翻页</p>

        <!-- 移动端：记一笔 -->
        <div class="actionbar no-print">
          <button v-if="!book.sealed" class="actionbar__main" @click="openQuickAdd">
            <AppIcon name="plus" :size="19" />
            <span>记一笔</span>
            <em class="actionbar__hint">姓名 + 金额，秒记</em>
          </button>
          <button v-else class="actionbar__main actionbar__main--sealed" @click="askSeal">
            <AppIcon name="unlock" :size="19" />
            <span>解除封存</span>
            <em class="actionbar__hint">封存状态下不可修改</em>
          </button>
        </div>
      </div>

      <!-- 右：概览面板 -->
      <aside class="detail-grid__side no-print">
        <section class="panel">
          <div class="panel__head">
            <h3>本簿概览</h3>
            <span class="dim mono">{{ records.length }} 笔</span>
          </div>
          <div class="ov__main">
            <span class="ov__label">礼金总额</span>
            <strong class="ov__num mono">{{ formatMoney(total) }}</strong>
            <span class="ov__cn serif">{{ stats.totalCN }}</span>
          </div>
          <div class="ov__grid">
            <div class="ov__cell">
              <em class="mono">{{ people }}</em><span>登记人数</span>
            </div>
            <div class="ov__cell">
              <em class="mono">{{ stats.average ? formatMoney(stats.average) : '—' }}</em
              ><span>平均礼金</span>
            </div>
            <div class="ov__cell">
              <em class="mono">{{ stats.max ? formatMoney(stats.max) : '—' }}</em><span>最高礼金</span>
            </div>
            <div class="ov__cell">
              <em class="mono">{{ stats.giftCount }}</em><span>礼品数量</span>
            </div>
          </div>
          <button class="btn btn--ghost btn--sm btn--block" @click="router.push(`/book/${id}/stats`)">
            <AppIcon name="chart" :size="15" /> 查看完整统计
          </button>
        </section>

        <section class="panel">
          <div class="panel__head"><h3>最近登记</h3></div>
          <ul v-if="recentRecords.length" class="recent">
            <li
              v-for="r in recentRecords"
              :key="r.id"
              class="recent__item"
              @click="activeRecord = r; recordOpen = true"
            >
              <span class="recent__avatar serif">{{ r.name.slice(0, 1) }}</span>
              <span class="recent__main">
                <span class="recent__name serif">{{ r.name }}</span>
                <span class="recent__time">{{ timeAgo(r.createdAt) }}</span>
              </span>
              <span class="recent__amount mono">
                {{ Number(r.amount) > 0 ? formatMoney(r.amount) : r.gift || '礼品' }}
              </span>
            </li>
          </ul>
          <p v-else class="dim" style="font-size: 13px">还没有登记记录</p>
        </section>

        <section class="panel">
          <div class="panel__head"><h3>礼簿操作</h3></div>
          <div class="ops">
            <button class="ops__item" @click="router.push(`/book/${id}/edit`)">
              <AppIcon name="edit" :size="17" /> 编辑礼簿信息
            </button>
            <button class="ops__item" @click="router.push(`/book/${id}/print`)">
              <AppIcon name="print" :size="17" /> 打印 / 导出 PDF
            </button>
            <button class="ops__item" @click="askSeal">
              <AppIcon :name="book.sealed ? 'unlock' : 'lock'" :size="17" />
              {{ book.sealed ? '解除封存' : '封存礼簿' }}
            </button>
            <button class="ops__item ops__item--danger" @click="askDeleteBook">
              <AppIcon name="trash" :size="17" /> 删除礼簿
            </button>
          </div>
        </section>
      </aside>
    </div>

    <!-- 更多菜单（移动端） -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="menuOpen" class="mask" @click="menuOpen = false" />
      </Transition>
      <Transition name="slide">
        <div v-if="menuOpen" class="sheet">
          <div class="sheet__grip" />
          <h3 class="sheet__title">礼簿操作</h3>
          <div class="menu">
            <button class="menu__item" @click="menuOpen = false; router.push(`/book/${id}/stats`)">
              <AppIcon name="chart" :size="19" /><span>查看统计</span>
            </button>
            <button class="menu__item" @click="menuOpen = false; router.push(`/book/${id}/edit`)">
              <AppIcon name="edit" :size="19" /><span>编辑礼簿信息</span>
            </button>
            <button class="menu__item" @click="onExport">
              <AppIcon name="download" :size="19" /><span>导出 Excel</span>
            </button>
            <button class="menu__item" @click="menuOpen = false; router.push(`/book/${id}/print`)">
              <AppIcon name="print" :size="19" /><span>打印 / 导出 PDF</span>
            </button>
            <button class="menu__item" @click="askSeal">
              <AppIcon :name="book.sealed ? 'unlock' : 'lock'" :size="19" />
              <span>{{ book.sealed ? '解除封存' : '封存礼簿' }}</span>
            </button>
            <button class="menu__item menu__item--danger" @click="askDeleteBook">
              <AppIcon name="trash" :size="19" /><span>删除礼簿</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <QuickAddSheet
      :open="quickOpen"
      :book="book"
      :record="editing"
      :relations="relations"
      @close="quickOpen = false"
    />

    <RecordSheet
      :open="recordOpen"
      :record="activeRecord"
      :index="activeIndex"
      @close="recordOpen = false"
      @edit="onEditRecord"
      @remove="askDeleteRecord"
    />

    <ConfirmDialog
      :open="confirmOpen"
      :title="
        confirmMode === 'delete-book' ? '删除礼簿' : confirmMode === 'seal' ? '封存礼簿' : '删除记录'
      "
      :message="confirmText"
      :confirm-text="confirmMode === 'seal' ? '确认封存' : '确认删除'"
      danger
      @cancel="confirmOpen = false"
      @confirm="onConfirm"
    />
  </div>

  <div v-else class="page">
    <div class="empty">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">礼簿不存在</p>
      <button class="btn btn--ghost" style="margin-top: 14px" @click="router.replace('/')">
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ---------- 双击分栏 ---------- */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 336px;
  gap: 24px;
  align-items: start;
}
.detail-grid__main {
  min-width: 0;
}
.detail-grid__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 24px;
}
.detail-grid__side .btn--block {
  margin-top: 16px;
}

/* ---------- 礼簿纸面 ---------- */
.ledger {
  background: linear-gradient(175deg, #fdfaf1 0%, #f9f2e2 60%, #f4ebd8 100%);
  border: 1px solid var(--line);
  border-radius: 6px 16px 16px 6px;
  padding: 10px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 10px 30px rgba(96, 70, 38, 0.13);
  position: relative;
  overflow: hidden;
}
.ledger::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 14px;
  background: linear-gradient(
    90deg,
    rgba(142, 43, 43, 0.15),
    rgba(142, 43, 43, 0.045) 55%,
    transparent
  );
  pointer-events: none;
}
.ledger__frame {
  border: 1px solid var(--line);
  border-radius: 2px 10px 10px 2px;
  padding: 26px 26px 16px;
  position: relative;
}
.ledger__frame::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid var(--line-3);
  border-radius: 2px 8px 8px 2px;
  pointer-events: none;
}
.ledger__head {
  text-align: center;
  padding-bottom: 18px;
  position: relative;
}
.ledger__head::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 6px;
  width: 52px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
}
.ledger__title {
  font-size: 22px;
  letter-spacing: 0.2em;
  color: var(--red-deep);
  padding-left: 0.2em;
  line-height: 1.45;
}
.ledger__date {
  font-size: 13px;
  letter-spacing: 0.16em;
  color: var(--ink-2);
  margin-top: 8px;
}
.ledger__place {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 4px;
}

/* 表格 */
.ledger__table {
  margin-top: 12px;
  border-top: 1.5px solid var(--line);
  border-bottom: 1.5px solid var(--line);
  position: relative;
  z-index: 1;
}
.ledger__row {
  display: flex;
  align-items: stretch;
  min-height: 46px;
  border-bottom: 1px solid var(--line-2);
  position: relative;
}
.ledger__rows .ledger__row:last-child {
  border-bottom: none;
}
.ledger__row--head {
  background: rgba(142, 43, 43, 0.045);
  border-bottom: 1.5px solid var(--line);
  min-height: 42px;
}
.ledger__cell {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  position: relative;
  min-width: 0;
}
.ledger__cell + .ledger__cell::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: var(--line-2);
}
.ledger__cell--idx {
  width: 60px;
  flex: none;
  justify-content: center;
  font-size: 12.5px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.ledger__cell--name {
  flex: 1;
  font-size: 16px;
  letter-spacing: 0.18em;
  color: var(--ink);
  justify-content: center;
  padding-left: 0.18em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ledger__cell--rel {
  width: 84px;
  flex: none;
  justify-content: center;
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
}
.ledger__cell--money {
  width: 32%;
  flex: none;
  justify-content: flex-end;
  font-size: 14.5px;
  color: var(--red-deep);
  padding-right: 16px;
}
button.ledger__cell--money {
  justify-content: center;
  letter-spacing: 0.16em;
  color: var(--ink-2);
  font-size: 14px;
  background: none;
  gap: 5px;
  padding-right: 12px;
}
.ledger__swap {
  opacity: 0.4;
  display: inline-flex;
}
.ledger__gift {
  font-size: 13px;
  color: var(--gold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ledger__gifttag {
  margin-left: 7px;
  font-size: 9.5px;
  color: #fff6e4;
  background: var(--gold);
  border-radius: 3px;
  padding: 0 3px;
  line-height: 1.5;
  flex: none;
}
.ledger__row.is-clickable {
  cursor: pointer;
}
.ledger__row.is-clickable:hover {
  background: rgba(142, 43, 43, 0.05);
}
.ledger__foot {
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  padding-top: 16px;
}

/* 翻页动画 */
.turn-next-enter-active,
.turn-next-leave-active,
.turn-prev-enter-active,
.turn-prev-leave-active {
  transition: opacity 0.24s ease, transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.turn-next-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.turn-next-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
.turn-prev-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}
.turn-prev-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

/* 翻页控件 */
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
  padding: 0 2px;
}
.pager__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  background: rgba(255, 255, 255, 0.66);
  font-size: 13.5px;
  color: var(--ink-2);
}
.pager__btn:hover:not(:disabled) {
  background: #fff;
  color: var(--red);
  border-color: var(--line);
}
.pager__btn:disabled {
  opacity: 0.35;
}
.pager__dots {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 60%;
}
.pager__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--line);
  transition: all 0.2s;
  cursor: pointer;
}
.pager__dot.is-active {
  background: var(--red);
  width: 18px;
  border-radius: 4px;
}
.kbd-hint {
  text-align: center;
  font-size: 11.5px;
  color: var(--ink-4);
  margin-top: 10px;
  letter-spacing: 0.1em;
}

/* 概览面板 */
.ov__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 0 18px;
  border-bottom: 1px dashed var(--line-2);
}
.ov__label {
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.14em;
}
.ov__num {
  font-size: 27px;
  font-weight: 700;
  color: var(--red);
  line-height: 1.2;
}
.ov__cn {
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.ov__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 8px;
  padding-top: 16px;
}
.ov__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}
.ov__cell em {
  font-style: normal;
  font-size: 15.5px;
  font-weight: 600;
}
.ov__cell span {
  font-size: 11px;
  color: var(--ink-3);
}

/* 最近登记 */
.recent {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.recent__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 6px;
  border-radius: 10px;
  cursor: pointer;
}
.recent__item:hover {
  background: rgba(142, 43, 43, 0.05);
}
.recent__avatar {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--red-wash);
  color: var(--red);
  border: 1px solid #e6cdc8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13.5px;
  flex: none;
}
.recent__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.recent__name {
  font-size: 14px;
  letter-spacing: 0.05em;
}
.recent__time {
  font-size: 10.5px;
  color: var(--ink-3);
}
.recent__amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--red);
  flex: none;
}

/* 操作列表 */
.ops {
  display: flex;
  flex-direction: column;
}
.ops__item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--ink-2);
  text-align: left;
}
.ops__item:hover {
  background: rgba(142, 43, 43, 0.05);
  color: var(--ink);
}
.ops__item--danger {
  color: var(--red);
}
.ops__item--danger:hover {
  background: var(--red-wash);
}

/* 记一笔（移动端浮层） */
.actionbar {
  display: none;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(var(--nav-h) + var(--safe-b) + 14px);
  width: min(calc(100% - 36px), 424px);
  z-index: 40;
}
.actionbar__main {
  width: 100%;
  height: 58px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: #fdf6e6;
  background: linear-gradient(180deg, #9c3535, #7a2323);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.24) inset,
    0 10px 26px rgba(122, 35, 35, 0.36);
  position: relative;
}
.actionbar__hint {
  position: absolute;
  right: 18px;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  letter-spacing: 0.06em;
  color: rgba(253, 246, 230, 0.62);
}
.actionbar__main--sealed {
  background: linear-gradient(180deg, #b09a72, #8d7752);
  box-shadow: 0 10px 26px rgba(120, 100, 60, 0.3);
}

/* 菜单 */
.menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.menu__item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 15px;
  color: var(--ink);
  text-align: left;
}
.menu__item:hover {
  background: rgba(142, 43, 43, 0.05);
}
.menu__item--danger {
  color: var(--red);
}

/* ---------- 移动端 ---------- */
@media (max-width: 959px) {
  .detail {
    padding-bottom: calc(var(--nav-h) + var(--safe-b) + 84px);
  }
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
  .detail-grid__side {
    display: none;
  }
  .ledger {
    border-radius: 6px 14px 14px 6px;
    padding: 8px;
  }
  .ledger__frame {
    padding: 18px 14px 12px;
  }
  .ledger__title {
    font-size: 18px;
    letter-spacing: 0.18em;
  }
  .ledger__row {
    min-height: 44px;
  }
  .ledger__cell--rel {
    display: none;
  }
  .ledger__cell--idx {
    width: 52px;
  }
  .ledger__cell--money {
    width: 42%;
    padding-right: 10px;
  }
  .actionbar {
    display: block;
  }
}
</style>
