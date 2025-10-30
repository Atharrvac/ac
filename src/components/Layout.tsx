import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout = ({ children, className }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-auto ${className}`}>
        {/* Mobile top padding for header */}
        <div className="lg:hidden h-16" />
        {children}
      </main>
    </div>
  );
};

export default Layout;
