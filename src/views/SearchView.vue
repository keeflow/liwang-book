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
    .slice(0, 40)
    .map((r) => ({ record: r, book: store.getBook(r.bookId) }))
})

const totalHits = computed(
  () => matchedContacts.value.length + matchedBooks.value.length + matchedRecords.value.length,
)

const suggestions = computed(() => store.contacts.slice(0, 8))
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <div class="searchbox">
        <AppIcon name="search" :size="16" />
        <input ref="input" v-model="keyword" placeholder="搜索姓名、手机号、礼簿名称" />
        <button v-if="keyword" @click="keyword = ''"><AppIcon name="close" :size="15" /></button>
      </div>
    </div>

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
      <p v-if="totalHits" class="hits dim">找到 {{ totalHits }} 条相关结果</p>

      <!-- 宾客 -->
      <section v-if="matchedContacts.length">
        <div class="section-title"><h2>宾客档案</h2></div>
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
      </section>

      <!-- 礼簿 -->
      <section v-if="matchedBooks.length">
        <div class="section-title"><h2>礼簿</h2></div>
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
      </section>

      <!-- 记录 -->
      <section v-if="matchedRecords.length">
        <div class="section-title"><h2>记录</h2></div>
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
      </section>

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
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--line-2);
  border-radius: 12px;
  color: var(--ink-3);
  min-width: 0;
}
.searchbox input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14.5px;
  min-width: 0;
}
.hits {
  font-size: 12px;
  padding: 4px 4px 0;
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
}
.hit:active {
  transform: scale(0.988);
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
</style>
