import { useState, useEffect } from "react";

import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { reactToComment, getCommentReaction } from "@/lib/api";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CommentNodeComment {
  id: string;
  author: string;
  timeAgo: string;
  content: string;
  likes: number;
  replies?: CommentNodeComment[];
}

interface CommentNodeProps {
  comment: CommentNodeComment;
  depth?: number;
  onReply?: (parentMid: string, content: string) => Promise<void>;
  replyingToMid?: string | null;
}

const CommentNode = ({ comment, depth = 0, onReply, replyingToMid = null }: CommentNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes);
  const [liking, setLiking] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const isReplying = replyingToMid === comment.id;
  const { uid, token } = useAuth();
  const { toast } = useToast();

  // Restore like state from server on mount
  useEffect(() => {
    if (!token || !comment.id) return;
    getCommentReaction(comment.id)
      .then((data) => {
        if (data.reaction_type === "LIKE") setLiked(true);
      })
      .catch(() => {}); // silently ignore — network may not be available
  }, [comment.id, token]);

  const handleLike = async () => {
    if (liking) return;

    if (!token || !uid) {
      toast({ title: "Not logged in", description: "Please log in to like comments.", variant: "destructive" });
      return;
    }

    // Optimistic update
    const wasLiked = liked;
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      setLiking(true);
      const result = await reactToComment(comment.id, uid, "LIKE");
      // Update with authoritative count from server
      setLikesCount(result.likes);
    } catch (err: any) {
      // Revert on failure
      setLiked(wasLiked);
      setLikesCount(comment.likes);
      toast({ title: "Failed to like", description: err.message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  };

  const handleReplySubmit = async () => {
    const content = replyText.trim();
    if (!content || !onReply) return;
    await onReply(comment.id, content);
    setReplyText("");
    setShowReplyInput(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className={`${depth > 0 ? "ml-6 pl-4 border-l-2 border-border" : ""}`}
    >
      <div className="py-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              {comment.author[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{comment.author}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{comment.timeAgo}</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  liked ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="tabular-nums">{likesCount}</span>
              </button>
              <button
                onClick={() => setShowReplyInput((prev) => !prev)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {expanded ? "Collapse" : `Show ${comment.replies.length} repl${comment.replies.length === 1 ? "y" : "ies"}`}
                </button>
              )}
            </div>

            {showReplyInput && (
              <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full min-h-[64px] resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setShowReplyInput(false);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isReplying || !replyText.trim()}
                    className="h-8 text-xs"
                    onClick={handleReplySubmit}
                  >
                    {isReplying ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && comment.replies?.map((reply) => (
          <CommentNode
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            onReply={onReply}
            replyingToMid={replyingToMid}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default CommentNode;
