import nextMDX from '@next/mdx';

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
  transpilePackages: ["next-mdx-remote"],
  experimental: {
    serverComponentsExternalPackages: ["@vercel/blob"],
  },
};

const withMDX = nextMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
