<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const active = computed(() => route.meta.tab as string | undefined)

const tabs = [
  { key: 'books', label: '礼簿', icon: 'book', to: '/' },
  { key: 'contacts', label: '往来', icon: 'contacts', to: '/contacts' },
  { key: 'me', label: '我的', icon: 'user', to: '/me' },
]
</script>

<template>
  <nav class="tabbar">
    <router-link
      v-for="t in tabs"
      :key="t.key"
      class="tabbar__item"
      :class="{ 'is-active': active === t.key }"
      :to="t.to"
    >
      <AppIcon class="tabbar__icon" :name="t.icon" :size="22" />
      <span>{{ t.label }}</span>
    </router-link>
  </nav>
</template>
