import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  // A static site: `next build` writes plain HTML, CSS and JS to out/, ready for any static host
  output: "export",
  // /play/ is served from play/index.html, which every static host understands
  trailingSlash: true,
  // A second dev server (e.g. an agent's) can build into its own folder; in export mode this is also where the site lands
  ...(process.env.NEXT_DIST_DIR && { distDir: process.env.NEXT_DIST_DIR }),
}

export default nextConfig
