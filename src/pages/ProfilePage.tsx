import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Calendar, MapPin, Link as LinkIcon, Sparkles, Clock, Users, Grid3X3, Pencil, Search, SlidersHorizontal, ArrowRight, Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { profileData } from "@/lib/mockData";

const statCards = [
  { label: "Karma Score", value: "12,450", change: "+12%", icon: Sparkles, changePositive: true },
  { label: "Account Age", value: "2.4 Years", icon: Clock },
  { label: "Total Clusters", value: "18", icon: Users },
  { label: "Active Windows", value: "142", icon: Grid3X3 },
];

const windows = [
  { title: "Prod-Ops Dashboard", lastAccessed: "2h ago", tags: ["AWS", "MONITOR"], clusters: 5 },
  { title: "Core API Services", lastAccessed: "5h ago", tags: ["KUBERNETES", "BACKEND"], clusters: 12 },
];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("windows");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const avatarScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.7]);
  const headerY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  const tabs = [
    { id: "windows", label: "My Windows", icon: Grid3X3 },
    { id: "clusters", label: "My Clusters", icon: Sparkles },
    { id: "settings", label: "Settings", icon: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Profile Header with parallax */}
      <div ref={heroRef}>
        <motion.div style={{ y: headerY }} className="max-w-[1000px] mx-auto px-4 lg:px-6 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="bg-card rounded-2xl shadow-surface p-6 lg:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <motion.div style={{ scale: avatarScale }} className="origin-top-left">
                <div className="relative">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center ring-4 ring-accent/20">
                    <span className="text-3xl font-bold text-accent">AR</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-card flex items-center justify-center">
                    <span className="text-[8px] text-success-foreground">✓</span>
                  </div>
                </div>
              </motion.div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-foreground">{profileData.name}</h1>
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">PRO PLAN</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">{profileData.bio}</p>
                  </div>
                  <Button variant="outline" className="hidden sm:flex items-center gap-2 rounded-xl border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {profileData.joined}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profileData.location}</span>
                  <a href="#" className="flex items-center gap-1 text-accent hover:underline"><LinkIcon className="h-3.5 w-3.5" />{profileData.website}</a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats cards */}
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="bg-card rounded-xl shadow-surface p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
              {stat.change && (
                <p className={`text-xs mt-1 font-medium ${stat.changePositive ? "text-success" : "text-destructive"}`}>
                  📈 {stat.change} from yesterday
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs & content */}
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 pb-12">
        <div className="bg-card rounded-2xl shadow-surface">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "windows" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Recent Windows</h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search windows..." className="pl-9 h-9 w-56 rounded-lg bg-muted border-0 text-sm" />
                    </div>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {windows.map((w) => (
                    <motion.div
                      key={w.title}
                      whileHover={{ y: -2 }}
                      className="bg-muted/50 rounded-xl p-4 border border-border hover:shadow-surface transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Grid3X3 className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{w.title}</h3>
                          <p className="text-xs text-muted-foreground">Last accessed {w.lastAccessed}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        {w.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{w.clusters} Active Clusters</span>
                        <button className="text-xs font-medium text-accent flex items-center gap-1 hover:underline">
                          Open <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* New Window */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-accent/40 transition-colors"
                  >
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">New Window</span>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "clusters" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <p className="text-muted-foreground">This space is currently quiet. Start the conversation.</p>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <p className="text-muted-foreground">Settings panel coming soon.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <span className="text-[8px] text-accent-foreground font-bold">C</span>
            </div>
            <span className="font-medium">Cluster</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="#" className="hover:text-foreground">Documentation</a>
            <a href="#" className="hover:text-foreground">Support</a>
          </div>
          <span>© 2024 Cluster Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default ProfilePage;
