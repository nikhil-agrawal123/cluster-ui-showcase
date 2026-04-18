import { useEffect, useState, useRef } from "react";
import { ChevronUp, ChevronDown, SmilePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchMyPostReaction,
  fetchPostReactionStats,
  reactToPost,
  removeMyPostReaction,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface VoteControlProps {
  count: number;
  vertical?: boolean;
  postId?: string;
}

type ReactionKind = "LIKE" | "DISLIKE" | "LOVE" | "LAUGH" | "SAD" | "WOW" | "ANGRY" | null;

const EMOJI_MAP: Record<string, string> = {
  LOVE: "❤️",
  LAUGH: "😂",
  SAD: "😢",
  WOW: "😲",
  ANGRY: "😡",
};

const VoteControl = ({ count, vertical = false, postId }: VoteControlProps) => {
  const [votes, setVotes] = useState(count);
  const [mine, setMine] = useState<ReactionKind>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { uid, token } = useAuth();

  useEffect(() => {
    setVotes(count);
  }, [count]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    if (isEmojiPickerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEmojiPickerOpen]);

  useEffect(() => {
    if (!postId) return;

    let mounted = true;

    const load = async () => {
      try {
        const [st, rx] = await Promise.all([
          fetchPostReactionStats(postId),
          token ? fetchMyPostReaction(postId).catch(() => ({ reaction: null })) : Promise.resolve({ reaction: null }),
        ]);

        if (!mounted) return;

        const m: Record<string, number> = {};
        let l = 0, d = 0;
        for (const r of st) {
          const k = r.reaction_type?.split(".").pop() ?? r.reaction_type;
          m[k] = r.count;
          if (k === "LIKE") l = r.count;
          if (k === "DISLIKE") d = r.count;
        }
        
        setStats(m);
        // Only override votes if we actually got stats, otherwise keep initial count
        if (st.length > 0 || Object.keys(m).length === 0) setVotes(l - d);
        setMine((rx.reaction as ReactionKind) ?? null);
      } catch (err) {
        // quiet fail on background poll
      }
    };

    load(); // initial load
    const iv = setInterval(load, 5000); // 5 sec realtime poll

    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [postId, token]);

  const refreshFromServer = async (pid: string) => {
    try {
      const [rx, st] = await Promise.all([
        token ? fetchMyPostReaction(pid) : Promise.resolve({ reaction: null }), 
        fetchPostReactionStats(pid)
      ]);
      setMine((rx.reaction as ReactionKind) ?? null);
      const m: Record<string, number> = {};
      let l = 0, d = 0;
      for (const r of st) {
        const k = r.reaction_type?.split(".").pop() ?? r.reaction_type;
        m[k] = r.count;
        if (k === "LIKE") l = r.count;
        if (k === "DISLIKE") d = r.count;
      }
      setStats(m);
      setVotes(l - d);
    } catch {}
  };

  const applyReaction = async (target: ReactionKind) => {
    if (isSubmittingVote || !postId || !uid || !token) return;
    setIsSubmittingVote(true);
    setIsEmojiPickerOpen(false);
    try {
      if (mine === target) {
        const res = await removeMyPostReaction(postId);
        setMine(null);
        setVotes(res.likes - res.dislikes);
        await refreshFromServer(postId);
        return;
      }
      const res = await reactToPost(postId, uid, target!);
      setMine(target);
      if (typeof res.likes === "number" && typeof res.dislikes === "number") {
        setVotes(res.likes - res.dislikes);
      }
      await refreshFromServer(postId);
    } catch (err) {
      console.error("Failed to save reaction:", err);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const formatCount = (x: number) => {
    if (x >= 1000) return `${(x / 1000).toFixed(1)}k`;
    return x.toString();
  };

  // Group generic stats
  const genericReactions = Object.entries(stats).filter(([k, v]) => v > 0 && k !== "LIKE" && k !== "DISLIKE");

  return (
    <div className={`flex ${vertical ? "flex-col items-start gap-2" : "items-center gap-1.5"} flex-wrap relative`}>
      {/* Upvotes/Downvotes cluster */}
      <div className={`flex items-center gap-1 bg-muted/60 px-1.5 py-1 rounded-full border border-border/50`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            applyReaction("LIKE");
          }}
          disabled={isSubmittingVote}
          className={`p-1 rounded-full transition-colors ${
            mine === "LIKE" ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-muted"
          }`}
          title="Upvote"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={votes}
            initial={{ y: mine === "LIKE" ? 5 : -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: mine === "LIKE" ? -5 : 5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`text-[13px] font-semibold tabular-nums min-w-[20px] text-center ${
              mine === "LIKE" ? "text-accent" : mine === "DISLIKE" ? "text-destructive" : "text-foreground"
            }`}
          >
            {formatCount(votes)}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            applyReaction("DISLIKE");
          }}
          disabled={isSubmittingVote}
          className={`p-1 rounded-full transition-colors ${
            mine === "DISLIKE" ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive/80 hover:bg-muted"
          }`}
          title="Downvote"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Emoji Reactions Trigger & Display */}
      <div className="flex items-center gap-1.5" ref={pickerRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEmojiPickerOpen(!isEmojiPickerOpen);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            isEmojiPickerOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          title="React"
        >
          <SmilePlus className="h-4 w-4" />
        </button>

        {/* Existing active emoji reactions */}
        {genericReactions.length > 0 && (
          <div className="flex -space-x-1 pl-1 text-[13px]">
            {genericReactions.map(([k, cnt], i) => (
              <span
                key={k}
                className={`relative z-${10 - i} flex items-center justify-center h-6 px-1.5 bg-background border border-border/50 rounded-full shadow-sm text-[12px] bg-muted/20 ${mine === k ? "border-amber-500/50 bg-amber-500/10" : ""}`}
                title={`${cnt} ${k.toLowerCase()}s`}
                onClick={(e) => {
                  e.stopPropagation();
                  applyReaction(k as ReactionKind);
                }}
              >
                {EMOJI_MAP[k] || "✨"}
                <span className="ml-1 text-[10px] text-muted-foreground font-semibold tabular-nums">
                  {cnt}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Floating Emoji Picker */}
        <AnimatePresence>
          {isEmojiPickerOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 bottom-full mb-2 z-50 flex items-center gap-1 p-2 bg-popover border border-border rounded-full shadow-lg"
            >
              {Object.entries(EMOJI_MAP).map(([k, emoji]) => (
                <button
                  key={k}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyReaction(k as ReactionKind);
                  }}
                  className={`relative p-1.5 text-xl rounded-full transition-transform hover:scale-125 hover:bg-muted ${
                    mine === k ? "bg-accent/20 scale-110" : ""
                  }`}
                  title={k}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoteControl;
