import React, { useEffect, useMemo, useRef, useCallback } from 'react'
import type { PageTransform, SelectionEvent } from './types'
import { emitSelection } from './useSelectionAnalytics'
import { renderTextLayer } from 'pdfjs-dist/web/pdf_viewer'

type Props = {
  page: any // PDFPageProxy
  pageIndex: number
  transform: PageTransform // { scale, rotation }
  className?: string
}

export function TextLayer({ page, pageIndex, transform, className }: Props) {
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

      try {
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          includeMarkedContent: true,
        })
        if (cancelled) return

        await renderTextLayer({
          textContentSource: textContent,
          container,
          viewport,
          textDivs: [],
          timeout: 0,
          enhanceTextSelection: true,
        })

        // Make the text invisible but selectable
        container.querySelectorAll('span').forEach((el) => {
          (el as HTMLElement).style.opacity = '0'
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
      className={className ? `textLayer ${className}` : 'textLayer'}
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


