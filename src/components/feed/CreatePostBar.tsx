import { Image } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CreatePostBar = () => (
  <div className="bg-card rounded-xl shadow-surface p-3 flex items-center gap-3">
    <Avatar className="h-9 w-9 border-2 border-accent/20">
      <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">AR</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <input
        type="text"
        placeholder="What's happening in your cluster?"
        className="w-full bg-muted rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
    <button className="p-2 text-muted-foreground hover:text-accent transition-colors">
      <Image className="h-5 w-5" />
    </button>
  </div>
);

export default CreatePostBar;
