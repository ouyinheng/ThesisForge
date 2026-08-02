import { h, type Component, computed } from "vue";
import { NIcon, type MenuOption } from "naive-ui";
import { useI18n } from "@/composables/useI18n";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import {
  HomeOutline,
  DocumentTextOutline,
  InformationCircleOutline,
  NewspaperOutline,
  GlobeOutline
} from "@vicons/ionicons5";

export function useNavMenu() {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();

  const renderIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) });

  /**
   * 导航菜单配置（侧边栏 + 顶栏共享同一数据源）
   */
  const navMenuOptions = computed<MenuOption[]>(() => [
    // {
    //   label: () => t("nav.home"),
    //   key: "home",
    //   icon: renderIcon(HomeOutline)
    // },
    {
      label: () => t("nav.papers"),
      key: "papers",
      icon: renderIcon(DocumentTextOutline)
    },
    {
      label: () => t("nav.external"),
      key: "external",
      icon: renderIcon(GlobeOutline),
      children: [
        {
          label: () => t("nav.juejin"),
          key: "juejin",
          icon: renderIcon(NewspaperOutline)
        }
      ]
    },
    {
      label: () => t("nav.about"),
      key: "about",
      icon: renderIcon(InformationCircleOutline)
    }
  ]);

  /**
   * 当前激活的菜单 key
   */
  const activeKey = computed(() => {
    if (route.path === "/") return "home";
    if (route.path === "/papers") return "papers";
    if (route.path === "/juejin" || route.path.startsWith("/juejin/")) return "juejin";
    if (route.path === "/about") return "about";
    return "";
  });

  /**
   * 菜单 key → 路由路径映射
   */
  const keyToRoute: Record<string, RouteLocationRaw> = {
    home: "/",
    papers: "/papers",
    about: "/about",
    juejin: "/juejin"
  };

  /**
   * 菜单选择回调
   */
  function handleSelect(key: string): void {
    if (keyToRoute[key]) {
      router.push(keyToRoute[key]);
    }
  }

  return {
    navMenuOptions,
    activeKey,
    handleSelect
  };
}
