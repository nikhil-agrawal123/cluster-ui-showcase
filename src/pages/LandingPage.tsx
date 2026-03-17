import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Users, MessageSquare, TrendingUp, Zap, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const features = [
  { icon: Users, title: "Clusters", desc: "Join topic-driven communities where depth meets discussion." },
  { icon: MessageSquare, title: "Threaded Windows", desc: "Rich conversations with nested replies and real-time updates." },
  { icon: TrendingUp, title: "Smart Trending", desc: "Algorithm-free feed that surfaces quality over noise." },
  { icon: Shield, title: "Community Moderation", desc: "Transparent rules enforced by trusted cluster moderators." },
  { icon: Zap, title: "Lightning Fast", desc: "Built on modern infrastructure for instant interactions." },
  { icon: Globe, title: "Open Ecosystem", desc: "Cross-cluster discovery and shared knowledge graphs." },
];

const stats = [
  { value: "52k+", label: "Active Members" },
  { value: "8.2k", label: "Daily Posts" },
  { value: "120+", label: "Clusters" },
  { value: "64%", label: "Engagement Rate" },
];

const LandingPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3" fill="currentColor" className="text-accent-foreground" />
                <circle cx="6" cy="16" r="3" fill="currentColor" className="text-accent-foreground" />
                <circle cx="18" cy="16" r="3" fill="currentColor" className="text-accent-foreground" />
                <line x1="12" y1="11" x2="6" y2="13" stroke="currentColor" strokeWidth="1.5" className="text-accent-foreground" />
                <line x1="12" y1="11" x2="18" y2="13" stroke="currentColor" strokeWidth="1.5" className="text-accent-foreground" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">Cluster</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm">Log In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with Parallax */}
      <section ref={heroRef} className="relative overflow-hidden pt-20 pb-32">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6 tracking-wide uppercase">
              Where depth meets discussion
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-[1.05] tracking-tighter max-w-3xl mx-auto">
              Communities built for
              <span className="text-accent"> real conversations</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed">
              Cluster brings people together around ideas, not algorithms. Join topic-driven communities with threaded discussions, smart curation, and transparent moderation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <Link to="/login">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-accent/20">
                Create Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" size="lg" className="rounded-xl h-12 px-8 text-base font-semibold">
                Explore Clusters
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-extrabold text-accent tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Everything you need to build community
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Powerful tools designed for meaningful engagement and organic growth.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="bg-card rounded-2xl shadow-surface p-6 hover:shadow-surface-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-card/50 border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto px-4 lg:px-6 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Ready to join the conversation?
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Sign up in seconds. No algorithms, no ads—just communities that matter.
          </p>
          <Link to="/login">
            <Button size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-12 px-10 text-base font-semibold gap-2 shadow-lg shadow-accent/20">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2024 Cluster, Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">About</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
