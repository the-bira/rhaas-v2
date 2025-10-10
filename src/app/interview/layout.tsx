import localFont from "next/font/local";

const quantumFont = localFont({
  src: [
    {
      path: "../../../public/fonts/Quantum.otf",
      weight: "100",
      style: "normal",
    },
  ],
  variable: "--font-quantum", // ← Importante para usar no CSS
});

export default async function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 min-h-screen w-full bg-background text-foreground overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background border-b px-4 h-14 w-full">
        <h1
          className={`max-w-7xl mx-auto w-full text-2xl font-bold ${quantumFont.className} 
          bg-gradient-to-b from-black to-gray-950
          dark:bg-gradient-to-b from-white to-slate-500
          bg-clip-text text-transparent 
          tracking-widest`}
        >
          HUMANA
        </h1>
      </header>
      <main className="max-w-7xl mx-auto w-full p-6">{children}</main>
    </div>
  );
}
