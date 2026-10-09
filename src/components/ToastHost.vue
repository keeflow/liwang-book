<script setup lang="ts">
import { useToast } from '@/stores/toast'
const toast = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-host">
      <TransitionGroup name="fade">
        <div v-for="t in toast.items" :key="t.id" class="toast" :class="`toast--${t.type}`">
          <span class="toast__dot" />
          <span>{{ t.text }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
