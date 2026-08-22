import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Last line of defence around the whole app.
 *
 * Without one, a throw anywhere in render unmounts the tree and React leaves
 * `#root` empty. On this site that is not a blank white page a visitor can read
 * as broken — the shell paints `--color-surface-0`, so they get a featureless
 * black viewport that looks like the site simply does not exist.
 *
 * Deliberately plain: no tokens, no Tailwind, no imports beyond React. If the
 * app is broken enough to land here, the less this depends on the less there is
 * to take it down with it.
 */
type Props = { children: ReactNode }
type State = { failed: boolean }

class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div
        style={{
          // dvh, not vh: this one has no fixed-position parent to measure
          // against. If a browser is old enough not to know dvh it drops the
          // declaration and the message sits at the top instead of centred,
          // which is a fine way for an error screen to degrade.
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#050505',
          color: '#8c8c8c',
          fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ color: '#c6c6c6', fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
            Something broke on this page.
          </p>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            Sorry — that is on me, not you. Reloading usually clears it.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.55rem 1.1rem',
              borderRadius: '0.5rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#9c9c9c',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Reload yananer.dev
          </a>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
