import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Camera, X, Loader2, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import anantaLogo from "@/assets/ananta-logo-new.png";
import { loadChatHistory, saveChatMessages } from "@/lib/chat-history";
import { askAnanta } from "@/lib/gemini";
import { truncatePrompt } from "@/lib/utils"; 
import { useSearchParams } from "react-router-dom"; // 👈 Added for ChatGPT workspace tracking

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const WELCOME = "🔧 Welcome to **FIXO — Visual Repair Diagnostics**!\n\nI can help you fix broken things! Just:\n📸 **Upload a photo** of the broken item\n📝 **Describe the issue** if you'd like\n\nI'll analyze the image and give you a **safe, step-by-step repair guide**.\n\n🔹 Cracked screens, leaky pipes, broken toys\n🔹 Electrical issues, furniture damage\n🔹 Appliance problems, vehicle parts\n🔹 And much more!\n\nSnap a photo and let's fix it! 🛠️";

const FIXO_SYSTEM_PROMPT = `You are FIXO, an AI-powered visual repair diagnostics assistant created by Supreme Tech as part of ANANTA AI. Your job is to analyze images of broken, damaged, or malfunctioning objects and provide safe, step-by-step repair instructions.

When you receive an image:
1. Identify the object and the type of damage
2. Assess the severity (minor, moderate, severe)
3. List required tools and materials
4. Provide clear, numbered step-by-step repair instructions
5. Include safety warnings where applicable
6. Suggest when to seek professional help

Always prioritize safety. If a repair is dangerous (electrical, structural, gas-related), warn the user and recommend professional assistance.

Format your response with clear sections using emojis and markdown-style formatting.`;

export default function FixoPage() {
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get("thread"); // 👈 Capture active thread from URL

  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApproval, setShowApproval] = useState(false); 
  const [pendingAction, setPendingAction] = useState<string | null>(null); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 Load History ONLY when clicking a past thread, else show Welcome state
  useEffect(() => {
    if (threadId) {
      loadChatHistory("fixo").then((h) => {
        if (h && h.length > 0) setMessages(h);
      });
    } else {
      setMessages([{ role: "assistant", content: WELCOME }]); // ✨ Blank New Workspace!
    }
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (bypassApproval = false) => {
    if (!input.trim() && !imageBase64 && !pendingAction) return;

    setIsLoading(true);
    const rawUserContent = input.trim() || pendingAction || (imageBase64 ? "Analyze this image and provide step-by-step repair instructions." : "");

    const userContent = truncatePrompt(rawUserContent, 2000);

    const highRiskKeywords = ["override", "delete", "format", "dangerous", "rewire", "voltage", "bypass"];
    const isHighRisk = highRiskKeywords.some(keyword => userContent.toLowerCase().includes(keyword));

    if (isHighRisk && !bypassApproval) {
      setPendingAction(userContent);
      setShowApproval(true);
      setIsLoading(false); 
      return; 
    }

    const currentImageBase64 = imageBase64; 
    const currentImagePreview = imagePreview;

    const userMsg: Message = { role: "user", content: userContent, image: currentImagePreview || undefined };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingAction(null);
    setShowApproval(false);
    removeImage(); 

    try {
      const prompt = `${FIXO_SYSTEM_PROMPT}\n\nUser request: ${userContent}`;
      const response = await askAnanta(prompt, currentImageBase64 || undefined);

      const aiMsg: Message = { role: "assistant", content: response || "I was unable to diagnose the object. Please upload a clearer angle." };
      setMessages((prev) => [...prev, aiMsg]);
      saveChatMessages("fixo", [userMsg, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { role: "assistant", content: "⚠️ Fixo Core encountered an error analyzing your visual data." };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-[hsl(30,90%,55%)] to-[hsl(340,80%,55%)] flex items-center justify-center"
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}
          >
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">FIXO — Visual Repair</h1>
            <p className="text-xs text-muted-foreground">AI-powered repair diagnostics from photos</p>
          </div>
          <motion.div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Online</span>
          </motion.div>
        </div>
      </motion.div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <motion.div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20 overflow-hidden" whileHover={{ scale: 1.1, rotate: 5 }}>
                  <img src={anantaLogo} alt="" className="h-6 w-6 object-contain" />
                </motion.div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${msg.role === "user" ? "bg-gradient-to-br from-[hsl(30,90%,55%)] to-[hsl(340,80%,55%)] text-primary-foreground shadow-lg" : "glass-panel text-foreground border border-border/50"}`}>
                {msg.image && (
                  <img src={msg.image} alt="Uploaded" className="rounded-lg mb-3 max-h-48 object-cover" />
                )}
                <div className="whitespace-pre-line">{msg.content}</div>
              </div>
              {msg.role === "user" && (
                <motion.div className="h-8 w-8 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 mt-1 border border-secondary/20" whileHover={{ scale: 1.1, rotate: -5 }}>
                  <User className="h-4 w-4 text-secondary" />
                </motion.div>
              )}
            </motion.div>
          ))}
          {isLoading && !showApproval && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <motion.div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20 overflow-hidden">
                <img src={anantaLogo} alt="" className="h-6 w-6 object-contain" />
              </motion.div>
              <div className="glass-panel rounded-2xl px-5 py-4 text-sm border border-border/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Analyzing image & generating repair guide...</span>
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
                <X className="h-3 w-3 text-destructive-foreground" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Image attached — send to analyze</span>
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
              <span className="font-bold text-sm">⚠️ High-Risk Action Detected</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Fixo intercepted a potentially unsafe repair or software override attempt. Do you approve manual execution override?
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => sendMessage(true)} 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-9 rounded-lg flex-1"
              >
                ✅ Approve & Execute
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
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
          <Camera className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div className="relative flex-1">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Describe the issue or just upload a photo..."
            disabled={isLoading || showApproval}
            className="flex-1 bg-transparent text-sm h-10 outline-none placeholder-muted-foreground text-foreground"
          />
        </div>
        <Button onClick={() => sendMessage()} variant="hero" size="icon" className="h-12 w-12 rounded-xl" disabled={isLoading || showApproval || (!input.trim() && !imageBase64)}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </motion.div>
    </div>
  );
}