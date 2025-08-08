import React, { useEffect, useMemo, useRef, useCallback } from 'react'
import type { PageTransform, SelectionEvent } from './types'
import { emitSelection } from './useSelectionAnalytics'
import * as pdfjsLib from 'pdfjs-dist'

type Props = {
  page: any // PDFPageProxy
  pageIndex: number
  transform: PageTransform // { scale, rotation }
  className?: string
}

export function TextLayer({ page, pageIndex, transform, className }: Props) {
  // eslint-disable-next-line no-console
  console.log('[TextLayer] Component mounted:', { pageIndex, transform })
  
  const containerRef = useRef<HTMLDivElement>(null)

  const viewport = useMemo(
    () => page.getViewport({ scale: transform.scale, rotation: transform.rotation }),
    [page, transform.scale, transform.rotation]
  )

  // Render/update text layer when viewport changes
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const container = containerRef.current
      if (!container) return
      container.innerHTML = '' // reset
      container.classList.add('textLayer')

      // eslint-disable-next-line no-console
      console.log('[TextLayer] mount: pageIndex=', pageIndex, 'viewport=', {
        width: viewport.width,
        height: viewport.height,
        scale: transform.scale,
        rotation: transform.rotation,
      })

      try {
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          includeMarkedContent: true,
        })
        if (cancelled) return

        // Create text spans manually
        textContent.items.forEach((item: any, index: number) => {
          const span = document.createElement('span')
          span.textContent = item.str
          span.style.position = 'absolute'
          span.style.left = `${item.transform[4]}px`
          span.style.top = `${item.transform[5]}px`
          span.style.fontSize = `${Math.abs(item.transform[0])}px`
          span.style.fontFamily = item.fontName || 'sans-serif'
          span.style.color = 'transparent'
          span.style.userSelect = 'text'
          span.style.pointerEvents = 'auto'
          container.appendChild(span)
        })

        // Debug: log rendered spans
        // eslint-disable-next-line no-console
        console.log('[TextLayer] rendered spans:', container.querySelectorAll('span').length)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[TextLayer] render failed', err)
      }
    })()
    return () => { cancelled = true }
  }, [page, viewport])

  const onMouseUp = useCallback(() => {
    const sel = window.getSelection?.()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString()
    if (!text.trim()) return

    const rects: SelectionEvent['rects'] = []
    for (let i = 0; i < sel.rangeCount; i++) {
      const range = sel.getRangeAt(i)
      Array.from(range.getClientRects()).forEach((r) => {
        const pdfRect = clientRectToPdfRect(r, containerRef.current!, viewport)
        rects.push(pdfRect)
      })
    }
    emitSelection({ pageIndex, text, rects })
  }, [pageIndex, viewport])

  return (
    <div
      ref={containerRef}
      className={className ? `${className} textLayer` : 'textLayer'}
      onMouseUp={onMouseUp}
      style={{
        position: 'absolute',
        inset: 0,
        width: viewport.width,
        height: viewport.height,
        userSelect: 'text',
        pointerEvents: 'auto',
        // Keep it above the canvas, below UI chrome
        zIndex: 5,
      }}
      aria-label={`Text layer for page ${pageIndex + 1}`}
      role="document"
    />
  )
}

function clientRectToPdfRect(rect: DOMRect, container: HTMLDivElement, viewport: any) {
  const containerBox = container.getBoundingClientRect()
  // viewport space (origin top-left)
  const x1v = rect.left - containerBox.left
  const y1v = rect.top - containerBox.top
  const x2v = rect.right - containerBox.left
  const y2v = rect.bottom - containerBox.top

  // Convert viewport coords -> PDF coords (origin bottom-left)
  const [x1p, y1p] = viewport.convertToPdfPoint(x1v, y1v)
  const [x2p, y2p] = viewport.convertToPdfPoint(x2v, y2v)

  const x = Math.min(x1p, x2p)
  const y = Math.min(y1p, y2p)
  const width = Math.abs(x2p - x1p)
  const height = Math.abs(y2p - y1p)
  return { x, y, width, height }
}


