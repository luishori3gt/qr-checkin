import fs from "fs";

const version = Date.now().toString(36);
const base = `/app-${version}/`;

let config = fs.readFileSync("vite.config.ts", "utf-8");

// Remove existing base line
config = config.replace(/\s+base:.*,/g, "");

// Add base after defineConfig
config = config.replace(
  "export default defineConfig({",
  `export default defineConfig({\n  base: "${base}",`
);

fs.writeFileSync("vite.config.ts", config);
console.log(`Set base to: ${base}`);
