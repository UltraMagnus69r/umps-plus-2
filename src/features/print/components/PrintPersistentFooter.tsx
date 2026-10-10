import { useEffect, useRef } from 'react'

function IconUpload({ color }: { color: string }) {
  return (
    <svg className="persistent-footer-pill__icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill={color}
        d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"
      />
    </svg>
  )
}

function IconImage({ color }: { color: string }) {
  return (
    <svg className="persistent-footer-pill__icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill={color}
        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
      />
    </svg>
  )
}

function IconPdf({ color }: { color: string }) {
  return (
    <svg className="persistent-footer-pill__icon-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill={color}
        d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"
      />
    </svg>
  )
}

interface PrintPersistentFooterProps {
  onBackToShowcase: () => void
  onUploadFronts: (files: FileList | null) => void
  onUploadBack: (files: FileList | null) => void
  onExportPdf: () => void
  onExportPng: () => void
  exporting: boolean
  includeBleedInExport: boolean
  onIncludeBleedInExportChange: (value: boolean) => void
}

export function PrintPersistentFooter({
  onBackToShowcase,
  onUploadFronts,
  onUploadBack,
  onExportPdf,
  onExportPng,
  exporting,
  includeBleedInExport,
  onIncludeBleedInExportChange,
}: PrintPersistentFooterProps) {
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const apply = () => {
      document.documentElement.style.setProperty('--print-footer-h', `${Math.ceil(el.getBoundingClientRect().height)}px`)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <footer ref={footerRef} className="persistent-footer" role="contentinfo">
      <div className="persistent-footer-inner">
        <button
          type="button"
          className="print-feature-back-btn print-feature-back-btn--footer"
          onClick={onBackToShowcase}
        >
          ← Back to Showcase
        </button>
        <label className="persistent-footer-pill persistent-footer-pill--front">
          <span className="persistent-footer-pill__icon" aria-hidden>
            <IconUpload color="var(--persistent-footer-icon-front)" />
          </span>
          <span className="persistent-footer-pill__label">Upload Proxies</span>
          <input
            type="file"
            className="persistent-footer-pill__input"
            accept="image/png"
            multiple
            onChange={(event) => {
              onUploadFronts(event.target.files)
              event.currentTarget.value = ''
            }}
          />
        </label>
        <label className="persistent-footer-pill persistent-footer-pill--back">
          <span className="persistent-footer-pill__icon" aria-hidden>
            <IconImage color="var(--persistent-footer-icon-back)" />
          </span>
          <span className="persistent-footer-pill__label">Upload Card Back</span>
          <input
            type="file"
            className="persistent-footer-pill__input"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              onUploadBack(event.target.files)
              event.currentTarget.value = ''
            }}
          />
        </label>
        <div className="persistent-footer-exports">
          <label
            className="persistent-footer-bleed-toggle"
            title={
              includeBleedInExport
                ? 'On: sheet uses full-bleed cards and shows cut marks.'
                : 'Off: sheet uses trim-sized placement without cut marks.'
            }
          >
            <input
              type="checkbox"
              checked={includeBleedInExport}
              onChange={(e) => onIncludeBleedInExportChange(e.target.checked)}
            />
            <span>Bleed and cut marks</span>
          </label>
          <button
            type="button"
            className="persistent-footer-pill persistent-footer-pill--pdf"
            onClick={() => void onExportPng()}
            disabled={exporting}
          >
            <span className="persistent-footer-pill__icon" aria-hidden>
              <IconPdf color="var(--persistent-footer-icon-pdf)" />
            </span>
            <span className="persistent-footer-pill__label">{exporting ? 'Exporting…' : '600 DPI PNG'}</span>
          </button>
          <button
            type="button"
            className="persistent-footer-pill persistent-footer-pill--pdf"
            onClick={() => void onExportPdf()}
            disabled={exporting}
          >
            <span className="persistent-footer-pill__icon" aria-hidden>
              <IconPdf color="var(--persistent-footer-icon-pdf)" />
            </span>
            <span className="persistent-footer-pill__label">Export PDF</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
