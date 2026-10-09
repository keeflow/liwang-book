<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLedgerStore } from '@/stores/ledger'
import { formatMoney, toChineseAmount } from '@/utils/cny'

const props = withDefaults(
  defineProps<{
    amount: number
    /** 强制模式，不传则跟随全局设置 */
    mode?: 'traditional' | 'numeric'
    /** 是否允许点击切换 */
    toggleable?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { toggleable: true, size: 'md' },
)

const store = useLedgerStore()
const override = ref<'traditional' | 'numeric' | null>(null)

const style = computed(() => props.mode ?? override.value ?? store.settings.moneyStyle)
const isTrad = computed(() => style.value === 'traditional')

const text = computed(() =>
  isTrad.value ? toChineseAmount(props.amount) || '—' : formatMoney(props.amount),
)

function onClick(e: Event) {
  if (!props.toggleable || props.mode) return
  e.stopPropagation()
  override.value = isTrad.value ? 'numeric' : 'traditional'
}
</script>

<template>
  <span
    class="money"
    :class="[`money--${size}`, { 'money--trad': isTrad, 'is-tappable': toggleable && !mode }]"
    @click="onClick"
  >
    {{ text }}
  </span>
</template>

<style scoped>
.money {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: color 0.18s ease;
}
.money--trad {
  font-family: var(--serif);
  letter-spacing: 0.05em;
}
.money.is-tappable {
  cursor: pointer;
}
.money--sm {
  font-size: 14px;
}
.money--md {
  font-size: 15px;
  font-weight: 600;
}
.money--lg {
  font-size: 18px;
  font-weight: 600;
}
</style>
