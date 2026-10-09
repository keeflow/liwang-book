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
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
      <BottomNav v-if="showTabs" />
    </main>
  </div>
  <ToastHost />
</template>
