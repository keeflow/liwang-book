import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 响应式媒体查询
 * 断点约定：
 *  - lg   ≥ 1200px  宽桌面
 *  - md   ≥ 960px   桌面 / 平板横屏（此时展示侧边栏）
 */
export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mql: MediaQueryList | null = null

  const update = (e?: MediaQueryListEvent) => {
    matches.value = e ? e.matches : !!mql?.matches
  }

  onMounted(() => {
    mql = window.matchMedia(query)
    update()
    mql.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', update)
  })

  return matches
}

/** 是否为桌面布局（≥960px） */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 960px)')
}
