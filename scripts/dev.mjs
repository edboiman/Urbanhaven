// Development: rebuild on change and serve dist/ on http://localhost:5173/
import { spawn } from "node:child_process";
const build = spawn(process.execPath, ["scripts/build.mjs", "--watch"], { stdio: "inherit" });
setTimeout(() => {
  const serve = spawn(process.execPath, ["scripts/serve.mjs", "dist", "5173", "/"], { stdio: "inherit" });
  const stop = () => { build.kill(); serve.kill(); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}, 4000);
