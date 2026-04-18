import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  UserPlus,
  UserCheck,
  Pencil,
  Hash,
  Share2,
  AppWindow,
  Megaphone,
  BarChart3,
  CalendarDays,
} from "lucide-react";
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
  fetchMegaphoneEngagement,
  voteMegaphonePoll,
  rsvpMegaphoneEvent,
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

function megaphoneVisuals(type: string | undefined) {
  if (type === "POLL") {
    return {
      Icon: BarChart3,
      iconClass: "text-violet-500",
      cardBorder: "border-violet-500/30 bg-violet-500/[0.06]",
      titleClass: "text-violet-600",
      bannerBorder: "border-violet-500/35 bg-violet-500/10",
      bannerAccent: "text-violet-600",
    };
  }
  if (type === "EVENT") {
    return {
      Icon: CalendarDays,
      iconClass: "text-sky-600",
      cardBorder: "border-sky-500/35 bg-sky-500/[0.07]",
      titleClass: "text-sky-700",
      bannerBorder: "border-sky-500/35 bg-sky-500/10",
      bannerAccent: "text-sky-700",
    };
  }
  return {
    Icon: Megaphone,
    iconClass: "text-amber-500",
    cardBorder: "border-amber-500/25 bg-amber-500/5",
    titleClass: "text-amber-600",
    bannerBorder: "border-amber-500/30 bg-amber-500/10",
    bannerAccent: "text-amber-500",
  };
}

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
  const [windowOrigin, setWindowOrigin] = useState<any | null>(null);
  const [megaphoneInfo, setMegaphoneInfo] = useState<any | null>(null);
  const [megaphoneEngagement, setMegaphoneEngagement] = useState<any | null>(null);
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
      setClusterName(null);
      if (row.megaphone?.cluster_name) {
        setClusterName(row.megaphone.cluster_name);
      } else {
        try {
          const cluster = await getClusterDetail(row.cid);
          setClusterName(cluster.name);
        } catch {
          setClusterName(row.cid.slice(0, 8));
        }
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

  const loadComments = async (background = false) => {
    if (!id || !isUuid(id)) {
      setApiComments([]);
      return;
    }

    if (!background) setLoadingComments(true);
    try {
      const rows = await fetchCommentsForPost(id);
      setApiComments(rows);
    } catch (err: any) {
      if (!background) {
        toast({ title: "Failed to load comments", description: err.message, variant: "destructive" });
      }
    } finally {
      if (!background) setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadPost(); // initial load
    const postPoll = setInterval(() => {
      // Background poll for post updates without blinking UI
      if (id && isUuid(id)) {
        fetchPostById(id).then(row => setApiPost(prev => prev ? { ...prev, likes: row.likes, dislikes: row.dislikes } : prev)).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(postPoll);
  }, [id]);

  useEffect(() => {
    loadComments(false); // initial foreground load
    const iv = setInterval(() => loadComments(true), 5000); // 5 sec background poll
    return () => clearInterval(iv);
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

  useEffect(() => {
    if (!id || !isUuid(id) || !apiPost?.megaphone) {
      setMegaphoneEngagement(null);
      return;
    }
    let cancelled = false;
    const load = () => {
      fetchMegaphoneEngagement(id)
        .then((d) => {
          if (!cancelled) setMegaphoneEngagement(d);
        })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [id, apiPost?.megaphone]);

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

  const pollSnapshot = megaphoneEngagement?.poll ?? apiPost?.megaphone?.poll;
  const eventSnapshot = megaphoneEngagement?.event ?? apiPost?.megaphone?.event;
  const megClusterLabel =
    megaphoneEngagement?.cluster_name ?? megaphoneInfo?.cluster_name ?? clusterName ?? apiPost?.cid?.slice(0, 8);

  const handlePollVote = async (optionIdx: number) => {
    if (!id || !isUuid(id)) return;
    if (!token) {
      toast({ title: "Sign in required", description: "Log in to vote in this poll.", variant: "destructive" });
      return;
    }
    try {
      const updated = await voteMegaphonePoll(id, optionIdx);
      setMegaphoneEngagement((prev: any) => (prev ? { ...prev, poll: updated } : { poll: updated }));
    } catch (err: any) {
      toast({ title: "Vote failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRsvp = async (status: "GOING" | "MAYBE" | "NOT_GOING") => {
    if (!id || !isUuid(id)) return;
    if (!token) {
      toast({ title: "Sign in required", description: "Log in to RSVP.", variant: "destructive" });
      return;
    }
    try {
      const updated = await rsvpMegaphoneEvent(id, status);
      setMegaphoneEngagement((prev: any) => (prev ? { ...prev, event: updated } : { event: updated }));
    } catch (err: any) {
      toast({ title: "RSVP failed", description: err.message, variant: "destructive" });
    }
  };

  const megVisuals = megaphoneInfo ? megaphoneVisuals(megaphoneInfo.type) : null;
  const MegKindIcon = megVisuals?.Icon ?? Megaphone;
  const megCountdownEnded = countdown === "Announcement Passed";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/feed" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          {apiPost?.cid && (
            <>
              <span>/</span>
              <Link
                to={`/cluster/${apiPost.cid}`}
                className="hover:text-foreground font-medium text-foreground/90"
              >
                c/{megClusterLabel ?? clusterName ?? apiPost.cid.slice(0, 8)}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">
            {apiPost?.megaphone ? "Megaphone" : "Discussion"}
          </span>
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex-1 min-w-0"
          >
            {megaphoneInfo && apiPost?.cid && megVisuals && (
              <div className={`mb-5 flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 ${megVisuals.cardBorder}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 ring-1 ring-border/60">
                  <MegKindIcon className={`h-5 w-5 ${megVisuals.iconClass}`} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${megVisuals.titleClass}`}>
                    Megaphone ·{" "}
                    {megaphoneInfo.type === "POLL"
                      ? "Poll"
                      : megaphoneInfo.type === "EVENT"
                        ? "Event"
                        : "Announcement"}
                  </p>
                  <Link
                    to={`/cluster/${apiPost.cid}`}
                    className="text-sm font-semibold text-foreground hover:text-accent inline-flex items-center gap-1"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    c/{megClusterLabel}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This post is pinned in that cluster. Engagement updates live for members.
                  </p>
                </div>
              </div>
            )}

            {!megaphoneInfo && apiPost?.cid && clusterName && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Posted in</span>
                <Link
                  to={`/cluster/${apiPost.cid}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-semibold text-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  c/{clusterName}
                </Link>
              </div>
            )}

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
            {megaphoneInfo && megVisuals && (
              <div
                className={`mb-4 rounded-lg border px-3 py-2.5 ${
                  megCountdownEnded ? "bg-muted/60 border-border" : `${megVisuals.bannerBorder} shadow-sm`
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background/70 ring-1 ring-border/50 ${
                        megCountdownEnded ? "opacity-60" : ""
                      }`}
                    >
                      <MegKindIcon
                        className={`h-4 w-4 ${megCountdownEnded ? "text-muted-foreground" : megVisuals.iconClass}`}
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${
                          megCountdownEnded ? "text-muted-foreground" : megVisuals.bannerAccent
                        }`}
                      >
                        {megaphoneInfo.type === "POLL"
                          ? "Poll"
                          : megaphoneInfo.type === "EVENT"
                            ? "Event"
                            : "Announcement"}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-none">
                        Active until {new Date(megaphoneInfo.end_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-0.5">Time Left</p>
                    <div
                      className={`text-lg font-mono font-bold tabular-nums leading-none ${
                        megCountdownEnded ? "text-muted-foreground text-sm" : megVisuals.bannerAccent
                      }`}
                    >
                      {countdown ?? "…"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {megaphoneInfo?.type === "POLL" && pollSnapshot?.options?.length ? (
              <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cluster poll</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{pollSnapshot.total_votes} votes</p>
                </div>
                <div className="space-y-2">
                  {pollSnapshot.options.map((o: { idx: number; label: string; votes: number }) => {
                    const total = Math.max(0, pollSnapshot.total_votes);
                    const pct = total === 0 ? 0 : Math.round((o.votes / total) * 100);
                    const isMine = pollSnapshot.my_vote === o.idx;
                    return (
                      <button
                        key={o.idx}
                        type="button"
                        disabled={countdown === "Announcement Passed"}
                        onClick={() => handlePollVote(o.idx)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition-colors disabled:opacity-50 ${
                          isMine ? "border-amber-500 bg-amber-500/10" : "border-border hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex justify-between gap-2 text-sm mb-1">
                          <span className="break-words">{o.label}</span>
                          <span className="tabular-nums text-muted-foreground shrink-0">
                            {o.votes} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500/80 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!token && (
                  <p className="text-[11px] text-muted-foreground">Log in to vote. Results update live for everyone.</p>
                )}
              </div>
            ) : null}

            {megaphoneInfo?.type === "EVENT" && eventSnapshot ? (
              <div className="mb-6 rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.06] to-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-sky-600 shrink-0" strokeWidth={2} />
                  <p className="text-xs font-semibold text-sky-800/90 dark:text-sky-200 uppercase tracking-wider">
                    RSVP
                  </p>
                </div>
                <div className="grid gap-2 sm:gap-3 text-sm sm:grid-cols-3">
                  {eventSnapshot.starts_at && (
                    <div className="rounded-lg border border-border/80 bg-background/60 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Starts</p>
                      <p className="text-sm font-medium leading-snug">{new Date(eventSnapshot.starts_at).toLocaleString()}</p>
                    </div>
                  )}
                  {eventSnapshot.ends_at && (
                    <div className="rounded-lg border border-border/80 bg-background/60 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ends</p>
                      <p className="text-sm font-medium leading-snug">{new Date(eventSnapshot.ends_at).toLocaleString()}</p>
                    </div>
                  )}
                  {eventSnapshot.location && (
                    <div className="rounded-lg border border-border/80 bg-background/60 px-3 py-2 sm:col-span-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Where</p>
                      <p className="text-sm font-medium leading-snug break-words">{eventSnapshot.location}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                  {(
                    [
                      { key: "GOING" as const, label: "Going" },
                      { key: "MAYBE" as const, label: "Maybe" },
                      { key: "NOT_GOING" as const, label: "Can't go" },
                    ] as const
                  ).map(({ key, label }) => {
                    const count =
                      key === "GOING"
                        ? eventSnapshot.counts?.GOING ?? 0
                        : key === "MAYBE"
                          ? eventSnapshot.counts?.MAYBE ?? 0
                          : eventSnapshot.counts?.NOT_GOING ?? 0;
                    const active = eventSnapshot.my_status === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={countdown === "Announcement Passed"}
                        onClick={() => handleRsvp(key)}
                        className={`flex min-h-[5.25rem] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-all disabled:opacity-50 disabled:pointer-events-none ${
                          active
                            ? "border-sky-500 bg-sky-500 text-white shadow-md ring-2 ring-sky-500/25"
                            : "border-border bg-background/80 hover:bg-muted/70 hover:border-sky-500/40"
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wide leading-tight ${
                            active ? "text-white/95" : "text-muted-foreground"
                          }`}
                        >
                          {label}
                        </span>
                        <span
                          className={`mt-1.5 text-2xl font-bold tabular-nums leading-none ${
                            active ? "text-white" : "text-foreground"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!token && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    Log in to RSVP. Totals update live for everyone.
                  </p>
                )}
              </div>
            ) : null}

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
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Posted in</p>
                    <Link
                      to={`/cluster/${apiPost?.cid}`}
                      className="text-sm font-bold text-foreground hover:text-accent transition-colors block leading-tight flex items-center gap-1"
                    >
                      <Hash className="h-3 w-3 text-accent" />
                      c/{megClusterLabel ?? clusterName ?? apiPost?.cid.slice(0, 8)}
                    </Link>
                  </div>
                  <div className="border-t border-amber-500/10 pt-2">
                    <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-tighter mb-1">Originally From</p>
                    <Link
                      to={`/cluster/${windowOrigin.origin_cid}`}
                      className="text-sm font-bold text-muted-foreground hover:text-amber-500 transition-colors block leading-tight flex items-center gap-1"
                    >
                      <Hash className="h-3 w-3 text-amber-500/70" />
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
