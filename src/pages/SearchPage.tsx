import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Hash, FileText, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { globalSearch, type GlobalSearchResult, type PostResponse } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const timeAgo = (iso: string) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.floor(Math.max(0, now - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

type Tab = "all" | "users" | "clusters" | "posts";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const navigate = useNavigate();

  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const r = await globalSearch(q);
      setResults(r);
    } catch { setResults(null); }
    finally { setLoading(false); }
  };

  // Search when URL param changes
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    if (q) doSearch(q);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "all", label: "All", icon: Search },
    { id: "users", label: "Users", icon: Users, count: results?.users.length },
    { id: "clusters", label: "Clusters", icon: Hash, count: results?.clusters.length },
    { id: "posts", label: "Posts", icon: FileText, count: results?.posts.length },
  ];

  const totalCount = results ? results.users.length + results.clusters.length + results.posts.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0">
            {/* Search header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Search className="h-6 w-6 text-accent" />
                Search
              </h1>
              <form onSubmit={handleSubmit} className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users, clusters, and posts..."
                  className="pl-10 h-11 rounded-xl bg-card border-0 shadow-surface text-sm"
                  autoFocus
                />
              </form>
            </motion.div>

            {/* Tabs */}
            {results && (
              <div className="flex items-center gap-1 bg-card rounded-xl px-2 py-1.5 shadow-surface w-fit mb-6">
                {tabs.map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                      {t.count !== undefined && t.count > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-muted"}`}>
                          {t.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Searching…</span>
              </div>
            )}

            {/* No results */}
            {!loading && results && totalCount === 0 && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No results for "{searchParams.get("q")}"</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && !results && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Enter a search term above</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {!loading && results && totalCount > 0 && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Users */}
                  {(activeTab === "all" || activeTab === "users") && results.users.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" /> People ({results.users.length})
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {results.users.map((u, i) => (
                          <motion.div
                            key={u.uid}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Link
                              to={`/user/${u.uid}`}
                              className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-surface hover:shadow-surface-hover transition-all hover:-translate-y-0.5 block"
                            >
                              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                                {u.name?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                                {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Clusters */}
                  {(activeTab === "all" || activeTab === "clusters") && results.clusters.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Hash className="h-4 w-4" /> Clusters ({results.clusters.length})
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {results.clusters.map((c, i) => (
                          <motion.div
                            key={c.cid}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Link
                              to={`/cluster/${c.cid}`}
                              className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-surface hover:shadow-surface-hover transition-all hover:-translate-y-0.5 block"
                            >
                              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">c/{c.name}</p>
                                {c.category && <p className="text-xs text-muted-foreground truncate">{c.category}</p>}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Posts */}
                  {(activeTab === "all" || activeTab === "posts") && results.posts.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Posts ({results.posts.length})
                      </h2>
                      <div className="space-y-2">
                        {results.posts.map((p, i) => (
                          <motion.div
                            key={p.pid}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Link
                              to={`/post/${p.pid}`}
                              className="block bg-card rounded-xl p-4 shadow-surface hover:shadow-surface-hover transition-all hover:-translate-y-0.5"
                            >
                              <p className="text-sm text-foreground leading-relaxed line-clamp-2 mb-3">{p.content}</p>
                              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                                <Link 
                                  to={`/cluster/${p.cid}`} 
                                  className="text-[10px] font-bold text-accent uppercase tracking-wider hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Hash className="h-3 w-3" />
                                  c/{(p as any).cluster_name ?? p.cid.slice(0, 8)}
                                </Link>
                                <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                                  <span className="flex items-center gap-1">👍 {p.likes}</span>
                                  {p.likes > 5 && (
                                    <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter">Trending</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
