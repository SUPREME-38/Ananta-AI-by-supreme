import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Gamepad2, Sparkles, Paperclip, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import anantaLogo from "@/assets/ananta-logo-new.png";
import { loadChatHistory, saveChatMessages } from "@/lib/chat-history";
import { askAnanta } from "@/lib/gemini"; 
import { truncatePrompt } from "@/lib/utils"; 
import { useSearchParams } from "react-router-dom"; // 👈 Added for ChatGPT workspace tracking

interface Message { role: "user" | "assistant"; content: string; image?: string; }

const WELCOME = "🎮 Welcome to **ANANTA Gaming Assistant**!\n\nI can help you with:\n🔹 Game strategies by playstyle (Aggressive, Supportive, Long-range)\n🔹 Best gun loadouts & attachments\n🔹 Rank-up guides & pro tips\n🔹 Hardware optimization\n\nGames: **COD, PUBG, Valorant, Fortnite, Apex Legends, Free Fire, BGMI**\n\nWhat game do you need help with?";

const GAMING_SYSTEM_PROMPT = `You are the ANANTA Gaming Assistant, a module of Ananta AI created by Sabavath Vishesh of Supreme Tech. 
Your goal is to provide real-time meta strategies, weapon loadouts, attachment guides, and walkthroughs for modern games. 

Tailor your response based on the user's game and their playstyle (Aggressive, Support, or Long Range Sniper). 
Provide stats, map rotation guides, setting optimizations, and pro-level mechanics tips! 
Format your responses beautifully with emojis and bold text.`;

export default function GamingPage() {
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get("thread"); // 👈 Capture active thread from URL

  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 Load History ONLY when clicking a past thread, else show Welcome state
  useEffect(() => {
    if (threadId) {
      loadChatHistory("gaming").then((h) => { 
        if (h.length > 0) setMessages(h); 
      });
    } else {
      setMessages([{ role: "assistant", content: WELCOME }]); // ✨ Blank New Workspace!
    }
  }, [threadId]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imagePreview) || isLoading) return;

    setIsLoading(true);
    const rawPrompt = input.trim() || "Analyze this gameplay screenshot and give me tips.";

    // 🛡️ Apply Truncation Shield
    const userPrompt = truncatePrompt(rawPrompt, 2000);

    const currentImage = imagePreview ? imagePreview.split(",")[1] : undefined;
    const currentPreview = imagePreview;

    const u: Message = { role: "user", content: userPrompt, image: currentPreview || undefined };
    setMessages((p) => [...p, u]);
    setInput("");
    removeImage();

    try {
      // 🎮 Execute Gaming Agent Prompt
      const gamingPrompt = `${GAMING_SYSTEM_PROMPT}\n\nUser Question: ${userPrompt}`;
      const response = await askAnanta(gamingPrompt, currentImage);

      const a: Message = { role: "assistant", content: response || "I ran into a connection glitch. Let me try analyzing that again." };
      setMessages((p) => [...p, a]);

      saveChatMessages("gaming", [u, a]);
    } catch (error) {
      const errorMsg: Message = { role: "assistant", content: "⚠️ Gaming Grid Disconnected. Ananta cannot query meta strategies right now." };
      setMessages((p) => [...p, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-3">
          <motion.div className="h-10 w-10 rounded-xl bg-gradient-to-br from-destructive/80 to-secondary flex items-center justify-center" animate={{ rotateY: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}>
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Gaming Assistant</h1>
            <p className="text-xs text-muted-foreground">Meta loadouts, strategies, and pro walkthroughs</p>
          </div>
          <motion.div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <span className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Battle Ready</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Message Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20 overflow-hidden">
                  <img src={anantaLogo} alt="" className="h-6 w-6 object-contain" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${msg.role === "user" ? "bg-gradient-to-br from-destructive/80 to-secondary text-primary-foreground shadow-lg" : "glass-panel text-foreground border border-border/50"}`}>
                {msg.image && <img src={msg.image} alt="Gameplay screenshot" className="rounded-lg mb-3 max-h-48 object-cover" />}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 mt-1 border border-secondary/20">
                  <User className="h-4 w-4 text-secondary" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20 overflow-hidden">
                <img src={anantaLogo} alt="" className="h-6 w-6 object-contain" />
              </div>
              <div className="glass-panel rounded-2xl px-5 py-4 text-sm border border-border/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Ananta Strategist is cooking meta tips...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media Tray preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-3 flex items-center gap-3">
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover border border-border" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Screenshot attached — send to analyze</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div className="relative flex-1">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
            placeholder="Ask for loadouts, strategies, or upload gameplay screenshots..."
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-muted border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 disabled:opacity-50"
          />
        </div>
        <Button onClick={sendMessage} variant="hero" size="icon" className="h-12 w-12 rounded-xl" disabled={isLoading || (!input.trim() && !imagePreview)}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </motion.div>
    </div>
  );
}