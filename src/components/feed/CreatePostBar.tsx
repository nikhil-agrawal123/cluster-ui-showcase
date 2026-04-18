import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, FileText, Megaphone, Hash, Users2, Pencil,
  ChevronDown, Loader2, Tag, Clock, AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  createPost,
  createMegaphone,
  editPost,
  fetchMyJoinedClusters,
  fetchClusters,
  type ClusterBasic,
} from "@/lib/api";

// ---- Types ------------------------------------------------------------------

export interface CreateMenuProps {
  onCreated?: () => void;
  /** When provided, the menu opens straight to the "Edit" sheet */
  editTarget?: { pid: string; content: string; tags?: string };
  /** Visual variant */
  variant?: "bar" | "button";
}

type ModalKind = "post" | "megaphone" | "cluster" | "edit" | null;

// ---- Create Cluster via API -------------------------------------------------

async function createCluster(payload: {
  name: string;
  description?: string;
  category?: string;
  is_private: boolean;
  creator_uid: string;
  token: string;
}): Promise<any> {
  const res = await fetch("http://localhost:8000/clusters/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload.token}`,
    },
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      category: payload.category,
      is_private: payload.is_private,
      creator_uid: payload.creator_uid,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ---- Sub-modals -------------------------------------------------------------

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

interface ModalShellProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalShell = ({ title, icon, iconBg, onClose, children }: ModalShellProps) => (
  <motion.div
    variants={overlayVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="bg-card rounded-2xl shadow-2xl w-full max-w-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <h2 className="text-base font-semibold text-foreground flex-1">{title}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </motion.div>
  </motion.div>
);

// ---- Field helpers ----------------------------------------------------------

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{children}</label>
);

const Field = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-1">{children}</div>
);

const Textarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/60 min-h-[100px]"
  />
);

const Input = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60"
  />
);

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/60"
  >
    {children}
  </select>
);

// ---- Post Modal -------------------------------------------------------------

const PostModal = ({ clusters, onClose, onCreated, uid }: {
  clusters: ClusterBasic[];
  onClose: () => void;
  onCreated: () => void;
  uid: string;
}) => {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [cid, setCid] = useState(clusters[0]?.cid ?? "");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handle = async () => {
    if (!content.trim() || !cid) return;
    setSubmitting(true);
    try {
      await createPost({ uid, cid, content: content.trim(), tags: tags.trim() || undefined });
      toast({ title: "Post created! 🎉", description: "Your post is now live." });
      onCreated();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Create Post" icon={<FileText className="h-4 w-4 text-accent" />} iconBg="bg-accent/15" onClose={onClose}>
      <Field>
        <Label>Cluster</Label>
        <Select value={cid} onChange={(e) => setCid(e.target.value)}>
          {clusters.map((c) => <option key={c.cid} value={c.cid}>{c.name}</option>)}
        </Select>
      </Field>
      <Field>
        <Label>Content</Label>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
      </Field>
      <Field>
        <Label><span className="flex items-center gap-1"><Tag className="h-3 w-3" />Tags (optional)</span></Label>
        <Input placeholder="design, ux, trends …" value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-sm">Cancel</Button>
        <Button
          disabled={!content.trim() || !cid || submitting}
          onClick={handle}
          className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl text-sm gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Publish
        </Button>
      </div>
    </ModalShell>
  );
};

// ---- Megaphone Modal -------------------------------------------------------

const MegaphoneModal = ({ clusters, onClose, onCreated, uid }: {
  clusters: ClusterBasic[];
  onClose: () => void;
  onCreated: () => void;
  uid: string;
}) => {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [cid, setCid] = useState(clusters[0]?.cid ?? "");
  const [megType, setMegType] = useState<"ANNOUNCEMENT" | "POLL" | "EVENT">("ANNOUNCEMENT");
  const [hours, setHours] = useState(24);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [eventStarts, setEventStarts] = useState("");
  const [eventEnds, setEventEnds] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handle = async () => {
    if (!content.trim() || !cid) return;
    if (megType === "POLL") {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        toast({ title: "Poll options", description: "Add at least two choices.", variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload: Parameters<typeof createMegaphone>[0] = {
        cid,
        content: content.trim(),
        tags: tags.trim() || undefined,
        megaphone_type: megType,
        duration_hours: hours,
      };
      if (megType === "POLL") {
        payload.poll_options = pollOptions.map((o) => o.trim()).filter(Boolean);
      }
      if (megType === "EVENT") {
        if (eventStarts.trim()) payload.event_starts_at = new Date(eventStarts).toISOString();
        if (eventEnds.trim()) payload.event_ends_at = new Date(eventEnds).toISOString();
        if (eventLocation.trim()) payload.event_location = eventLocation.trim();
      }
      await createMegaphone(payload);
      toast({ title: "Megaphone fired! 📣", description: "Your announcement is now pinned." });
      onCreated();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <ModalShell
      title="Create Megaphone"
      icon={<Megaphone className="h-4 w-4 text-amber-500" />}
      iconBg="bg-amber-500/15"
      onClose={onClose}
    >
      <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        Megaphones are pinned cluster-wide announcements. You must be a moderator.
      </div>
      <Field>
        <Label>Cluster</Label>
        <Select value={cid} onChange={(e) => setCid(e.target.value)}>
          {clusters.map((c) => <option key={c.cid} value={c.cid}>{c.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label>Type</Label>
          <Select value={megType} onChange={(e) => setMegType(e.target.value as "ANNOUNCEMENT" | "POLL" | "EVENT")}>
            <option value="ANNOUNCEMENT">📢 Announcement</option>
            <option value="EVENT">🗓️ Event</option>
            <option value="POLL">📊 Poll</option>
          </Select>
        </Field>
        <Field>
          <Label><span className="flex items-center gap-1"><Clock className="h-3 w-3" />Duration (hrs)</span></Label>
          <Input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
        </Field>
      </div>
      {megType === "POLL" && (
        <div className="space-y-2">
          <Label>Poll choices</Label>
          {pollOptions.map((opt, i) => (
            <Input
              key={i}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const next = [...pollOptions];
                next[i] = e.target.value;
                setPollOptions(next);
              }}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg text-xs"
            disabled={pollOptions.length >= 10}
            onClick={() => setPollOptions([...pollOptions, ""])}
          >
            Add option
          </Button>
        </div>
      )}
      {megType === "EVENT" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <Label>Starts (optional)</Label>
            <Input type="datetime-local" value={eventStarts} onChange={(e) => setEventStarts(e.target.value)} />
          </Field>
          <Field>
            <Label>Ends (optional)</Label>
            <Input type="datetime-local" value={eventEnds} onChange={(e) => setEventEnds(e.target.value)} />
          </Field>
          <div className="sm:col-span-2 space-y-1">
            <Label>Location (optional)</Label>
            <Input placeholder="Room / link / address" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
          </div>
        </div>
      )}
      <Field>
        <Label>Announcement Content</Label>
        <Textarea placeholder="Write your cluster-wide announcement…" value={content} onChange={(e) => setContent(e.target.value)} autoFocus />
      </Field>
      <Field>
        <Label><span className="flex items-center gap-1"><Tag className="h-3 w-3" />Tags (optional)</span></Label>
        <Input placeholder="event, important, news …" value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-sm">Cancel</Button>
        <Button
          disabled={!content.trim() || !cid || submitting}
          onClick={handle}
          className="bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-sm gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          Fire Megaphone
        </Button>
      </div>
    </ModalShell>
  );
};

// ---- Create Cluster Modal ---------------------------------------------------

const ClusterModal = ({ onClose, onCreated, token, uid }: {
  onClose: () => void;
  onCreated: () => void;
  token: string;
  uid: string;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handle = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createCluster({ name: name.trim(), description: description.trim() || undefined, category: category.trim() || undefined, is_private: isPrivate, creator_uid: uid, token });
      toast({ title: "Cluster created! 🚀", description: `c/${name} is now live.` });
      onCreated();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Create Cluster" icon={<Users2 className="h-4 w-4 text-purple-400" />} iconBg="bg-purple-500/15" onClose={onClose}>
      <Field>
        <Label><span className="flex items-center gap-1"><Hash className="h-3 w-3" />Cluster Name</span></Label>
        <Input placeholder="my-awesome-cluster" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60} />
      </Field>
      <Field>
        <Label>Description</Label>
        <Textarea placeholder="What is this cluster about?" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: 72 }} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label>Category</Label>
          <Input placeholder="Tech, Art, Science…" value={category} onChange={(e) => setCategory(e.target.value)} />
        </Field>
        <Field>
          <Label>Visibility</Label>
          <Select value={isPrivate ? "private" : "public"} onChange={(e) => setIsPrivate(e.target.value === "private")}>
            <option value="public">🌍 Public</option>
            <option value="private">🔒 Private</option>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-sm">Cancel</Button>
        <Button
          disabled={!name.trim() || submitting}
          onClick={handle}
          className="bg-purple-500 text-white hover:bg-purple-600 rounded-xl text-sm gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users2 className="h-4 w-4" />}
          Create Cluster
        </Button>
      </div>
    </ModalShell>
  );
};

// ---- Edit Post Modal -------------------------------------------------------

const EditModal = ({ target, onClose, onCreated }: {
  target: { pid: string; content: string; tags?: string };
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [content, setContent] = useState(target.content);
  const [tags, setTags] = useState(target.tags ?? "");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handle = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await editPost(target.pid, content.trim(), tags.trim() || undefined);
      toast({ title: "Post updated! ✅" });
      onCreated();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <ModalShell title="Edit Post" icon={<Pencil className="h-4 w-4 text-blue-400" />} iconBg="bg-blue-500/15" onClose={onClose}>
      <Field>
        <Label>Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} autoFocus />
      </Field>
      <Field>
        <Label><span className="flex items-center gap-1"><Tag className="h-3 w-3" />Tags</span></Label>
        <Input placeholder="tag1, tag2 …" value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-sm">Cancel</Button>
        <Button
          disabled={!content.trim() || submitting}
          onClick={handle}
          className="bg-blue-500 text-white hover:bg-blue-600 rounded-xl text-sm gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </ModalShell>
  );
};

// ---- Main CreateMenu Component ----------------------------------------------

const menuItems = [
  {
    id: "post" as ModalKind,
    label: "Post",
    desc: "Share a text post in a cluster",
    icon: FileText,
    color: "text-accent",
    bg: "hover:bg-accent/10",
    dot: "bg-accent",
  },
  {
    id: "megaphone" as ModalKind,
    label: "Megaphone",
    desc: "Cluster-wide announcement (mod only)",
    icon: Megaphone,
    color: "text-amber-500",
    bg: "hover:bg-amber-500/10",
    dot: "bg-amber-500",
  },
  {
    id: "cluster" as ModalKind,
    label: "Cluster",
    desc: "Start a new community",
    icon: Users2,
    color: "text-purple-400",
    bg: "hover:bg-purple-500/10",
    dot: "bg-purple-500",
  },
];

const CreateMenu = ({ onCreated, editTarget, variant = "bar" }: CreateMenuProps) => {
  const { token, uid, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<ModalKind>(editTarget ? "edit" : null);
  const [joinedClusters, setJoinedClusters] = useState<ClusterBasic[]>([]);
  const [allClusters, setAllClusters] = useState<ClusterBasic[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-open modal from ?create= URL param (triggered by Navbar)
  useEffect(() => {
    const createParam = searchParams.get("create") as ModalKind;
    if (createParam && ["post", "megaphone", "cluster"].includes(createParam)) {
      setModal(createParam);
      // Remove the param from URL so re-visiting /feed doesn't re-open it
      setSearchParams((prev) => { prev.delete("create"); return prev; }, { replace: true });
    }
  }, [searchParams]);

  const initials = profile?.name
    ? profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // Open edit modal automatically when editTarget is provided
  useEffect(() => {
    if (editTarget) setModal("edit");
  }, [editTarget?.pid]);

  // Load clusters
  useEffect(() => {
    if (!token) return;
    fetchMyJoinedClusters().then(setJoinedClusters).catch(() => {});
    fetchClusters(0, 50).then(setAllClusters).catch(() => {});
  }, [token]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clusterList = joinedClusters.length > 0 ? joinedClusters : allClusters;

  const openModal = (kind: ModalKind) => {
    setOpen(false);
    setModal(kind);
  };

  const handleCreated = () => {
    onCreated?.();
  };

  if (!token) {
    return (
      <div className="bg-card rounded-xl shadow-surface p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground flex-1">Log in to create posts and clusters…</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl shadow-surface p-3 flex items-center gap-3" ref={menuRef}>
        <Avatar className="h-9 w-9 border-2 border-accent/20 shrink-0">
          <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>

        {/* Fake input that opens post modal */}
        <button
          className="flex-1 text-left bg-muted rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          onClick={() => openModal("post")}
        >
          What's on your mind?
        </button>

        {/* "+ Create" dropdown trigger */}
        <div className="relative">
          <Button
            onClick={() => setOpen((p) => !p)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-9 px-3 gap-1.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-2xl w-64 z-40 overflow-hidden"
              >
                <div className="p-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openModal(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${item.bg}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-medium ${item.color}`}>{item.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight truncate">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals rendered at root level via portal-style AnimatePresence */}
      <AnimatePresence>
        {modal === "post" && (
          <PostModal
            key="post-modal"
            clusters={clusterList}
            uid={uid ?? ""}
            onClose={() => setModal(null)}
            onCreated={handleCreated}
          />
        )}
        {modal === "megaphone" && (
          <MegaphoneModal
            key="meg-modal"
            clusters={clusterList}
            uid={uid ?? ""}
            onClose={() => setModal(null)}
            onCreated={handleCreated}
          />
        )}
        {modal === "cluster" && (
          <ClusterModal
            key="cluster-modal"
            token={token ?? ""}
            uid={uid ?? ""}
            onClose={() => setModal(null)}
            onCreated={handleCreated}
          />
        )}
        {modal === "edit" && editTarget && (
          <EditModal
            key="edit-modal"
            target={editTarget}
            onClose={() => setModal(null)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateMenu;
