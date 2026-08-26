import type { ReactNode } from "react";
import { PublicNav } from "./PublicNav";
import { SiteFooter } from "./SiteFooter";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
