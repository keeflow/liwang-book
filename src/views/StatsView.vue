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

const top10 = computed(() => [...records.value].sort((a, b) => b.amount - a.amount).slice(0, 10))

function onExport() {
  if (book.value) {
    exportBookExcel(book.value, records.value)
    toast.success('已导出 Excel')
  }
}
</script>

<template>
  <div v-if="book" class="page">
    <header class="topbar">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <div style="min-width: 0">
        <h1 class="topbar__title">统计</h1>
        <p class="topbar__sub">{{ book.name }} · {{ toDisplayDate(book.date) }}</p>
      </div>
      <div class="topbar__actions">
        <button class="btn btn--ghost" @click="onExport">
          <AppIcon name="download" :size="17" /> 导出 Excel
        </button>
      </div>
    </header>

    <!-- 总额 -->
    <section class="hero">
      <div class="hero__main">
        <span class="hero__label">礼金总额</span>
        <strong class="hero__num mono">{{ formatMoney(stats.total) }}</strong>
        <span class="hero__cn serif">{{ stats.totalCN }}</span>
      </div>
      <div class="hero__stats">
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
        <div class="hero__cell">
          <em class="mono">{{ stats.max ? formatMoney(stats.max) : '—' }}</em>
          <span>最高礼金</span>
        </div>
      </div>
    </section>

    <!-- 仪表盘 -->
    <div class="dash">
      <section class="panel dash__wide">
        <div class="panel__head">
          <h2>常见金额</h2>
          <span class="dim">前五档占总额 {{ progress }}%</span>
        </div>
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

      <section class="panel">
        <div class="panel__head"><h2>平均与最高</h2></div>
        <div class="kv">
          <div class="kv__item">
            <span>平均礼金</span>
            <strong class="mono">{{ formatMoney(stats.average) }}</strong>
          </div>
          <div class="kv__item">
            <span>最高礼金</span>
            <strong class="mono">{{ formatMoney(stats.max) }}</strong>
            <em v-if="stats.maxName">{{ stats.maxName }}</em>
          </div>
          <div class="kv__item">
            <span>礼金笔数</span>
            <strong class="mono">{{ stats.count }} 笔</strong>
          </div>
          <div class="kv__item">
            <span>人均礼金</span>
            <strong class="mono">
              {{ formatMoney(stats.people ? Math.round(stats.total / stats.people) : 0) }}
            </strong>
          </div>
        </div>
      </section>

      <section class="panel dash__wide">
        <div class="panel__head">
          <h2>礼金前十</h2>
          <span class="dim">按金额排序</span>
        </div>
        <ol v-if="top10.length" class="rank">
          <li v-for="(r, i) in top10" :key="r.id" class="rank__item">
            <span class="rank__no" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
            <span class="rank__name serif">{{ r.name }}</span>
            <span class="rank__rel dim">{{ r.relation || '' }}</span>
            <span class="rank__gift dim">{{ r.gift || '' }}</span>
            <span class="rank__amount mono">{{ formatMoney(r.amount) }}</span>
          </li>
        </ol>
        <p v-else class="dim" style="font-size: 13px">暂无记录</p>
      </section>

      <section class="panel">
        <div class="panel__head"><h2>关系分布</h2></div>
        <div v-if="stats.relations.length" class="bars">
          <div v-for="r in stats.relations.slice(0, 8)" :key="r.name" class="bar">
            <span class="bar__label bar__label--text">{{ r.name }}</span>
            <span class="bar__track">
              <i
                class="bar__fill bar__fill--gold"
                :style="{ width: (r.count / maxRel) * 100 + '%' }"
              />
            </span>
            <span class="bar__count mono">{{ r.count }}人</span>
          </div>
        </div>
        <p v-else class="dim" style="font-size: 13px">暂无关系数据</p>
      </section>
    </div>
  </div>

  <div v-else class="page">
    <div class="empty">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">礼簿不存在</p>
    </div>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: 24px;
  align-items: center;
  border-radius: 22px;
  padding: 28px 30px;
  background: linear-gradient(160deg, #9c3535 0%, #832929 55%, #6b1e1e 100%);
  color: #fdf6e6;
  box-shadow: 0 14px 34px rgba(122, 35, 35, 0.26);
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: '';
  position: absolute;
  right: -50px;
  top: -50px;
  width: 170px;
  height: 170px;
  border: 1px solid rgba(211, 179, 101, 0.28);
  border-radius: 50%;
}
.hero__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hero__label {
  font-size: 12px;
  letter-spacing: 0.26em;
  color: rgba(250, 235, 205, 0.7);
}
.hero__num {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.01em;
}
.hero__cn {
  font-size: 12.5px;
  color: rgba(250, 235, 205, 0.78);
  letter-spacing: 0.12em;
}
.hero__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-left: 1px solid rgba(250, 235, 205, 0.22);
  padding-left: 24px;
}
.hero__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.hero__cell + .hero__cell {
  border-left: 1px solid rgba(250, 235, 205, 0.14);
}
.hero__cell em {
  font-style: normal;
  font-size: 20px;
  font-weight: 700;
}
.hero__cell span {
  font-size: 11.5px;
  color: rgba(250, 235, 205, 0.68);
}

/* 仪表盘 */
.dash {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
  align-items: start;
}
.dash__wide {
  grid-column: span 2;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bar__label {
  width: 76px;
  flex: none;
  font-size: 13px;
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
  height: 10px;
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
  width: 48px;
  flex: none;
  font-size: 12.5px;
  color: var(--ink-3);
}

.kv {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.kv__item {
  background: var(--paper-3);
  border: 1px solid var(--line-3);
  border-radius: 13px;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kv__item span {
  font-size: 11.5px;
  color: var(--ink-3);
}
.kv__item strong {
  font-size: 18px;
  font-weight: 700;
  color: var(--red);
}
.kv__item em {
  font-style: normal;
  font-size: 11px;
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
  gap: 12px;
  padding: 10px 4px;
  border-bottom: 1px dashed var(--line-3);
}
.rank__item:last-child {
  border-bottom: none;
}
.rank__no {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
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
  width: 96px;
  flex: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank__rel {
  font-size: 11.5px;
  width: 70px;
  flex: none;
}
.rank__gift {
  font-size: 11.5px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank__amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--red);
  flex: none;
  margin-left: auto;
}

/* ---------- 移动端 ---------- */
@media (max-width: 959px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    padding: 22px 20px;
    gap: 18px;
  }
  .hero__num {
    font-size: 34px;
  }
  .hero__stats {
    border-left: none;
    border-top: 1px solid rgba(250, 235, 205, 0.22);
    padding-left: 0;
    padding-top: 16px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 0;
  }
  .hero__cell:nth-child(odd) {
    border-left: none;
  }
  .dash {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
  .dash__wide {
    grid-column: span 1;
  }
  .rank__name {
    width: 72px;
  }
  .rank__rel {
    width: 56px;
  }
}
</style>
