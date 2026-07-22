/**
 * Injecting prerendered markup into the built index.html.
 *
 * Kept separate from the script that does the rendering so the substitution
 * itself is unit-testable: it is the step that can silently no-op, and a
 * silent no-op here means shipping an empty shell that looks fine in a browser
 * with JavaScript and is blank to everything else.
 */

/** Exactly the empty mount point vite ships in index.html. */
const EMPTY_ROOT = '<div id="root"></div>'

export function injectPrerenderedHtml(html: string, appHtml: string): string {
  if (!html.includes(EMPTY_ROOT)) {
    throw new Error(
      `index.html has no ${EMPTY_ROOT} to fill — prerendering would silently ship an empty ` +
        'shell. Did the mount point change?',
    )
  }
  if (appHtml.trim() === '') {
    throw new Error('the app rendered to an empty string — refusing to ship a blank page')
  }
  return html.replace(EMPTY_ROOT, `<div id="root">${appHtml}</div>`)
}
