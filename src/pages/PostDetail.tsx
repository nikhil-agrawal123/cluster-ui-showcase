import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageSquare, Share2, Bookmark } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import VoteControl from "@/components/feed/VoteControl";
import CommentNode from "@/components/thread/CommentNode";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { posts, comments } from "@/lib/mockData";

const PostDetail = () => {
  const { id } = useParams();
  const post = posts.find((p) => p.id === id) || posts[0];
  const [commentText, setCommentText] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span>/</span>
          <Link to="/cluster" className="hover:text-foreground">c/{post.community}</Link>
          <span>/</span>
          <span className="text-foreground">Window View</span>
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
              {post.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-sm font-semibold">{post.author[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{post.author}</p>
                <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
              </div>
              <Button variant="default" size="sm" className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90 rounded-full h-8 px-4 text-xs">
                Follow
              </Button>
            </div>

            <div className="prose prose-slate max-w-none text-foreground/90 leading-relaxed space-y-4 mb-6">
              <p>{post.excerpt || "This is a detailed exploration of the topic at hand. The community has been actively discussing the implications and potential solutions."}</p>
              <p>Minimalism has always been a cornerstone of modern digital design, but 2024 is ushering in a new era. We're moving beyond the sterile whitespace of the past decade into something more expressive yet equally focused.</p>
              <h2 className="text-xl font-semibold text-foreground mt-8">1. Intentional Motion</h2>
              <p>Motion is no longer just "eye candy." In 2024, it's used to guide the user's focus. Subtle transitions between states help maintain context without overwhelming the visual field.</p>
              <h2 className="text-xl font-semibold text-foreground mt-8">2. Depth and Layering</h2>
              <p>We're seeing a return to depth through shadows and blurs, but with a refined touch. Glassmorphism is evolving into more sophisticated layering systems that create hierarchy without the need for high-contrast borders.</p>
              <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground my-6">
                "Clarity is not the absence of complexity, but the mastery of it."
              </blockquote>
              <p>As we look forward, the challenge remains: how to provide enough information for power users while keeping the interface approachable for everyone else.</p>
            </div>

            {/* Engagement */}
            <div className="flex items-center gap-3 py-4 border-t border-border">
              <div className="flex items-center gap-1">
                <VoteControl count={post.votes} vertical={false} />
              </div>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full bg-muted">
                <MessageSquare className="h-4 w-4" />
                {post.comments} Comments
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
                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs px-4">
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {comments.map((comment) => (
                  <CommentNode key={comment.id} comment={comment} />
                ))}
              </div>
            </div>
          </motion.article>

          {/* Right rail */}
          <aside className="w-64 shrink-0 hidden lg:block space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="bg-card rounded-xl shadow-surface p-4"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Related Windows</h3>
              <div className="space-y-2">
                {["Glassmorphism Trends", "Bento Grid Layouts", "Typography Systems", "Color Theory 101"].map((title, i) => (
                  <div key={title} className={`text-sm py-2 px-3 rounded-lg cursor-pointer transition-colors ${i === 0 ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    {title}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="bg-accent/10 border border-accent/20 rounded-xl p-4"
            >
              <h3 className="text-sm font-semibold text-foreground mb-1">Join the Design Cluster</h3>
              <p className="text-xs text-muted-foreground mb-3">Get weekly curated insights from leading designers around the world.</p>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-sm h-9">
                Subscribe
              </Button>
            </motion.div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {["UI DESIGN", "MINIMALISM", "TRENDS 2024", "UX"].map((tag) => (
                  <span key={tag} className="text-xs text-accent font-medium bg-accent/10 px-2.5 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
