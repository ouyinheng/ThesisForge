<script setup lang="ts">
import { NTag, NText } from 'naive-ui'
import type { VideoMovie } from '@/services/videoStation/content'

defineProps<{
  movie: VideoMovie
}>()
</script>

<template>
  <article class="video-card">
    <div class="card-cover" v-if="movie.cover">
      <img :src="movie.cover" :alt="movie.title" loading="lazy" />
      <span v-if="movie.badge" class="cover-badge">{{ movie.badge }}</span>
    </div>
    <div class="card-cover placeholder" v-else>
      <span class="placeholder-text">{{ movie.title?.[0] || '?' }}</span>
    </div>
    <div class="card-body">
      <h2 class="card-title">{{ movie.title }}</h2>
      <div class="card-meta" v-if="movie.category || movie.rating">
        <NTag v-if="movie.category" size="small" :bordered="false" round>{{ movie.category }}</NTag>
        <NText v-if="movie.rating" depth="3" class="card-rating">{{ movie.rating }}</NText>
      </div>
    </div>
  </article>
</template>

<style lang="less" scoped>
.video-card {
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
  aspect-ratio: 270/380;
  overflow: hidden;
  background: var(--color-bg-tertiary);
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.placeholder-text {
  font-size: 48px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.cover-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 1.3;
}

.card-body {
  padding: 0.75em 0.9em 0.9em;
}

.card-title {
  font-family: var(--font-sans);
  font-size: var(--fs-sm);
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 0.5em;
  flex-wrap: wrap;
}

.card-rating {
  font-size: var(--fs-xs);
  color: #f59e0b;
}
</style>
