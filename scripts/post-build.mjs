import fs from "fs";
import path from "path";

const distPath = path.resolve(process.cwd(), "dist/public");
const indexPath = path.resolve(distPath, "index.html");

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, "utf-8");
  
  // Add version query parameter to assets to bust CDN cache
  const version = Date.now().toString();
  content = content.replace(
    /src="\/assets\/([^"]+)"/g,
    `src="/assets/$1?v=${version}"`
  );
  content = content.replace(
    /href="\/assets\/([^"]+)"/g,
    `href="/assets/$1?v=${version}"`
  );
  
  // Add cache-busting meta tags
  content = content.replace(
    "<head>",
    `<head><meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0">`
  );
  
  fs.writeFileSync(indexPath, content);
  console.log(`Post-build: Assets versioned with v=${version}`);
}
