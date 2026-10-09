<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { formatMoney } from '@/utils/cny'
import { downloadJSON, exportAllExcel, exportContactsExcel } from '@/utils/export'
import AppIcon from '@/components/AppIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { BackupPayload } from '@/types'

const store = useLedgerStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const confirmClear = ref(false)
const replaceOnImport = ref(true)

const overview = computed(() => [
  { label: '礼簿', value: String(store.books.length), unit: '本', sub: '含已封存' },
  { label: '登记记录', value: String(store.records.length), unit: '笔', sub: '全部礼金与礼品' },
  { label: '宾客', value: String(store.contacts.length), unit: '位', sub: '自动归并同名' },
])
const balance = computed(() => store.totalReceived - store.totalSent)

function onExportAll() {
  if (!store.books.length) return toast.error('还没有礼簿可导出')
  exportAllExcel(store.sortedBooks, store.recordsByBook)
  toast.success('已导出全部礼簿')
}

function onExportContacts() {
  if (!store.contacts.length) return toast.error('还没有往来数据')
  exportContactsExcel(store.contacts)
  toast.success('已导出人情往来')
}

function onBackup() {
  const payload = store.exportBackup()
  downloadJSON(payload, `礼往-备份-${new Date().toISOString().slice(0, 10)}.json`)
  toast.success('备份文件已生成')
}

function triggerImport() {
  fileInput.value?.click()
}

async function onFile(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const payload = JSON.parse(text) as BackupPayload
    store.importBackup(payload, replaceOnImport.value ? 'replace' : 'merge')
    toast.success(replaceOnImport.value ? '数据已恢复' : '数据已合并')
  } catch (err) {
    console.error(err)
    toast.error('备份文件解析失败')
  }
}

function onClear() {
  store.clearAll()
  confirmClear.value = false
  toast.success('已清空全部数据')
}
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div style="min-width: 0">
        <h1 class="topbar__title">我的</h1>
        <p class="topbar__sub">数据概览、显示偏好与备份管理</p>
      </div>
    </header>

    <!-- 概览 -->
    <section class="kpis">
      <div v-for="o in overview" :key="o.label" class="kpi">
        <span class="kpi__label">{{ o.label }}</span>
        <strong class="kpi__value mono">{{ o.value }}<em>{{ o.unit }}</em></strong>
        <span class="kpi__sub">{{ o.sub }}</span>
      </div>
      <div class="kpi kpi--money">
        <span class="kpi__label">往来差额</span>
        <strong class="kpi__value mono" :class="balance >= 0 ? 'is-in' : 'is-out'">
          {{ balance >= 0 ? '+' : '' }}{{ formatMoney(balance) }}
        </strong>
        <span class="kpi__sub">
          收 {{ formatMoney(store.totalReceived) }} · 送 {{ formatMoney(store.totalSent) }}
        </span>
      </div>
    </section>

    <div class="settings-grid">
      <!-- 左列 -->
      <div class="settings-col">
        <section class="panel">
          <div class="panel__head"><h2>显示设置</h2></div>
          <div class="row">
            <div class="row__label">
              <AppIcon name="sparkle" :size="18" />
              <div>
                <p>金额默认显示</p>
                <span class="row__hint">礼簿中点击「礼金」表头可随时切换</span>
              </div>
            </div>
            <div class="segment segment--sm">
              <button
                class="segment__item"
                :class="{ 'is-active': store.settings.moneyStyle === 'traditional' }"
                @click="store.updateSettings({ moneyStyle: 'traditional' })"
              >
                大写
              </button>
              <button
                class="segment__item"
                :class="{ 'is-active': store.settings.moneyStyle === 'numeric' }"
                @click="store.updateSettings({ moneyStyle: 'numeric' })"
              >
                数字
              </button>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel__head"><h2>关于礼往</h2></div>
          <p class="about__quote serif">记得快、看着熟、查得到、算得清、长期留得住。</p>
          <p class="row__hint" style="margin-top: 10px; line-height: 1.75">
            礼往将纸质礼簿电子化：查看时像一本传统礼簿，录入时像现代
            App。所有数据保存在本机浏览器的 IndexedDB 中，可随时导出备份，不上传云端。
          </p>
          <div class="about__row">
            <span class="dim">版本</span>
            <span class="mono">v1.2.0</span>
          </div>
          <div class="about__row">
            <span class="dim">技术栈</span>
            <span class="mono">Vue 3 · Vite · TypeScript</span>
          </div>
        </section>
      </div>

      <!-- 右列 -->
      <div class="settings-col">
        <section class="panel">
          <div class="panel__head">
            <h2>数据管理</h2>
            <span class="dim">建议定期备份</span>
          </div>
          <div class="group">
            <button class="row row--tap" @click="onExportAll">
              <div class="row__label">
                <AppIcon name="download" :size="18" />
                <div>
                  <p>导出全部礼簿 Excel</p>
                  <span class="row__hint">每本礼簿一个工作表</span>
                </div>
              </div>
              <AppIcon name="right" :size="15" />
            </button>
            <button class="row row--tap" @click="onExportContacts">
              <div class="row__label">
                <AppIcon name="contacts" :size="18" />
                <div>
                  <p>导出人情往来 Excel</p>
                  <span class="row__hint">含收礼、送礼与差额</span>
                </div>
              </div>
              <AppIcon name="right" :size="15" />
            </button>
            <button class="row row--tap" @click="onBackup">
              <div class="row__label">
                <AppIcon name="archive" :size="18" />
                <div>
                  <p>数据备份</p>
                  <span class="row__hint">导出 JSON 文件，可长期保存</span>
                </div>
              </div>
              <AppIcon name="right" :size="15" />
            </button>
            <button class="row row--tap" @click="triggerImport">
              <div class="row__label">
                <AppIcon name="upload" :size="18" />
                <div>
                  <p>恢复备份</p>
                  <span class="row__hint">
                    {{ replaceOnImport ? '将覆盖现有数据' : '与现有数据合并' }}
                  </span>
                </div>
              </div>
              <AppIcon name="right" :size="15" />
            </button>
            <div class="row">
              <div class="row__label">
                <AppIcon name="filter" :size="18" />
                <div>
                  <p>导入方式</p>
                  <span class="row__hint">恢复前请先做好备份</span>
                </div>
              </div>
              <div class="segment segment--sm">
                <button
                  class="segment__item"
                  :class="{ 'is-active': replaceOnImport }"
                  @click="replaceOnImport = true"
                >
                  覆盖
                </button>
                <button
                  class="segment__item"
                  :class="{ 'is-active': !replaceOnImport }"
                  @click="replaceOnImport = false"
                >
                  合并
                </button>
              </div>
            </div>
            <button class="row row--tap row--danger" @click="confirmClear = true">
              <div class="row__label">
                <AppIcon name="trash" :size="18" />
                <div>
                  <p>清空全部数据</p>
                  <span class="row__hint">删除全部礼簿与记录</span>
                </div>
              </div>
              <AppIcon name="right" :size="15" />
            </button>
          </div>
        </section>
      </div>
    </div>

    <p class="footer serif">礼往 · 一本礼簿，记下每一次人情往来</p>

    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      style="display: none"
      @change="onFile"
    />

    <ConfirmDialog
      :open="confirmClear"
      title="清空全部数据"
      message="将删除本机保存的全部礼簿、记录与设置，操作不可恢复。建议先导出备份。"
      confirm-text="确认清空"
      danger
      @cancel="confirmClear = false"
      @confirm="onClear"
    />
  </div>
</template>

<style scoped>
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
}
.kpi__label {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.kpi__value {
  font-size: 25px;
  font-weight: 700;
  line-height: 1.15;
}
.kpi__value em {
  font-style: normal;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
  margin-left: 3px;
}
.kpi--money .kpi__value {
  font-size: 21px;
}
.kpi__value.is-in {
  color: var(--red);
}
.kpi__value.is-out {
  color: var(--green);
}
.kpi__sub {
  font-size: 11.5px;
  color: var(--ink-3);
}

.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 18px;
  margin-top: 18px;
  align-items: start;
}
.settings-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.group {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 6px;
  border-bottom: 1px solid var(--line-3);
  color: var(--ink-2);
  width: 100%;
  text-align: left;
  border-radius: 10px;
}
.row:last-child {
  border-bottom: none;
}
.row--tap:hover {
  background: rgba(142, 43, 43, 0.05);
}
.row--danger .row__label p,
.row--danger .row__label svg {
  color: var(--red);
}
.row__label {
  display: flex;
  align-items: center;
  gap: 13px;
  color: var(--ink-2);
  min-width: 0;
}
.row__label p {
  font-size: 14.5px;
  color: var(--ink);
}
.row__hint {
  font-size: 11.5px;
  color: var(--ink-3);
  display: block;
  line-height: 1.6;
}
.segment--sm {
  width: 120px;
  flex: none;
}
.segment--sm .segment__item {
  height: 30px;
  font-size: 12.5px;
}

.about__quote {
  font-size: 15px;
  color: var(--red-deep);
  letter-spacing: 0.06em;
}
.about__row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px dashed var(--line-3);
}

.footer {
  text-align: center;
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.14em;
  padding: 36px 0 6px;
}

@media (max-width: 1100px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 959px) {
  .kpis {
    gap: 10px;
  }
  .kpi {
    padding: 14px 16px;
    border-radius: 15px;
  }
  .kpi__value {
    font-size: 21px;
  }
  .settings-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    margin-top: 16px;
  }
  .footer {
    padding: 24px 0 6px;
  }
}
</style>
