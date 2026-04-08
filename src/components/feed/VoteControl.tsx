import { useState } from "react";
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
  const [votes, setVotes] = useState(count);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const { uid, token } = useAuth();

  const handleVote = async (direction: "up" | "down") => {
    if (voted === direction) {
      setVoted(null);
      setVotes(count);
    } else {
      setVoted(direction);
      setVotes(direction === "up" ? count + 1 : count - 1);

      // Persist to backend
      if (postId && uid && token) {
        try {
          await reactToPost(
            postId,
            uid,
            direction === "up" ? "LIKE" : "DISLIKE"
          );
        } catch (err) {
          console.error("Failed to save reaction:", err);
        }
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
