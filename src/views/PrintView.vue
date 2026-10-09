<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { toChineseDate, toDisplayDate } from '@/utils/date'
import { computeStats } from '@/utils/stats'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()

const PER_PAGE = 20

const id = computed(() => route.params.id as string)
const book = computed(() => store.getBook(id.value))
const records = computed(() => store.recordsOf(id.value))
const stats = computed(() => computeStats(records.value))

const chunks = computed(() => {
  const out: typeof records.value[] = []
  for (let i = 0; i < records.value.length; i += PER_PAGE) {
    out.push(records.value.slice(i, i + PER_PAGE))
  }
  return out.length ? out : [[]]
})

function print() {
  window.print()
}
</script>

<template>
  <div v-if="book" class="print-root">
    <div class="print-bar no-print">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <h1 class="topbar__title">打印 / 导出 PDF</h1>
      <button class="btn btn--primary btn--sm" @click="print">
        <AppIcon name="print" :size="16" /> 打印
      </button>
    </div>
    <p class="print-tip no-print">在打印对话框中选择「保存为 PDF」即可得到电子礼簿。</p>

    <!-- 封面页 -->
    <section class="p-page p-cover">
      <div class="p-cover__frame">
        <div class="p-cover__label">
          <span class="p-cover__chars serif">礼簿</span>
        </div>
        <div class="p-cover__meta">
          <p class="p-cover__type">{{ book.type }}</p>
          <h2 class="p-cover__name serif">{{ book.name }}</h2>
          <p class="p-cover__date serif">{{ toChineseDate(book.date) }}</p>
          <p v-if="book.location" class="p-cover__place">{{ book.location }}</p>
        </div>
      </div>
    </section>

    <!-- 正文页 -->
    <section v-for="(chunk, ci) in chunks" :key="ci" class="p-page">
      <header class="p-head">
        <h2 class="p-head__title serif">{{ book.name }}</h2>
        <p class="p-head__date serif">{{ toChineseDate(book.date) }}</p>
      </header>

      <table class="p-table">
        <thead>
          <tr>
            <th class="c-idx serif">序号</th>
            <th class="c-name serif">姓名</th>
            <th class="c-money serif">礼金</th>
            <th class="c-gift serif">礼品</th>
            <th class="c-rel serif">关系</th>
            <th class="c-note serif">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in chunk" :key="r.id">
            <td class="c-idx serif">{{ ci * PER_PAGE + i + 1 }}</td>
            <td class="c-name serif">{{ r.name }}</td>
            <td class="c-money serif">
              {{ Number(r.amount) > 0 ? toChineseAmount(r.amount) : '—' }}
              <em v-if="Number(r.amount) > 0" class="p-num">{{ formatMoney(r.amount) }}</em>
            </td>
            <td class="c-gift">{{ r.gift || '' }}</td>
            <td class="c-rel">{{ r.relation || '' }}</td>
            <td class="c-note">{{ r.note || '' }}</td>
          </tr>
        </tbody>
      </table>

      <footer class="p-foot">
        <span class="serif">第 {{ ci + 1 }} 页 / 共 {{ chunks.length }} 页</span>
        <span v-if="ci === chunks.length - 1" class="p-foot__sum serif">
          合计 {{ stats.people }} 人 · {{ stats.count }} 笔 ·
          <strong>{{ toChineseAmount(stats.total) }}</strong>
          <em class="p-num">{{ formatMoney(stats.total) }}</em>
        </span>
      </footer>
    </section>

    <p class="p-sign no-print">
      礼簿生成于 {{ toDisplayDate(new Date().toISOString().slice(0, 10)) }} · 礼往
    </p>
  </div>

  <div v-else class="page">
    <div class="empty">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">礼簿不存在</p>
    </div>
  </div>
</template>

<style scoped>
.print-root {
  background: #e7ddc7;
  min-height: 100vh;
  padding: 0 0 40px;
}
.print-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(250, 245, 233, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line-2);
}
.print-tip {
  text-align: center;
  font-size: 12px;
  color: var(--ink-3);
  padding: 10px 16px 0;
}

.p-page {
  width: min(100% - 24px, 720px);
  margin: 14px auto;
  background: #fdfaf1;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 26px 24px;
  box-shadow: var(--shadow);
  color: var(--ink);
}

/* 封面 */
.p-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 520px;
  background: linear-gradient(160deg, #9c3535, #7c2424 60%, #631c1c);
  border-color: rgba(211, 179, 101, 0.5);
}
.p-cover__frame {
  width: 86%;
  border: 1px solid rgba(211, 179, 101, 0.65);
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26px;
}
.p-cover__label {
  background: #f7efdb;
  padding: 18px 16px;
  border-radius: 3px;
}
.p-cover__chars {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 32px;
  color: var(--red-deep);
  letter-spacing: 0.04em;
}
.p-cover__meta {
  text-align: center;
  color: #fbf2dc;
}
.p-cover__type {
  font-size: 11px;
  letter-spacing: 0.4em;
  color: rgba(240, 220, 175, 0.8);
}
.p-cover__name {
  font-size: 20px;
  letter-spacing: 0.1em;
  margin-top: 8px;
}
.p-cover__date {
  font-size: 12.5px;
  letter-spacing: 0.1em;
  color: rgba(236, 216, 175, 0.8);
  margin-top: 6px;
}
.p-cover__place {
  font-size: 11px;
  color: rgba(236, 216, 175, 0.6);
  margin-top: 4px;
}

/* 正文 */
.p-head {
  text-align: center;
  padding-bottom: 14px;
  border-bottom: 1.5px solid var(--line);
  margin-bottom: 4px;
}
.p-head__title {
  font-size: 19px;
  letter-spacing: 0.2em;
  color: var(--red-deep);
}
.p-head__date {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--ink-2);
  margin-top: 5px;
}

.p-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.p-table th,
.p-table td {
  border-bottom: 1px solid var(--line-2);
  padding: 8px 6px;
  font-size: 13px;
  text-align: center;
  vertical-align: middle;
}
.p-table th {
  font-size: 12.5px;
  letter-spacing: 0.16em;
  color: var(--ink-2);
  border-bottom: 1.5px solid var(--line);
  background: rgba(142, 43, 43, 0.04);
}
.p-table td.c-name {
  font-size: 14.5px;
  letter-spacing: 0.14em;
}
.p-table td.c-money {
  color: var(--red-deep);
}
.p-table td.c-gift,
.p-table td.c-rel,
.p-table td.c-note {
  font-size: 11.5px;
  color: var(--ink-2);
  word-break: break-all;
}
.c-idx {
  width: 52px;
}
.c-name {
  width: 88px;
}
.c-money {
  width: 148px;
}
.c-gift {
  width: 100px;
}
.c-rel {
  width: 66px;
}
.p-num {
  display: block;
  font-style: normal;
  font-size: 10.5px;
  color: var(--ink-3);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}
.p-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.p-foot__sum strong {
  color: var(--red-deep);
}
.p-sign {
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.14em;
  margin-top: 18px;
}

/* 打印 */
@media print {
  @page {
    size: A4;
    margin: 14mm 12mm;
  }
  .print-root {
    background: #fff;
    padding: 0;
  }
  .p-page {
    width: 100%;
    margin: 0;
    border: none;
    box-shadow: none;
    border-radius: 0;
    padding: 0;
    break-after: page;
    page-break-after: always;
  }
  .p-page:last-of-type {
    break-after: auto;
    page-break-after: auto;
  }
  .p-cover {
    min-height: auto;
    height: 246mm;
    padding: 40mm 30mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .p-cover__label,
  .p-table th,
  .p-head,
  .p-foot {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .p-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .p-head {
    break-after: avoid;
  }
  .p-table th {
    background: #f4ece0 !important;
  }
}
</style>
