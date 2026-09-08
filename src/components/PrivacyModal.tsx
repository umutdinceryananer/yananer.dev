import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { privacy, privacyUpdated } from '../data/privacy'
import { useDialogTransition, dialogChrome, dialogCloseButton } from '../lib/useDialogTransition'
import { useDialogFocus } from '../lib/useDialogFocus'
import { useScrollLock } from '../lib/useScrollLock'

/**
 * The privacy notice, in a dialog rather than on a route.
 *
 * There is deliberately no SPA catch-all on this site -- an unknown path serves
 * a real 404, which is what keeps scanner noise out of the pageview stats -- so
 * a /privacy route would have to be a static file anyway. It is one: the build
 * emits public/privacy/index.html from the same src/data/privacy.ts this reads,
 * for anyone who wants a URL to link to. This is the copy people will actually
 * open, one click from the footer.
 */
const PrivacyModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { render, shown } = useDialogTransition(open)
  const chrome = dialogChrome(shown)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useDialogFocus(render, panelRef)
  useScrollLock(render)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!render) return null

  return createPortal(
    <div className={`${chrome.root} p-3 sm:p-4`} onClick={onClose}>
      <div aria-hidden className={`${chrome.backdrop} bg-scrim`} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${chrome.panel} w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface-1 border border-gray-800 rounded-xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 sticky top-0 bg-surface-1 z-10">
          <h2 id={titleId} className="text-ink text-sm font-semibold truncate">
            What this site measures
          </h2>
          <button onClick={onClose} aria-label="Close" className={dialogCloseButton}>
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {privacy.map((section) => (
            <section key={section.heading}>
              <h3 className="text-ink text-sm font-semibold mb-1.5">{section.heading}</h3>
              {section.body.map((line) => (
                <p key={line} className="text-gray-400 text-xs leading-relaxed mb-1.5 last:mb-0">
                  {line}
                </p>
              ))}
            </section>
          ))}
          <p className="text-gray-500 text-[11px] pt-1 border-t border-gray-800">
            Last updated {privacyUpdated}.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PrivacyModal
