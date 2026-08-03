export interface Bookmark {
  id: string
  title: string
  url: string
  icon: string              // favicon URL 或 ''
  letter: string            // title 首字母（图标兜底）
  groupId: string           // 分组 id，'' = 未分组
  createdAt: string
  updatedAt: string
}

export interface Collection {
  id: string
  name: string
  icon: string              // emoji 或文字标识
  color: string             // 主题色
  createdAt: string
  updatedAt: string
  order: number             // 排序权重
}

export type CreateBookmarkDTO = Pick<Bookmark, 'url' | 'title'> &
  Partial<Pick<Bookmark, 'icon' | 'groupId'>>

export type UpdateBookmarkDTO = Partial<
  Pick<Bookmark, 'title' | 'url' | 'icon' | 'groupId' | 'letter'>
>

export type CreateCollectionDTO = Pick<Collection, 'name'> &
  Partial<Pick<Collection, 'icon' | 'color'>>
