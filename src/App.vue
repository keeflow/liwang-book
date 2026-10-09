<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import Sidebar from '@/components/Sidebar.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useLedgerStore } from '@/stores/ledger'

const route = useRoute()
const store = useLedgerStore()

onMounted(() => store.init())

/** 移动端仅在一级页面展示底部导航 */
const showTabs = computed(() => !!route.meta.tab)
</script>

<template>
  <div class="app">
    <Sidebar />
    <main class="main">
      <div v-if="!store.ready" class="app-loading">
        <div class="app-loading__seal">礼</div>
        <p class="app-loading__text">正在翻开礼簿…</p>
      </div>
      <router-view v-else v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
      <BottomNav v-if="showTabs" />
    </main>
  </div>
  <ToastHost />
</template>

<style scoped>
.app-loading {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.app-loading__seal {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--red);
  color: #f6ecd8;
  font-family: var(--serif);
  font-size: 30px;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  animation: seal-pulse 1.4s ease-in-out infinite;
}

.app-loading__text {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: 0.16em;
}

@keyframes seal-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
