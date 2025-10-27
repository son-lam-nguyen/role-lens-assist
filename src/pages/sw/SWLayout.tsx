import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SWSidebar } from "@/components/supportlens/SWSidebar";
import { Navbar } from "@/components/supportlens/Navbar";

const SWLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SidebarProvider>
        <div className="flex pt-16 w-full">
          <SWSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              <div className="mb-4">
                <SidebarTrigger />
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default SWLayout;
