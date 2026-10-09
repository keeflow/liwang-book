<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { formatMoney } from '@/utils/cny'
import { exportContactsExcel } from '@/utils/export'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const store = useLedgerStore()
const toast = useToast()

type Tab = 'all' | 'in' | 'out'
const tab = ref<Tab>('all')
const keyword = ref('')

const filtered = computed(() => {
  let list = store.contacts
  if (tab.value === 'in') list = list.filter((c) => c.received > 0)
  if (tab.value === 'out') list = list.filter((c) => c.sent > 0)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        (c.phone || '').includes(kw) ||
        (c.relation || '').toLowerCase().includes(kw),
    )
  }
  return list
})

const balance = computed(() => store.totalReceived - store.totalSent)

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'in', label: '收到的礼' },
  { key: 'out', label: '送出的礼' },
]

function onExport() {
  exportContactsExcel(store.contacts)
  toast.success('已导出人情往来')
}
</script>

<template>
  <div class="page">
    <div class="topbar">
      <h1 class="topbar__title" style="padding-left: 4px">人情往来</h1>
      <button class="icon-btn" @click="onExport">
        <AppIcon name="download" :size="18" />
      </button>
    </div>

    <!-- 汇总 -->
    <section class="sum">
      <div class="sum__main">
        <span class="sum__label">往来差额</span>
        <strong class="sum__num mono" :class="balance >= 0 ? 'is-in' : 'is-out'">
          {{ balance >= 0 ? '+' : '' }}{{ formatMoney(balance) }}
        </strong>
        <span class="sum__cn serif">
          {{ balance >= 0 ? '收多于送' : '送多于收' }}
        </span>
      </div>
      <div class="sum__row">
        <div class="sum__col">
          <span class="sum__k">累计收礼</span>
          <strong class="mono is-in">{{ formatMoney(store.totalReceived) }}</strong>
        </div>
        <span class="sum__sep" />
        <div class="sum__col">
          <span class="sum__k">累计送礼</span>
          <strong class="mono is-out">{{ formatMoney(store.totalSent) }}</strong>
        </div>
      </div>
    </section>

    <!-- 搜索 -->
    <div class="search">
      <AppIcon name="search" :size="17" />
      <input v-model="keyword" placeholder="搜索姓名、手机号、关系" />
      <button v-if="keyword" class="search__clear" @click="keyword = ''">
        <AppIcon name="close" :size="15" />
      </button>
    </div>

    <div class="segment" style="margin-bottom: 16px">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="segment__item"
        :class="{ 'is-active': tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <p class="count dim">共 {{ filtered.length }} 位宾客</p>

    <div v-if="filtered.length" class="clist">
      <article
        v-for="c in filtered"
        :key="c.id"
        class="contact"
        @click="router.push(`/contact/${encodeURIComponent(c.id)}`)"
      >
        <div class="contact__avatar serif">{{ c.name.slice(0, 1) }}</div>
        <div class="contact__main">
          <div class="contact__top">
            <h3 class="contact__name serif">{{ c.name }}</h3>
            <span v-if="c.relation" class="contact__rel">{{ c.relation }}</span>
          </div>
          <div class="contact__nums">
            <span v-if="c.received > 0" class="contact__num">
              <i class="arrow arrow--in">收</i>{{ formatMoney(c.received) }}
            </span>
            <span v-if="c.sent > 0" class="contact__num">
              <i class="arrow arrow--out">送</i>{{ formatMoney(c.sent) }}
            </span>
          </div>
        </div>
        <div class="contact__right">
          <span class="contact__times">{{ c.records.length }} 次</span>
          <AppIcon name="right" :size="15" />
        </div>
      </article>
    </div>

    <div v-else class="empty">
      <div class="empty__mark serif">往</div>
      <p class="empty__title">没有匹配的宾客</p>
      <p style="font-size: 13px">在礼簿中记下一笔，这里就会自动形成人情往来账</p>
    </div>
  </div>
</template>

<style scoped>
.sum {
  border-radius: 20px;
  padding: 22px;
  background: linear-gradient(160deg, #fdfaf1, #f4ebd7);
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}
.sum::after {
  content: '';
  position: absolute;
  right: -30px;
  top: -30px;
  width: 110px;
  height: 110px;
  border: 1px solid rgba(142, 43, 43, 0.1);
  border-radius: 50%;
}
.sum__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 18px;
}
.sum__label {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--ink-3);
}
.sum__num {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.sum__num.is-in {
  color: var(--red);
}
.sum__num.is-out {
  color: var(--green);
}
.sum__cn {
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.12em;
}
.sum__row {
  display: flex;
  border-top: 1px solid var(--line-2);
  padding-top: 16px;
}
.sum__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.sum__k {
  font-size: 11.5px;
  color: var(--ink-3);
}
.sum__col strong {
  font-size: 17px;
  font-weight: 600;
}
.sum__col .is-in {
  color: var(--red);
}
.sum__col .is-out {
  color: var(--ink-2);
}
.sum__sep {
  width: 1px;
  background: var(--line-2);
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--line-2);
  border-radius: 13px;
  margin-bottom: 14px;
  color: var(--ink-3);
}
.search input {
  flex: 1;
  border: none;
  background: none;
  height: 100%;
  font-size: 14.5px;
}
.search__clear {
  color: var(--ink-3);
  display: flex;
}

.count {
  font-size: 12px;
  padding: 0 4px 10px;
}

.clist {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.contact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}
.contact:active {
  transform: scale(0.987);
}
.contact__avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f6ece8, #efe0da);
  color: var(--red);
  border: 1px solid #e6cdc8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  flex: none;
}
.contact__main {
  flex: 1;
  min-width: 0;
}
.contact__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.contact__name {
  font-size: 15.5px;
  letter-spacing: 0.06em;
}
.contact__rel {
  font-size: 10.5px;
  color: var(--ink-3);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 0 7px;
  flex: none;
}
.contact__nums {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--ink-2);
}
.contact__num {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
.arrow {
  font-style: normal;
  font-size: 9.5px;
  width: 15px;
  height: 15px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.arrow--in {
  background: var(--red-soft);
}
.arrow--out {
  background: #9d8a6d;
}
.contact__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  color: var(--ink-3);
  font-size: 11px;
  flex: none;
}
</style>
