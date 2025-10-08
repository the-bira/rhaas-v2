"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import CodeBlock from "@tiptap/extension-code-block";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  Code2,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
} from "lucide-react";
import "@/styles/md-wysiwyg.css";

export function MarkdownEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v?: string) => void;
}) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isInternalUpdate = useRef(false);
  const lastExternalValue = useRef<string | null>(null);

  useEffect(() => setMounted(true), []);
  const currentTheme = theme === "system" ? systemTheme : theme;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Highlight,
      CodeBlock,
      Underline,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      if (isInternalUpdate.current) return;
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || typeof value !== "string") return;
    const nextHtml = value.trim();
    const currentHtml = editor.getHTML().trim();
    if (nextHtml === currentHtml || nextHtml === lastExternalValue.current)
      return;
    try {
      isInternalUpdate.current = true;
      editor.commands.setContent(nextHtml, { emitUpdate: false });
      lastExternalValue.current = nextHtml;
    } finally {
      setTimeout(() => (isInternalUpdate.current = false), 20);
    }
  }, [value, editor]);

  if (!mounted || !editor) {
    return (
      <div className="h-[400px] w-full rounded-lg bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Carregando editor...</span>
      </div>
    );
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "")
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
  };

  return (
    <div data-color-mode={currentTheme === "dark" ? "dark" : "light"}>
      {/* Toolbar */}
      <div className="tiptap-toolbar">
        <button onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={16} />
        </button>
        <button onClick={toggleLink}>
          <Link2 size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={16} />
        </button>
        <button onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={16} />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={16} />
        </button>
        <button
          onClick={() => {
            const url = window.prompt("URL da imagem");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        >
          <ImageIcon size={16} />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
}
