import { useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { reactToPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface VoteControlProps {
  count: number;
  vertical?: boolean;
  postId?: string;
}

const VoteControl = ({ count, vertical = true, postId }: VoteControlProps) => {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const { uid, token } = useAuth();

  const storageKey = useMemo(() => {
    if (!postId) return null;
    const voter = uid ?? "anon";
    return `cluster:post-vote:${voter}:${postId}`;
  }, [postId, uid]);

  useEffect(() => {
    if (!storageKey) {
      setVoted(null);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    if (saved === "up" || saved === "down") {
      setVoted(saved);
      return;
    }
    setVoted(null);
  }, [storageKey]);

  const votes = count + (voted === "up" ? 1 : voted === "down" ? -1 : 0);

  const handleVote = async (direction: "up" | "down") => {
    const nextVote = voted === direction ? null : direction;
    setVoted(nextVote);

    if (storageKey) {
      if (nextVote) {
        localStorage.setItem(storageKey, nextVote);
      } else {
        localStorage.removeItem(storageKey);
      }
    }

    // Persist to backend for selected reactions.
    // Un-vote API is not available yet, so removing a vote is UI-local for now.
    if (nextVote && postId && uid && token) {
      try {
        await reactToPost(
          postId,
          uid,
          nextVote === "up" ? "LIKE" : "DISLIKE"
        );
      } catch (err) {
        console.error("Failed to save reaction:", err);
      }
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className={`flex ${vertical ? "flex-col" : "flex-row"} items-center gap-0.5`}>
      <button
        onClick={(e) => { e.stopPropagation(); handleVote("up"); }}
        className={`p-1 rounded transition-colors ${
          voted === "up" ? "text-accent" : "text-muted-foreground hover:text-accent"
        }`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={votes}
          initial={{ y: voted === "up" ? 10 : -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: voted === "up" ? -10 : 10, opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          className={`text-sm font-semibold tabular-nums ${
            voted === "up" ? "text-accent" : voted === "down" ? "text-destructive" : "text-foreground"
          }`}
        >
          {formatCount(votes)}
        </motion.span>
      </AnimatePresence>
      <button
        onClick={(e) => { e.stopPropagation(); handleVote("down"); }}
        className={`p-1 rounded transition-colors ${
          voted === "down" ? "text-destructive" : "text-muted-foreground hover:text-muted-foreground/70"
        }`}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
};

export default VoteControl;
