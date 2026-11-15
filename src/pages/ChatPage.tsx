import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Sparkles, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import anantaLogo from "@/assets/ananta-logo-new.png";
import { loadChatHistory, saveChatMessages } from "@/lib/chat-history";
import { askAnanta } from "@/lib/gemini"; 
import { truncatePrompt } from "@/lib/utils"; 
import { useSearchParams } from "react-router-dom"; // 👈 For ChatGPT-style query threads

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const WELCOME = "👋 Hey there! I'm **ANANTA AI** — your intelligent companion.\n\nI'm here to help with tech, coding, business, learning — or just chat! I can be your friend, mentor, or assistant.\n\nHow can I help you? 😊";

export default function ChatPage() {
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
      loadChatHistory("chat").then((history) => {
        if (history.length > 0) {
          // In a multi-table setup we would filter by threadId. For now we pull chat history.
          setMessages(history); 
        }
      });
    } else {
      setMessages([{ role: "assistant", content: WELCOME }]); // ✨ Blank New Chat workspace!
    }
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
    const rawUserContent = input.trim() || pendingAction || (imagePreview ? "Shared a file" : "");

    const safePrompt = truncatePrompt(rawUserContent, 2000);

    const highRiskKeywords = ["ignore guidelines", "bypass rules", "override instruction", "delete history", "clear system logs"];
    const isHighRisk = highRiskKeywords.some(keyword => safePrompt.toLowerCase().includes(keyword));

    if (isHighRisk && !bypassApproval) {
      setPendingAction(safePrompt);
      setShowApproval(true);
      setIsLoading(false); 
      return; 
    }

    const base64Image = imagePreview ? imagePreview.split(",")[1] : undefined;

    const userMsg: Message = { role: "user", content: safePrompt, image: imagePreview || undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingAction(null);
    setShowApproval(false);
    removeImage();

    try {
      const aiResponseText = await askAnanta(safePrompt, base64Image);

      const aiMsg: Message = { role: "assistant", content: aiResponseText };
      setMessages((prev) => [...prev, aiMsg]);

      saveChatMessages("chat", [userMsg, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { role: "assistant", content: "⚠️ System Disruption. I am having trouble connecting to Ananta Core right now." };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-3">
          <motion.div className="relative h-10 w-10" animate={{ rotateY: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}>
            <img src={anantaLogo} alt="ANANTA AI" className="h-10 w-10 object-contain drop-shadow-[0_0_12px_hsl(192,100%,50%,0.5)]" />
          </motion.div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Chat Assistant</h1>
            <p className="text-xs text-muted-foreground">Your AI companion — tech, life, and everything in between</p>
          </div>
        </div>
      </motion.div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border text-xs font-medium ${msg.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"}`}>
                {msg.image && <img src={msg.image} alt="User upload" className="max-w-xs rounded-md mb-2 border border-border" />}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {isLoading && !showApproval && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-card border-border">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-sm animate-pulse text-muted-foreground">Ananta AI is thinking...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2 mt-auto">
        <AnimatePresence>
          {imagePreview && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md border border-border" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground shadow-lg hover:bg-destructive/90">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showApproval && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }} 
              className="mb-4 p-4 border border-destructive/30 bg-destructive/5 rounded-xl flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 text-destructive">
                <span className="font-bold text-sm">⚠️ Suspicious Activity Detected</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ananta detected an attempt to override standard system prompt guidelines or reset history. Do you approve manual execution?
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => sendMessage(true)} 
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-9 rounded-lg flex-1"
                >
                  ✅ Approve Prompt
                </Button>
                <Button 
                  onClick={() => {
                    setShowApproval(false);
                    setPendingAction(null);
                  }} 
                  variant="outline" 
                  className="text-xs h-9 rounded-lg flex-1"
                >
                  ❌ Deny & Reset
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button type="button" size="icon" variant="ghost" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-5 w-5" />
          </Button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask Ananta anything..."
            disabled={isLoading || showApproval}
            className="flex-1 bg-transparent text-sm h-10 outline-none placeholder-muted-foreground text-foreground"
          />

          <Button type="button" size="icon" className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50" onClick={() => sendMessage()} disabled={isLoading || showApproval || (!input.trim() && !imagePreview)}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}