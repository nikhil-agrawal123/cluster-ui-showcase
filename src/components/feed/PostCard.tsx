import { MessageSquare, Share2, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import VoteControl from "./VoteControl";

export interface PostData {
  id: string;
  community: string;
  author: string;
  timeAgo: string;
  title: string;
  excerpt?: string;
  image?: string;
  votes: number;
  comments: number;
}

const ActionButton = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted">
    {icon}
    <span>{label}</span>
  </button>
);

const PostCard = ({ post }: { post: PostData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="group bg-card rounded-xl shadow-surface hover:shadow-surface-hover transition-shadow duration-200"
    >
      <div className="p-4 flex gap-3">
        <VoteControl count={post.votes} />
        <div className="flex-1 min-w-0 space-y-2">
          <header className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link to="/cluster" className="font-semibold text-accent hover:underline underline-offset-4">
              c/{post.community}
            </Link>
            <span>·</span>
            <span>Posted by u/{post.author}</span>
            <span>·</span>
            <span className="tabular-nums">{post.timeAgo}</span>
          </header>
          <Link to={`/post/${post.id}`}>
            <h3 className="text-base font-medium leading-snug text-foreground tracking-tight text-balance hover:text-accent transition-colors cursor-pointer">
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
          <footer className="flex items-center gap-1 pt-1">
            <ActionButton icon={<MessageSquare className="h-4 w-4" />} label={`${post.comments} Comments`} />
            <ActionButton icon={<Share2 className="h-4 w-4" />} label="Share" />
            <ActionButton icon={<Bookmark className="h-4 w-4" />} label="Save" />
          </footer>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
