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

const list = computed(() => {
  const all = store.sortedBooks
  if (filter.value === 'open') return all.filter((b) => !b.sealed)
  if (filter.value === 'sealed') return all.filter((b) => b.sealed)
  return all
})

const tabs: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '记礼中' },
  { key: 'sealed', label: '已封存' },
]
</script>

<template>
  <div class="page page--flush">
    <div class="topbar" style="padding-left: 18px; padding-right: 18px">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <h1 class="topbar__title">全部礼簿</h1>
      <button class="icon-btn" @click="router.push('/book/new')">
        <AppIcon name="plus" :size="19" />
      </button>
    </div>

    <div style="padding: 0 18px">
      <div class="segment">
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
    </div>

    <div style="padding: 18px">
      <div v-if="list.length" class="list">
        <article v-for="b in list" :key="b.id" class="item" @click="router.push(`/book/${b.id}/cover`)">
          <div class="item__cover serif">礼簿</div>
          <div class="item__main">
            <div class="item__row">
              <h3 class="item__name serif">{{ b.name }}</h3>
              <span class="item__badge">{{ b.type }}</span>
            </div>
            <p class="item__date">{{ toDisplayDate(b.date) }}<template v-if="b.location"> · {{ b.location }}</template></p>
            <div class="item__stats">
              <span>{{ store.bookPeople(b.id) }} 人</span>
              <span class="item__dot" />
              <span>{{ store.recordsOf(b.id).length }} 笔</span>
              <MoneyText :amount="store.bookTotal(b.id)" size="sm" :toggleable="false" />
            </div>
          </div>
          <div class="item__side">
            <AppIcon v-if="b.sealed" name="lock" :size="16" />
            <span v-if="b.direction === 'out'" class="item__out">送</span>
          </div>
        </article>
      </div>

      <div v-else class="empty">
        <div class="empty__mark serif">礼</div>
        <p class="empty__title">这里还是空的</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item {
  display: flex;
  gap: 13px;
  align-items: center;
  padding: 13px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}
.item:active {
  transform: scale(0.986);
}
.item__cover {
  width: 40px;
  height: 54px;
  flex: none;
  border-radius: 4px 8px 8px 4px;
  background: linear-gradient(150deg, #a03939, #7c2424 60%, #601b1b);
  border: 1px solid rgba(211, 179, 101, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 11.5px;
  color: rgba(246, 232, 200, 0.95);
}
.item__main {
  flex: 1;
  min-width: 0;
}
.item__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item__name {
  font-size: 15.5px;
  letter-spacing: 0.05em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item__badge {
  font-size: 10px;
  color: var(--gold);
  border: 1px solid #e2d3ab;
  background: var(--gold-wash);
  padding: 0 6px;
  border-radius: 999px;
  flex: none;
}
.item__date {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 3px;
}
.item__stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--ink-2);
  margin-top: 7px;
}
.item__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--line);
}
.item__side {
  color: var(--ink-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.item__out {
  font-size: 10px;
  color: var(--red-soft);
  border: 1px solid #e6cdc8;
  border-radius: 4px;
  padding: 0 3px;
}
</style>
