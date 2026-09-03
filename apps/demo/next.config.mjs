import createMDX from "@next/mdx";

/**
 * The docs pages are MDX, so that the prose is prose in the source too — and
 * so that `<SpokenText>` is handed real `h2` and `p` elements to read, which
 * is the one thing the walk cannot get from a component of its own.
 */
const withMDX = createMDX({});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: {
    serverComponentsExternalPackages: ["@vercel/blob"],
  },
};

export default withMDX(nextConfig);
