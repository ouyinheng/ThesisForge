<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { watch, onMounted, nextTick } from 'vue'
import { NIcon } from 'naive-ui'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import {
  ListOutline,
  ListCircleOutline,
  CheckboxOutline,
  TextOutline,
  CodeOutline,
  LinkOutline,
  ImageOutline,
  GridOutline,
  ArrowUndoOutline,
  ArrowRedoOutline,
} from '@vicons/ionicons5'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const lowlight = createLowlight(all)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    Link,
    Image,
    TextStyle,
    Color,
    Highlight,
    TaskList,
    TaskItem,
    Placeholder.configure({ placeholder: props.placeholder || '' }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    CodeBlockLowlight.configure({ lowlight }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// 确保编辑器视图在 DOM 挂载后正确附加，避免 immediatelyRender 导致的时序问题
onMounted(() => {
  nextTick(() => {
    if (editor.value) {
      // 触发编辑器视图重新关联 DOM，确保 contenteditable 正常工作
      const view = editor.value.view
      if (view && !view.hasFocus()) {
        view.dom.focus()
        view.dom.blur()
      }
    }
  })
})

watch(
  () => props.modelValue,
  (newContent) => {
    if (editor.value && newContent !== editor.value.getHTML()) {
      // 第二个参数 false: 设置内容时不触发 onUpdate，避免与输入回写形成循环导致光标丢失
      editor.value.commands.setContent(newContent, false)
    }
  }
)

function setLink(): void {
  const url = prompt('Enter URL:')
  if (url && editor.value) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

function addImage(): void {
  const url = prompt('Enter image URL:')
  if (url && editor.value) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}
</script>

<template>
  <div class="tiptap-wrapper">
    <div class="toolbar" v-if="editor">
      <button class="tool-btn" @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }">
        B
      </button>
      <button class="tool-btn tool-italic" @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }">
        I
      </button>
      <button class="tool-btn tool-underline" @click="editor.chain().focus().toggleUnderline().run()" :class="{ active: editor.isActive('underline') }">
        U
      </button>
      <button class="tool-btn tool-strike" @click="editor.chain().focus().toggleStrike().run()" :class="{ active: editor.isActive('strike') }">
        S
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ active: editor.isActive('heading', { level: 2 }) }">
        H2
      </button>
      <button class="tool-btn" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ active: editor.isActive('heading', { level: 3 }) }">
        H3
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().toggleBulletList().run()" :class="{ active: editor.isActive('bulletList') }">
        <NIcon :size="14"><ListOutline /></NIcon>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ active: editor.isActive('orderedList') }">
        <NIcon :size="14"><ListCircleOutline /></NIcon>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().toggleTaskList().run()" :class="{ active: editor.isActive('taskList') }">
        <NIcon :size="14"><CheckboxOutline /></NIcon>
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }">
        <NIcon :size="14"><TextOutline /></NIcon>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }">
        <NIcon :size="14"><CodeOutline /></NIcon>
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().setTextAlign('left').run()">L</button>
      <button class="tool-btn" @click="editor.chain().focus().setTextAlign('center').run()">C</button>
      <button class="tool-btn" @click="editor.chain().focus().setTextAlign('right').run()">R</button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="setLink" :class="{ active: editor.isActive('link') }">
        <NIcon :size="14"><LinkOutline /></NIcon>
      </button>
      <button class="tool-btn" @click="addImage">
        <NIcon :size="14"><ImageOutline /></NIcon>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">
        <NIcon :size="14"><GridOutline /></NIcon>
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().undo().run()">
        <NIcon :size="14"><ArrowUndoOutline /></NIcon>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().redo().run()">
        <NIcon :size="14"><ArrowRedoOutline /></NIcon>
      </button>
    </div>
    <EditorContent :editor="editor" class="tiptap-editor" />
  </div>
</template>

<style lang="less" scoped>
.tiptap-wrapper {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg);
  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }
}

.toolbar {
  position: sticky;
  top: 48px;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2em;
  padding: 0.5em 0.8em;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.tool-btn {
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  transition: background var(--transition-fast), color var(--transition-fast);
  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
  &.active {
    background: var(--color-primary-light);
    color: var(--color-primary);
  }
}

.tool-italic {
  font-style: italic;
}

.tool-underline {
  text-decoration: underline;
}

.tool-strike {
  text-decoration: line-through;
}

.tool-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 0.4em;
}

.tiptap-editor {
  padding: var(--sp-5);
  font-family: var(--font-serif);
  font-size: var(--fs-base);
  line-height: 1.8;
  color: var(--color-text);
}

/* 占位符 */
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--color-text-tertiary);
}
</style>

<style>
.tiptap-editor .ProseMirror {
  min-height: 60vh !important;
  outline: none;
  &:focus {
    outline: none;
  }
}
.tiptap-editor .ProseMirror p {
  margin-bottom: 0.8em;
}
</style>
