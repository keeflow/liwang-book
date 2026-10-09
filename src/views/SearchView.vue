<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { formatMoney } from '@/utils/cny'
import { toDisplayDate } from '@/utils/date'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const store = useLedgerStore()

const keyword = ref('')
const input = ref<HTMLInputElement | null>(null)

onMounted(() => input.value?.focus())

const kw = computed(() => keyword.value.trim().toLowerCase())
const has = computed(() => kw.value.length > 0)

const matchedContacts = computed(() => {
  if (!has.value) return []
  return store.contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(kw.value) ||
      (c.phone || '').includes(kw.value) ||
      (c.relation || '').toLowerCase().includes(kw.value),
  )
})

const matchedBooks = computed(() => {
  if (!has.value) return []
  return store.sortedBooks.filter(
    (b) =>
      b.name.toLowerCase().includes(kw.value) ||
      (b.host || '').toLowerCase().includes(kw.value) ||
      (b.location || '').toLowerCase().includes(kw.value),
  )
})

const matchedRecords = computed(() => {
  if (!has.value) return []
  return store.records
    .filter((r) => r.name.toLowerCase().includes(kw.value) || (r.phone || '').includes(kw.value))
    .slice(0, 60)
    .map((r) => ({ record: r, book: store.getBook(r.bookId) }))
})

const totalHits = computed(
  () => matchedContacts.value.length + matchedBooks.value.length + matchedRecords.value.length,
)

const suggestions = computed(() => store.contacts.slice(0, 12))
</script>

<template>
  <div class="page">
    <header class="topbar">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <div class="searchbox">
        <AppIcon name="search" :size="17" />
        <input ref="input" v-model="keyword" placeholder="搜索姓名、手机号、礼簿名称" />
        <button v-if="keyword" @click="keyword = ''"><AppIcon name="close" :size="15" /></button>
      </div>
      <span v-if="has" class="dim" style="font-size: 12.5px; flex: none">
        {{ totalHits }} 条结果
      </span>
    </header>

    <!-- 未输入：常用 -->
    <template v-if="!has">
      <div class="section-title"><h2>最近往来的宾客</h2></div>
      <div class="chips">
        <button
          v-for="c in suggestions"
          :key="c.id"
          class="chip"
          @click="router.push(`/contact/${encodeURIComponent(c.id)}`)"
        >
          {{ c.name }}
        </button>
      </div>
      <p v-if="!suggestions.length" class="dim" style="font-size: 13px; padding: 12px 4px">
        还没有宾客数据，先去记一笔吧
      </p>
    </template>

    <template v-else>
      <div class="results">
        <!-- 宾客 -->
        <section class="res-col">
          <div class="res-col__head">
            <h2 class="serif">宾客档案</h2>
            <span class="dim">{{ matchedContacts.length }}</span>
          </div>
          <article
            v-for="c in matchedContacts"
            :key="c.id"
            class="hit"
            @click="router.push(`/contact/${encodeURIComponent(c.id)}`)"
          >
            <div class="hit__avatar serif">{{ c.name.slice(0, 1) }}</div>
            <div class="hit__main">
              <p class="hit__title serif">{{ c.name }}</p>
              <p class="hit__sub">
                <span v-if="c.relation">{{ c.relation }} · </span>
                <span v-if="c.phone" class="mono">{{ c.phone }} · </span>
                {{ c.records.length }} 次往来
              </p>
            </div>
            <div class="hit__nums">
              <span class="is-in">收 {{ formatMoney(c.received) }}</span>
              <span class="is-out">送 {{ formatMoney(c.sent) }}</span>
            </div>
          </article>
          <p v-if="!matchedContacts.length" class="res-empty">没有匹配的宾客</p>
        </section>

        <!-- 礼簿 -->
        <section class="res-col">
          <div class="res-col__head">
            <h2 class="serif">礼簿</h2>
            <span class="dim">{{ matchedBooks.length }}</span>
          </div>
          <article
            v-for="b in matchedBooks"
            :key="b.id"
            class="hit"
            @click="router.push(`/book/${b.id}/cover`)"
          >
            <div class="hit__avatar hit__avatar--book serif">簿</div>
            <div class="hit__main">
              <p class="hit__title serif">{{ b.name }}</p>
              <p class="hit__sub">
                {{ toDisplayDate(b.date) }} · {{ store.bookPeople(b.id) }} 人 ·
                {{ store.recordsOf(b.id).length }} 笔
              </p>
            </div>
            <AppIcon name="right" :size="15" />
          </article>
          <p v-if="!matchedBooks.length" class="res-empty">没有匹配的礼簿</p>
        </section>

        <!-- 记录 -->
        <section class="res-col">
          <div class="res-col__head">
            <h2 class="serif">记录</h2>
            <span class="dim">{{ matchedRecords.length }}</span>
          </div>
          <article
            v-for="m in matchedRecords"
            :key="m.record.id"
            class="hit"
            @click="m.book && router.push(`/book/${m.book.id}`)"
          >
            <div class="hit__main">
              <p class="hit__title serif">{{ m.record.name }}</p>
              <p class="hit__sub">
                {{ m.book?.name }} · {{ m.book ? toDisplayDate(m.book.date) : '' }}
                <template v-if="m.record.note"> · {{ m.record.note }}</template>
              </p>
            </div>
            <span class="hit__amount mono">{{ formatMoney(m.record.amount) }}</span>
          </article>
          <p v-if="!matchedRecords.length" class="res-empty">没有匹配的记录</p>
        </section>
      </div>

      <div v-if="!totalHits" class="empty">
        <div class="empty__mark serif">寻</div>
        <p class="empty__title">没有找到「{{ keyword }}」</p>
        <p style="font-size: 13px">试试搜索姓名、手机号或礼簿名称</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.searchbox {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  height: 46px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid var(--line-2);
  border-radius: 13px;
  color: var(--ink-3);
  min-width: 0;
  max-width: 560px;
}
.searchbox input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  min-width: 0;
}

.results {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  align-items: start;
}
.res-col {
  min-width: 0;
}
.res-col__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--line-2);
  margin-bottom: 12px;
}
.res-col__head h2 {
  font-size: 16px;
  letter-spacing: 0.1em;
}
.res-empty {
  font-size: 12.5px;
  color: var(--ink-4);
  padding: 10px 4px;
}

.hit {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 13px;
  margin-bottom: 8px;
  box-shadow: var(--shadow-sm);
  color: var(--ink-3);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.hit:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.hit__avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--red-wash);
  color: var(--red);
  border: 1px solid #e6cdc8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex: none;
}
.hit__avatar--book {
  background: linear-gradient(150deg, #a03939, #7c2424);
  color: #f6e8c8;
  border-color: rgba(211, 179, 101, 0.5);
}
.hit__main {
  flex: 1;
  min-width: 0;
}
.hit__title {
  font-size: 15px;
  letter-spacing: 0.05em;
  color: var(--ink);
}
.hit__sub {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hit__nums {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  flex: none;
}
.hit__nums .is-in {
  color: var(--red);
}
.hit__nums .is-out {
  color: var(--ink-3);
}
.hit__amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--red);
  flex: none;
}

@media (max-width: 1200px) {
  .results {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 959px) {
  .results {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  .searchbox {
    max-width: none;
  }
}
</style>
