import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <ChatPage />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
