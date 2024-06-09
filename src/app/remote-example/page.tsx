import { useMDXComponents } from '@/mdx-components';
import { MDXRemote } from 'next-mdx-remote/rsc'
 
const md = `
# Hello, world!

This is a remote MDX page.

## Features

- **TypeScript**: Static types are cool.
- **Next.js**: The React framework for production.
- **Tailwind CSS**: Utility-first CSS framework.

## Code

\`\`\`tsx
import { MDXRemote } from 'next-mdx-remote/rsc'

export default function RemoteMdxPage() {
  const md = '# Hello, world!'
  return <MDXRemote source={md} />
}
\`\`\`

## Links

- [GitHub](https://github.com)
- [Twitter](https://twitter.com)
`
 
export default async function RemoteMdxPage() {
  // MDX text - can be from a local file, database, CMS, fetch, anywhere...
  const components = useMDXComponents();

  return (
    <div className="wrapper">
      <MDXRemote source={md} components={components} />
    </div>
  );
}
