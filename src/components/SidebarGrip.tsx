"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function SidebarGrip() {
  const { open } = useSidebar(); // ✅ já vem do ShadCN — sem useEffect

  return (
    <div
      className={cn(
        "fixed top-16 -translate-y-1/2 z-50 transition-all duration-300 ease-in-out",
        open ? "left-[260px]" : "left-0"
      )}
    >
      <div
        className="
          group flex items-center justify-center
          w-6 h-16
          bg-primary-foreground/70
          backdrop-blur-sm
          border border-border border-l-0
          rounded-r-full
          opacity-30 hover:opacity-100
          transition-all duration-300 ease-in-out
          hover:w-8 hover:shadow-md cursor-pointer
        "
      >
        <SidebarTrigger />
      </div>
    </div>
  );
}
