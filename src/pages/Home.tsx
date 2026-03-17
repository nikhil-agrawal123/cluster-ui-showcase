import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import PostCard from "@/components/feed/PostCard";
import CreatePostBar from "@/components/feed/CreatePostBar";
import TrendingClusters from "@/components/feed/TrendingClusters";
import { posts } from "@/lib/mockData";

const Footer = () => (
  <div className="text-xs text-muted-foreground space-x-3 mt-4">
    <a href="#" className="hover:text-foreground">About</a>
    <a href="#" className="hover:text-foreground">Careers</a>
    <a href="#" className="hover:text-foreground">Help Center</a>
    <a href="#" className="hover:text-foreground">Privacy Policy</a>
    <p className="mt-2">© 2024 Cluster, Inc. All rights reserved.</p>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0 space-y-4">
            <CreatePostBar />
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </main>
          <aside className="w-72 shrink-0 hidden xl:block space-y-4">
            <TrendingClusters />
            <Footer />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
