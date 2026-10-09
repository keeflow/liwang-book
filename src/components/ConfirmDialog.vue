<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
  }>(),
  { title: '确认操作', confirmText: '确定', cancelText: '取消', danger: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="mask" style="z-index: 200" @click="emit('cancel')" />
    </Transition>
    <Transition name="fade">
      <div v-if="open" class="confirm">
        <h3 class="confirm__title serif">{{ title }}</h3>
        <p v-if="message" class="confirm__msg">{{ message }}</p>
        <div class="confirm__actions">
          <button class="btn btn--ghost" @click="emit('cancel')">{{ cancelText }}</button>
          <button class="btn" :class="danger ? 'btn--primary' : 'btn--primary'" @click="emit('confirm')">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm {
  position: fixed;
  z-index: 201;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(calc(100% - 56px), 340px);
  background: var(--paper-2);
  border-radius: 18px;
  padding: 24px 22px 18px;
  box-shadow: 0 20px 60px rgba(60, 40, 20, 0.3);
  border: 1px solid var(--line-2);
  text-align: center;
}
.confirm__title {
  font-size: 17px;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}
.confirm__msg {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.65;
  margin-bottom: 20px;
}
.confirm__actions {
  display: flex;
  gap: 10px;
}
.confirm__actions .btn {
  flex: 1;
}
</style>
