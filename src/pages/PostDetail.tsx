import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, UserPlus, UserCheck, Pencil, Hash, Share2, AppWindow } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import VoteControl from "@/components/feed/VoteControl";
import CommentNode, { type CommentNodeComment } from "@/components/thread/CommentNode";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import CreateMenu from "@/components/feed/CreatePostBar";
import {
  createComment,
  fetchCommentsForPost,
  fetchPostById,
  getClusterDetail,
  getUserProfile,
  followUser,
  unfollowUser,
  checkFollowStatus,
  type CommentResponse,
  type PostResponse,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ThreadComment = CommentNodeComment;

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const timeAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const PostDetail = () => {
  const { id } = useParams();
  const { uid, token } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [apiPost, setApiPost] = useState<PostResponse | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [apiComments, setApiComments] = useState<CommentResponse[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [replyingToMid, setReplyingToMid] = useState<string | null>(null);
  const [clusterName, setClusterName] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [commentUserNames, setCommentUserNames] = useState<Record<string, string>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<{ pid: string; content: string; tags?: string } | null>(null);
  const [clusterMemberCount, setClusterMemberCount] = useState<number | null>(null);
  const [windowOrigin, setWindowOrigin] = useState<any | null>(null);
  const [megaphoneInfo, setMegaphoneInfo] = useState<any | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  const isApiPost = Boolean(id && isUuid(id));

  const displayPost = useMemo(() => {
    if (apiPost) {
      const content = apiPost.content ?? "(no content)";
      return {
        id: apiPost.pid,
        cid: apiPost.cid,
        community: clusterName ?? apiPost.cid.slice(0, 8),
        author: authorName ?? apiPost.uid.slice(0, 8),
        timeAgo: timeAgo(apiPost.created_at),
        title: content.length > 100 ? `${content.slice(0, 100)}...` : content,
        excerpt: content,
        votes: (apiPost.likes ?? 0) - (apiPost.dislikes ?? 0),
        comments: apiComments.length,
      };
    }
    return {
      id: id ?? "",
      cid: "",
      community: "Unknown",
      author: "Unknown",
      timeAgo: "",
      title: "Post not found",
      excerpt: "This post could not be loaded.",
      votes: 0,
      comments: 0,
    };
  }, [apiPost, apiComments.length, clusterName, authorName, id]);

  const loadPost = async () => {
    if (!id || !isUuid(id)) {
      setApiPost(null);
      return;
    }

    setLoadingPost(true);
    try {
      const row = await fetchPostById(id);
      setApiPost(row);
      // Resolve cluster name
      try {
        const cluster = await getClusterDetail(row.cid);
        setClusterName(cluster.name);
      } catch {
        setClusterName(row.cid.slice(0, 8));
      }
      // Resolve author name
      try {
        const user = await getUserProfile(row.uid);
        setAuthorName(user.name);
      } catch {
        setAuthorName(row.uid.slice(0, 8));
      }
    } catch (err: any) {
      setApiPost(null);
      toast({ title: "Failed to load post", description: err.message, variant: "destructive" });
    } finally {
      setLoadingPost(false);
    }
  };

  // Resolve comment author names whenever comments load
  useEffect(() => {
    if (apiComments.length === 0) return;
    const uniqueUids = [...new Set(apiComments.map((c) => c.uid))];
    const nameMap: Record<string, string> = {};
    Promise.allSettled(
      uniqueUids.map(async (u) => {
        try {
          const p = await getUserProfile(u);
          nameMap[u] = p.name;
        } catch {
          nameMap[u] = u.slice(0, 8);
        }
      })
    ).then(() => setCommentUserNames((prev) => ({ ...prev, ...nameMap })));
  }, [apiComments]);

  // Load follow status when post author is known
  useEffect(() => {
    if (!token || !apiPost?.uid) return;
    checkFollowStatus(apiPost.uid)
      .then((data) => setIsFollowing(data.is_following))
      .catch(() => {});
  }, [apiPost?.uid, token]);

  const handleFollow = async () => {
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in to follow users.", variant: "destructive" });
      return;
    }
    if (!apiPost?.uid) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(apiPost.uid);
        setIsFollowing(false);
        toast({ title: "Unfollowed", description: `You unfollowed ${authorName ?? "this user"}.` });
      } else {
        await followUser(apiPost.uid);
        setIsFollowing(true);
        toast({ title: "Following!", description: `You are now following ${authorName ?? "this user"}.` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id || !isUuid(id)) {
      setApiComments([]);
      return;
    }

    setLoadingComments(true);
    try {
      const rows = await fetchCommentsForPost(id);
      setApiComments(rows);
    } catch (err: any) {
      toast({ title: "Failed to load comments", description: err.message, variant: "destructive" });
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  useEffect(() => {
    loadComments();
  }, [id]);

  // Sync megaphone and window info from apiPost metadata
  useEffect(() => {
    if (!apiPost) {
      setMegaphoneInfo(null);
      setWindowOrigin(null);
      setCountdown(null);
      return;
    }

    // Set Window info from embedded data
    if (apiPost.window_origin) {
      setWindowOrigin(apiPost.window_origin);
    } else {
      setWindowOrigin(null);
    }

    // Set Megaphone info and start countdown from embedded data
    if (apiPost.megaphone) {
      const info = apiPost.megaphone;
      setMegaphoneInfo(info);

      const tick = () => {
        const now = Date.now();
        const end = new Date(info.end_time).getTime();
        const diff = end - now;
        if (diff <= 0) {
          setCountdown("Announcement Passed");
          return;
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      };
      tick();
      const iv = setInterval(tick, 1000);
      return () => clearInterval(iv);
    } else {
      setMegaphoneInfo(null);
      setCountdown(null);
    }
  }, [apiPost]);

  const threadedComments = useMemo<ThreadComment[]>(() => {
    if (!id || !isUuid(id)) {
      return [];
    }

    const nodes = new Map<string, ThreadComment>();
    const roots: ThreadComment[] = [];

    for (const c of apiComments) {
      nodes.set(c.mid, {
        id: c.mid,
        author: commentUserNames[c.uid] ?? `u/${c.uid.slice(0, 8)}`,
        timeAgo: timeAgo(c.created_at),
        content: c.content,
        likes: c.likes,
        replies: [],
      });
    }

    for (const c of apiComments) {
      const node = nodes.get(c.mid);
      if (!node) continue;

      if (c.parent_mid) {
        const parent = nodes.get(c.parent_mid);
        if (parent) {
          parent.replies = [...(parent.replies ?? []), node];
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [apiComments, id]);

  const handlePostComment = async () => {
    if (!id || !isUuid(id)) {
      toast({ title: "Demo post", description: "Commenting is available for backend posts only.", variant: "destructive" });
      return;
    }

    if (!token || !uid) {
      toast({ title: "Not logged in", description: "Please log in to post a comment.", variant: "destructive" });
      return;
    }

    const content = commentText.trim();
    if (!content) {
      toast({ title: "Empty comment", description: "Write something before posting.", variant: "destructive" });
      return;
    }

    try {
      setPostingComment(true);
      await createComment({ uid, pid: id, content });
      setCommentText("");
      await Promise.all([loadComments(), loadPost()]);
      toast({ title: "Comment posted", description: "Your comment is now live." });
    } catch (err: any) {
      toast({ title: "Failed to post", description: err.message, variant: "destructive" });
    } finally {
      setPostingComment(false);
    }
  };

  const handleReplyToComment = async (parentMid: string, content: string) => {
    if (!id || !isUuid(id)) {
      toast({ title: "Demo post", description: "Replying is available for backend posts only.", variant: "destructive" });
      return;
    }

    if (!token || !uid) {
      toast({ title: "Not logged in", description: "Please log in to reply.", variant: "destructive" });
      return;
    }

    const clean = content.trim();
    if (!clean) {
      toast({ title: "Empty reply", description: "Write something before posting.", variant: "destructive" });
      return;
    }

    try {
      setReplyingToMid(parentMid);
      await createComment({ uid, pid: id, parent_mid: parentMid, content: clean });
      await Promise.all([loadComments(), loadPost()]);
      toast({ title: "Reply posted", description: "Your reply is now live." });
    } catch (err: any) {
      toast({ title: "Failed to reply", description: err.message, variant: "destructive" });
    } finally {
      setReplyingToMid(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/feed" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span>/</span>
          <Link
            to={displayPost.cid ? `/cluster/${displayPost.cid}` : "/explore"}
            className="hover:text-foreground"
          >
            c/{displayPost.community}
          </Link>
          <span>/</span>
          <span className="text-foreground">Post</span>
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance mb-4">
              {displayPost.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-sm font-semibold">{displayPost.author[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {apiPost?.uid ? (
                    <Link to={`/user/${apiPost.uid}`} className="hover:text-accent transition-colors">
                      u/{displayPost.author}
                    </Link>
                  ) : `u/${displayPost.author}`}
                </p>
                <p className="text-xs text-muted-foreground">{displayPost.timeAgo}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {/* Edit button — only for post author */}
                {apiPost && String(apiPost.uid) === String(uid) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground border border-border"
                    onClick={() => setEditTarget({ pid: apiPost.pid, content: apiPost.content ?? "", tags: apiPost.tags ?? undefined })}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
                {/* Follow button */}
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className={`rounded-full h-8 px-4 text-xs gap-1.5 ${
                    isFollowing
                      ? "border-accent text-accent hover:bg-accent/10"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}
                  onClick={handleFollow}
                  disabled={followLoading || !token || (apiPost ? String(apiPost.uid) === String(uid) : false)}
                >
                  {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            </div>

            {/* Window: originally posted in banner */}
            {windowOrigin && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <span className="text-amber-500 font-semibold shrink-0">🪟 Originally from</span>
                <Link
                  to={`/cluster/${windowOrigin.origin_cid}`}
                  className="text-accent font-semibold hover:underline truncate"
                >
                  c/{windowOrigin.cluster_name ?? windowOrigin.origin_cid?.slice(0, 8)}
                </Link>
                <Link
                  to={`/post/${windowOrigin.origin_pid}`}
                  className="ml-auto text-xs text-muted-foreground hover:text-accent shrink-0"
                >
                  View original →
                </Link>
              </div>
            )}

            {/* Megaphone countdown banner */}
            {megaphoneInfo && (
              <div className={`mb-4 rounded-lg border px-3 py-2 ${countdown === "Announcement Passed" ? "bg-muted/60 border-border" : "bg-amber-500/10 border-amber-500/30 shadow-sm"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📣</span>
                    <div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none mb-1">
                        {megaphoneInfo.type}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-none">
                        Active until {new Date(megaphoneInfo.end_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-0.5">Time Left</p>
                    <div className={`text-lg font-mono font-bold tabular-nums leading-none ${countdown === "Announcement Passed" ? "text-muted-foreground text-sm" : "text-amber-500"}`}>
                      {countdown ?? "…"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="prose prose-slate max-w-none text-foreground/90 leading-relaxed space-y-4 mb-6">
              {loadingPost && isApiPost && <p>Loading post...</p>}
              {!loadingPost && (
                <p>{displayPost.excerpt || "This post has no body content yet."}</p>
              )}
            </div>

            {/* Engagement */}
            <div className="flex items-center gap-3 py-4 border-t border-border">
              <div className="flex items-center gap-1">
                <VoteControl count={displayPost.votes} vertical={false} postId={displayPost.id} />
              </div>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full bg-muted">
                <MessageSquare className="h-4 w-4" />
                {displayPost.comments} Comments
              </button>
            </div>

            {/* Discussion */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                Discussion
              </h2>

              <div className="flex gap-3 mb-6">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-accent/10 text-accent text-xs">AR</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent min-h-[80px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      disabled={postingComment}
                      onClick={handlePostComment}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs px-4"
                    >
                      {postingComment ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {loadingComments && <p className="text-sm text-muted-foreground">Loading comments...</p>}
                {!loadingComments && threadedComments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No comments yet. Start the discussion.</p>
                )}
                {threadedComments.map((comment) => (
                  <CommentNode
                    key={comment.id}
                    comment={comment}
                    onReply={handleReplyToComment}
                    replyingToMid={replyingToMid}
                  />
                ))}
              </div>
            </div>
          </motion.article>

          {/* Right rail */}
          <aside className="w-64 shrink-0 hidden lg:block space-y-4">
            {/* Window origin card — prioritized at the top */}
            {windowOrigin && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border-2 border-amber-500/30 rounded-xl p-4 shadow-lg ring-1 ring-amber-500/10"
              >
                <h3 className="text-[10px] font-extrabold text-amber-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5 bg-amber-500/5 py-1 px-2 rounded-md w-fit">
                  <span className="text-sm">🪟</span> ORIGIN CONTEXT
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Source Cluster</p>
                    <Link
                      to={`/cluster/${windowOrigin.origin_cid}`}
                      className="text-sm font-bold text-foreground hover:text-accent transition-colors block leading-tight flex items-center gap-1"
                    >
                      <Hash className="h-3 w-3 text-amber-500" />
                      c/{windowOrigin.cluster_name ?? windowOrigin.origin_cid?.slice(0, 8)}
                    </Link>
                  </div>
                  
                  {windowOrigin.content && (
                    <div className="relative">
                      <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed italic border-l-2 border-amber-500/30 pl-3 py-1 bg-muted/30 rounded-r-lg">
                        "{windowOrigin.content}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-2 border-t border-border/50">
                    {windowOrigin.author_uid && (
                      <div className="flex flex-col">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-0.5">Original Author</p>
                        <Link
                          to={`/user/${windowOrigin.author_uid}`}
                          className="text-[10px] font-bold text-foreground/80 hover:text-accent flex items-center gap-1"
                        >
                          u/{windowOrigin.author_name ?? "Unknown"}
                        </Link>
                      </div>
                    )}
                    <Link
                      to={`/post/${windowOrigin.origin_pid}`}
                      className="text-[10px] font-black text-white bg-accent hover:bg-accent/90 px-3 py-2 rounded-lg text-center transition-all shadow-sm active:scale-95"
                    >
                      JUMP TO SOURCE →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Megaphone promotion card */}
            {megaphoneInfo && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border ${countdown === "Announcement Passed" ? "bg-muted/60 border-border" : "bg-amber-500/10 border-amber-500/30 shadow-surface"}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📣</span>
                  <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                    Megaphone
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-background/50 rounded-lg p-2 border border-border/50 flex flex-col items-end">
                    <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-tighter font-bold">Time Remaining</p>
                    <p className={`text-lg font-mono font-bold tabular-nums leading-none ${countdown === "Announcement Passed" ? "text-muted-foreground text-sm" : "text-amber-500"}`}>
                      {countdown ?? "…"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                    <span>Type: {megaphoneInfo.type}</span>
                    <span className="text-amber-500/80">Active</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cluster stats card */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-surface">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cluster Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground font-medium">Members</span>
                  <span className="text-sm font-semibold">{clusterMemberCount ?? "..."}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  View Community
                </Button>
              </div>
            </div>

            {/* Cluster info */}
            {clusterName && displayPost.cid && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="bg-card rounded-xl shadow-surface p-4"
              >
                <h3 className="text-sm font-semibold text-foreground mb-2">About this Cluster</h3>
                <Link to={`/cluster/${displayPost.cid}`} className="text-sm text-accent hover:underline font-medium block mb-2">
                  c/{clusterName}
                </Link>
                <Link to={`/cluster/${displayPost.cid}`}>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs h-8 mt-1">
                    Visit Cluster
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* Post tags */}
            {(apiPost?.tags || displayPost.excerpt) && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(apiPost?.tags ?? "").split(",").filter(Boolean).map((tag) => (
                    <span key={tag} className="text-xs text-accent font-medium bg-accent/10 px-2.5 py-1 rounded-md">
                      {tag.trim()}
                    </span>
                  ))}
                  {!(apiPost?.tags) && (
                    <span className="text-xs text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
            )}

            {/* Author card */}
            {authorName && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="bg-card rounded-xl shadow-surface p-4"
              >
                <h3 className="text-sm font-semibold text-foreground mb-3">Author</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                      {authorName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link to={apiPost ? `/user/${apiPost.uid}` : "#"} className="text-sm font-semibold text-foreground hover:text-accent truncate block">
                      {authorName}
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
