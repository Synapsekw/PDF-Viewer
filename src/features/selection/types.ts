export type PageTransform = {
  scale: number
  rotation: number // 0 | 90 | 180 | 270
}

export type SelectionRect = { x: number; y: number; width: number; height: number } // PDF page coords

export type SelectionEvent = {
  pageIndex: number
  text: string
  rects: SelectionRect[]
}


