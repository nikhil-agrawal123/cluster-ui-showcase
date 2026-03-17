import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Trash2, UserX, Flag, MessageSquare, SlidersHorizontal, ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { moderationData } from "@/lib/mockData";
import { Link } from "react-router-dom";

const sidebarItems = [
  { icon: Flag, label: "Queue", active: true },
  { icon: Flag, label: "Reported" },
  { icon: UserX, label: "Banned Users" },
  { icon: SlidersHorizontal, label: "Rules & Policy" },
];

const stats = [
  { label: "Pending Reports", value: "142", change: "+12% from yesterday", positive: true, icon: "📋" },
  { label: "Resolved Today", value: "85", change: "-5% from avg", positive: false, icon: "✅" },
  { label: "Active Bans", value: "12", change: "+2% active", positive: false, icon: "🚫" },
];

const ModerationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 border-r border-border min-h-[calc(100vh-56px)] p-4 hidden md:block">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active ? "bg-sidebar-accent text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-6 left-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Status</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">● All systems operational</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 max-w-[1100px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Moderation Queue</h1>
              <p className="text-sm text-muted-foreground mt-1">Review and take action on reported windows and comments.</p>
            </div>
            <div className="flex bg-muted rounded-full p-0.5">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full h-8 px-4 text-xs">Windows</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full h-8 px-4 text-xs">Comments</Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="bg-card rounded-xl shadow-surface p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span>{stat.icon}</span>
                </div>
                <p className="text-3xl font-bold text-foreground tabular-nums">{stat.value}</p>
                <p className={`text-xs mt-1 font-medium ${stat.positive ? "text-success" : "text-destructive"}`}>
                  {stat.change}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Queue table */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="bg-card rounded-xl shadow-surface overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Current Queue</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Sort
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Reported Item</th>
                    <th className="text-left px-5 py-3 font-medium">Reason</th>
                    <th className="text-left px-5 py-3 font-medium">Reporter</th>
                    <th className="text-left px-5 py-3 font-medium">Time</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {moderationData.map((item, i) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      className="border-t border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">User: {item.user}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-semibold text-primary-foreground px-2 py-1 rounded ${item.reasonColor}`}>
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{item.reporter}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground tabular-nums">{item.time}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="w-8 h-8 rounded-full bg-success flex items-center justify-center hover:bg-success/80 transition-colors">
                            <CheckCircle className="h-4 w-4 text-success-foreground" />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center hover:bg-destructive/80 transition-colors">
                            <Trash2 className="h-4 w-4 text-destructive-foreground" />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
                            <UserX className="h-4 w-4 text-primary-foreground" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">Showing 1-4 of 142 reports</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Previous</Button>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Next</Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ModerationPage;
