import { defineStore } from 'pinia'

export interface ToastItem {
  id: number
  text: string
  type: 'info' | 'success' | 'error'
}

let seq = 0

export const useToast = defineStore('toast', {
  state: () => ({ items: [] as ToastItem[] }),
  actions: {
    show(text: string, type: ToastItem['type'] = 'info', duration = 1800) {
      const id = ++seq
      this.items.push({ id, text, type })
      setTimeout(() => {
        this.items = this.items.filter((t) => t.id !== id)
      }, duration)
    },
    success(text: string) {
      this.show(text, 'success')
    },
    error(text: string) {
      this.show(text, 'error', 2400)
    },
  },
})
