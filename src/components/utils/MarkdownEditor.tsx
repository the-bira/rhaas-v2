"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "@/styles/md-wysiwyg.css";

// Lazy load do editor (evita erro no SSR)
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
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita erro de hidratação no Next.js
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-[400px] w-full rounded-lg bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Carregando editor...</span>
      </div>
    );
  }

  // Pega o tema atual real (user ou sistema)
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div data-color-mode={currentTheme === "dark" ? "dark" : "light"}>
      <MDEditor
        value={value}
        onChange={onChange}
        height={400}
        preview="live"
        visibleDragbar={false}
        commandsFilter={(cmd) =>
          cmd.name &&
          [
            "bold",
            "italic",
            "underline",
            "ordered-list",
            "unordered-list",
            "link",
            "quote",
            "code",
            "title",
          ].includes(cmd.name)
            ? cmd
            : false
        }
      />
    </div>
  );
}
