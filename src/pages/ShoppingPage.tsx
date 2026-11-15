import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, ShoppingCart, Sparkles, Paperclip, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import anantaLogo from "@/assets/ananta-logo-new.png";
import { loadChatHistory, saveChatMessages } from "@/lib/chat-history";
import { askAnanta } from "@/lib/gemini"; 
import { truncatePrompt } from "@/lib/utils"; 
import { useSearchParams } from "react-router-dom"; // 👈 Added for ChatGPT workspace tracking

interface Message { role: "user" | "assistant"; content: string; image?: string; }

const WELCOME = "🛒 Welcome to **ANANTA Shopping Assistant**!\n\nI can help you with:\n🔹 Phones — Gaming, Multitasking, Budget picks\n🔹 Cars & Bikes — Performance, Design, Value\n🔹 TVs, Laptops & Watches\n🔹 Tech gear — Mice, Headphones & more\n🔹 Price comparisons & reviews\n\nWhat product are you looking for?";

const SHOPPING_SYSTEM_PROMPT = `You are the ANANTA Shopping Assistant, an agent created by Sabavath Vishesh of Supreme Tech.
Your primary role is to act as an Interactive Personal Shopper and Advisor.

🚨 COMPETITION RULES FOR AGENT 3 (REASONING MODE):
When a user asks for product recommendations (e.g., "Recommend a phone" or "What laptop should I buy?"):
1. DO NOT give a massive list of products right away.
2. Instead, ask the user 3 to 5 interactive follow-up questions to understand their exact needs! (e.g., Budget, Primary Use-case, Preferred brand, Battery life vs Display, etc.)
3. Once they answer those questions, analyze and give the exact "What to buy, Why, When, and Where".

Keep your tone sleek, helpful, and beautifully formatted with emojis and clean markdown. Apply this rule to all gadgets, cars, bikes, and products.`;

export default function ShoppingPage() {
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get("thread"); // 👈 Capture active thread from URL

  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [showApproval, setShowApproval] = useState(false); 
  const [pendingAction, setPendingAction] = useState<string | null>(null); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 Load History ONLY when clicking a past thread, else show Welcome state
  useEffect(() => {
    if (threadId) {
      loadChatHistory("shopping").then((h) => { 
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

  const sendMessage = async (bypassApproval = false) => {
    if (!input.trim() && !imagePreview && !pendingAction) return;

    setIsLoading(true);
    const rawPrompt = input.trim() || pendingAction || "Analyze this product photo and give me shopping advice.";

    const userPrompt = truncatePrompt(rawPrompt, 2000);

    const highRiskKeywords = ["checkout", "buy now", "purchase", "order", "override budget", "transaction", "payment"];
    const isHighRisk = highRiskKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword)); // 🐛 Slotted userPrompt here

    if (isHighRisk && !bypassApproval) {
      setPendingAction(userPrompt);
      setShowApproval(true);
      setIsLoading(false); 
      return; 
    }

    const currentImage = imagePreview ? imagePreview.split(",")[1] : undefined;
    const currentPreview = imagePreview;

    const u: Message = { role: "user", content: userPrompt, image: currentPreview || undefined };
    setMessages((p) => [...p, u]);
    setInput("");
    setPendingAction(null);
    setShowApproval(false);
    removeImage();

    try {
      const shoppingPrompt = `${SHOPPING_SYSTEM_PROMPT}\n\nUser Question: ${userPrompt}`;
      const response = await askAnanta(shoppingPrompt, currentImage);

      const a: Message = { role: "assistant", content: response || "I ran into a connection glitch while checking price indexes. Please try again!" };
      setMessages((p) => [...p, a]);

      saveChatMessages("shopping", [u, a]);
    } catch (error) {
      const errorMsg: Message = { role: "assistant", content: "⚠️ Shopping Grid Offline. Unable to fetch real-time specifications." };
      setMessages((p) => [...p, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-3">
          <motion.div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center" animate={{ rotateY: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}>
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Shopping Assistant</h1>
            <p className="text-xs text-muted-foreground">AI-powered product recommendations & comparisons</p>
          </div>
          <motion.div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Online</span>
          </motion.div>
        </div>
      </motion.div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20 overflow-hidden">
                  <img src={anantaLogo} alt="" className="h-6 w-6 object-contain" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${msg.role === "user" ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20" : "glass-panel text-foreground border border-border/50"}`}>
                {msg.image && <img src={msg.image} alt="Product screenshot" className="rounded-lg mb-3 max-h-48 object-cover" />}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 mt-1 border border-secondary/20">
                  <User className="h-4 w-4 text-secondary" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && !showApproval && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20 overflow-hidden">
                <img src={anantaLogo} alt="" className="h-6 w-6 object-contain" />
              </div>
              <div className="glass-panel rounded-2xl px-5 py-4 text-sm border border-border/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Ananta Shopper is calculating recommendations...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {imagePreview && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-3 flex items-center gap-3">
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover border border-border" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Product photo attached</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showApproval && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }} 
            className="mb-4 p-4 border border-primary/30 bg-primary/5 rounded-xl flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-primary">
              <span className="font-bold text-sm">🛒 High-Stakes Action Detected</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ananta Shopper intercepted an action involving simulated purchases or financial limits. Do you approve manual execution?
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => sendMessage(true)} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 rounded-lg flex-1"
              >
                ✅ Approve & Proceed
              </Button>
              <Button 
                onClick={() => {
                  setShowApproval(false);
                  setPendingAction(null);
                }} 
                variant="outline" 
                className="text-xs h-9 rounded-lg flex-1"
              >
                ❌ Deny Action
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about phones, laptops, cars, or bikes..."
            disabled={isLoading || showApproval}
            className="flex-1 bg-transparent text-sm h-10 outline-none placeholder-muted-foreground text-foreground"
          />
        </div>
        <Button onClick={() => sendMessage()} variant="hero" size="icon" className="h-12 w-12 rounded-xl" disabled={isLoading || showApproval || (!input.trim() && !imagePreview)}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </motion.div>
    </div>
  );
}