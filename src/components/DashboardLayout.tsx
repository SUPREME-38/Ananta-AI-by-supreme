import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { loadChatHistory, type ModuleType } from "@/lib/chat-history";
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Wrench,
  GraduationCap, Gamepad2, User, Settings, LogOut, Search, Bell, Menu, X, Loader2, Trash2, Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import anantaLogo from "@/assets/ananta-logo-new.png";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/chat", icon: MessageSquare, label: "Chat" },
  { to: "/dashboard/shopping", icon: ShoppingCart, label: "Shopping Assistance" },
  { to: "/dashboard/fixo", icon: Wrench, label: "FIXO" },
  { to: "/dashboard/skills", icon: GraduationCap, label: "Skill Unlocking" },
  { to: "/dashboard/gaming", icon: Gamepad2, label: "Gaming Assistant" },
  { to: "/dashboard/profile", icon: User, label: "Profile" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<{ id?: string; content: string }[]>([]);

  const pathParts = location.pathname.split("/");
  const currentModule = pathParts[pathParts.length - 1] || "dashboard";

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const modules = ["chat", "shopping", "fixo", "skills", "gaming"];
    if (modules.includes(currentModule)) {
      loadChatHistory(currentModule as ModuleType).then((data) => {
        const userMessages = data.filter((msg) => msg.role === "user");
        setHistory(userMessages);
      });
    } else {
      setHistory([]);
    }
  }, [currentModule, location.pathname]); 

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar overflow-hidden"
      >
        <div className="flex items-center gap-2 h-16 px-4 border-b border-border">
          <motion.img
            src={anantaLogo}
            alt="ANANTA AI"
            className="h-9 w-9 object-contain shrink-0 drop-shadow-[0_0_10px_hsl(192,100%,50%,0.4)]"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-heading text-lg font-bold text-gradient whitespace-nowrap"
              >
                ANANTA AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item, i) => {
            const active = location.pathname === item.to;
            return (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group relative overflow-hidden",
                    active
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_hsl(192,100%,50%,0.1)]"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary/5 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className="h-5 w-5 shrink-0 relative z-10" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}

          {/* 📜 Dynamic Workspace Threads (ChatGPT Style!) */}
          <AnimatePresence>
            {sidebarOpen && ["chat", "shopping", "fixo", "skills", "gaming"].includes(currentModule) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-4 border-t border-border mt-4 mx-1 space-y-2 flex flex-col"
              >
                {/* ➕ New Chat Button */}
                <button
                  onClick={() => navigate(`/dashboard/${currentModule}`)} 
                  className="mx-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-border bg-background hover:bg-muted text-xs text-foreground transition-all duration-300"
                >
                  <Plus className="h-4 w-4" /> New Workspace
                </button>

                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mt-2">
                  Workspace History
                </p>
                
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                  {history.length > 0 ? (
                    history.map((msg, i) => (
                      <div 
                        key={i} 
                        onClick={() => navigate(`/dashboard/${currentModule}?thread=${msg.content.substring(0, 15)}`)}
                        className={cn(
                          "group flex items-center justify-between p-2 mx-2 rounded-lg cursor-pointer transition-all border border-transparent",
                          location.search.includes(encodeURIComponent(msg.content.substring(0, 15))) ? "bg-primary/10 border-primary/20" : "hover:bg-sidebar-accent"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-xs text-sidebar-foreground truncate max-w-[130px]">
                            {msg.content}
                          </span>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded-md transition-all">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground/60 italic px-3 p-1">No saved threads found.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={async () => { await logout(); navigate("/"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.div
        className="flex-1"
        animate={{ marginLeft: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 glass-panel border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search..."
                className="h-9 w-64 rounded-lg bg-muted border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              className="text-muted-foreground hover:text-foreground transition-colors relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="h-5 w-5" />
              <motion.span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>
            <div className="flex items-center gap-2">
              <motion.div
                className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.05 }}
              >
                {displayName[0].toUpperCase()}
              </motion.div>
              <span className="text-sm font-medium text-foreground hidden md:block">{displayName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}