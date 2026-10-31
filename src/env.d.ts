// Build-time constants injected by scripts/build.mjs (esbuild `define`).
interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly DEV: boolean;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare const __PDF_WORKER__: string;
declare const __BUILD_DATE__: string;
declare module "*.css";
