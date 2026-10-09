<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { computeStats } from '@/utils/stats'
import { formatMoney } from '@/utils/cny'
import { toDisplayDate } from '@/utils/date'
import { exportBookExcel } from '@/utils/export'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()
const toast = useToast()

const id = computed(() => route.params.id as string)
const book = computed(() => store.getBook(id.value))
const records = computed(() => store.recordsOf(id.value))
const stats = computed(() => computeStats(records.value))

const maxCount = computed(() =>
  stats.value.distribution.length ? Math.max(...stats.value.distribution.map((d) => d.count)) : 1,
)
const maxRel = computed(() =>
  stats.value.relations.length ? Math.max(...stats.value.relations.map((d) => d.count)) : 1,
)

const progress = computed(() => {
  const total = stats.value.total
  if (!total) return 0
  const top = stats.value.distribution.slice(0, 5).reduce((s, d) => s + d.amount * d.count, 0)
  return Math.min(100, Math.round((top / total) * 100))
})

function onExport() {
  if (book.value) {
    exportBookExcel(book.value, records.value)
    toast.success('已导出 Excel')
  }
}
</script>

<template>
  <div v-if="book" class="page">
    <div class="topbar">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <h1 class="topbar__title">统计</h1>
      <button class="icon-btn" @click="onExport">
        <AppIcon name="download" :size="18" />
      </button>
    </div>

    <p class="stat-book">{{ book.name }} · {{ toDisplayDate(book.date) }}</p>

    <!-- 总额 -->
    <section class="hero">
      <span class="hero__label">礼金总额</span>
      <strong class="hero__num mono">{{ formatMoney(stats.total) }}</strong>
      <span class="hero__cn serif">{{ stats.totalCN }}</span>
      <div class="hero__grid">
        <div class="hero__cell">
          <em class="mono">{{ stats.people }}</em>
          <span>登记人数</span>
        </div>
        <div class="hero__cell">
          <em class="mono">{{ stats.count }}</em>
          <span>礼金笔数</span>
        </div>
        <div class="hero__cell">
          <em class="mono">{{ stats.giftCount }}</em>
          <span>礼品数量</span>
        </div>
      </div>
    </section>

    <div class="duo">
      <div class="mini-card">
        <span class="mini-card__label">平均礼金</span>
        <strong class="mini-card__num mono">{{ formatMoney(stats.average) }}</strong>
      </div>
      <div class="mini-card">
        <span class="mini-card__label">最高礼金</span>
        <strong class="mini-card__num mono">{{ formatMoney(stats.max) }}</strong>
        <span v-if="stats.maxName" class="mini-card__sub">{{ stats.maxName }}</span>
      </div>
    </div>

    <!-- 常见金额 -->
    <section class="panel">
      <header class="panel__head">
        <h2>常见金额</h2>
        <span class="dim">前五档占总额 {{ progress }}%</span>
      </header>
      <div v-if="stats.distribution.length" class="bars">
        <div v-for="d in stats.distribution.slice(0, 8)" :key="d.amount" class="bar">
          <span class="bar__label mono">{{ formatMoney(d.amount) }}</span>
          <span class="bar__track">
            <i class="bar__fill" :style="{ width: (d.count / maxCount) * 100 + '%' }" />
          </span>
          <span class="bar__count mono">{{ d.count }}人</span>
        </div>
      </div>
      <p v-else class="dim" style="font-size: 13px">暂无礼金记录</p>
    </section>

    <!-- 关系分布 -->
    <section v-if="stats.relations.length" class="panel">
      <header class="panel__head">
        <h2>关系分布</h2>
      </header>
      <div class="bars">
        <div v-for="r in stats.relations.slice(0, 8)" :key="r.name" class="bar">
          <span class="bar__label bar__label--text">{{ r.name }}</span>
          <span class="bar__track">
            <i class="bar__fill bar__fill--gold" :style="{ width: (r.count / maxRel) * 100 + '%' }" />
          </span>
          <span class="bar__count mono">{{ r.count }}人</span>
        </div>
      </div>
    </section>

    <!-- 榜单 -->
    <section v-if="records.length" class="panel">
      <header class="panel__head"><h2>礼金前十</h2></header>
      <ol class="rank">
        <li
          v-for="(r, i) in [...records].sort((a, b) => b.amount - a.amount).slice(0, 10)"
          :key="r.id"
          class="rank__item"
        >
          <span class="rank__no" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
          <span class="rank__name serif">{{ r.name }}</span>
          <span class="rank__rel dim">{{ r.relation || '' }}</span>
          <span class="rank__amount mono">{{ formatMoney(r.amount) }}</span>
        </li>
      </ol>
    </section>

    <button class="btn btn--ghost btn--block" style="margin-top: 20px" @click="onExport">
      <AppIcon name="download" :size="18" /> 导出 Excel
    </button>
  </div>

  <div v-else class="page">
    <div class="empty">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">礼簿不存在</p>
    </div>
  </div>
</template>

<style scoped>
.stat-book {
  font-size: 13px;
  color: var(--ink-3);
  padding: 0 4px 14px;
}

.hero {
  border-radius: 20px;
  padding: 24px 22px 18px;
  background: linear-gradient(160deg, #9c3535 0%, #832929 55%, #6b1e1e 100%);
  color: #fdf6e6;
  box-shadow: 0 14px 34px rgba(122, 35, 35, 0.28);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: '';
  position: absolute;
  right: -40px;
  top: -40px;
  width: 140px;
  height: 140px;
  border: 1px solid rgba(211, 179, 101, 0.3);
  border-radius: 50%;
}
.hero__label {
  font-size: 12px;
  letter-spacing: 0.24em;
  color: rgba(250, 235, 205, 0.7);
  padding-left: 0.24em;
}
.hero__num {
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
  margin-top: 6px;
}
.hero__cn {
  font-size: 12.5px;
  color: rgba(250, 235, 205, 0.78);
  letter-spacing: 0.12em;
  margin-top: 4px;
}
.hero__grid {
  display: flex;
  width: 100%;
  margin-top: 22px;
  border-top: 1px solid rgba(250, 235, 205, 0.22);
  padding-top: 16px;
}
.hero__cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.hero__cell + .hero__cell {
  border-left: 1px solid rgba(250, 235, 205, 0.16);
}
.hero__cell em {
  font-style: normal;
  font-size: 21px;
  font-weight: 700;
}
.hero__cell span {
  font-size: 11.5px;
  color: rgba(250, 235, 205, 0.68);
}

.duo {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}
.mini-card {
  flex: 1;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: var(--shadow-sm);
}
.mini-card__label {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
}
.mini-card__num {
  font-size: 22px;
  font-weight: 700;
  color: var(--red);
}
.mini-card__sub {
  font-size: 11.5px;
  color: var(--ink-3);
}

.panel {
  margin-top: 16px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: var(--shadow-sm);
}
.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel__head h2 {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.1em;
}
.panel__head span {
  font-size: 11.5px;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bar__label {
  width: 66px;
  flex: none;
  font-size: 12.5px;
  color: var(--ink-2);
  text-align: right;
}
.bar__label--text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar__track {
  flex: 1;
  height: 9px;
  border-radius: 999px;
  background: var(--paper-deep);
  overflow: hidden;
}
.bar__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #b04a3f, #8e2b2b);
  transition: width 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
  min-width: 4px;
}
.bar__fill--gold {
  background: linear-gradient(90deg, #d3b365, #b18a2f);
}
.bar__count {
  width: 42px;
  flex: none;
  font-size: 12px;
  color: var(--ink-3);
}

.rank {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rank__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 2px;
  border-bottom: 1px dashed var(--line-3);
}
.rank__item:last-child {
  border-bottom: none;
}
.rank__no {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  background: var(--paper-deep);
  color: var(--ink-2);
  flex: none;
}
.rank__no.is-top {
  background: var(--red-wash);
  color: var(--red);
  font-weight: 700;
}
.rank__name {
  font-size: 14.5px;
  letter-spacing: 0.06em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank__rel {
  font-size: 11.5px;
  flex: 1;
}
.rank__amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--red);
}
</style>
