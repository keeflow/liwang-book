<script setup lang="ts">
import type { GiftRecord } from '@/types'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { formatTime } from '@/utils/date'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ open: boolean; record: GiftRecord | null; index?: number }>()
const emit = defineEmits<{ close: []; edit: []; remove: [] }>()

function hasAmount(r: GiftRecord | null) {
  return !!r && Number(r.amount) > 0
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="mask" @click="emit('close')" />
    </Transition>
    <Transition name="slide">
      <div v-if="open && record" class="sheet">
        <div class="sheet__grip" />
        <header class="rec__head">
          <div class="rec__avatar serif">{{ record.name.trim().slice(0, 1) }}</div>
          <div class="rec__id">
            <h3 class="rec__name serif">{{ record.name }}</h3>
            <p class="rec__sub">
              <span v-if="index">第 {{ index }} 笔 · </span>
              {{ record.relation || '未填关系' }}
            </p>
          </div>
        </header>

        <div v-if="hasAmount(record)" class="rec__amount">
          <p class="rec__amount-num serif">{{ toChineseAmount(record.amount) }}</p>
          <p class="rec__amount-num2 mono">{{ formatMoney(record.amount) }}</p>
        </div>
        <div v-else-if="record.gift" class="rec__gift">
          <AppIcon name="gift" :size="18" />
          <span>{{ record.gift }}</span>
        </div>

        <dl class="rec__list">
          <div v-if="record.gift && hasAmount(record)" class="rec__row">
            <dt>礼品</dt>
            <dd>{{ record.gift }}</dd>
          </div>
          <div v-if="record.phone" class="rec__row">
            <dt>手机号</dt>
            <dd class="mono">{{ record.phone }}</dd>
          </div>
          <div v-if="record.note" class="rec__row">
            <dt>备注</dt>
            <dd>{{ record.note }}</dd>
          </div>
          <div class="rec__row">
            <dt>登记时间</dt>
            <dd class="mono">{{ formatTime(record.createdAt) }}</dd>
          </div>
          <div v-if="record.createdBy" class="rec__row">
            <dt>登记人员</dt>
            <dd>{{ record.createdBy }}</dd>
          </div>
        </dl>

        <div class="rec__actions">
          <button class="btn btn--ghost" @click="emit('remove')">
            <AppIcon name="trash" :size="17" />
            删除
          </button>
          <button class="btn btn--primary" @click="emit('edit')">
            <AppIcon name="edit" :size="17" />
            编辑
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rec__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.rec__avatar {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: var(--red-wash);
  color: var(--red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  border: 1px solid #e7cdc8;
  flex: none;
}
.rec__name {
  font-size: 19px;
  letter-spacing: 0.08em;
}
.rec__sub {
  font-size: 12.5px;
  color: var(--ink-3);
  margin-top: 2px;
}
.rec__amount {
  text-align: center;
  padding: 18px 0 14px;
  border-top: 1px solid var(--line-3);
  border-bottom: 1px solid var(--line-3);
  margin-bottom: 16px;
}
.rec__amount-num {
  font-size: 27px;
  color: var(--red);
  letter-spacing: 0.08em;
}
.rec__amount-num2 {
  font-size: 13px;
  color: var(--ink-3);
  margin-top: 4px;
}
.rec__gift {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: var(--gold-wash);
  border: 1px solid #e8d9b0;
  border-radius: 12px;
  color: #85651a;
  font-size: 14px;
  margin-bottom: 16px;
}
.rec__list {
  margin: 0 0 18px;
}
.rec__row {
  display: flex;
  gap: 14px;
  padding: 9px 2px;
  font-size: 14px;
  border-bottom: 1px dashed var(--line-3);
}
.rec__row:last-child {
  border-bottom: none;
}
.rec__row dt {
  width: 74px;
  flex: none;
  color: var(--ink-3);
  font-size: 13px;
}
.rec__row dd {
  margin: 0;
  color: var(--ink);
  flex: 1;
  word-break: break-all;
}
.rec__actions {
  display: flex;
  gap: 10px;
}
.rec__actions .btn {
  flex: 1;
}
</style>
