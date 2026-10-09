<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { toDisplayDate } from '@/utils/date'
import AppIcon from '@/components/AppIcon.vue'
import MoneyText from '@/components/MoneyText.vue'

const router = useRouter()
const store = useLedgerStore()

type Filter = 'all' | 'open' | 'sealed'
const filter = ref<Filter>('all')
const keyword = ref('')

const list = computed(() => {
  let all = store.sortedBooks
  if (filter.value === 'open') all = all.filter((b) => !b.sealed)
  if (filter.value === 'sealed') all = all.filter((b) => b.sealed)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    all = all.filter(
      (b) =>
        b.name.toLowerCase().includes(kw) ||
        (b.host || '').toLowerCase().includes(kw) ||
        (b.location || '').toLowerCase().includes(kw),
    )
  }
  return all
})

const tabs: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '记礼中' },
  { key: 'sealed', label: '已封存' },
]
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div style="min-width: 0">
        <h1 class="topbar__title">全部礼簿</h1>
        <p class="topbar__sub">共 {{ store.books.length }} 本 · {{ list.length }} 本符合当前筛选</p>
      </div>
      <div class="topbar__actions">
        <div class="mini-search">
          <AppIcon name="search" :size="16" />
          <input v-model="keyword" placeholder="搜索礼簿名称、主人、地点" />
        </div>
        <div class="segment" style="width: 250px">
          <button
            v-for="t in tabs"
            :key="t.key"
            class="segment__item"
            :class="{ 'is-active': filter === t.key }"
            @click="filter = t.key"
          >
            {{ t.label }}
          </button>
        </div>
        <button class="btn btn--primary" @click="router.push('/book/new')">
          <AppIcon name="plus" :size="18" />新建礼簿
        </button>
      </div>
    </header>

    <div v-if="list.length" class="grid">
      <article
        v-for="b in list"
        :key="b.id"
        class="bcard"
        @click="router.push(`/book/${b.id}/cover`)"
      >
        <div class="bcard__top">
          <div class="bcard__cover serif">礼簿</div>
          <div class="bcard__head">
            <h3 class="bcard__name serif">{{ b.name }}</h3>
            <div class="bcard__tags">
              <span class="tag">{{ b.type }}</span>
              <span v-if="b.direction === 'out'" class="tag tag--out">送出</span>
              <span v-if="b.sealed" class="tag tag--seal">
                <AppIcon name="lock" :size="11" />已封存
              </span>
            </div>
          </div>
        </div>
        <p class="bcard__date">
          {{ toDisplayDate(b.date) }}
          <template v-if="b.location"> · {{ b.location }}</template>
        </p>
        <div class="bcard__bottom">
          <span class="bcard__people">
            <em class="mono">{{ store.bookPeople(b.id) }}</em> 人
            <i />
            <em class="mono">{{ store.recordsOf(b.id).length }}</em> 笔
          </span>
          <MoneyText :amount="store.bookTotal(b.id)" size="sm" :toggleable="false" />
        </div>
      </article>
    </div>

    <div v-else class="empty">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">{{ keyword || filter !== 'all' ? '没有匹配的礼簿' : '还没有礼簿' }}</p>
      <button class="btn btn--primary" style="margin-top: 18px" @click="router.push('/book/new')">
        <AppIcon name="plus" :size="18" /> 新建礼簿
      </button>
    </div>
  </div>
</template>

<style scoped>
.mini-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 14px;
  width: 260px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--line-2);
  border-radius: 12px;
  color: var(--ink-3);
}
.mini-search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.bcard {
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.bcard:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.bcard__top {
  display: flex;
  gap: 13px;
  align-items: flex-start;
}
.bcard__cover {
  width: 44px;
  height: 60px;
  flex: none;
  border-radius: 4px 9px 9px 4px;
  background: linear-gradient(150deg, #a03939, #7c2424 58%, #5e1a1a);
  border: 1px solid rgba(211, 179, 101, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 12px;
  color: rgba(246, 232, 200, 0.95);
  box-shadow: 0 3px 10px rgba(96, 34, 26, 0.22);
}
.bcard__head {
  flex: 1;
  min-width: 0;
}
.bcard__name {
  font-size: 16px;
  letter-spacing: 0.05em;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.bcard__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}
.tag {
  font-size: 10.5px;
  color: var(--gold);
  border: 1px solid #e2d3ab;
  background: var(--gold-wash);
  padding: 1px 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.tag--out {
  color: var(--red-soft);
  border-color: #e6cdc8;
  background: var(--red-wash);
}
.tag--seal {
  color: var(--ink-3);
  border-color: var(--line-2);
  background: rgba(255, 255, 255, 0.7);
}
.bcard__date {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bcard__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-3);
  color: var(--red);
}
.bcard__people {
  font-size: 12px;
  color: var(--ink-2);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.bcard__people em {
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
}
.bcard__people i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--line);
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 959px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .mini-search {
    display: none;
  }
}
</style>
