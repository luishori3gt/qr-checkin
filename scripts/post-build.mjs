import fs from "fs";
import path from "path";

const distPath = path.resolve(process.cwd(), "dist/public");
const indexPath = path.resolve(distPath, "index.html");

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, "utf-8");

  // Add cache-busting meta tags
  content = content.replace(
    "<head>",
    `<head><meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0">`
  );

  // Create versioned assets directory
  const version = Date.now().toString(36);
  const assetsDir = path.join(distPath, "assets");
  const versionedDir = path.join(distPath, `a${version}`);

  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, versionedDir, { recursive: true });
    console.log(`Copied assets to /a${version}/`);

    // Update index.html to use versioned paths
    content = content.replace(/\/assets\//g, `/a${version}/`);
    console.log(`Updated asset paths to /a${version}/`);
  }

  fs.writeFileSync(indexPath, content);
  console.log(`Post-build complete. Version: a${version}`);
}
