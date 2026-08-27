/**
 * サイト内リンクにベースパスを付ける。
 *
 * なぜ必要か:
 *   Astro は HTML の `href` を自動でベースパス付きに書き換えない。
 *   GitHub Pages のプロジェクトサイト（`https://<user>.github.io/<repo>/`）で配信すると、
 *   `href="/legend"` のような絶対パスは全部リンク切れになる。
 *   サイト内リンクは必ずこの関数を通す。
 *
 * 設計:
 *   - `import.meta.env.BASE_URL` の末尾スラッシュの有無は Astro の設定で変わるため、
 *     両端のスラッシュを落としてから連結する（`//legend` のような二重スラッシュを作らない）。
 *   - ローカル閲覧（base なし）では BASE_URL が `/` なので、これまでと同じパスが出る。
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  return rel ? `${base}/${rel}` : `${base}/`;
}
