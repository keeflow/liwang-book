<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { Book, GiftRecord, RecordKind } from '@/types'
import { useLedgerStore } from '@/stores/ledger'
import { useToast } from '@/stores/toast'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { QUICK_AMOUNTS } from '@/utils/id'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  open: boolean
  book: Book
  /** 传入则为编辑模式 */
  record?: GiftRecord | null
  /** 已知关系候选 */
  relations?: string[]
}>()

const emit = defineEmits<{ close: [] }>()

const store = useLedgerStore()
const toast = useToast()

const form = reactive({
  name: '',
  amount: '',
  kind: 'cash' as RecordKind,
  gift: '',
  relation: '',
  phone: '',
  note: '',
})
const showMore = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)
const amountInput = ref<HTMLInputElement | null>(null)

const isEdit = computed(() => !!props.record)
const today = computed(() => store.todayStats(props.book.id))

const amountNumber = computed(() => {
  const v = parseFloat(form.amount)
  return isNaN(v) ? 0 : v
})
const amountCN = computed(() => (amountNumber.value > 0 ? toChineseAmount(amountNumber.value) : ''))

const relationOptions = computed(() => (props.relations ?? []).slice(0, 8))

function reset() {
  form.name = ''
  form.amount = ''
  form.kind = 'cash'
  form.gift = ''
  form.relation = ''
  form.phone = ''
  form.note = ''
  showMore.value = false
}

function fillFromRecord(r: GiftRecord) {
  form.name = r.name
  form.amount = r.amount ? String(r.amount) : ''
  form.kind = r.kind
  form.gift = r.gift || ''
  form.relation = r.relation || ''
  form.phone = r.phone || ''
  form.note = r.note || ''
  showMore.value = !!(r.relation || r.phone || r.note)
}

watch(
  () => [props.open, props.record] as const,
  ([open, rec]) => {
    if (!open) return
    if (rec) fillFromRecord(rec)
    else reset()
    nextTick(() => {
      if (rec) amountInput.value?.focus()
      else nameInput.value?.focus()
    })
  },
  { immediate: true },
)

function pickAmount(v: number) {
  form.amount = String(v)
  amountInput.value?.focus()
}

function onNameEnter() {
  if (form.kind === 'gift' && !form.amount) {
    document.getElementById('quick-gift-input')?.focus()
    return
  }
  amountInput.value?.focus()
}

function save(continueNext: boolean) {
  const name = form.name.trim()
  if (!name) {
    toast.error('请填写宾客姓名')
    nameInput.value?.focus()
    return
  }
  if (form.kind === 'cash' && amountNumber.value <= 0) {
    toast.error('请填写礼金金额')
    amountInput.value?.focus()
    return
  }
  if (form.kind === 'gift' && !form.gift.trim() && amountNumber.value <= 0) {
    toast.error('请填写礼品或礼金')
    return
  }

  const payload = {
    bookId: props.book.id,
    name,
    amount: amountNumber.value,
    kind: form.kind,
    gift: form.gift.trim() || undefined,
    relation: form.relation.trim() || undefined,
    phone: form.phone.trim() || undefined,
    note: form.note.trim() || undefined,
  }

  if (props.record) {
    store.updateRecord(props.record.id, payload)
    toast.success('已保存修改')
    emit('close')
    return
  }

  store.addRecord(payload)
  const tip =
    form.kind === 'gift' && !amountNumber.value
      ? `已记下 ${name} 的礼品`
      : `已记下 ${name} ${formatMoney(amountNumber.value)}`
  toast.success(tip)

  if (continueNext) {
    const keepRelation = form.relation
    reset()
    form.relation = keepRelation
    nextTick(() => nameInput.value?.focus())
  } else {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="mask" @click="emit('close')" />
    </Transition>
    <Transition name="slide">
      <div v-if="open" class="sheet quick">
        <div class="sheet__grip" />

        <header class="quick__head">
          <div>
            <p class="quick__book">{{ book.name }}</p>
            <p class="quick__today">
              今日已收
              <strong class="mono">{{ formatMoney(today.amount) }}</strong>
              <span class="dim"> · 共 {{ today.count }} 笔</span>
            </p>
          </div>
          <button class="icon-btn" @click="emit('close')">
            <AppIcon name="close" :size="18" />
          </button>
        </header>

        <div v-if="isEdit" class="quick__editbar">正在编辑 · {{ record?.name }}</div>

        <div class="quick__body">
          <div class="field">
            <label class="field__label">姓名</label>
            <input
              ref="nameInput"
              v-model="form.name"
              class="input input--lg"
              placeholder="宾客姓名"
              autocomplete="off"
              enterkeyhint="next"
              @keyup.enter="onNameEnter"
            />
          </div>

          <div class="field">
            <label class="field__label">
              礼金
              <span v-if="form.kind === 'gift'" class="dim">（可与礼品并存，可留空）</span>
            </label>
            <div class="money-input">
              <span class="money-input__symbol serif">¥</span>
              <input
                ref="amountInput"
                v-model="form.amount"
                class="input input--amount"
                type="number"
                inputmode="decimal"
                placeholder="0"
                enterkeyhint="done"
                @keyup.enter="save(true)"
              />
            </div>
            <p class="field-hint serif" :class="{ 'is-placeholder': !amountCN }">
              {{ amountCN || '大写金额将自动生成' }}
            </p>
          </div>

          <div class="chips quick__chips">
            <button
              v-for="a in QUICK_AMOUNTS"
              :key="a"
              class="chip"
              :class="{ 'is-active': Number(form.amount) === a }"
              type="button"
              @click="pickAmount(a)"
            >
              {{ a }}
            </button>
          </div>

          <div class="field quick__kind">
            <label class="field__label">类型</label>
            <div class="segment">
              <button
                class="segment__item"
                :class="{ 'is-active': form.kind === 'cash' }"
                type="button"
                @click="form.kind = 'cash'"
              >
                礼金
              </button>
              <button
                class="segment__item"
                :class="{ 'is-active': form.kind === 'gift' }"
                type="button"
                @click="form.kind = 'gift'"
              >
                礼品
              </button>
            </div>
          </div>

          <div v-if="form.kind === 'gift'" class="field">
            <label class="field__label">礼品</label>
            <input
              id="quick-gift-input"
              v-model="form.gift"
              class="input"
              placeholder="如：五粮液 × 2"
            />
          </div>

          <button class="quick__toggle" type="button" @click="showMore = !showMore">
            <AppIcon :name="showMore ? 'down' : 'right'" :size="14" />
            {{ showMore ? '收起更多信息' : '添加关系 / 手机号 / 备注' }}
          </button>

          <div v-if="showMore" class="quick__more">
            <div class="field">
              <label class="field__label">关系</label>
              <input v-model="form.relation" class="input" placeholder="如：朋友、同事、亲戚" />
              <div v-if="relationOptions.length" class="chips quick__relchips">
                <button
                  v-for="r in relationOptions"
                  :key="r"
                  class="chip"
                  :class="{ 'is-active': form.relation === r }"
                  type="button"
                  @click="form.relation = r"
                >
                  {{ r }}
                </button>
              </div>
            </div>
            <div class="field">
              <label class="field__label">手机号</label>
              <input v-model="form.phone" class="input" type="tel" placeholder="选填" />
            </div>
            <div class="field">
              <label class="field__label">备注</label>
              <input v-model="form.note" class="input" placeholder="选填" />
            </div>
          </div>
        </div>

        <footer class="quick__foot">
          <button v-if="isEdit" class="btn btn--ghost" @click="emit('close')">取消</button>
          <button class="btn btn--primary btn--block" @click="save(!isEdit)">
            {{ isEdit ? '保存修改' : '保存并继续' }}
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.quick {
  max-height: 94vh;
}
.quick__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line-3);
  margin-bottom: 16px;
}
.quick__book {
  font-family: var(--serif);
  font-size: 16px;
  letter-spacing: 0.06em;
}
.quick__today {
  font-size: 12.5px;
  color: var(--ink-2);
  margin-top: 3px;
}
.quick__today strong {
  color: var(--red);
  font-size: 14px;
}
.quick__editbar {
  background: var(--gold-wash);
  border: 1px solid #e6d7ad;
  color: #8a6a1c;
  border-radius: 10px;
  font-size: 13px;
  padding: 8px 12px;
  margin-bottom: 14px;
  text-align: center;
}
.quick__body {
  padding-bottom: 4px;
}
.money-input {
  position: relative;
}
.money-input__symbol {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--ink-3);
}
.quick__chips {
  margin: -4px 0 18px;
}
.quick__kind {
  margin-top: 4px;
}
.quick__toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--red);
  font-size: 13.5px;
  padding: 10px 0 6px;
}
.quick__more {
  padding-top: 8px;
  animation: page-in 0.24s ease;
}
.quick__relchips {
  margin-top: 8px;
}
.field-hint.is-placeholder {
  opacity: 0.55;
}
.quick__foot {
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(250, 245, 233, 0), var(--paper-2) 22%);
  padding: 14px 0 2px;
  display: flex;
  gap: 10px;
}
.quick__foot .btn--block {
  flex: 1;
}
</style>
