<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useLedgerStore } from '@/stores/ledger'

const route = useRoute()
const store = useLedgerStore()

onMounted(() => store.init())

const showTabs = computed(() => !!route.meta.tab)
</script>

<template>
  <div class="shell">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
    <BottomNav v-if="showTabs" />
  </div>
  <ToastHost />
</template>
