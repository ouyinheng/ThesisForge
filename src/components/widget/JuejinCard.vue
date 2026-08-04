<script setup lang="ts">
import { NTag, NText } from 'naive-ui'
import type { JuejinArticle } from '@/services/juejin/juejinCache'

defineProps<{
  article: JuejinArticle
}>()

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  return String(n)
}
</script>

<template>
  <article class="juejin-card">
    <div class="card-cover" v-if="article.cover_image">
      <img :src="article.cover_image" :alt="article.title" loading="lazy" />
    </div>
    <div class="card-body">
      <h2 class="card-title">{{ article.title }}</h2>
      <p class="card-brief">{{ article.brief_content }}</p>
      <div class="card-tags" v-if="article.tags.length">
        <NTag
          v-for="tag in article.tags.slice(0, 3)"
          :key="tag.tag_name"
          size="small"
          :bordered="false"
          round
        >{{ tag.tag_name }}</NTag>
      </div>
      <div class="card-meta">
        <NText depth="3">{{ article.user_name }}</NText>
        <NText depth="3" class="card-stats">
          {{ formatCount(article.view_count) }} 阅读 · {{ formatCount(article.digg_count) }} 赞
        </NText>
      </div>
    </div>
  </article>
</template>

<style lang="less" scoped>
.juejin-card {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast),
    border-color var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
    border-color: var(--color-primary);
  }
}

.card-cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--color-bg-tertiary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.card-body {
  padding: 0.85em 1em 1em;
}

.card-title {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 0.4em;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-brief {
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-text-secondary);
  margin: 0 0 0.6em;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 0.6em;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 0.6em;
}

.card-stats {
  font-size: 12px;
}
</style>
