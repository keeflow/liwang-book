<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { greeting as greetingFn, toDisplayDate } from '@/utils/date'
import { formatMoney } from '@/utils/cny'
import AppIcon from '@/components/AppIcon.vue'
import MoneyText from '@/components/MoneyText.vue'

const router = useRouter()
const store = useLedgerStore()

const greetingText = greetingFn()

const recent = computed(() => store.sortedBooks.slice(0, 4))
const hasMore = computed(() => store.books.length > 4)
const sealedCount = computed(() => store.books.filter((b) => b.sealed).length)

function openBook(id: string) {
  router.push(`/book/${id}/cover`)
}
</script>

<template>
  <div class="page">
    <!-- 品牌头 -->
    <header class="brand">
      <div class="brand__row">
        <div class="brand__mark">
          <span class="brand__title serif">礼往</span>
          <span class="brand__slogan">一本礼簿，记下每一次人情往来</span>
        </div>
        <button class="icon-btn" @click="router.push('/search')" aria-label="搜索">
          <AppIcon name="search" :size="19" />
        </button>
      </div>
      <p class="brand__greet">{{ greetingText }}</p>
    </header>

    <!-- 新建 -->
    <button class="create" @click="router.push('/book/new')">
      <AppIcon name="plus" :size="20" />
      <span>新建礼簿</span>
    </button>

    <!-- 最近礼簿 -->
    <div class="section-title">
      <h2>最近礼簿</h2>
      <router-link v-if="hasMore" class="section-title__more" to="/books">
        全部 {{ store.books.length }} 本 →
      </router-link>
      <span v-else-if="store.books.length" class="dim" style="font-size: 12px">
        共 {{ store.books.length }} 本<template v-if="sealedCount">
          · 已封存 {{ sealedCount }}</template
        >
      </span>
    </div>

    <div v-if="recent.length" class="books">
      <article
        v-for="b in recent"
        :key="b.id"
        class="book"
        :class="{ 'book--sealed': b.sealed }"
        @click="openBook(b.id)"
      >
        <div class="book__cover">
          <div class="book__cover-inner serif">礼簿</div>
        </div>
        <div class="book__main">
          <div class="book__top">
            <h3 class="book__name serif">{{ b.name }}</h3>
            <span class="book__badge">{{ b.type }}</span>
          </div>
          <p class="book__date">
            {{ toDisplayDate(b.date) }}
            <template v-if="b.location"> · {{ b.location }}</template>
          </p>
          <div class="book__stats">
            <span class="book__stat">
              <em class="mono">{{ store.bookPeople(b.id) }}</em> 人
            </span>
            <MoneyText :amount="store.bookTotal(b.id)" size="lg" />
          </div>
          <div class="book__foot">
            <span v-if="b.sealed" class="book__sealed">
              <AppIcon name="lock" :size="12" /> 已封存
            </span>
            <span v-else class="book__live">
              <i class="dot" /> 记礼中 · {{ store.recordsOf(b.id).length }} 笔
            </span>
            <span v-if="b.direction === 'out'" class="book__dir">送出</span>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty card" style="padding: 48px 24px">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">还没有礼簿</p>
      <p style="font-size: 13.5px">点击上方「新建礼簿」，为下一场宴席开一本簿子</p>
    </div>

    <!-- 人情往来 -->
    <div class="section-title">
      <h2>人情往来</h2>
      <router-link class="section-title__more" to="/contacts">查看往来账 →</router-link>
    </div>

    <div class="deals card" @click="router.push('/contacts')">
      <div class="deals__col">
        <span class="deals__label">累计收礼</span>
        <strong class="deals__num serif mono">{{ formatMoney(store.totalReceived) }}</strong>
      </div>
      <span class="deals__sep" />
      <div class="deals__col">
        <span class="deals__label">累计送礼</span>
        <strong class="deals__num deals__num--out serif mono">{{ formatMoney(store.totalSent) }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.brand {
  padding: 20px 2px 4px;
}
.brand__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.brand__mark {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.brand__title {
  font-size: 27px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--red-deep);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  line-height: 1.1;
}
.brand__slogan {
  font-size: 11.5px;
  letter-spacing: 0.1em;
  color: var(--ink-3);
}
.brand__greet {
  margin-top: 14px;
  font-family: var(--serif);
  font-size: 17px;
  letter-spacing: 0.1em;
  color: var(--ink);
}

.create {
  width: 100%;
  height: 62px;
  margin: 16px 0 4px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: #fdf6e6;
  background: linear-gradient(180deg, #9c3535, #7c2424);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.24) inset,
    0 8px 22px rgba(124, 36, 36, 0.3);
  transition: transform 0.14s ease;
}
.create:active {
  transform: scale(0.982);
}

.books {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.book {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
  position: relative;
  overflow: hidden;
}
.book:active {
  transform: scale(0.985);
  box-shadow: var(--shadow);
}
.book::after {
  content: '';
  position: absolute;
  right: -18px;
  top: -18px;
  width: 62px;
  height: 62px;
  border: 1px solid var(--line-3);
  border-radius: 50%;
  opacity: 0.7;
}
.book__cover {
  width: 46px;
  height: 62px;
  flex: none;
  border-radius: 4px 9px 9px 4px;
  background: linear-gradient(150deg, #a03939, #7c2424 60%, #601b1b);
  border: 1px solid rgba(211, 179, 101, 0.5);
  box-shadow: 0 3px 10px rgba(96, 34, 26, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
}
.book--sealed .book__cover {
  filter: saturate(0.72) brightness(0.96);
}
.book__cover-inner {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 13px;
  color: rgba(246, 232, 200, 0.95);
  letter-spacing: 0.04em;
}
.book__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.book__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.book__name {
  font-size: 16.5px;
  letter-spacing: 0.05em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book__badge {
  font-size: 10.5px;
  color: var(--gold);
  border: 1px solid #e2d3ab;
  background: var(--gold-wash);
  padding: 1px 7px;
  border-radius: 999px;
  flex: none;
  letter-spacing: 0.06em;
}
.book__date {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book__stats {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-top: 10px;
  color: var(--red);
}
.book__stat {
  font-size: 12px;
  color: var(--ink-2);
}
.book__stat em {
  font-style: normal;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}
.book__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--ink-3);
}
.book__sealed {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #8b7a5f;
}
.book__live {
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
.book__dir {
  margin-left: auto;
  color: var(--red-soft);
}

/* 往来汇总 */
.deals {
  display: flex;
  align-items: stretch;
  padding: 20px 18px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fdfaf1, #f6efdd);
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow-sm);
}
.deals__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.deals__label {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.deals__num {
  font-size: 21px;
  color: var(--red);
  letter-spacing: 0.02em;
}
.deals__num--out {
  color: var(--ink-2);
}
.deals__sep {
  width: 1px;
  background: var(--line-2);
  margin: 2px 6px;
}
</style>
