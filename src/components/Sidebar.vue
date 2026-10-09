<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()

const active = computed(() => route.meta.tab as string | undefined)

const items = computed(() => [
  { key: 'books', label: '礼簿', icon: 'book', to: '/', count: store.books.length },
  { key: 'contacts', label: '往来', icon: 'contacts', to: '/contacts', count: store.contacts.length },
  { key: 'me', label: '我的', icon: 'user', to: '/me', count: 0 },
])
</script>

<template>
  <aside class="sidebar">
    <router-link class="sidebar__brand" to="/">
      <span class="sidebar__logo">礼</span>
      <span>
        <span class="sidebar__name">礼往</span>
        <span class="sidebar__slogan">一本礼簿，记下每一次人情往来</span>
      </span>
    </router-link>

    <button class="sidebar__create" @click="router.push('/book/new')">
      <AppIcon name="plus" :size="18" />
      新建礼簿
    </button>

    <p class="sidebar__group">账簿</p>
    <nav class="sidebar__nav">
      <router-link
        v-for="i in items"
        :key="i.key"
        class="sidebar__item"
        :class="{ 'is-active': active === i.key }"
        :to="i.to"
      >
        <AppIcon :name="i.icon" :size="19" />
        <span>{{ i.label }}</span>
        <span v-if="i.count" class="sidebar__count">{{ i.count }}</span>
      </router-link>
      <router-link class="sidebar__item" :class="{ 'is-active': route.name === 'search' }" to="/search">
        <AppIcon name="search" :size="19" />
        <span>搜索</span>
      </router-link>
    </nav>

    <div class="sidebar__spacer" />

    <div class="sidebar__foot">
      <span class="seal sidebar__seal serif">礼往</span>
      <p>
        <strong>数据存于本机</strong>
        可随时导出备份
      </p>
    </div>
  </aside>
</template>
