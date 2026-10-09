<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContactPanel from '@/components/ContactPanel.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => decodeURIComponent(route.params.id as string))
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <div style="min-width: 0">
        <h1 class="topbar__title">宾客档案</h1>
        <p class="topbar__sub">历史人情往来与回礼参考</p>
      </div>
    </div>

    <div class="detail-wrap">
      <ContactPanel :contact-id="id" />
    </div>
  </div>
</template>

<style scoped>
.detail-wrap {
  max-width: 760px;
}
</style>
