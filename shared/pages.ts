/** Every page the site publishes, as site-root-relative paths.
 *
 * The site is a small set of static documents rather than a client-side router,
 * so the list of pages is itself a fact about the site and lives here, in one
 * place, as plain strings.
 *
 * Vite emits only the pages listed in `build.rollupOptions.input`. A page that
 * exists in the repository but is missing from this list still works in
 * `npm run dev` — the dev server serves the project root — and then 404s in the
 * built site. Keeping the list here, and testing it, is what stops that from
 * happening quietly. */

export const SITE_PAGES: Record<string, string> = {
  /** Redirect to the catalog, so the site root is not a dead end. */
  root: '/index.html',
  index: '/experiments/index.html',
  evidenceModel: '/shared/evidence-model.html',
  proto01App: '/prototypes/proto-01/app/index.html',
  proto01Doc: '/prototypes/proto-01/doc.html',
  proto02Doc: '/prototypes/proto-02/doc.html',
}
