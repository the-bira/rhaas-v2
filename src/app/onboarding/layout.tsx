export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center max-w-7xl mx-auto ">
      {children}
    </div>
  );
}