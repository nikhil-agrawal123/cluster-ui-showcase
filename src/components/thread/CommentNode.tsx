import { useState } from "react";
import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Comment {
  id: string;
  author: string;
  timeAgo: string;
  content: string;
  likes: number;
  replies?: Comment[];
}

const CommentNode = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const [liked, setLiked] = useState(false);

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
                onClick={() => setLiked(!liked)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  liked ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="tabular-nums">{liked ? comment.likes + 1 : comment.likes}</span>
              </button>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {expanded ? "Collapse" : "Expand"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && comment.replies?.map((reply) => (
          <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default CommentNode;
