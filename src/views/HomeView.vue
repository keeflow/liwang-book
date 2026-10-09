<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { greeting as greetingFn, toDisplayDate } from '@/utils/date'
import { formatMoney } from '@/utils/cny'
import AppIcon from '@/components/AppIcon.vue'
import MoneyText from '@/components/MoneyText.vue'
import BookCover from '@/components/BookCover.vue'

const router = useRouter()
const store = useLedgerStore()

const greetingText = greetingFn()
const recent = computed(() => store.sortedBooks.slice(0, 6))
const hasMore = computed(() => store.books.length > 6)
const sealedCount = computed(() => store.books.filter((b) => b.sealed).length)
const recordCount = computed(() => store.records.length)
const balance = computed(() => store.totalReceived - store.totalSent)

const kpis = computed(() => [
  { label: '礼簿', value: String(store.books.length), unit: '本', sub: `${sealedCount.value} 本已封存`, to: '/books' },
  { label: '登记记录', value: String(recordCount.value), unit: '笔', sub: `${store.contacts.length} 位宾客`, to: '/books' },
  { label: '累计收礼', value: formatMoney(store.totalReceived), sub: '我办席', to: '/contacts', accent: true },
  { label: '累计送礼', value: formatMoney(store.totalSent), sub: '我赴席', to: '/contacts' },
])
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div style="min-width: 0">
        <h1 class="topbar__title">礼簿</h1>
        <p class="topbar__sub">{{ greetingText }} · 一本礼簿，记下每一次人情往来</p>
      </div>
      <div class="topbar__actions">
        <button class="icon-btn" title="搜索" @click="router.push('/search')">
          <AppIcon name="search" :size="19" />
        </button>
        <button class="btn btn--primary" @click="router.push('/book/new')">
          <AppIcon name="plus" :size="18" />
          新建礼簿
        </button>
      </div>
    </header>

    <!-- 指标 -->
    <section class="kpis">
      <button v-for="k in kpis" :key="k.label" class="kpi" @click="router.push(k.to)">
        <span class="kpi__label">{{ k.label }}</span>
        <strong class="kpi__value mono" :class="{ 'is-accent': k.accent }">
          {{ k.value }}<em v-if="k.unit">{{ k.unit }}</em>
        </strong>
        <span class="kpi__sub">{{ k.sub }}</span>
      </button>
    </section>

    <!-- 最近礼簿 -->
    <div class="section-title">
      <h2>最近礼簿</h2>
      <router-link v-if="hasMore" class="section-title__more" to="/books">
        全部 {{ store.books.length }} 本 →
      </router-link>
      <span v-else-if="store.books.length" class="dim" style="font-size: 12px">
        共 {{ store.books.length }} 本
      </span>
    </div>

    <div v-if="recent.length" class="book-grid">
      <article
        v-for="b in recent"
        :key="b.id"
        class="bookcard"
        :class="{ 'is-sealed': b.sealed }"
        @click="router.push(`/book/${b.id}/cover`)"
      >
        <BookCover :book="b" variant="panel" />
        <div class="bookcard__body">
          <div class="bookcard__line">
            <span class="bookcard__label">人数</span>
            <span class="bookcard__people mono">{{ store.bookPeople(b.id) }} 人</span>
          </div>
          <div class="bookcard__amount">
            <MoneyText :amount="store.bookTotal(b.id)" size="lg" :toggleable="false" />
          </div>
          <div class="bookcard__foot">
            <span v-if="b.sealed" class="bookcard__sealed">
              <AppIcon name="lock" :size="12" /> 已封存
            </span>
            <span v-else class="bookcard__live">
              <i class="dot" /> 记礼中 · {{ store.recordsOf(b.id).length }} 笔
            </span>
            <span v-if="b.direction === 'out'" class="bookcard__dir">送出</span>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty card">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">还没有礼簿</p>
      <p style="font-size: 13.5px">点击「新建礼簿」，为下一场宴席开一本簿子</p>
      <button class="btn btn--primary" style="margin-top: 20px" @click="router.push('/book/new')">
        <AppIcon name="plus" :size="18" /> 新建礼簿
      </button>
    </div>

    <!-- 人情往来 -->
    <div class="section-title">
      <h2>人情往来</h2>
      <router-link class="section-title__more" to="/contacts">查看往来账 →</router-link>
    </div>

    <div class="deals" @click="router.push('/contacts')">
      <div class="deals__col">
        <span class="deals__label">累计收礼</span>
        <strong class="deals__num serif mono">{{ formatMoney(store.totalReceived) }}</strong>
        <span class="deals__hint">亲友赠我</span>
      </div>
      <span class="deals__sep" />
      <div class="deals__col">
        <span class="deals__label">累计送礼</span>
        <strong class="deals__num serif mono">{{ formatMoney(store.totalSent) }}</strong>
        <span class="deals__hint">我赠亲友</span>
      </div>
      <span class="deals__sep" />
      <div class="deals__col">
        <span class="deals__label">往来差额</span>
        <strong
          class="deals__num serif mono"
          :class="balance >= 0 ? 'is-in' : 'is-out'"
        >
          {{ balance >= 0 ? '+' : '' }}{{ formatMoney(balance) }}
        </strong>
        <span class="deals__hint">{{ balance >= 0 ? '收多于送' : '送多于收' }}</span>
      </div>
      <span class="deals__arrow"><AppIcon name="right" :size="20" /></span>
    </div>
  </div>
</template>

<style scoped>
/* 指标 */
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.kpi {
  text-align: left;
  padding: 18px 20px;
  border-radius: 18px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.kpi:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
  border-color: var(--line);
}
.kpi__label {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.kpi__value {
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.15;
}
.kpi__value em {
  font-style: normal;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
  margin-left: 3px;
}
.kpi__value.is-accent {
  color: var(--red);
}
.kpi__sub {
  font-size: 11.5px;
  color: var(--ink-3);
}

/* 礼簿网格 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.bookcard {
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  cursor: pointer;
}
.bookcard:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.bookcard.is-sealed {
  filter: saturate(0.9);
}
.bookcard__body {
  padding: 14px 16px 13px;
}
.bookcard__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.bookcard__label {
  font-size: 11.5px;
  color: var(--ink-3);
}
.bookcard__people {
  font-size: 12.5px;
  color: var(--ink-2);
}
.bookcard__amount {
  margin-top: 4px;
  color: var(--red);
}
.bookcard__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--line-3);
  font-size: 11.5px;
  color: var(--ink-3);
}
.bookcard__sealed {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #8b7a5f;
}
.bookcard__live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--green);
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 3px rgba(46, 125, 91, 0.14);
}
.bookcard__dir {
  margin-left: auto;
  color: var(--red-soft);
}

/* 往来汇总 */
.deals {
  display: flex;
  align-items: stretch;
  padding: 22px 26px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fdfaf1, #f6efdd);
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow-sm);
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.deals:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
.deals__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.deals__label {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.deals__num {
  font-size: 25px;
  color: var(--red);
  letter-spacing: 0.01em;
}
.deals__num.is-in {
  color: var(--red);
}
.deals__num.is-out {
  color: var(--green);
}
.deals__hint {
  font-size: 11.5px;
  color: var(--ink-3);
}
.deals__sep {
  width: 1px;
  background: var(--line-2);
  margin: 0 26px;
}
.deals__arrow {
  display: flex;
  align-items: center;
  color: var(--ink-3);
  padding-left: 16px;
}

/* ---------- 移动端 ---------- */
@media (max-width: 959px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .kpi {
    padding: 14px 16px;
    border-radius: 15px;
  }
  .kpi__value {
    font-size: 21px;
  }
  .book-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .deals {
    padding: 18px;
    flex-wrap: wrap;
  }
  .deals__num {
    font-size: 19px;
  }
  .deals__sep {
    margin: 0 12px;
  }
  .deals__arrow {
    display: none;
  }
  .deals__col {
    min-width: 30%;
  }
}
</style>
