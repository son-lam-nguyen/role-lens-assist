import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/authContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import SWLayout from "./pages/sw/SWLayout";
import Overview from "./pages/sw/Overview";
import Upload from "./pages/sw/Upload";
import Clients from "./pages/sw/Clients";
import Cases from "./pages/sw/Cases";
import Calendar from "./pages/sw/Calendar";
import Notes from "./pages/sw/Notes";
import Messages from "./pages/sw/Messages";
import Library from "./pages/sw/Library";
import Recordings from "./pages/sw/Recordings";
import Settings from "./pages/sw/Settings";
import ClientChat from "./pages/ClientChat";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<Login />} />
            <Route
              path="/sw"
              element={
                <ProtectedRoute requiredRole="support-worker">
                  <SWLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="upload" element={<Upload />} />
              <Route path="clients" element={<Clients />} />
              <Route path="cases" element={<Cases />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="notes" element={<Notes />} />
              <Route path="messages" element={<Messages />} />
              <Route path="library" element={<Library />} />
              <Route path="recordings" element={<Recordings />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/client" element={<ClientChat />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
