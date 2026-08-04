import { h, type Component, computed } from "vue";
import { NIcon, type MenuOption } from "naive-ui";
import { useI18n } from "@/composables/i18n/useI18n";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import {
  HomeOutline,
  DocumentTextOutline,
  InformationCircleOutline,
  NewspaperOutline,
  GlobeOutline,
  CheckboxOutline,
  BookmarkOutline,
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
    {
      label: () => t("nav.home"),
      key: "home",
      icon: renderIcon(HomeOutline)
    },
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
      label: () => "To-Do",
      key: "todos",
      icon: renderIcon(CheckboxOutline)
    },
    {
      label: () => t("nav.collections"),
      key: "collections",
      icon: renderIcon(BookmarkOutline)
    },
    {
      label: () => t("nav.about"),
      key: "about",
      icon: renderIcon(InformationCircleOutline)
    }
  ]);

  /**
   * 当前激活的菜单 key（支持动态路由高亮）
   * - /article/:id → papers 高亮
   * - /juejin/:id → juejin 高亮
   * - /editor → home 高亮
   */
  const activeKey = computed(() => {
    const path = route.path;
    if (path === "/" || path.startsWith("/editor")) return "home";
    if (path === "/papers" || path.startsWith("/article/")) return "papers";
    if (path === "/juejin" || path.startsWith("/juejin/")) return "juejin";
    if (path === "/todos" || path.startsWith("/todos")) return "todos";
    if (path === "/collections" || path.startsWith("/collections")) return "collections";
    if (path === "/about") return "about";
    return "";
  });

  /**
   * 菜单 key → 路由路径映射
   */
  const keyToRoute: Record<string, RouteLocationRaw> = {
    home: "/",
    papers: "/papers",
    about: "/about",
    juejin: "/juejin",
    todos: "/todos",
    collections: "/collections"
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
