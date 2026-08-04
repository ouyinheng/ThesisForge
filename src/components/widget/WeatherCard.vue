<script setup lang="ts">
import { ref, onMounted } from "vue";
import { NSpin, NText } from "naive-ui";
import {
  fetchWeather,
  getCurrentPosition,
  getWeatherByCity,
  WeatherData
} from "@/services/weather";
import { useSettingsStore } from "@/stores/settings";

const settings = useSettingsStore();

const loading = ref(true);
const weather = ref<WeatherData | null>(null);

const ICON_MAP: Record<string, string> = {
  SunnyOutline: "i-carbon-sun",
  PartlySunnyOutline: "i-carbon-partly-cloudy",
  CloudOutline: "i-carbon-cloud",
  RainyOutline: "i-carbon-rain",
  SnowOutline: "i-carbon-snow",
  ThunderstormOutline: "i-carbon-lightning"
};

function getIcon(iconName: string): string {
  return ICON_MAP[iconName] || "i-carbon-cloud";
}

async function load(silent = false) {
  if (!silent) loading.value = true;
  try {
    const city = settings.weatherCity;
    if (city) {
      weather.value = await getWeatherByCity(city);
    } else {
      const pos = await getCurrentPosition();
      const w = await fetchWeather(pos.lat, pos.lon);
      w.city = "";
      weather.value = w;
    }
  } catch {
    try {
      weather.value = await getWeatherByCity(settings.weatherCity || "长沙");
    } catch {
      // keep current data
    }
  } finally {
    loading.value = false;
  }
}

function refresh() {
  load(true);
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="weather-mini" @click="refresh" title="点击刷新">
    <!-- <template v-if="loading">
      <n-spin size="small" />
    </template> -->

    <template v-if="weather">
      <i :class="getIcon(weather.icon)" :style="{ fontSize: '28px', color: '#e0a800' }" />
      <div class="wm-info">
        <div class="wm-line1">
          <span class="wm-temp">{{ weather.temp }}°</span>
          <n-text depth="2" class="wm-city">{{ weather.city }}</n-text>
        </div>
        <n-text depth="2" class="wm-desc">{{ weather.desc }}</n-text>
        <n-text depth="3" class="wm-detail">{{ weather.high }}° / {{ weather.low }}°</n-text>
      </div>
    </template>
  </div>
</template>

<style scoped>
.weather-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  min-width: 180px;
  transition: background var(--transition-fast);
}
.weather-mini:hover {
  background: var(--color-bg-tertiary);
}
.wm-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.wm-line1 {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.wm-temp {
  font-family: var(--font-mono);
  font-size: var(--fs-xl);
  font-weight: 700;
  color: var(--color-text);
}
.wm-city {
  font-size: var(--fs-xs);
  font-weight: 500;
}
.wm-desc {
  font-size: var(--fs-xs);
}
.wm-detail {
  font-size: 11px;
}
</style>
