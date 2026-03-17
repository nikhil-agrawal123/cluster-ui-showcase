import { Home, Compass, TrendingUp, Bookmark, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home Feed", path: "/feed" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: TrendingUp, label: "Popular", path: "/popular" },
  { icon: Bookmark, label: "Saved Windows", path: "/saved" },
];

const myClusters = [
  { label: "Design Systems", tag: "UI", color: "bg-blue-500" },
  { label: "React Devs", tag: "JS", color: "bg-yellow-500" },
  { label: "ML Research", tag: "AI", color: "bg-purple-500" },
];

const Sidebar = () => {
  const location = useLocation();

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
            My Clusters
          </h3>
          <div className="space-y-1">
            {myClusters.map((cluster) => (
              <Link key={cluster.label} to="/cluster">
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <span className={`w-6 h-6 rounded-md ${cluster.color} flex items-center justify-center text-[10px] font-bold text-primary-foreground`}>
                    {cluster.tag}
                  </span>
                  {cluster.label}
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
