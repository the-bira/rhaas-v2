"use client";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
export function MarkdownEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v?: string) => void;
}) {
  return (
    <div data-color-mode="dark">
      {" "}
      <MDEditor
        value={value}
        onChange={onChange}
        height={400}
        preview="live"
        visibleDragbar={false}
      />{" "}
    </div>
  );
}
