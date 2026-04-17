import { useState, useEffect } from "react";
import { Check, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  fetchClusters,
  joinCluster,
  leaveCluster,
  fetchMyJoinedClusterIds,
  bookmarkCluster,
  unbookmarkCluster,
  fetchMyBookmarkedClusters,
  type ClusterBasic,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const TrendingClusters = () => {
  const [clusters, setClusters] = useState<ClusterBasic[]>([]);
  const [joinedCids, setJoinedCids] = useState<Set<string>>(new Set());
  const [bookmarkedCids, setBookmarkedCids] = useState<Set<string>>(new Set());
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClusters(0, 5).then(setClusters).catch(console.error);

    if (!token) {
      setJoinedCids(new Set());
      setBookmarkedCids(new Set());
      return;
    }

    fetchMyJoinedClusterIds()
      .then((cids) => setJoinedCids(new Set(cids)))
      .catch(console.error);

    fetchMyBookmarkedClusters()
      .then((items) => setBookmarkedCids(new Set(items.map((item) => item.cid))))
      .catch(console.error);
  }, [token]);

  const handleJoin = async (cid: string) => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to join clusters.", variant: "destructive" });
      return;
    }
    try {
      const result = await joinCluster(cid);
      setJoinedCids((prev) => new Set(prev).add(cid));
      if (result.already_member) {
        toast({ title: "Already joined", description: "You're already a member." });
      } else {
        toast({ title: "Joined!", description: "You're now a member of this cluster." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLeave = async (cid: string) => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to leave clusters.", variant: "destructive" });
      return;
    }
    try {
      await leaveCluster(cid);
      setJoinedCids((prev) => {
        const next = new Set(prev);
        next.delete(cid);
        return next;
      });
      toast({ title: "Left cluster", description: "You are no longer a member." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleBookmark = async (cid: string) => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to bookmark clusters.", variant: "destructive" });
      return;
    }

    try {
      const isBookmarked = bookmarkedCids.has(cid);
      if (isBookmarked) {
        await unbookmarkCluster(cid);
        setBookmarkedCids((prev) => {
          const next = new Set(prev);
          next.delete(cid);
          return next;
        });
        toast({ title: "Bookmark removed", description: "Cluster removed from your bookmarks." });
      } else {
        await bookmarkCluster(cid);
        setBookmarkedCids((prev) => new Set(prev).add(cid));
        toast({ title: "Bookmarked", description: "Cluster added to your bookmarks." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="bg-card rounded-xl shadow-surface p-4"
    >
      <h3 className="font-semibold text-foreground mb-4">Trending Clusters</h3>
      <div className="space-y-3">
        {clusters.map((c) => {
          const isJoined = joinedCids.has(c.cid);
          const isBookmarked = bookmarkedCids.has(c.cid);
          return (
            <div key={c.cid} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {c.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">c/{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.category ?? "General"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleToggleBookmark(c.cid)}
                  aria-label={isBookmarked ? "Remove bookmark" : "Bookmark cluster"}
                >
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-accent" /> : <Bookmark className="h-4 w-4" />}
                </Button>

                {isJoined ? (
                  <div className="flex items-center gap-2">
                    <span className="h-7 text-xs text-green-500 font-medium flex items-center gap-1 px-1">
                      <Check className="h-3.5 w-3.5" /> Joined
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-full px-3"
                      onClick={() => handleLeave(c.cid)}
                    >
                      Leave
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-full px-4"
                    onClick={() => handleJoin(c.cid)}
                  >
                    Join
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {clusters.length === 0 && <p className="text-sm text-muted-foreground">Loading…</p>}
      </div>
      <Link to="/explore">
        <button className="w-full text-center text-sm text-accent font-medium mt-4 hover:underline">
          View All
        </button>
      </Link>
    </motion.div>
  );
};

export default TrendingClusters;
