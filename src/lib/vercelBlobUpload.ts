import { put } from "@vercel/blob";
export async function vercelBlobUpload(file: File) {
  const blob = await put(file.name, file, {
    access: "public",
    allowOverwrite: true,
  });
  return blob.url;
}
