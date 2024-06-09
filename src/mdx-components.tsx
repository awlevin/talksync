import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 {...props} className="mb-4 text-4xl font-bold" />,
    h2: (props) => <h2 {...props} className="mb-3 text-2xl font-semibold" />,
    h3: (props) => <h3 {...props} className="mb-2 text-xl font-semibold" />,
    h4: (props) => <h4 {...props} className="mb-2 text-lg font-semibold" />,
    h5: (props) => <h5 {...props} className="mb-2 text-base font-semibold" />,
    h6: (props) => <h6 {...props} className="mb-2 text-sm font-semibold" />,
    table: (props) => (
      <table {...props} className="w-full table-auto border-collapse" />
    ),
    td: (props) => (
      <td {...props} className="border border-zinc-500 px-4 py-2" />
    ),
    th: (props) => (
      <th {...props} className="border border-zinc-500 px-4 py-2" />
    ),
    tr: (props) => <tr {...props} className="border border-zinc-500" />,
    blockquote: (props) => (
      <blockquote
        {...props}
        className="border-l-4 border-zinc-500 pl-4 italic"
      />
    ),
    ul: (props) => <ul {...props} className="list-disc list-inside" />,
    ol: (props) => <ol {...props} className="list-decimal list-inside" />,
    li: (props) => <li {...props} className="mb-2" />,
    code: (props) => (
      <code {...props} className="bg-zinc-100 rounded p-1 text-sm" />
    ),
    inlineCode: (props) => (
      <code {...props} className="bg-zinc-100 rounded p-1 text-sm" />
    ),
    a: (props) => (
      <a
        {...props}
        className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
      />
    ),
    p: (props) => <p {...props} className="mb-4" />,
    pre: (props) => (
      <pre {...props} className="rounded-lg border-2 border-zinc-500 p-4" />
    ),
    ...components,
  };
}
