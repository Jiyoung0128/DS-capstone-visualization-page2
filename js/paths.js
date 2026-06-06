/**
 * GitHub Pages (프로젝트 사이트 /repo-name/) 와 로컬 serve(/) 공통 URL.
 */

/** @returns {string} leading slash, no trailing slash; "" at site root */
export function getBasePath() {
  const meta = document.querySelector('meta[name="app-base"]');
  if (meta?.content != null && meta.content !== "") {
    const b = meta.content.trim().replace(/\/$/, "");
    return b.startsWith("/") ? b : `/${b}`;
  }
  let path = window.location.pathname;
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -"/index.html".length);
  }
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (!path || path === "/") {
    return "";
  }
  return path;
}

/** @param {string} relativePath no leading slash */
export function resolveAppUrl(relativePath) {
  const rel = String(relativePath).replace(/^\//, "");
  const base = getBasePath();
  if (!base) {
    return rel;
  }
  return `${base}/${rel}`.replace(/\/+/g, "/");
}
