import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const SavedPage = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Saved Windows</h1>
                <p className="text-sm text-muted-foreground">
                  {token ? "Your saved windows will appear here." : "Log in to save windows."}
                </p>
              </div>
            </motion.div>

            {/* Empty state */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="bg-card rounded-xl shadow-surface p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Bookmark className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No saved windows yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                When you find a post you want to revisit, click the <strong>Save</strong> button on it.
                It will appear here for easy access.
              </p>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SavedPage;
