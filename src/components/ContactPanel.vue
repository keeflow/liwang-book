<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { toDisplayDate } from '@/utils/date'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{ contactId: string }>()

const router = useRouter()
const store = useLedgerStore()

const contact = computed(() => store.contacts.find((c) => c.id === props.contactId))

type Tab = 'all' | 'in' | 'out'
const tab = ref<Tab>('all')

const timeline = computed(() => {
  if (!contact.value) return []
  return store.deals
    .filter((d) => d.record.name.trim().toLowerCase() === props.contactId)
    .sort((a, b) => new Date(b.book.date).getTime() - new Date(a.book.date).getTime())
})

const shown = computed(() => {
  if (tab.value === 'all') return timeline.value
  return timeline.value.filter((d) => d.direction === tab.value)
})

const receivedRecords = computed(() => timeline.value.filter((d) => d.direction === 'in'))
const lastIn = computed(() => receivedRecords.value[0])

const reference = computed(() => {
  const base = Number(lastIn.value?.record.amount) || 0
  if (!base) return []
  const round = (n: number) => Math.round(n / 100) * 100
  return [
    { comment: '持平', amount: base },
    { comment: '略高', amount: round(base * 1.2) },
    { comment: '较高', amount: round(base * 1.5) },
  ].filter((x, i, arr) => arr.findIndex((y) => y.amount === x.amount) === i)
})

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部往来' },
  { key: 'in', label: '收到的' },
  { key: 'out', label: '送出的' },
]

function openBook(bookId: string) {
  router.push(`/book/${bookId}`)
}
</script>

<template>
  <div v-if="contact" class="cp">
    <!-- 档案头 -->
    <section class="profile">
      <div class="profile__avatar serif">{{ contact.name.slice(0, 1) }}</div>
      <div class="profile__info">
        <h2 class="profile__name serif">{{ contact.name }}</h2>
        <div class="profile__tags">
          <span v-if="contact.relation" class="tag">{{ contact.relation }}</span>
          <span v-if="contact.phone" class="tag tag--plain mono">
            <AppIcon name="phone" :size="12" />{{ contact.phone }}
          </span>
          <span v-if="!contact.relation && !contact.phone" class="tag tag--plain">暂无更多信息</span>
        </div>
      </div>
      <div class="profile__grid">
        <div class="profile__cell">
          <span>累计收到</span>
          <strong class="mono is-in">{{ formatMoney(contact.received) }}</strong>
        </div>
        <div class="profile__cell">
          <span>累计送出</span>
          <strong class="mono is-out">{{ formatMoney(contact.sent) }}</strong>
        </div>
        <div class="profile__cell">
          <span>往来差额</span>
          <strong class="mono" :class="contact.balance >= 0 ? 'is-in' : 'is-out'">
            {{ contact.balance >= 0 ? '+' : '' }}{{ formatMoney(contact.balance) }}
          </strong>
        </div>
      </div>
    </section>

    <!-- 往来时间线 -->
    <div class="cp__bar">
      <h3 class="serif">人情往来</h3>
      <span class="dim">共 {{ timeline.length }} 次</span>
      <div class="segment segment--sm">
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
    </div>

    <ol v-if="shown.length" class="timeline">
      <li v-for="d in shown" :key="d.record.id" class="tl">
        <span class="tl__dot" :class="d.direction === 'in' ? 'is-in' : 'is-out'" />
        <div class="tl__body">
          <p class="tl__date mono">{{ toDisplayDate(d.book.date) }}</p>
          <p class="tl__event serif" @click="openBook(d.book.id)">
            {{ d.book.name }}
            <AppIcon name="right" :size="12" />
          </p>
          <p class="tl__dir">
            <span v-if="d.record.relation" class="tl__rel">{{ d.record.relation }}</span>
            {{ d.direction === 'in' ? `${contact.name} → 我` : `我 → ${contact.name}` }}
          </p>
          <p v-if="d.record.gift" class="tl__gift">
            <AppIcon name="gift" :size="13" />{{ d.record.gift }}
          </p>
          <p v-if="d.record.note" class="tl__note">{{ d.record.note }}</p>
        </div>
        <span class="tl__amount mono" :class="d.direction === 'in' ? 'is-in' : 'is-out'">
          {{ formatMoney(d.record.amount) }}
        </span>
      </li>
    </ol>
    <p v-else class="dim" style="font-size: 13px; padding: 8px 4px">暂无相关记录</p>

    <!-- 回礼历史参考 -->
    <section v-if="reference.length" class="ref">
      <header class="ref__head">
        <h3 class="serif">回礼历史参考</h3>
        <span class="dim">仅供参考，不代替你决定</span>
      </header>
      <p class="ref__base">
        最近一次收到礼金
        <strong class="mono">{{ formatMoney(lastIn?.record.amount || 0) }}</strong>
        <em class="serif">{{ toChineseAmount(lastIn?.record.amount || 0) }}</em>
      </p>
      <div class="ref__list">
        <div v-for="r in reference" :key="r.comment" class="ref__item">
          <span class="ref__amount mono">{{ formatMoney(r.amount) }}</span>
          <span class="ref__comment">{{ r.comment }}</span>
        </div>
      </div>
      <p class="ref__hint">依据历史记录整理，最终金额由你决定</p>
    </section>
  </div>
</template>

<style scoped>
.cp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 档案头 */
.profile {
  background: linear-gradient(160deg, #fdfaf1, #f3e9d4);
  border: 1px solid var(--line-2);
  border-radius: 20px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 16px;
  align-items: center;
  box-shadow: var(--shadow-sm);
}
.profile__avatar {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8eeea, #eedcd6);
  border: 1px solid #e5cbc5;
  color: var(--red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}
.profile__name {
  font-size: 21px;
  letter-spacing: 0.1em;
  line-height: 1.3;
}
.profile__tags {
  display: flex;
  gap: 8px;
  margin-top: 7px;
  flex-wrap: wrap;
}
.tag {
  font-size: 11.5px;
  color: var(--gold);
  background: var(--gold-wash);
  border: 1px solid #e8d9b0;
  border-radius: 999px;
  padding: 3px 10px;
}
.tag--plain {
  color: var(--ink-3);
  background: rgba(255, 255, 255, 0.66);
  border-color: var(--line-2);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.profile__grid {
  grid-column: 1 / -1;
  display: flex;
  margin-top: 12px;
  border-top: 1px solid var(--line-2);
  padding-top: 16px;
}
.profile__cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}
.profile__cell + .profile__cell {
  border-left: 1px solid var(--line-3);
}
.profile__cell span {
  font-size: 11.5px;
  color: var(--ink-3);
}
.profile__cell strong {
  font-size: 16px;
  font-weight: 600;
}
.is-in {
  color: var(--red);
}
.is-out {
  color: var(--ink-2);
}

/* 工具条 */
.cp__bar {
  display: flex;
  align-items: center;
  gap: 14px;
}
.cp__bar h3 {
  font-size: 16px;
  letter-spacing: 0.1em;
}
.cp__bar .segment--sm {
  width: 214px;
  margin-left: auto;
  flex: none;
}
.segment--sm .segment__item {
  height: 32px;
  font-size: 12.5px;
}

/* 时间线 */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0 0 0 6px;
}
.tl {
  display: flex;
  gap: 12px;
  padding: 0 0 18px 14px;
  position: relative;
  border-left: 1px solid var(--line-2);
}
.tl:last-child {
  border-left-color: transparent;
  padding-bottom: 4px;
}
.tl__dot {
  position: absolute;
  left: -5.5px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--paper-2);
  border: 2px solid var(--red-soft);
}
.tl__dot.is-out {
  border-color: #9d8a6d;
}
.tl__body {
  flex: 1;
  min-width: 0;
}
.tl__date {
  font-size: 11.5px;
  color: var(--ink-3);
}
.tl__event {
  font-size: 14.5px;
  letter-spacing: 0.06em;
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--ink);
}
.tl__event:hover {
  color: var(--red);
}
.tl__dir {
  font-size: 12px;
  color: var(--ink-2);
  margin-top: 3px;
}
.tl__rel {
  color: var(--ink-3);
  margin-right: 6px;
}
.tl__gift,
.tl__note {
  font-size: 12px;
  color: var(--gold);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.tl__note {
  color: var(--ink-3);
}
.tl__amount {
  font-size: 15px;
  font-weight: 600;
  flex: none;
  padding-top: 17px;
}

/* 回礼参考 */
.ref {
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 18px;
  padding: 18px 20px 14px;
  box-shadow: var(--shadow-sm);
}
.ref__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.ref__head h3 {
  font-size: 15px;
  letter-spacing: 0.1em;
}
.ref__head span {
  font-size: 11px;
}
.ref__base {
  margin-top: 14px;
  font-size: 13px;
  color: var(--ink-2);
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--line-2);
}
.ref__base strong {
  color: var(--red);
  font-size: 16px;
  margin-left: 6px;
}
.ref__base em {
  font-style: normal;
  color: var(--ink-3);
  font-size: 11.5px;
  margin-left: 8px;
}
.ref__list {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}
.ref__item {
  flex: 1;
  border: 1px solid var(--line-2);
  border-radius: 13px;
  padding: 14px 8px;
  text-align: center;
  background: linear-gradient(180deg, #fdfaf1, #f7f0df);
}
.ref__amount {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: var(--red);
}
.ref__comment {
  display: block;
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 3px;
}
.ref__hint {
  font-size: 11px;
  color: var(--ink-3);
  text-align: center;
  margin-top: 12px;
}
</style>
