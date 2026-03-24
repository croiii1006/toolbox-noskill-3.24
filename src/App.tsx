import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TikTokInspirationProvider } from "@/contexts/TikTokInspirationContext";
import { ReplicatePrefillProvider } from "@/contexts/ReplicatePrefillContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CreditsProvider>
        <TikTokInspirationProvider>
          <ReplicatePrefillProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ReplicatePrefillProvider>
        </TikTokInspirationProvider>
      </CreditsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
