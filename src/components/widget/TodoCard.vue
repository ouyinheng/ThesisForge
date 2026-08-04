<script setup lang="ts">
import { computed } from "vue";
import { NText, NButton, NIcon, NCheckbox, NEmpty, NProgress } from "naive-ui";
import {
  CheckboxOutline,
  ChevronForwardOutline,
  FlameOutline,
  AddOutline,
  SparklesOutline
} from "@vicons/ionicons5";
import { useTodoStore } from "@/stores/todo";
import { useRouter } from "vue-router";

const store = useTodoStore();
const router = useRouter();

const todayTodos = computed(() => store.todayTodos.slice(0, 4));
const totalToday = computed(() => store.todayTodos.length);
const totalPending = computed(() => store.pendingTodos.length);
const doneToday = computed(() => store.todayTodos.filter((t) => t.done).length);

const completionRate = computed(() => {
  if (!totalToday.value) return 0;
  return Math.round((doneToday.value / totalToday.value) * 100);
});

// 迷你圆环
const R = 16;
const C = 2 * Math.PI * R;
const offset = computed(() => C * (1 - completionRate.value / 100));

function goTodos() {
  router.push("/todos");
}
</script>

<template>
  <section class="todo-widget">
    <!-- 头部 -->
    <div class="tw-header">
      <div class="tw-title-group">
        <div class="tw-icon">
          <NIcon :size="13"><CheckboxOutline /></NIcon>
        </div>
        <span class="tw-title">今日焦点</span>
      </div>
      <NText depth="3" class="tw-count" v-if="totalToday">
        <NIcon :size="10"><FlameOutline /></NIcon>
        {{ totalToday }}
      </NText>
    </div>

    <!-- 内容 -->
    <div class="tw-body">
      <!-- 迷你进度条 -->
      <div class="tw-progress" v-if="totalToday">
        <div class="tw-ring">
          <svg :width="40" :height="40" :viewBox="'0 0 40 40'">
            <circle
              cx="20"
              cy="20"
              :r="R"
              fill="none"
              stroke="var(--color-bg-tertiary)"
              stroke-width="3.5"
            />
            <circle
              cx="20"
              cy="20"
              :r="R"
              fill="none"
              stroke="url(#twGrad)"
              stroke-width="3.5"
              stroke-linecap="round"
              :stroke-dasharray="C"
              :stroke-dashoffset="offset"
              transform="rotate(-90 20 20)"
              class="tw-ring-bar"
            />
            <defs>
              <linearGradient id="twGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--color-primary)" />
                <stop offset="100%" stop-color="#F87171" />
              </linearGradient>
            </defs>
          </svg>
          <span class="tw-ring-text">{{ completionRate }}</span>
        </div>
        <div class="tw-labels">
          <span class="tw-stat-num"
            >{{ doneToday }}<span class="num-total">/{{ totalToday }}</span></span
          >
          <span class="tw-stat-label">今日完成</span>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="tw-list" v-if="todayTodos.length">
        <div
          v-for="todo in todayTodos"
          :key="todo.id"
          class="tw-item"
          :class="{ 'item-done': todo.done, [`p-${todo.priority}`]: true }"
          @click="store.toggleTodo(todo.id)"
        >
          <NCheckbox :checked="!!todo.done" size="small" @click.stop />
          <span class="tw-item-title">{{ todo.title }}</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="tw-empty" v-else>
        <NIcon :size="20" class="tw-empty-icon"><SparklesOutline /></NIcon>
        <span>今天还没有任务</span>
      </div>

      <!-- 更多待办提示 -->
      <div class="tw-more" v-if="totalPending > totalToday">
        <NIcon :size="10"><FlameOutline /></NIcon>
        还有 {{ totalPending - totalToday }} 项非今日待办
      </div>
    </div>

    <!-- 底部 -->
    <div class="tw-footer">
      <NButton text type="primary" size="small" class="tw-btn" @click="goTodos">
        打开工作台
        <NIcon :size="11"><ChevronForwardOutline /></NIcon>
      </NButton>
      <NButton text size="small" class="tw-btn-add" @click="goTodos">
        <NIcon :size="11"><AddOutline /></NIcon>
        添加
      </NButton>
    </div>
  </section>
</template>

<style scoped>
.todo-widget {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    box-shadow 0.25s,
    transform 0.25s;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
}

.tw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
}

.tw-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tw-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--color-primary-light), #fecaca);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.tw-title {
  font-size: var(--fs-base);
  font-weight: 600;
}

.tw-count {
  font-size: var(--fs-xs);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
  font-weight: 600;
}

.tw-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 18px 12px;
}

.tw-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}

.tw-ring {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.tw-ring-bar {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.tw-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-primary);
}

.tw-labels {
  display: flex;
  flex-direction: column;
}

.tw-stat-num {
  font-family: var(--font-mono);
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--color-text);

  .num-total {
    font-size: 11px;
    font-weight: 400;
    color: var(--color-text-tertiary);
  }
}

.tw-stat-label {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.tw-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tw-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-bg-tertiary);
    transform: translateX(2px);
  }

  &.p-high {
    border-left-color: #ef4444;
  }

  &.item-done {
    opacity: 0.5;

    .tw-item-title {
      text-decoration: line-through;
      color: var(--color-text-tertiary);
    }

    &:hover {
      opacity: 0.7;
    }
  }
}

.tw-item-title {
  flex: 1;
  font-size: var(--fs-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tw-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: var(--color-text-tertiary);
  font-size: var(--fs-xs);
}

.tw-empty-icon {
  color: var(--color-primary-light);
}

.tw-more {
  font-size: 10px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 0;
}

.tw-footer {
  display: flex;
  gap: 4px;
  border-top: 1px solid var(--color-border);
  padding: 8px 14px;
}

.tw-btn {
  flex: 1;

  :deep(.n-button__content) {
    gap: 2px;
  }
}

.tw-btn-add {
  color: var(--color-text-tertiary);

  &:hover {
    color: var(--color-primary);
  }
}
</style>
