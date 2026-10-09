<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { useIsDesktop } from '@/composables/useMediaQuery'
import { formatMoney } from '@/utils/cny'
import { exportContactsExcel } from '@/utils/export'
import AppIcon from '@/components/AppIcon.vue'
import ContactPanel from '@/components/ContactPanel.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()
const toast = useToast()
const isDesktop = useIsDesktop()

type Tab = 'all' | 'in' | 'out'
const tab = ref<Tab>('all')
const keyword = ref('')

const selectedId = ref<string>('')

/** 桌面端：支持 ?id=xxx 深链；默认选中第一位 */
watch(
  isDesktop,
  (v) => {
    if (!v) return
    const q = route.query.id as string | undefined
    if (q) selectedId.value = q
    else if (!selectedId.value) selectedId.value = store.contacts[0]?.id ?? ''
  },
  { immediate: true },
)

watch(
  () => store.contacts.length,
  () => {
    if (isDesktop.value && !store.contacts.find((c) => c.id === selectedId.value)) {
      selectedId.value = store.contacts[0]?.id ?? ''
    }
  },
)

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

function select(id: string) {
  if (isDesktop.value) {
    selectedId.value = id
    router.replace({ query: { ...route.query, id } })
  } else {
    router.push(`/contact/${encodeURIComponent(id)}`)
  }
}

function onExport() {
  if (!store.contacts.length) return toast.error('还没有往来数据')
  exportContactsExcel(store.contacts)
  toast.success('已导出人情往来')
}
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div style="min-width: 0">
        <h1 class="topbar__title">人情往来</h1>
        <p class="topbar__sub">共 {{ store.contacts.length }} 位宾客 · 收送账目长期留档</p>
      </div>
      <div class="topbar__actions">
        <button class="btn btn--ghost" @click="onExport">
          <AppIcon name="download" :size="17" /> 导出往来账
        </button>
      </div>
    </header>

    <!-- 汇总 -->
    <section class="sum">
      <div class="sum__col">
        <span class="sum__k">累计收礼</span>
        <strong class="mono is-in">{{ formatMoney(store.totalReceived) }}</strong>
        <span class="sum__hint">亲友赠我</span>
      </div>
      <span class="sum__sep" />
      <div class="sum__col">
        <span class="sum__k">累计送礼</span>
        <strong class="mono is-out">{{ formatMoney(store.totalSent) }}</strong>
        <span class="sum__hint">我赠亲友</span>
      </div>
      <span class="sum__sep" />
      <div class="sum__col">
        <span class="sum__k">往来差额</span>
        <strong class="mono" :class="balance >= 0 ? 'is-in' : 'is-out'">
          {{ balance >= 0 ? '+' : '' }}{{ formatMoney(balance) }}
        </strong>
        <span class="sum__hint">{{ balance >= 0 ? '收多于送' : '送多于收' }}</span>
      </div>
    </section>

    <div class="split">
      <!-- 左：列表 -->
      <section class="list-col">
        <div class="search">
          <AppIcon name="search" :size="17" />
          <input v-model="keyword" placeholder="搜索姓名、手机号、关系" />
          <button v-if="keyword" class="search__clear" @click="keyword = ''">
            <AppIcon name="close" :size="15" />
          </button>
        </div>

        <div class="segment" style="margin-bottom: 14px">
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

        <p class="count dim">共 {{ filtered.length }} 位</p>

        <div v-if="filtered.length" class="clist">
          <article
            v-for="c in filtered"
            :key="c.id"
            class="contact"
            :class="{ 'is-active': isDesktop && selectedId === c.id }"
            @click="select(c.id)"
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
      </section>

      <!-- 右：详情 -->
      <section class="panel-col">
        <ContactPanel v-if="selectedId" :contact-id="selectedId" />
        <div v-else class="panel-empty">
          <div class="empty__mark serif">亲</div>
          <p class="empty__title">选择一位宾客</p>
          <p style="font-size: 13px; color: var(--ink-3)">
            左侧列表中点击姓名，即可查看历次人情往来与回礼参考
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.sum {
  display: flex;
  align-items: stretch;
  border-radius: 18px;
  padding: 20px 26px;
  background: linear-gradient(180deg, #fdfaf1, #f6efdd);
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow-sm);
}
.sum__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.sum__k {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.sum__col strong {
  font-size: 25px;
  font-weight: 700;
}
.sum__hint {
  font-size: 11.5px;
  color: var(--ink-3);
}
.sum__sep {
  width: 1px;
  background: var(--line-2);
  margin: 0 26px;
}
.is-in {
  color: var(--red);
}
.is-out {
  color: var(--green);
}

/* 主从分栏 */
.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.18fr);
  gap: 22px;
  align-items: start;
  margin-top: 22px;
}
.list-col {
  min-width: 0;
}
.panel-col {
  min-width: 0;
  position: sticky;
  top: 24px;
  background: var(--paper-3);
  border: 1px solid var(--line-2);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}
.panel-empty {
  text-align: center;
  padding: 60px 20px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--line-2);
  border-radius: 13px;
  margin-bottom: 14px;
  color: var(--ink-3);
}
.search input {
  flex: 1;
  min-width: 0;
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
  padding: 13px 15px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
}
.contact:hover {
  border-color: var(--line);
  transform: translateX(2px);
}
.contact.is-active {
  border-color: var(--red-soft);
  background: linear-gradient(100deg, #fdf6f3, var(--paper-2) 55%);
  box-shadow: 0 0 0 2px rgba(142, 43, 43, 0.08);
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

/* ---------- 移动端 ---------- */
@media (max-width: 959px) {
  .sum {
    padding: 16px 18px;
    flex-wrap: wrap;
  }
  .sum__col {
    min-width: 30%;
  }
  .sum__col strong {
    font-size: 18px;
  }
  .sum__sep {
    margin: 0 12px;
  }
  .split {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    margin-top: 16px;
  }
  .panel-col {
    display: none;
  }
}
</style>
