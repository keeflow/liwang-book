<script setup lang="ts">
/**
 * 轻量图标集（描边风格，24x24）
 */
withDefaults(defineProps<{ name: string; size?: number | string }>(), { size: 22 })

const paths: Record<string, string> = {
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z|M9 3v16|M12.5 8h3.5',
  contacts: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z|M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5|M16 5.2a3.2 3.2 0 0 1 0 6.1|M17.5 14.8c2.4.6 4 2.4 4 5.2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z|M4.5 21c0-3.9 3.4-6.5 7.5-6.5s7.5 2.6 7.5 6.5',
  plus: 'M12 5v14|M5 12h14',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z|M21 21l-4.3-4.3',
  more: 'M12 6.2v.01|M12 12v.01|M12 17.8v.01',
  chart: 'M4 20V10|M10 20V4|M16 20v-7|M22 20H2',
  download: 'M12 3v12|M7.5 10.5 12 15l4.5-4.5|M4 20h16',
  upload: 'M12 21V9|M7.5 13.5 12 9l4.5 4.5|M4 4h16',
  lock: 'M6 11V8a6 6 0 0 1 12 0v3|M5 11h14v10H5z',
  unlock: 'M6 11V8a6 6 0 0 1 11.5-2.4|M5 11h14v10H5z',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Z|M14.5 5.5l4 4',
  trash: 'M4 7h16|M9 7V4.5h6V7|M6 7l1 13h10l1-13|M10.5 11v5.5|M13.5 11v5.5',
  close: 'M6 6l12 12|M18 6 6 18',
  check: 'M5 13l4.5 4.5L19 7',
  phone:
    'M7.5 3.5h9l1.5 4-2.5 1.5-1.5-1.5-4 4 1.5 1.5L10.5 15l-4-1.5v-9Z|M15 15.5c1.6 1.6 3.4 1 4.5 2.2',
  gift: 'M4 10.5h16V20H4z|M3 7.5h18v3H3z|M12 7.5V20|M12 7.5C10.5 7.5 8 7.2 8 5.4A2 2 0 0 1 12 4.6a2 2 0 0 1 4 .8c0 1.8-2.5 2.1-4 2.1Z',
  calendar: 'M4 6h16v15H4z|M4 10.5h16|M8 3v3.5|M16 3v3.5',
  place: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  print: 'M7 9V3.5h10V9|M7 18H4.5v-6H19.5v6H17|M7 15h10v6H7z',
  filter: 'M4 6h16|M7 12h10|M10 18h4',
  swap: 'M4 8h13l-3.2-3.2|M20 16H7l3.2 3.2',
  archive: 'M3 4.5h18V8H3z|M5 8v12h14V8|M10 12h4',
  sparkle: 'M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4L12 4Z',
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in (paths[name] || '').split('|')" :key="i" :d="d" />
  </svg>
</template>
