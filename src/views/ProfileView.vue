<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { formatMoney } from '@/utils/cny'
import { downloadJSON, exportAllExcel, exportContactsExcel } from '@/utils/export'
import AppIcon from '@/components/AppIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { BackupPayload } from '@/types'

const router = useRouter()
const store = useLedgerStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const confirmClear = ref(false)
const replaceOnImport = ref(true)

const overview = computed(() => [
  { label: '礼簿', value: store.books.length, unit: '本' },
  { label: '记录', value: store.records.length, unit: '笔' },
  { label: '宾客', value: store.contacts.length, unit: '位' },
])

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
    <div class="topbar">
      <h1 class="topbar__title" style="padding-left: 4px">我的</h1>
    </div>

    <!-- 品牌 -->
    <section class="brandcard">
      <div class="brandcard__seal seal serif">礼往</div>
      <div class="brandcard__text">
        <h2 class="serif">礼往</h2>
        <p>一本礼簿，记下每一次人情往来</p>
      </div>
    </section>

    <!-- 概览 -->
    <section class="ov">
      <div v-for="o in overview" :key="o.label" class="ov__cell">
        <strong class="mono">{{ o.value }}</strong>
        <span>{{ o.label }}（{{ o.unit }}）</span>
      </div>
    </section>
    <section class="ov ov--money">
      <div class="ov__cell">
        <strong class="mono is-in">{{ formatMoney(store.totalReceived) }}</strong>
        <span>累计收礼</span>
      </div>
      <div class="ov__cell">
        <strong class="mono is-out">{{ formatMoney(store.totalSent) }}</strong>
        <span>累计送礼</span>
      </div>
    </section>

    <!-- 显示设置 -->
    <div class="section-title"><h2>显示设置</h2></div>
    <div class="group">
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
    </div>

    <!-- 数据管理 -->
    <div class="section-title"><h2>数据管理</h2></div>
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
            <span class="row__hint">{{ replaceOnImport ? '将覆盖现有数据' : '与现有数据合并' }}</span>
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

    <!-- 关于 -->
    <div class="section-title"><h2>关于</h2></div>
    <div class="group">
      <div class="row row--col">
        <p class="about__quote serif">记得快、看着熟、查得到、算得清、长期留得住。</p>
        <p class="row__hint" style="margin-top: 8px">
          礼往将纸质礼簿电子化：查看时像一本传统礼簿，录入时像现代 App。所有数据保存在本机浏览器中，
          可随时导出备份，不上传云端。
        </p>
      </div>
      <div class="row">
        <div class="row__label">
          <AppIcon name="book" :size="18" />
          <div><p>版本</p></div>
        </div>
        <span class="row__hint mono">v1.0.0</span>
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
.brandcard {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(150deg, #9c3535, #7c2424 60%, #631c1c);
  box-shadow: 0 12px 30px rgba(122, 35, 35, 0.26);
  color: #fdf6e6;
  position: relative;
  overflow: hidden;
}
.brandcard::after {
  content: '';
  position: absolute;
  right: -34px;
  bottom: -34px;
  width: 116px;
  height: 116px;
  border: 1px solid rgba(211, 179, 101, 0.28);
  border-radius: 50%;
}
.brandcard__seal {
  width: 50px;
  height: 50px;
  font-size: 15px;
  background: rgba(255, 245, 225, 0.16);
  border: 1px solid rgba(211, 179, 101, 0.6);
  color: #f7e6c4;
  flex: none;
}
.brandcard__text h2 {
  font-size: 20px;
  letter-spacing: 0.2em;
}
.brandcard__text p {
  font-size: 11.5px;
  color: rgba(250, 235, 205, 0.72);
  margin-top: 3px;
  letter-spacing: 0.06em;
}

.ov {
  display: flex;
  margin-top: 14px;
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  padding: 16px 8px;
  box-shadow: var(--shadow-sm);
}
.ov__cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ov__cell + .ov__cell {
  border-left: 1px solid var(--line-3);
}
.ov__cell strong {
  font-size: 20px;
  font-weight: 700;
}
.ov__cell span {
  font-size: 11.5px;
  color: var(--ink-3);
}
.ov--money .ov__cell strong {
  font-size: 17px;
}
.is-in {
  color: var(--red);
}
.is-out {
  color: var(--ink-2);
}

.group {
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-3);
  color: var(--ink-2);
  width: 100%;
  text-align: left;
}
.row:last-child {
  border-bottom: none;
}
.row--tap:active {
  background: rgba(142, 43, 43, 0.045);
}
.row--danger .row__label p,
.row--danger .row__label svg {
  color: var(--red);
}
.row--col {
  flex-direction: column;
  align-items: flex-start;
}
.row__label {
  display: flex;
  align-items: center;
  gap: 12px;
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
  line-height: 1.55;
}
.segment--sm {
  width: 108px;
  flex: none;
}
.segment--sm .segment__item {
  height: 30px;
  font-size: 12.5px;
}

.about__quote {
  font-size: 14.5px;
  color: var(--red-deep);
  letter-spacing: 0.06em;
}
.footer {
  text-align: center;
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.14em;
  padding: 28px 0 6px;
}
</style>
