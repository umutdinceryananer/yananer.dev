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
  light: 'light',
  dark: 'dark',
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
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${LABEL[resolved]} — switch to ${LABEL[next]}`}
      aria-label={`Theme: ${LABEL[resolved]}. Switch to ${LABEL[next]}.`}
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
  )
}

export default ThemeToggle
