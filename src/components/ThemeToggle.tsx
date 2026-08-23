import { setTheme, useTheme, type ThemeChoice } from '../lib/useTheme'

/**
 * Cycles system → light → dark → system.
 *
 * One button rather than a three-segment control: the nav already carries a
 * segmented pill, and a second one beside it would read as two competing
 * navigations rather than a setting. The cost is that a cycling control does
 * not show its options, so the icon names the state it is *in* and the label
 * says what a press will do.
 *
 * "System" is a real, reachable state, not just the value before you touch
 * anything — otherwise the first click is one-way and the visitor can never
 * hand the decision back to the OS.
 */
const NEXT: Record<ThemeChoice, ThemeChoice> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const LABEL: Record<ThemeChoice, string> = {
  system: 'system',
  light: 'light',
  dark: 'dark',
}

const ICON: Record<ThemeChoice, React.ReactNode> = {
  // Monitor
  system: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
    />
  ),
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
  const { choice } = useTheme()
  const next = NEXT[choice]

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${LABEL[choice]} — switch to ${LABEL[next]}`}
      aria-label={`Theme: ${LABEL[choice]}. Switch to ${LABEL[next]}.`}
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
        {ICON[choice]}
      </svg>
    </button>
  )
}

export default ThemeToggle
