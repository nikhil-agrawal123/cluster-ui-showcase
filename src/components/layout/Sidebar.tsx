import { useState, useEffect } from "react";
import { Home, Compass, TrendingUp, Bookmark } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchClusters, type ClusterBasic } from "@/lib/api";

const navItems = [
  { icon: Home, label: "Home Feed", path: "/feed" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: TrendingUp, label: "Popular", path: "/popular" },
  { icon: Bookmark, label: "Saved Windows", path: "/saved" },
];

const TAG_COLORS = [
  "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-emerald-500",
  "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-rose-500",
];

const Sidebar = () => {
  const location = useLocation();
  const [clusters, setClusters] = useState<ClusterBasic[]>([]);

  useEffect(() => {
    fetchClusters(0, 6).then(setClusters).catch(console.error);
  }, []);

  return (
    <aside className="w-60 shrink-0 hidden lg:block">
      <div className="sticky top-[72px] space-y-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div>
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Top Clusters
          </h3>
          <div className="space-y-1">
            {clusters.map((cluster, idx) => (
              <Link key={cluster.cid} to="/cluster">
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <span className={`w-6 h-6 rounded-md ${TAG_COLORS[idx % TAG_COLORS.length]} flex items-center justify-center text-[10px] font-bold text-primary-foreground`}>
                    {cluster.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate">{cluster.name}</span>
                </motion.div>
              </Link>
            ))}
            {clusters.length === 0 && (
              <p className="px-3 text-xs text-muted-foreground">Loading…</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
