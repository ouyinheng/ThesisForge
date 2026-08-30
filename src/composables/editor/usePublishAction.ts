import { ref } from "vue";

/**
 * 编辑器（新建或编辑）的共享发布动作。
 * 布局 header 中的"发布文章"按钮通过此模块调用编辑器内的发布函数，
 * 使顶栏的"写文章"按钮在进入编辑器后变为发布入口。
 */
const active = ref(false);
let publishFn: (() => void) | null = null;

export function usePublishAction() {
  function registerEditor(fn: () => void) {
    active.value = true;
    publishFn = fn;
  }

  function unregisterEditor() {
    active.value = false;
    publishFn = null;
  }

  return {
    isEditorActive: active,
    registerEditor,
    unregisterEditor,
    publish: () => publishFn?.(),
  };
}