import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Compass, Search, Users, Check } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchClusters, joinCluster, type ClusterBasic } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-red-500", "bg-purple-500",
  "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-green-500",
  "bg-indigo-500", "bg-rose-500", "bg-teal-500", "bg-orange-500",
  "bg-fuchsia-500", "bg-lime-500", "bg-sky-500",
];

const ExplorePage = () => {
  const [clusters, setClusters] = useState<ClusterBasic[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [joinedCids, setJoinedCids] = useState<Set<string>>(new Set());
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClusters(0, 50)
      .then(setClusters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? clusters.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.category?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : clusters;

  const handleJoin = async (cid: string) => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to join clusters.", variant: "destructive" });
      return;
    }
    try {
      const result = await joinCluster(cid);
      setJoinedCids((prev) => new Set(prev).add(cid));
      if (result.already_member) {
        toast({ title: "Already joined", description: "You're already a member of this cluster." });
      } else {
        toast({ title: "Joined!", description: "You're now a member of this cluster." });
      }
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
          <main className="flex-1 min-w-0 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-3 mb-1">
                <Compass className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Explore Clusters</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Discover communities that match your interests.</p>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clusters..."
                  className="pl-9 h-10 bg-card border-border rounded-xl text-sm"
                />
              </div>
            </motion.div>

            {loading && <p className="text-center text-muted-foreground py-12">Loading clusters…</p>}

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((c, i) => {
                const isJoined = joinedCids.has(c.cid);
                return (
                  <motion.div
                    key={c.cid}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                    className="bg-card rounded-xl shadow-surface p-5 hover:shadow-surface-hover transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`w-10 h-10 rounded-lg ${COLORS[i % COLORS.length]} flex items-center justify-center text-xs font-bold text-white`}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">c/{c.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {c.category ?? "General"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {c.category ? `A community focused on ${c.category} topics.` : "Explore what this cluster has to offer."}
                    </p>
                    {isJoined ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="mt-4 w-full h-8 text-xs border-green-500 text-green-500 rounded-lg gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" /> Joined
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full h-8 text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-lg"
                        onClick={() => handleJoin(c.cid)}
                      >
                        Join Cluster
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
