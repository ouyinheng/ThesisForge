<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { watch } from 'vue'
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

watch(
  () => props.modelValue,
  (newContent) => {
    if (editor.value && newContent !== editor.value.getHTML()) {
      editor.value.commands.setContent(newContent)
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
        <span class="i-carbon:list"></span>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ active: editor.isActive('orderedList') }">
        <span class="i-carbon:list-numbered"></span>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().toggleTaskList().run()" :class="{ active: editor.isActive('taskList') }">
        <span class="i-carbon:checkbox-checked"></span>
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }">
        <span class="i-carbon:quotes"></span>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }">
        <span class="i-carbon:code"></span>
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().setTextAlign('left').run()">L</button>
      <button class="tool-btn" @click="editor.chain().focus().setTextAlign('center').run()">C</button>
      <button class="tool-btn" @click="editor.chain().focus().setTextAlign('right').run()">R</button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="setLink" :class="{ active: editor.isActive('link') }">
        <span class="i-carbon:link"></span>
      </button>
      <button class="tool-btn" @click="addImage">
        <span class="i-carbon:image"></span>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">
        <span class="i-carbon:table"></span>
      </button>
      <span class="tool-divider"></span>
      <button class="tool-btn" @click="editor.chain().focus().undo().run()">
        <span class="i-carbon:undo"></span>
      </button>
      <button class="tool-btn" @click="editor.chain().focus().redo().run()">
        <span class="i-carbon:redo"></span>
      </button>
    </div>
    <EditorContent :editor="editor" class="tiptap-editor" />
  </div>
</template>

<style lang="less" scoped>
.tiptap-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2em;
  padding: 0.5em 0.8em;
  background: var(--color-bg-secondary);
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
  border-radius: 3px;
  font-size: 13px;
  font-weight: 600;
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
  padding: 1em 1.2em;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1.8;
}
</style>

<style>
.tiptap-editor .ProseMirror {
  min-height: 360px !important;
  outline: none;
}
.tiptap-editor .ProseMirror p {
  margin-bottom: 0.8em;
}
</style>
