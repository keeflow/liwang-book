<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { toChineseDate } from '@/utils/date'
import BookCover from '@/components/BookCover.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()

const id = computed(() => route.params.id as string)
const book = computed(() => store.getBook(id.value))
const recordCount = computed(() => store.recordsOf(id.value).length)

const flipping = ref(false)

function open() {
  if (flipping.value) return
  flipping.value = true
  setTimeout(() => {
    router.replace(`/book/${id.value}`)
  }, 780)
}

function jump() {
  router.replace(`/book/${id.value}`)
}
</script>

<template>
  <div v-if="book" class="cover-page">
    <div class="topbar cover-page__bar no-print">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <h1 class="topbar__title">礼簿封面</h1>
      <button class="icon-btn" @click="router.push(`/book/${id}/edit`)">
        <AppIcon name="edit" :size="18" />
      </button>
    </div>

    <div class="stage" :class="{ 'is-flipping': flipping }" @click="open">
      <!-- 翻页后露出的正文纸面 -->
      <div class="stage__behind">
        <div class="behind__inner">
          <h2 class="behind__title serif">{{ book.name }}</h2>
          <p class="behind__date serif">{{ toChineseDate(book.date) }}</p>
          <p class="behind__meta">{{ recordCount }} 笔 · {{ store.bookPeople(book.id) }} 人</p>
        </div>
      </div>

      <!-- 可翻动的封面 -->
      <div class="leaf">
        <div class="leaf__front">
          <BookCover :book="book" variant="full" />
          <div v-if="book.sealed" class="leaf__seal serif">封存</div>
        </div>
        <div class="leaf__back">
          <div class="leaf__back-paper" />
        </div>
      </div>

      <div class="stage__glow" />
    </div>

    <p class="cover-page__hint" :class="{ 'is-hidden': flipping }">
      <AppIcon name="sparkle" :size="14" />
      轻触封面，翻开礼簿
    </p>

    <div class="cover-page__foot no-print" :class="{ 'is-hidden': flipping }">
      <button class="btn btn--ghost btn--sm" @click.stop="router.push(`/book/${id}/stats`)">
        <AppIcon name="chart" :size="15" /> 统计
      </button>
      <button class="btn btn--ghost btn--sm" @click.stop="jump">
        跳过动画进入 <AppIcon name="right" :size="15" />
      </button>
    </div>
  </div>

  <div v-else class="page">
    <div class="empty">
      <div class="empty__mark serif">礼</div>
      <p class="empty__title">礼簿不存在</p>
      <button class="btn btn--ghost" style="margin-top: 14px" @click="router.replace('/')">
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.cover-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 18px calc(20px + var(--safe-b));
  background:
    radial-gradient(circle at 50% 32%, rgba(255, 252, 242, 0.95), transparent 62%),
    linear-gradient(180deg, #efe6d2, #e6dbc2);
}
.cover-page__bar {
  width: 100%;
  max-width: 460px;
  margin-bottom: 4px;
}

/* 舞台 */
.stage {
  position: relative;
  width: min(100%, 316px);
  aspect-ratio: 3 / 4.15;
  margin: 10px auto 0;
  perspective: 1700px;
  perspective-origin: 78% 50%;
  cursor: pointer;
  flex: none;
}

/* 底下的纸面 */
.stage__behind {
  position: absolute;
  inset: 0;
  border-radius: 6px 16px 16px 6px;
  background: linear-gradient(170deg, #fdf8ec, #f4ebd8);
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.stage__behind::after {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid var(--line-3);
  border-radius: 3px 11px 11px 3px;
  pointer-events: none;
}
.behind__inner {
  text-align: center;
  padding: 0 26px;
  opacity: 0.9;
}
.behind__title {
  font-size: 17px;
  letter-spacing: 0.08em;
  color: var(--ink);
  line-height: 1.5;
}
.behind__date {
  font-size: 12px;
  color: var(--ink-2);
  margin-top: 8px;
  letter-spacing: 0.08em;
}
.behind__meta {
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 6px;
}

/* 可翻动的书叶 */
.leaf {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-origin: left center;
  transition:
    transform 0.78s cubic-bezier(0.5, 0.02, 0.3, 1),
    box-shadow 0.78s ease;
  will-change: transform;
}
.stage.is-flipping .leaf {
  transform: rotateY(-172deg) translateZ(2px);
}
.leaf__front,
.leaf__back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 6px 16px 16px 6px;
  overflow: hidden;
}
.leaf__front :deep(.cover) {
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
  margin: 0;
  max-width: none;
}
.leaf__back {
  transform: rotateY(180deg);
  background: linear-gradient(180deg, #f7efdd, #eadfc6);
  box-shadow: inset -14px 0 26px -18px rgba(60, 30, 10, 0.5);
}
.leaf__back-paper {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(150, 120, 80, 0.06) 0px,
    rgba(150, 120, 80, 0.06) 1px,
    transparent 1px,
    transparent 6px
  );
}
/* 封存标记 */
.leaf__seal {
  position: absolute;
  top: 20px;
  right: 18px;
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: #fff2df;
  background: rgba(181, 58, 48, 0.92);
  border: 1px solid rgba(255, 235, 205, 0.5);
  border-radius: 4px;
  padding: 7px 3px;
}

.stage__glow {
  position: absolute;
  inset: -6% -4%;
  border-radius: 20px;
  pointer-events: none;
  background: radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.4), transparent 60%);
  opacity: 0;
  transition: opacity 0.5s;
}
.stage.is-flipping .stage__glow {
  opacity: 1;
}

.cover-page__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 26px;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: var(--ink-3);
  animation: breathe 2.6s ease-in-out infinite;
  transition: opacity 0.3s;
}
@keyframes breathe {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
.cover-page__foot {
  display: flex;
  gap: 10px;
  margin-top: 22px;
  transition: opacity 0.3s;
}
.is-hidden {
  opacity: 0;
  pointer-events: none;
}
</style>
