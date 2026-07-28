'use client'

/**
 * Theme toggle.
 *
 * Deliberately not `next-themes`. The whole job is: read a string, write a
 * string, set one attribute. A dependency for that is weight the brief asked
 * us not to carry.
 *
 * There is no React state here at all, which is what avoids the usual
 * hydration mismatch — the server cannot know the visitor's theme, so it
 * renders nothing theme-dependent. Which icon shows is decided by CSS from the
 * `data-theme` attribute and the system media query, and the button only ever
 * writes that attribute.
 */

export const THEME_STORAGE_KEY = 'theme'

function applyTheme(next: 'light' | 'dark') {
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Private mode, or storage disabled. The theme still applies for this
    // page view; it simply will not be remembered. Not worth surfacing.
  }
}

export function ThemeToggle() {
  function toggle() {
    const explicit = document.documentElement.dataset.theme
    const current =
      explicit === 'light' || explicit === 'dark'
        ? explicit
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'

    applyTheme(current === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
      className="inline-grid size-9 place-items-center rounded-md border border-line text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {/*
        Which icon shows is pure CSS keyed on the effective theme — see
        `.icon-when-dark` / `.icon-when-light` in globals.css. Doing it in CSS
        rather than React state is what keeps the server render and the client
        render identical no matter what the visitor's system preference is.
      */}

      {/* Sun: shown in dark mode, because it offers the switch to light. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="icon-when-dark size-[18px]"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>

      {/* Moon: shown in light mode. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="icon-when-light size-[18px]"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
