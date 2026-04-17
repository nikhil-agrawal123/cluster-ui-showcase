import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Check, MessageSquare } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMyBookmarkedClusters,
  setClusterChatOption,
  joinCluster,
  leaveCluster,
  unbookmarkCluster,
  type BookmarkedCluster,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SavedPage = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkedCluster[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookmarks = () => {
    if (!token) {
      setBookmarks([]);
      return;
    }

    setLoading(true);
    fetchMyBookmarkedClusters()
      .then(setBookmarks)
      .catch((err: any) => {
        toast({ title: "Failed to load bookmarks", description: err.message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookmarks();
  }, [token]);

  const handleToggleChat = async (cid: string, nextValue: boolean) => {
    try {
      await setClusterChatOption(cid, nextValue);
      setBookmarks((prev) =>
        prev.map((item) => (item.cid === cid ? { ...item, chat_enabled: nextValue } : item))
      );
      toast({ title: "Chat option updated", description: nextValue ? "Cluster chat enabled." : "Cluster chat disabled." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleMembership = async (item: BookmarkedCluster) => {
    try {
      if (item.is_member) {
        await leaveCluster(item.cid);
        setBookmarks((prev) => prev.map((entry) => (entry.cid === item.cid ? { ...entry, is_member: false } : entry)));
        toast({ title: "Left cluster", description: `You left c/${item.name}.` });
      } else {
        await joinCluster(item.cid);
        setBookmarks((prev) => prev.map((entry) => (entry.cid === item.cid ? { ...entry, is_member: true } : entry)));
        toast({ title: "Joined cluster", description: `You joined c/${item.name}.` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveBookmark = async (cid: string) => {
    try {
      await unbookmarkCluster(cid);
      setBookmarks((prev) => prev.filter((item) => item.cid !== cid));
      toast({ title: "Bookmark removed", description: "Cluster removed from your bookmarks." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

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
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Bookmarked Clusters</h1>
                <p className="text-sm text-muted-foreground">
                  {token ? "Your bookmarked clusters and chat options appear here." : "Log in to view your bookmarks."}
                </p>
              </div>
            </motion.div>

            {loading && <p className="text-sm text-muted-foreground py-8 text-center">Loading bookmarks…</p>}

            {!loading && token && bookmarks.length > 0 && (
              <div className="space-y-3">
                {bookmarks.map((item, i) => (
                  <motion.div
                    key={item.cid}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.28 }}
                    className="bg-card rounded-xl shadow-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-foreground">c/{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.category ?? "General"}</p>
                        {item.is_member && (
                          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Joined
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleToggleMembership(item)}
                        >
                          {item.is_member ? "Leave" : "Join"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleRemoveBookmark(item.cid)}
                        >
                          Remove Bookmark
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Cluster chat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.chat_enabled ? "Enabled" : "Disabled"}</span>
                        <Switch
                          checked={item.chat_enabled}
                          onCheckedChange={(nextValue) => handleToggleChat(item.cid, nextValue)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && (!token || bookmarks.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="bg-card rounded-xl shadow-surface p-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No bookmarked clusters yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Bookmark clusters from Explore or Trending, then manage join status and chat options here.
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SavedPage;
