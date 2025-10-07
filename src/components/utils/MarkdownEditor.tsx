// src/components/utils/MarkdownEditor.tsx
"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg bg-muted animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground">Carregando editor...</span>
    </div>
  ),
});

export function MarkdownEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v?: string) => void;
}) {
  return (
    <div data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={onChange}
        height={400}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  );
}
