import { useState, useEffect } from "react";
import { Send, Hash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { createPost, fetchClusters, type ClusterBasic } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CreatePostBarProps {
  onPostCreated?: () => void;
}

const CreatePostBar = ({ onPostCreated }: CreatePostBarProps) => {
  const { token, uid, profile } = useAuth();
  const { toast } = useToast();

  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [clusters, setClusters] = useState<ClusterBasic[]>([]);
  const [selectedCid, setSelectedCid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Load clusters for the dropdown
  useEffect(() => {
    fetchClusters(0, 30)
      .then((list) => {
        setClusters(list);
        if (list.length > 0) setSelectedCid(list[0].cid);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!token || !uid) {
      toast({ title: "Not logged in", description: "Please log in to create a post.", variant: "destructive" });
      return;
    }
    if (!content.trim()) return;
    if (!selectedCid) {
      toast({ title: "Select a cluster", description: "Pick a cluster to post in.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createPost({
        uid,
        cid: selectedCid,
        content: content.trim(),
        tags: tags.trim() || undefined,
      });
      toast({ title: "Post created!", description: "Your post is now live." });
      setContent("");
      setTags("");
      setExpanded(false);
      onPostCreated?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not create post", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="bg-card rounded-xl shadow-surface p-3 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border-2 border-accent/20">
          <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder={token ? "What's happening in your cluster?" : "Log in to post…"}
            disabled={!token}
            className="w-full bg-muted rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!token || !content.trim() || submitting}
          className="p-2 text-muted-foreground hover:text-accent transition-colors disabled:opacity-30"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {expanded && token && (
        <div className="flex items-center gap-3 pl-12">
          {/* Cluster selector */}
          <select
            value={selectedCid}
            onChange={(e) => setSelectedCid(e.target.value)}
            className="bg-muted text-sm rounded-lg px-2 py-1.5 border-0 focus:ring-1 focus:ring-accent text-foreground max-w-[180px]"
          >
            {clusters.map((c) => (
              <option key={c.cid} value={c.cid}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tags input */}
          <div className="relative flex-1">
            <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tags (optional)"
              className="w-full bg-muted rounded-lg pl-7 pr-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostBar;
