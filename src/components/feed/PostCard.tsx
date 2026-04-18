import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import VoteControl from "./VoteControl";
import { bookmarkCluster } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ShareToClusterModal } from "./ShareToClusterModal";
import {
  MessageSquare,
  Share2,
  Bookmark,
  BookmarkCheck,
  Megaphone,
  AppWindow,
  BarChart3,
  CalendarDays,
} from "lucide-react";

export interface PostData {
  id: string;
  cid: string;       // actual cluster UUID — used for routing
  uid?: string;      // author UID — used for profile link
  /** When set and matches post.uid, shows an Edit link to the post */
  viewerUid?: string | null;
  community: string; // display name of the cluster
  author: string;    // display name of the post author
  timeAgo: string;
  title: string;
  excerpt?: string;
  image?: string;
  votes: number;
  comments: number;
  type?: string;     
  /** Embedded megaphone details if active */
  megaphone?: {
    start_time: string;
    end_time: string;
    type: string;
    is_active: boolean;
    subscriber_count: number;
  };
  /** Embedded window origin details */
  window_origin?: {
    origin_pid: string;
    origin_cid: string;
    cluster_name: string | null;
    author_name: string | null;
    content: string | null;
  };
}

const CommentButton = ({ postId, commentCount, light = false }: { postId: string; commentCount: number; light?: boolean }) => (
  <Link to={`/post/${postId}`}>
    <button className={`flex items-center gap-1.5 text-xs transition-colors py-1 px-2 rounded-md ${
      light ? "text-amber-700/70 hover:text-amber-900 hover:bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`}>
      <MessageSquare className="h-4 w-4" />
      <span>{commentCount} {commentCount === 1 ? "Comment" : "Comments"}</span>
    </button>
  </Link>
);

const PostCard = ({ post }: { post: PostData }) => {
  const showAuthorEdit = post.viewerUid && post.uid && String(post.viewerUid) === String(post.uid);
  const { token } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Post link copied to clipboard." });
  };

  const handleShare = async () => {
    if (!token) {
      handleCopyLink(); // Fallback for guests
      return;
    }
    // For authenticated users, we prioritize "Share to Cluster" as requested to build the window graph
    setIsShareModalOpen(true);
  };

  const handleSave = async (isAnnouncement = false) => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to save posts.", variant: "destructive" });
      return;
    }
    try {
      if (saved) {
        toast({ title: "Already saved", description: "This cluster is already bookmarked." });
        return;
      }
      await bookmarkCluster(post.cid);
      setSaved(true);
      toast({ title: "Saved!", description: `Cluster "${post.community}" bookmarked.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isMegaphone = !!post.megaphone;
  const isWindow = post.type === "WINDOW" || !!post.window_origin;
  const megType = post.megaphone?.type;
  const isPollMeg = megType === "POLL";
  const isEventMeg = megType === "EVENT";

  if (isMegaphone) {
    const accentBar = isPollMeg ? "bg-violet-500" : isEventMeg ? "bg-sky-500" : "bg-amber-500";
    const cardShell = isPollMeg
      ? "from-violet-500/15 via-violet-500/5 to-transparent border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.12)]"
      : isEventMeg
        ? "from-sky-500/15 via-sky-500/5 to-transparent border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.12)]"
        : "from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]";
    const iconBox = isPollMeg
      ? "bg-violet-500/20"
      : isEventMeg
        ? "bg-sky-500/20"
        : "bg-amber-500/20";
    const KindIcon = isPollMeg ? BarChart3 : isEventMeg ? CalendarDays : Megaphone;
    const iconClass = isPollMeg ? "text-violet-500" : isEventMeg ? "text-sky-600" : "text-amber-500";
    const headerMuted = isPollMeg
      ? "text-violet-600/60"
      : isEventMeg
        ? "text-sky-700/70"
        : "text-amber-600/60";
    const clusterLink = isPollMeg ? "text-violet-600" : isEventMeg ? "text-sky-700" : "text-amber-600";

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -1 }}
          className={`group relative overflow-hidden bg-gradient-to-br ${cardShell} border rounded-2xl transition-all duration-300`}
        >
          <div className={`absolute top-0 left-0 w-1 h-full ${accentBar}`} />
          <div className="p-5 flex gap-4">
            <div className={`w-12 h-12 rounded-xl ${iconBox} flex items-center justify-center shrink-0 shadow-inner`}>
              <KindIcon className={`h-6 w-6 ${iconClass} ${!isPollMeg && !isEventMeg ? "animate-pulse" : ""}`} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <header className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/cluster/${post.cid}`}
                    className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${clusterLink}`}
                  >
                    c/{post.community}
                  </Link>
                  <span className={`${isPollMeg ? "text-violet-500/30" : isEventMeg ? "text-sky-500/30" : "text-amber-500/30"} text-xs`}>
                    ·
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${headerMuted}`}>
                    {post.megaphone?.type === "POLL"
                      ? "Poll"
                      : post.megaphone?.type === "EVENT"
                        ? "Event"
                        : "Announcement"}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-medium tabular-nums px-2 py-0.5 rounded-full border ${
                    isPollMeg
                      ? "text-violet-800/70 bg-violet-500/10 border-violet-500/15"
                      : isEventMeg
                        ? "text-sky-900/70 bg-sky-500/10 border-sky-500/15"
                        : "text-amber-700/50 bg-amber-500/5 border-amber-500/10"
                  }`}
                >
                  {post.timeAgo}
                </span>
              </header>
              
              <Link to={`/post/${post.id}`}>
                <h3
                  className={`text-lg font-bold leading-tight text-foreground transition-colors mb-2 ${
                    isPollMeg
                      ? "hover:text-violet-600"
                      : isEventMeg
                        ? "hover:text-sky-700"
                        : "hover:text-amber-600"
                  }`}
                >
                  {post.title}
                </h3>
              </Link>
              
              {post.excerpt && (
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2 mb-4">
                  {post.excerpt}
                </p>
              )}

              <footer
                className={`flex items-center gap-2 pt-2 border-t ${
                  isPollMeg ? "border-violet-500/15" : isEventMeg ? "border-sky-500/15" : "border-amber-500/10"
                }`}
              >
                <CommentButton postId={post.id} commentCount={post.comments} light />
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs text-amber-700/70 hover:text-amber-900 transition-colors py-1 px-2 rounded-md hover:bg-amber-500/10"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => handleSave(true)}
                  className={`flex items-center gap-1.5 text-xs transition-colors py-1 px-2 rounded-md hover:bg-amber-500/10 ${
                    saved ? "text-amber-600 font-bold" : "text-amber-700/70 hover:text-amber-900"
                  }`}
                >
                  {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  <span>{saved ? "Saved" : "Save Cluster"}</span>
                </button>
                {showAuthorEdit && (
                  <Link
                    to={`/post/${post.id}`}
                    className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 py-1 px-2 rounded-md hover:bg-amber-500/10"
                  >
                    Edit
                  </Link>
                )}
              </footer>
            </div>
          </div>
        </motion.div>

        <ShareToClusterModal
          pid={post.id}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className={`group bg-card rounded-xl shadow-surface hover:shadow-surface-hover transition-shadow duration-200 ${
        isWindow ? "ring-1 ring-amber-500/10 border-l-4 border-amber-500/40" : ""
      }`}
    >
      <div className="p-4">
        <div className="w-full space-y-2">
          <header className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link to={`/cluster/${post.cid}`} className="font-semibold text-accent hover:underline underline-offset-4">
              c/{post.community}
            </Link>
            <span>·</span>
            {post.uid ? (
              <Link to={`/user/${post.uid}`} className="hover:text-foreground hover:underline">
                u/{post.author}
              </Link>
            ) : (
              <span>u/{post.author}</span>
            )}
            <span>·</span>
            <span className="tabular-nums">{post.timeAgo}</span>
            {isWindow && (
              <span className="ml-1 flex items-center gap-1 text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[9px] uppercase tracking-wider">
                <AppWindow className="h-3 w-3" /> Shared Window
              </span>
            )}
          </header>
          <Link to={`/post/${post.id}`}>
            <h3 className="text-base font-semibold leading-snug text-foreground tracking-tight text-balance group-hover:text-accent transition-colors cursor-pointer">
              {post.title}
            </h3>
          </Link>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {post.excerpt}
            </p>
          )}
          {post.image && (
            <div className="mt-2 rounded-lg overflow-hidden bg-muted">
              <img src={post.image} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          <footer className="flex items-center gap-1.5 pt-2 mt-1 border-t border-border/50 flex-wrap">
            <VoteControl count={post.votes} postId={post.id} />
            <div className="w-px h-4 bg-border/60 mx-1" />
            <CommentButton postId={post.id} commentCount={post.comments} />
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button
              onClick={() => handleSave()}
              className={`flex items-center gap-1.5 text-xs transition-colors py-1 px-2 rounded-md hover:bg-muted ${
                saved ? "text-accent font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
            {showAuthorEdit && (
              <Link
                to={`/post/${post.id}`}
                className="text-xs font-semibold text-accent hover:underline py-1 px-2"
              >
                Edit
              </Link>
            )}
          </footer>
        </div>
      </div>

      <ShareToClusterModal
        pid={post.id}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </motion.div>
  );
};

export default PostCard;
