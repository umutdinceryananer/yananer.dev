import { setTheme, useTheme, type ResolvedTheme } from '../lib/useTheme'

/**
 * Toggles between light and dark.
 *
 * One button rather than a segmented control: the nav already carries a
 * segmented pill, and a second one beside it would read as two competing
 * navigations rather than a setting. The icon names the state it is *in* and
 * the label says what a press will do.
 *
 * There is no "system" position. The OS preference still decides what a first
 * visit looks like — it is what the inline script falls back to when nothing is
 * stored — but once someone has pressed this, they have said what they want and
 * the control has two honest states instead of three.
 *
 * It reads `resolved` rather than `choice` for the same reason: before the
 * first press the stored choice is "system", and a button that has to explain
 * that is a button doing too much work.
 */
const LABEL: Record<ResolvedTheme, string> = {
  light: 'Light',
  dark: 'Dark',
}

const ICON: Record<ResolvedTheme, React.ReactNode> = {
  // Sun
  light: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
    />
  ),
  // Moon
  dark: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
    />
  ),
}

const ThemeToggle = () => {
  const { resolved } = useTheme()
  const next: ResolvedTheme = resolved === 'dark' ? 'light' : 'dark'

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => setTheme(next)}
        // No `title`. The browser's own tooltip would open alongside the one
        // below it, in a style nothing else on the site uses and after a delay
        // nothing else on the site waits for.
        aria-label={`Theme: ${LABEL[resolved].toLowerCase()}. Switch to ${LABEL[
          next
        ].toLowerCase()}.`}
        className="grid h-[38px] w-[38px] place-items-center rounded-full bg-surface-1 border border-gray-800 text-gray-400 hover:text-ink hover:border-accent-500 transition-colors"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          {ICON[resolved]}
        </svg>
      </button>

      {/* The same box the contribution grid uses: state on top in ink, what a
          press will do underneath in grey. It opens downwards because this one
          sits at the top of the page, where there is nothing above it to open
          into.

          aria-hidden, because the button's own label already says all of this
          and a screen reader should not hear it twice.

          has-[:focus-visible] rather than group-focus-within: the group is this
          wrapper, which cannot take focus itself, and focus-within would also
          fire on a mouse click and leave the tooltip open under the pointer
          until you clicked somewhere else. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity duration-150 motion-reduce:transition-none group-hover:opacity-100 group-has-[:focus-visible]:opacity-100"
      >
        <div className="bg-surface-3 border border-gray-700 rounded-md px-2.5 py-1.5 leading-tight shadow-lg">
          <div className="text-[11px] font-medium text-ink">{LABEL[resolved]}</div>
          <div className="text-[10px] text-gray-300">Switch to {LABEL[next].toLowerCase()}</div>
        </div>
      </div>
    </div>
  )
}

export default ThemeToggle
