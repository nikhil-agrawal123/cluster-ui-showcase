import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fetchClusters, joinCluster, type ClusterBasic } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const TrendingClusters = () => {
  const [clusters, setClusters] = useState<ClusterBasic[]>([]);
  const [joinedCids, setJoinedCids] = useState<Set<string>>(new Set());
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClusters(0, 5).then(setClusters).catch(console.error);
  }, []);

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
              {isJoined ? (
                <span className="h-7 text-xs text-green-500 font-medium flex items-center gap-1 px-3">
                  <Check className="h-3.5 w-3.5" /> Joined
                </span>
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
