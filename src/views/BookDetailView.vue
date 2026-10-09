<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import type { GiftRecord } from '@/types'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { toChineseDate } from '@/utils/date'
import { exportBookExcel } from '@/utils/export'
import AppIcon from '@/components/AppIcon.vue'
import MoneyText from '@/components/MoneyText.vue'
import QuickAddSheet from '@/components/QuickAddSheet.vue'
import RecordSheet from '@/components/RecordSheet.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()
const toast = useToast()

const PAGE_SIZE = 8

const id = computed(() => route.params.id as string)
const book = computed(() => store.getBook(id.value))
const records = computed(() => store.recordsOf(id.value))
const total = computed(() => store.bookTotal(id.value))
const people = computed(() => store.bookPeople(id.value))

const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(records.value.length / PAGE_SIZE)))
const turnDir = ref<'next' | 'prev'>('next')

watch(records, () => {
  if (page.value > pages.value) page.value = pages.value
})

const pageRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  const slice = records.value.slice(start, start + PAGE_SIZE)
  const rows: (GiftRecord | null)[] = [...slice]
  while (rows.length < PAGE_SIZE) rows.push(null)
  return rows
})

const startIndex = computed(() => (page.value - 1) * PAGE_SIZE)

function go(delta: number) {
  const next = page.value + delta
  if (next < 1 || next > pages.value) return
  turnDir.value = delta > 0 ? 'next' : 'prev'
  page.value = next
}

/** 常用关系候选 */
const relations = computed(() => {
  const set = new Set<string>()
  for (const r of records.value) if (r.relation) set.add(r.relation)
  return [...set]
})

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

async function afterQuickClose() {
  await nextTick()
}

watch(quickOpen, (v) => {
  if (!v) {
    editing.value = null
    afterQuickClose()
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
    <div class="topbar no-print">
      <button class="icon-btn" @click="router.push(`/book/${id}/cover`)">
        <AppIcon name="left" :size="19" />
      </button>
      <h1 class="topbar__title">{{ book.name }}</h1>
      <button class="icon-btn" @click="router.push('/search')">
        <AppIcon name="search" :size="18" />
      </button>
      <button class="icon-btn" @click="menuOpen = true">
        <AppIcon name="more" :size="18" />
      </button>
    </div>

    <!-- 概要条 -->
    <div class="summary">
      <span class="summary__item">
        <em class="mono">{{ people }}</em> 人
      </span>
      <span class="summary__dot" />
      <span class="summary__item">
        <em class="mono">{{ records.length }}</em> 笔
      </span>
      <span class="summary__dot" />
      <span class="summary__item summary__item--money">
        <MoneyText :amount="total" size="sm" :toggleable="false" />
      </span>
      <span v-if="book.sealed" class="summary__sealed">
        <AppIcon name="lock" :size="12" /> 已封存
      </span>
    </div>

    <!-- 传统礼簿纸面 -->
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

    <!-- 翻页 -->
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

    <!-- 记一笔 -->
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

    <!-- 更多菜单 -->
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

    <!-- 记礼 / 编辑 -->
    <QuickAddSheet
      :open="quickOpen"
      :book="book"
      :record="editing"
      :relations="relations"
      @close="quickOpen = false"
    />

    <!-- 记录详情 -->
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
.detail {
  padding-bottom: calc(var(--nav-h) + var(--safe-b) + 84px);
}

/* 概要条 */
.summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px 12px;
  font-size: 12.5px;
  color: var(--ink-3);
  flex-wrap: wrap;
}
.summary__item em {
  font-style: normal;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}
.summary__item--money {
  color: var(--red);
  font-weight: 600;
}
.summary__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--line);
}
.summary__sealed {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #8b7a5f;
  font-size: 11.5px;
}

/* ---------- 礼簿纸面 ---------- */
.ledger {
  background: linear-gradient(175deg, #fdf9ef 0%, #f8f1e0 60%, #f3ead6 100%);
  border: 1px solid var(--line);
  border-radius: 6px 14px 14px 6px;
  padding: 8px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 10px 26px rgba(96, 70, 38, 0.14);
  position: relative;
  overflow: hidden;
}
.ledger::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 12px;
  background: linear-gradient(
    90deg,
    rgba(142, 43, 43, 0.16),
    rgba(142, 43, 43, 0.05) 55%,
    transparent
  );
  pointer-events: none;
}
.ledger__frame {
  border: 1px solid var(--line);
  border-radius: 2px 9px 9px 2px;
  padding: 18px 14px 12px;
  position: relative;
}
.ledger__frame::after {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid var(--line-3);
  border-radius: 2px 7px 7px 2px;
  pointer-events: none;
}
.ledger__head {
  text-align: center;
  padding-bottom: 12px;
  position: relative;
}
.ledger__head::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 4px;
  width: 44px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
}
.ledger__title {
  font-size: 18px;
  letter-spacing: 0.18em;
  color: var(--red-deep);
  padding-left: 0.18em;
  line-height: 1.45;
}
.ledger__date {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--ink-2);
  margin-top: 5px;
}
.ledger__place {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 3px;
}

/* 表格 */
.ledger__table {
  margin-top: 10px;
  border-top: 1.5px solid var(--line);
  border-bottom: 1.5px solid var(--line);
  position: relative;
  z-index: 1;
}
.ledger__row {
  display: flex;
  align-items: stretch;
  min-height: 44px;
  border-bottom: 1px solid var(--line-2);
  position: relative;
}
.ledger__rows .ledger__row:last-child {
  border-bottom: none;
}
.ledger__row--head {
  background: rgba(142, 43, 43, 0.045);
  border-bottom: 1.5px solid var(--line);
  min-height: 40px;
}
.ledger__cell {
  display: flex;
  align-items: center;
  padding: 6px 8px;
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
  width: 52px;
  flex: none;
  justify-content: center;
  font-size: 12px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.ledger__cell--name {
  flex: 1;
  font-size: 15.5px;
  letter-spacing: 0.16em;
  color: var(--ink);
  justify-content: center;
  padding-left: 0.16em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ledger__cell--money {
  width: 42%;
  flex: none;
  justify-content: flex-end;
  font-size: 14px;
  color: var(--red-deep);
  padding-right: 10px;
  position: relative;
}
button.ledger__cell--money {
  justify-content: center;
  letter-spacing: 0.16em;
  color: var(--ink-2);
  font-size: 14px;
  background: none;
  gap: 4px;
  padding-right: 8px;
}
.ledger__swap {
  opacity: 0.4;
  display: inline-flex;
}
.ledger__row--head .ledger__cell--money {
  width: 42%;
}
.ledger__gift {
  font-size: 12.5px;
  color: var(--gold);
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ledger__gifttag {
  margin-left: 6px;
  font-size: 9.5px;
  color: #fff6e4;
  background: var(--gold);
  border-radius: 3px;
  padding: 0 3px;
  line-height: 1.5;
  flex: none;
}
.ledger__row--blank .ledger__cell--idx::after {
  content: '';
}
.ledger__row.is-clickable:active {
  background: rgba(142, 43, 43, 0.06);
}
.ledger__foot {
  text-align: center;
  font-size: 11.5px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
  padding-top: 12px;
}

/* 翻页动画 */
.turn-next-enter-active,
.turn-next-leave-active,
.turn-prev-enter-active,
.turn-prev-leave-active {
  transition:
    opacity 0.26s ease,
    transform 0.26s cubic-bezier(0.22, 0.61, 0.36, 1);
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
  margin-top: 16px;
  padding: 0 2px;
}
.pager__btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  color: var(--ink-2);
}
.pager__btn:disabled {
  opacity: 0.35;
}
.pager__dots {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 50%;
}
.pager__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--line);
  transition: all 0.2s;
}
.pager__dot.is-active {
  background: var(--red);
  width: 16px;
  border-radius: 4px;
}

/* 记一笔 */
.actionbar {
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
  transition: transform 0.14s ease;
}
.actionbar__main:active {
  transform: scale(0.982);
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
.menu__item:active {
  background: rgba(142, 43, 43, 0.05);
}
.menu__item--danger {
  color: var(--red);
}
</style>
