<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { BOOK_TYPES, type BookDirection, type BookType } from '@/types'
import { todayISO } from '@/utils/date'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()
const toast = useToast()

const editId = computed(() => (route.params.id as string) || '')
const isEdit = computed(() => !!editId.value)
const existing = computed(() => (editId.value ? store.getBook(editId.value) : undefined))

const form = reactive({
  name: '',
  type: '婚礼' as BookType,
  date: todayISO(),
  location: '',
  host: '',
  note: '',
  direction: 'in' as BookDirection,
})

onMounted(() => {
  if (existing.value) {
    Object.assign(form, {
      name: existing.value.name,
      type: existing.value.type,
      date: existing.value.date,
      location: existing.value.location || '',
      host: existing.value.host || '',
      note: existing.value.note || '',
      direction: existing.value.direction,
    })
  }
})

/** 依据类型与主人姓名给一个建议书名 */
function suggestName() {
  if (form.name.trim()) return
  const host = form.host.trim()
  if (!host) {
    form.name = form.type === '其他' ? '' : form.type
    return
  }
  form.name = form.type === '其他' ? host : `${host} ${form.type}`
}

const namePlaceholder = computed(() => {
  if (form.direction === 'out') return `如：${form.host || '张三'} ${form.type}`
  return `如：${form.host ? form.host + ' ' : ''}${form.type}`
})

function submit() {
  if (!form.name.trim()) {
    toast.error('请填写礼簿名称')
    return
  }
  if (!form.date) {
    toast.error('请选择日期')
    return
  }
  const payload = {
    name: form.name.trim(),
    type: form.type,
    date: form.date,
    location: form.location.trim(),
    host: form.host.trim(),
    note: form.note.trim(),
    direction: form.direction,
  }
  if (isEdit.value && existing.value) {
    store.updateBook(existing.value.id, payload)
    toast.success('礼簿已更新')
    router.replace(`/book/${existing.value.id}/cover`)
  } else {
    const book = store.createBook(payload)
    toast.success('礼簿已创建')
    router.replace(`/book/${book.id}/cover`)
  }
}
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <div style="min-width: 0">
        <h1 class="topbar__title">{{ isEdit ? '编辑礼簿' : '新建礼簿' }}</h1>
        <p class="topbar__sub">填写宴席信息，创建后即可开始记礼</p>
      </div>
    </div>

    <div class="form-card">
      <div class="field field--full">
        <label class="field__label">方向</label>
        <div class="segment" style="max-width: 420px">
          <button
            class="segment__item"
            :class="{ 'is-active': form.direction === 'in' }"
            @click="form.direction = 'in'"
          >
            收礼 · 我办席
          </button>
          <button
            class="segment__item"
            :class="{ 'is-active': form.direction === 'out' }"
            @click="form.direction = 'out'"
          >
            送礼 · 我赴席
          </button>
        </div>
        <p class="field-hint">
          {{
            form.direction === 'in'
              ? '记录本次宴席收到的礼金与礼品'
              : '记录本次赴席送出的礼金，用于人情往来统计'
          }}
        </p>
      </div>

      <div class="form-grid">
        <div class="field field--full">
          <label class="field__label">礼簿名称</label>
          <input v-model="form.name" class="input" :placeholder="namePlaceholder" />
        </div>

        <div class="field field--full">
          <label class="field__label">类型</label>
          <div class="chips">
            <button
              v-for="t in BOOK_TYPES"
              :key="t"
              class="chip"
              :class="{ 'is-active': form.type === t }"
              type="button"
              @click="form.type = t; suggestName()"
            >
              {{ t }}
            </button>
          </div>
        </div>

        <div class="field">
          <label class="field__label">日期</label>
          <input v-model="form.date" class="input" type="date" />
        </div>

        <div class="field">
          <label class="field__label">{{ form.direction === 'in' ? '主人姓名' : '对方姓名' }}</label>
          <input
            v-model="form.host"
            class="input"
            :placeholder="form.direction === 'in' ? '如：王强' : '如：张三'"
            @blur="suggestName()"
          />
          <p class="field-hint">用于封面展示与导出</p>
        </div>

        <div class="field">
          <label class="field__label">地点</label>
          <input v-model="form.location" class="input" placeholder="选填，如：锦江饭店 三楼宴会厅" />
        </div>

        <div class="field field--full">
          <label class="field__label">备注</label>
          <textarea v-model="form.note" class="input" placeholder="选填" />
        </div>
      </div>

      <div class="form-card__foot">
        <button class="btn btn--ghost" @click="router.back()">取消</button>
        <button class="btn btn--primary" @click="submit">
          {{ isEdit ? '保存修改' : '创建并进入礼簿' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  background: var(--paper-2);
  border: 1px solid var(--line-2);
  border-radius: 20px;
  padding: 26px 28px 22px;
  box-shadow: var(--shadow-sm);
  max-width: 880px;
}
.form-card__foot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 6px;
  border-top: 1px solid var(--line-3);
  margin-top: 8px;
}
@media (max-width: 959px) {
  .form-card {
    padding: 18px 16px 16px;
    border-radius: 16px;
  }
  .form-card__foot .btn {
    flex: 1;
  }
}
</style>
