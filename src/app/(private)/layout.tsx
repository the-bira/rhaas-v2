import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/utils/AppSidebar';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
     <main>
      <SidebarTrigger />
      {children}
     </main>
    </SidebarProvider>
  );
}
