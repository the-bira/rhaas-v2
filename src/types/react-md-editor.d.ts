// src/types/react-md-editor.d.ts
import "@uiw/react-md-editor";

declare module "@uiw/react-md-editor" {
  /** Estende o tipo de preview para incluir o modo experimental wysiwyg */
  export type PreviewType = "edit" | "live" | "preview" | "wysiwyg";
}
