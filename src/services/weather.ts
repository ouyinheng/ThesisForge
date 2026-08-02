// Open-Meteo 天气服务 — 免费、无需 API Key、CORS 支持
// https://open-meteo.com/docs

const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_API = 'https://api.open-meteo.com/v1/forecast'

export interface GeoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
  timezone: string
}

export interface WeatherData {
  icon: string
  temp: number
  desc: string
  humidity: number
  wind: string
  windSpeed: number
  city: string
  high: number
  low: number
  weatherCode: number
  isDay: boolean
}

// WMO Weather interpretation codes (中文描述)
const WEATHER_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: '晴朗', icon: 'SunnyOutline' },
  1: { desc: '主要晴朗', icon: 'PartlySunnyOutline' },
  2: { desc: '多云', icon: 'PartlySunnyOutline' },
  3: { desc: '阴', icon: 'CloudOutline' },
  45: { desc: '雾', icon: 'CloudOutline' },
  48: { desc: '雾凇', icon: 'CloudOutline' },
  51: { desc: '毛毛雨', icon: 'RainyOutline' },
  53: { desc: '中度毛毛雨', icon: 'RainyOutline' },
  55: { desc: '密集毛毛雨', icon: 'RainyOutline' },
  56: { desc: '冻毛毛雨', icon: 'RainyOutline' },
  57: { desc: '密集冻毛毛雨', icon: 'RainyOutline' },
  61: { desc: '小雨', icon: 'RainyOutline' },
  63: { desc: '中雨', icon: 'RainyOutline' },
  65: { desc: '大雨', icon: 'RainyOutline' },
  66: { desc: '冻雨', icon: 'RainyOutline' },
  67: { desc: '大冻雨', icon: 'RainyOutline' },
  71: { desc: '小雪', icon: 'SnowOutline' },
  73: { desc: '中雪', icon: 'SnowOutline' },
  75: { desc: '大雪', icon: 'SnowOutline' },
  77: { desc: '雪粒', icon: 'SnowOutline' },
  80: { desc: '阵雨', icon: 'RainyOutline' },
  81: { desc: '中阵雨', icon: 'RainyOutline' },
  82: { desc: '大阵雨', icon: 'RainyOutline' },
  85: { desc: '小阵雪', icon: 'SnowOutline' },
  86: { desc: '大阵雪', icon: 'SnowOutline' },
  95: { desc: '雷暴', icon: 'ThunderstormOutline' },
  96: { desc: '雷暴伴小冰雹', icon: 'ThunderstormOutline' },
  99: { desc: '雷暴伴大冰雹', icon: 'ThunderstormOutline' },
}

function getWeatherInfo(code: number): { desc: string; icon: string } {
  return WEATHER_CODES[code] || { desc: '未知', icon: 'CloudOutline' }
}

// 根据城市名搜索坐标
export async function searchCity(query: string): Promise<GeoResult[]> {
  const url = `${GEO_API}?name=${encodeURIComponent(query)}&count=5&language=zh`
  const res = await fetch(url)
  if (!res.ok) throw new Error('搜索城市失败')
  const data = await res.json()
  return (data.results || []) as GeoResult[]
}

// 根据坐标获取天气
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current_weather: 'true',
    daily: 'temperature_2m_max,temperature_2m_min,weathercode',
    hourly: 'relativehumidity_2m',
    timezone: 'auto',
  })
  const res = await fetch(`${FORECAST_API}?${params}`)
  if (!res.ok) throw new Error('获取天气失败')
  const data = await res.json()
  const current = data.current_weather
  const daily = data.daily
  const hourly = data.hourly

  const weatherCode = current.weathercode as number
  const info = getWeatherInfo(weatherCode)

  // 获取当前小时湿度
  const currentHour = new Date().getHours()
  const humidity = hourly.relativehumidity_2m?.[currentHour] ?? 60

  return {
    icon: info.icon,
    temp: Math.round(current.temperature),
    desc: info.desc,
    humidity: Math.round(humidity),
    wind: `${Math.round(current.windspeed)} km/h`,
    windSpeed: current.windspeed,
    city: '',
    high: Math.round(daily.temperature_2m_max?.[0] ?? current.temperature),
    low: Math.round(daily.temperature_2m_min?.[0] ?? current.temperature),
    weatherCode,
    isDay: current.is_day === 1,
  }
}

// 浏览器地理定位
export function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  })
}

// 根据坐标反向获取城市名（简化版，直接用经纬度查天气，城市名单独存）
export async function getWeatherByCity(cityName: string): Promise<WeatherData> {
  const results = await searchCity(cityName)
  if (!results.length) throw new Error('未找到该城市')
  const geo = results[0]
  const weather = await fetchWeather(geo.latitude, geo.longitude)
  weather.city = geo.name
  return weather
}

// 预设城市列表（点击切换）
export const PRESET_CITIES = ['北京', '上海', '成都', '杭州', '深圳', '广州']
