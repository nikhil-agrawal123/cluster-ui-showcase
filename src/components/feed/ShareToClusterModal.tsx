import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchMyBookmarkedClusters, sharePostToCluster, BookmarkedCluster } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Share2, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShareToClusterModalProps {
  pid: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareToClusterModal({ pid, isOpen, onClose, onSuccess }: ShareToClusterModalProps) {
  const [clusters, setClusters] = useState<BookmarkedCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadClusters();
    }
  }, [isOpen]);

  async function loadClusters() {
    setLoading(true);
    try {
      const data = await fetchMyBookmarkedClusters();
      setClusters(data);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load your clusters.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleShare(cid: string, clusterName: string) {
    setSharing(true);
    try {
      await sharePostToCluster(pid, cid);
      toast({ title: "Shared!", description: `Post shared to c/${clusterName}.` });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSharing(false);
    }
  }

  const filteredClusters = clusters.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.category && c.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 gap-0 border-amber-500/20 shadow-2xl">
        <DialogHeader className="p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-b border-amber-500/10">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Share2 className="h-5 w-5 text-amber-500" />
            Share to Cluster
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Share this post as a "Window" into one of your bookmarked clusters.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your clusters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-amber-500/10 focus-visible:ring-amber-500/50"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border border-amber-500/10 bg-muted/10">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500/50" />
              </div>
            ) : filteredClusters.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredClusters.map((cluster) => (
                  <button
                    key={cluster.cid}
                    onClick={() => handleShare(cluster.cid, cluster.name)}
                    disabled={sharing}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-amber-500/10 transition-colors group border border-transparent hover:border-amber-500/20 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <Hash className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none mb-1">c/{cluster.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{cluster.category || "General"}</p>
                      </div>
                    </div>
                    <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">No clusters found.</p>
                <p className="text-xs text-muted-foreground/60">Search for another name or join more clusters.</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/50">
          <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
