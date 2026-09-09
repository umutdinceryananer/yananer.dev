import { useEffect, useId, useRef, useState } from 'react'
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
 *
 * It also carries the opt-out switch, which has to be here rather than in a
 * README: CNIL's audience-measurement exemption is conditional on offering a
 * mechanism the visitor can actually use to object, and the previous one was a
 * line to type into the developer console.
 */

/**
 * Whether this build measures anything at all.
 *
 * Read straight from the build env rather than through session.ts's ENDPOINT
 * export, because importing that module to find out whether to import it is
 * exactly the problem being avoided: Footer renders this dialog and App renders
 * Footer, so a static import would pull the tracker's module graph into the main
 * bundle. Read this way the reference disappears at build time when no endpoint
 * is configured, and nothing analytics-related ships at all --
 * scripts/audit-analytics.ts asserts both halves of that.
 *
 * It keeps the dialog honest too. A switch offering to stop measuring that is
 * not happening is a worse lie than no switch.
 */
const MEASURING = !!import.meta.env.VITE_ANALYTICS_ENDPOINT

const PrivacyModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [optedOut, setOptedOut] = useState<boolean | null>(null)
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

  // Read on open rather than on mount: the dialog is mounted for the life of
  // the page, and the answer can change in another tab.
  useEffect(() => {
    if (!open || !MEASURING) return
    let cancelled = false
    import('../lib/analytics/session')
      .then((m) => !cancelled && setOptedOut(m.isOptedOut()))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  const toggle = async () => {
    const next = !optedOut
    // Optimistic: the switch is the visitor's answer to a question about their
    // own device, and it should never appear to hesitate.
    setOptedOut(next)
    try {
      const m = await import('../lib/analytics/session')
      m.setOptedOut(next)
    } catch {
      setOptedOut(!next)
    }
  }

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
          <div className="pt-1 border-t border-gray-800">
            {MEASURING && optedOut !== null && (
              <button
                onClick={toggle}
                aria-pressed={optedOut}
                className={`w-full mt-3 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  optedOut
                    ? 'border-gray-800 bg-surface-0 text-gray-300 hover:border-gray-700'
                    : 'border-accent-500/30 bg-accent-500/10 text-ink hover:border-accent-500/50'
                }`}
              >
                {optedOut ? 'Measuring is off. Turn it back on' : 'Turn measuring off for this browser'}
              </button>
            )}
            <p className="text-gray-500 text-[11px] mt-3">
              {!MEASURING
                ? 'Nothing is being measured on this build at all.'
                : optedOut
                  ? 'Nothing is being recorded, and both identifiers have been deleted from this browser.'
                  : 'Turning it off deletes both identifiers straight away and stops all recording on this browser.'}
            </p>
            <p className="text-gray-500 text-[11px] mt-2">Last updated {privacyUpdated}.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PrivacyModal
