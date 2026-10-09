<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '@/stores/ledger'
import { formatMoney, toChineseAmount } from '@/utils/cny'
import { toChineseDate, toDisplayDate } from '@/utils/date'
import BookCover from '@/components/BookCover.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useLedgerStore()

const id = computed(() => route.params.id as string)
const book = computed(() => store.getBook(id.value))
const recordCount = computed(() => store.recordsOf(id.value).length)
const people = computed(() => (book.value ? store.bookPeople(book.value.id) : 0))
const total = computed(() => (book.value ? store.bookTotal(book.value.id) : 0))

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

const metas = computed(() => {
  if (!book.value) return []
  return [
    { label: '类型', value: book.value.type },
    { label: '日期', value: toDisplayDate(book.value.date) },
    { label: '地点', value: book.value.location || '未填写' },
    { label: book.value.direction === 'in' ? '主人' : '对方', value: book.value.host || '未填写' },
  ]
})
</script>

<template>
  <div v-if="book" class="cover-page">
    <header class="topbar cover-page__bar no-print">
      <button class="icon-btn" @click="router.back()">
        <AppIcon name="left" :size="19" />
      </button>
      <div style="min-width: 0">
        <h1 class="topbar__title">礼簿封面</h1>
        <p class="topbar__sub">轻触封面即可翻开礼簿</p>
      </div>
      <div class="topbar__actions">
        <button class="btn btn--ghost" @click="router.push(`/book/${id}/stats`)">
          <AppIcon name="chart" :size="17" /> 统计
        </button>
        <button class="btn btn--primary" @click="jump">
          进入礼簿 <AppIcon name="right" :size="17" />
        </button>
      </div>
    </header>

    <div class="cover-layout">
      <!-- 封面 -->
      <div class="cover-layout__stage">
        <div class="stage" :class="{ 'is-flipping': flipping }" @click="open">
          <div class="stage__behind">
            <div class="behind__inner">
              <h2 class="behind__title serif">{{ book.name }}</h2>
              <p class="behind__date serif">{{ toChineseDate(book.date) }}</p>
              <p class="behind__meta">{{ recordCount }} 笔 · {{ people }} 人</p>
            </div>
          </div>

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
      </div>

      <!-- 信息栏 -->
      <aside class="cover-layout__info no-print">
        <section class="panel">
          <div class="panel__head"><h2>礼簿信息</h2></div>
          <p class="info__name serif">{{ book.name }}</p>
          <p class="info__date serif">{{ toChineseDate(book.date) }}</p>
          <dl class="info__list">
            <div v-for="m in metas" :key="m.label" class="info__row">
              <dt>{{ m.label }}</dt>
              <dd>{{ m.value }}</dd>
            </div>
            <div v-if="book.note" class="info__row">
              <dt>备注</dt>
              <dd>{{ book.note }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel">
          <div class="panel__head"><h2>本簿概览</h2></div>
          <div class="info__stats">
            <div class="info__stat">
              <em class="mono">{{ people }}</em><span>登记人数</span>
            </div>
            <div class="info__stat">
              <em class="mono">{{ recordCount }}</em><span>记录笔数</span>
            </div>
          </div>
          <div class="info__total">
            <span>礼金总额</span>
            <strong class="mono">{{ formatMoney(total) }}</strong>
            <em class="serif">{{ toChineseAmount(total) }}</em>
          </div>
          <button class="btn btn--primary btn--block" @click="jump">
            翻开礼簿 <AppIcon name="right" :size="17" />
          </button>
          <button
            class="btn btn--ghost btn--block"
            style="margin-top: 10px"
            @click="router.push(`/book/${id}/edit`)"
          >
            <AppIcon name="edit" :size="16" /> 编辑礼簿信息
          </button>
        </section>

        <section v-if="book.sealed" class="sealed-note">
          <AppIcon name="lock" :size="16" />
          本礼簿已封存，如需修改请先解除封存
        </section>
      </aside>
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
  flex: 1;
  display: flex;
  flex-direction: column;
}
.cover-page__bar {
  width: 100%;
  padding: 34px 36px 20px;
  max-width: 1360px;
  margin: 0 auto;
}

.cover-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 372px;
  gap: 36px;
  align-items: start;
  padding: 0 36px 56px;
  max-width: 1360px;
  margin: 0 auto;
  width: 100%;
}
.cover-layout__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0 40px;
  min-height: 560px;
}
.cover-layout__info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 24px;
}

/* 舞台 */
.stage {
  position: relative;
  width: min(100%, 340px);
  aspect-ratio: 3 / 4.15;
  margin: 0 auto;
  perspective: 1800px;
  perspective-origin: 78% 50%;
  cursor: pointer;
  flex: none;
}
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
.leaf {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-origin: left center;
  transition: transform 0.78s cubic-bezier(0.5, 0.02, 0.3, 1);
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
  margin-top: 28px;
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
.is-hidden {
  opacity: 0;
  pointer-events: none;
}

/* 信息栏 */
.info__name {
  font-size: 19px;
  letter-spacing: 0.08em;
  line-height: 1.4;
}
.info__date {
  font-size: 12.5px;
  color: var(--ink-3);
  margin-top: 4px;
  letter-spacing: 0.1em;
}
.info__list {
  margin: 16px 0 0;
  border-top: 1px dashed var(--line-2);
  padding-top: 6px;
}
.info__row {
  display: flex;
  gap: 14px;
  padding: 8px 0;
  font-size: 13.5px;
}
.info__row dt {
  width: 54px;
  flex: none;
  color: var(--ink-3);
  font-size: 12.5px;
}
.info__row dd {
  margin: 0;
  flex: 1;
  color: var(--ink);
  word-break: break-all;
}
.info__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.info__stat {
  background: var(--paper-3);
  border: 1px solid var(--line-3);
  border-radius: 13px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}
.info__stat em {
  font-style: normal;
  font-size: 20px;
  font-weight: 700;
}
.info__stat span {
  font-size: 11.5px;
  color: var(--ink-3);
}
.info__total {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 16px 0 18px;
}
.info__total span {
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.12em;
}
.info__total strong {
  font-size: 26px;
  font-weight: 700;
  color: var(--red);
}
.info__total em {
  font-style: normal;
  font-size: 11.5px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.sealed-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: #8b7a5f;
  background: var(--gold-wash);
  border: 1px solid #e8d9b0;
  border-radius: 13px;
  padding: 12px 14px;
}

/* ---------- 移动端 ---------- */
@media (max-width: 959px) {
  .cover-page {
    padding: 0 18px calc(24px + var(--safe-b));
  }
  .cover-page__bar {
    padding: 14px 4px 8px;
  }
  .cover-page__bar .topbar__sub,
  .cover-page__bar .btn--ghost {
    display: none;
  }
  .cover-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    padding: 0;
  }
  .cover-layout__stage {
    min-height: 0;
    padding: 6px 0 0;
  }
  .cover-layout__info {
    position: static;
    margin-top: 20px;
  }
  .stage {
    width: min(100%, 300px);
  }
  .cover-page__hint {
    margin-top: 20px;
  }
}
</style>
