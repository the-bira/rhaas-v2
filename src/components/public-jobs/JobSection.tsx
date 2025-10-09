
export function JobSection({
  title,
  html,
}: {
  title: string;
  html: string;
}) {
  return (
    <section className="bg-card border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
