<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@/types'
import { toChineseDate } from '@/utils/date'

const props = withDefaults(
  defineProps<{
    book: Book
    /** full = 封面整屏；panel = 卡片内的封面块；mini = 列表缩略 */
    variant?: 'full' | 'panel' | 'mini'
  }>(),
  { variant: 'full' },
)

/** 去掉书名里重复的宴席类型后缀，让封面更简洁 */
const shortName = computed(() => {
  const n = props.book.name || ''
  return n.replace(new RegExp(`${props.book.type}$`), '').replace(/[-—·\s]+$/, '') || n || props.book.type
})

const dateCN = computed(() => toChineseDate(props.book.date))
</script>

<template>
  <!-- 列表缩略 -->
  <div v-if="variant === 'mini'" class="mini">
    <span class="mini__chars serif">礼簿</span>
  </div>

  <!-- 卡片封面块 -->
  <div v-else-if="variant === 'panel'" class="panel">
    <div class="panel__frame">
      <span class="panel__type">{{ book.type }}</span>
      <span class="panel__name serif">{{ shortName }}</span>
    </div>
    <span class="panel__date serif">{{ dateCN }}</span>
  </div>

  <!-- 完整封面 -->
  <div v-else class="cover">
    <div class="cover__grain" />
    <div class="cover__frame">
      <div class="cover__inner">
        <div class="cover__label">
          <span class="cover__chars serif">礼簿</span>
        </div>

        <div class="cover__meta">
          <span class="cover__rule" />
          <span class="cover__type">{{ book.type }}</span>
          <h2 class="cover__name serif">{{ shortName }}</h2>
          <p class="cover__date serif">{{ dateCN }}</p>
          <p v-if="book.location" class="cover__place">{{ book.location }}</p>
        </div>

        <div class="cover__seal">
          <div class="seal seal--cover serif">礼往</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------- 缩略 ---------- */
.mini {
  width: 42px;
  height: 56px;
  border-radius: 4px 8px 8px 4px;
  background: linear-gradient(150deg, #9c3535 0%, #7a2323 55%, #631c1c 100%);
  border: 1px solid rgba(211, 179, 101, 0.55);
  box-shadow: 0 2px 8px rgba(90, 40, 30, 0.28), inset 0 0 0 2px rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex: none;
  overflow: hidden;
}
.mini::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(211, 179, 101, 0.32);
  border-radius: 2px 5px 5px 2px;
}
.mini__chars {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(246, 232, 200, 0.94);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* ---------- 卡片封面块 ---------- */
.panel {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(155deg, #9c3535 0%, #7a2323 52%, #601b1b 100%);
  padding: 16px 14px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 112px;
  box-shadow: inset 0 0 0 1px rgba(211, 179, 101, 0.4), 0 6px 16px rgba(90, 40, 30, 0.2);
}
.panel__frame {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  padding-left: 12px;
}
.panel__frame::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(180deg, transparent, var(--gold-2), transparent);
}
.panel__type {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(240, 220, 175, 0.78);
}
.panel__name {
  font-size: 18px;
  line-height: 1.25;
  color: #fbf2dc;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
}
.panel__date {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(238, 219, 178, 0.72);
}

/* ---------- 完整封面 ---------- */
.cover {
  position: relative;
  width: min(100%, 330px);
  aspect-ratio: 3 / 4.15;
  margin: 0 auto;
  border-radius: 6px 16px 16px 6px;
  background: linear-gradient(155deg, #a03939 0%, #832929 42%, #6a1f1f 78%, #571717 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.14) inset,
    -8px 0 14px -10px rgba(0, 0, 0, 0.5) inset,
    0 18px 42px rgba(78, 32, 22, 0.42),
    0 2px 6px rgba(78, 32, 22, 0.3);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 书面细纹 */
.cover__grain {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      92deg,
      rgba(255, 255, 255, 0.035) 0px,
      rgba(255, 255, 255, 0.035) 1px,
      transparent 1px,
      transparent 3px
    ),
    radial-gradient(circle at 30% 12%, rgba(255, 255, 255, 0.14), transparent 55%);
  pointer-events: none;
}
/* 金色双框 */
.cover__frame {
  position: relative;
  width: calc(100% - 30px);
  height: calc(100% - 30px);
  border: 1px solid rgba(211, 179, 101, 0.62);
  border-radius: 3px 10px 10px 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover__frame::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid rgba(211, 179, 101, 0.26);
  border-radius: 2px 8px 8px 2px;
}
.cover__inner {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 30px 22px 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

/* 题签 */
.cover__label {
  background: linear-gradient(170deg, #fbf4e2 0%, #f2e7cd 60%, #ead9b6 100%);
  border-radius: 3px;
  padding: 20px 16px;
  box-shadow:
    0 6px 18px rgba(60, 20, 12, 0.34),
    0 1px 0 rgba(255, 255, 255, 0.7) inset,
    0 0 0 1px rgba(160, 120, 60, 0.28);
  position: relative;
  margin-top: 4px;
}
.cover__chars {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 34px;
  line-height: 1.12;
  letter-spacing: 0.02em;
  color: var(--red-deep);
  font-weight: 600;
}

/* 元信息 */
.cover__meta {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  width: 100%;
}
.cover__rule {
  width: 46px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-2), transparent);
  margin-bottom: 2px;
}
.cover__type {
  font-size: 10px;
  letter-spacing: 0.42em;
  color: rgba(240, 220, 175, 0.8);
  padding-left: 0.42em;
}
.cover__name {
  font-size: 19px;
  letter-spacing: 0.08em;
  color: #fbf2dc;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.32);
  line-height: 1.4;
}
.cover__date {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: rgba(236, 216, 175, 0.78);
}
.cover__place {
  font-size: 11px;
  color: rgba(236, 216, 175, 0.55);
}

/* 印章 */
.cover__seal {
  position: absolute;
  right: 24px;
  bottom: 24px;
}
.seal--cover {
  width: 40px;
  height: 40px;
  font-size: 13px;
  line-height: 1.12;
  border-radius: 5px;
  background: #b53a30;
  color: #fff3e2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.32);
  opacity: 0.94;
  writing-mode: vertical-rl;
  text-orientation: upright;
  padding: 5px 0;
}
</style>
