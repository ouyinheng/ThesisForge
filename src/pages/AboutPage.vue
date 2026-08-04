<script setup lang="ts">
defineOptions({ name: "about" });
import { NH1, NH2, NText, NDivider, NCard } from "naive-ui";
import { useI18n } from "@/composables/i18n/useI18n";
import AppPage from "@/components/app/AppPage.vue";

const { t } = useI18n();

const featureList = [{ icon: "", text: "" }];
</script>

<template>
  <AppPage>
    <NCard class="about-page" :bordered="false">
      <NH1 class="about-title">{{ t("about.title") }}</NH1>
      <NText depth="2" class="about-description">{{ t("about.description") }}</NText>

      <NDivider />

      <NH2 class="features-title">{{ t("about.features") }}</NH2>
      <ul class="features-list">
        <li v-for="feature in t('about.featureList')" :key="feature">
          <NText depth="2">{{ feature }}</NText>
        </li>
      </ul>

      <NDivider />

      <NText depth="3" class="about-footer">{{ t("about.footer") }}</NText>
    </NCard>
  </AppPage>
</template>

<style lang="less" scoped>
.about-page {
  width: 100%;
  max-width: 920px;
  margin-left: var(--content-ml, auto);
  margin-right: var(--content-mr, auto);
}

.about-title {
  font-family: var(--font-serif) !important;
  margin-bottom: 0.8em !important;
}

.about-description {
  font-family: var(--font-serif) !important;
  font-size: 17px;
  line-height: 1.8;
  display: block;
  margin-bottom: 1em;
}

.features-title {
  font-family: var(--font-serif) !important;
  margin-bottom: 0.6em !important;
}

.features-list {
  list-style: none;
  padding: 0;
  li {
    position: relative;
    padding-left: 1.2em;
    margin-bottom: 0.5em;
    font-family: var(--font-serif);
    font-size: 16px;
    &:before {
      content: "\2013";
      position: absolute;
      left: 0;
      color: var(--color-primary);
    }
  }
}

.about-footer {
  font-size: 14px;
  display: block;
  text-align: center;
}
</style>
