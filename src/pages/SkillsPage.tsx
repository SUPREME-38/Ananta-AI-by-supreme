import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight, ArrowLeft, Sparkles, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askAnanta } from "@/lib/gemini"; 
import { truncatePrompt } from "@/lib/utils"; 
import { useSearchParams } from "react-router-dom"; 

const defaultSkills = [
  {
    name: "Programming",
    emoji: "💻",
    gradient: "from-primary to-[hsl(210,100%,60%)]",
    roadmap: [
      { level: "Beginner", steps: ["Learn variables & data types", "Understand control flow (loops, if/else)", "Write simple functions", "Practice with small projects"] },
      { level: "Intermediate", steps: ["Learn OOP concepts", "Understand data structures", "Practice algorithms", "Build a CLI application"] },
      { level: "Advanced", steps: ["System design principles", "Design patterns", "Performance optimization", "Contribute to open source"] },
    ],
  },
  {
    name: "Web Development",
    emoji: "🌐",
    gradient: "from-secondary to-[hsl(280,80%,65%)]",
    roadmap: [
      { level: "Beginner", steps: ["Learn HTML & CSS basics", "Understand responsive design", "JavaScript fundamentals", "Build a static website"] },
      { level: "Intermediate", steps: ["Learn React or Vue", "State management", "REST APIs & fetch", "Build a full-stack app"] },
      { level: "Advanced", steps: ["TypeScript mastery", "Testing strategies", "CI/CD pipelines", "Performance & SEO optimization"] },
    ],
  },
  {
    name: "AI & Machine Learning",
    emoji: "🤖",
    gradient: "from-[hsl(150,80%,45%)] to-[hsl(170,90%,50%)]",
    roadmap: [
      { level: "Beginner", steps: ["Python fundamentals", "Linear algebra basics", "Statistics & probability", "Intro to NumPy & Pandas"] },
      { level: "Intermediate", steps: ["Supervised learning", "Neural networks", "TensorFlow / PyTorch basics", "Build a classification model"] },
      { level: "Advanced", steps: ["Deep learning architectures", "NLP & Computer Vision", "MLOps & deployment", "Research & publish papers"] },
    ],
  },
  {
    name: "Entrepreneurship",
    emoji: "🚀",
    gradient: "from-[hsl(340,80%,55%)] to-[hsl(20,90%,55%)]",
    roadmap: [
      { level: "Beginner", steps: ["Identify problems worth solving", "Customer discovery", "Lean startup methodology", "Build an MVP"] },
      { level: "Intermediate", steps: ["Product-market fit", "Business model canvas", "Fundraising basics", "Marketing & growth"] },
      { level: "Advanced", steps: ["Scaling operations", "Team building & culture", "Financial management", "Exit strategies"] },
    ],
  },
];

const SKILLS_SYSTEM_PROMPT = `You are the ANANTA Skill Unlocking Curator, created by Sabavath Vishesh of Supreme Tech. 
The user wants to learn a specific skill. You must create a JSON-styled clean markdown structure for a 3-tier roadmap (Beginner, Intermediate, Advanced).

For each level, generate exactly 4 clear actionable bullet-point steps.
Keep the titles very concise and clean! Do not include extra conversational fluff.`;

export default function SkillsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const threadId = searchParams.get("thread"); // 👈 Capture active thread from URL

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeRoadmap, setActiveRoadmap] = useState<{ level: string; steps: string[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 Load History ONLY when clicking a past thread from sidebar, else show dashboard
  useEffect(() => {
    if (threadId) {
      // If thread ID exists, check if it's one of the defaults first
      const preset = defaultSkills.find((s) => s.name === threadId);
      if (preset) {
        setSelectedSkill(preset.name);
        setActiveRoadmap(preset.roadmap);
      } else {
        // If it's a custom query thread, kick off custom search logic automatically!
        setSelectedSkill(threadId);
        triggerCustomSkillLoad(threadId);
      }
    } else {
      setSelectedSkill(null); // ✨ Blank New Workspace view!
      setSearchQuery("");
      setActiveRoadmap([]);
    }
  }, [threadId]);

  const triggerCustomSkillLoad = async (skillQuery: string) => {
    setIsLoading(true);
    try {
      const prompt = `${SKILLS_SYSTEM_PROMPT}\n\nSkill to generate: ${skillQuery}`;
      await askAnanta(prompt); // Hit engine for logging trace side-effects

      // Mock UI schema filler
      const generatedLevels = [
        { level: "Beginner Level", steps: ["Understand basic setup & syntax", "Build a mini project", "Master core fundamentals", "Take a quiz/test concepts"] },
        { level: "Intermediate Level", steps: ["Learn advanced architecture", "Work with APIs and third-party tools", "Focus on debugging & clean code", "Build a portfolio project"] },
        { level: "Advanced Level", steps: ["Learn system design & logic scaling", "Performance optimization metrics", "Automation pipelines", "Contribute to standard environments"] },
      ];

      setActiveRoadmap(generatedLevels);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSearch = async () => {
    if (!searchQuery.trim() || isLoading) return;

    const safeSearchQuery = truncatePrompt(searchQuery.trim(), 2000);
    
    // 🔗 Push custom thread to search params to log history visually in workspace
    setSearchParams({ thread: safeSearchQuery }); 
  };

  const toggleComplete = (step: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Skill Unlocking</h1>
        <p className="text-sm text-muted-foreground mb-4">Select or type any custom skill to get your generated roadmap.</p>
      </motion.div>

      {!selectedSkill && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSearch()}
              placeholder="Search custom skills (e.g. UI/UX Design, Photoshop)..."
              className="w-full h-12 rounded-xl bg-muted border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <Button onClick={handleCustomSearch} disabled={isLoading || !searchQuery.trim()} className="h-12 px-5 rounded-xl bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 mr-1" />} Unlock
          </Button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!selectedSkill ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {defaultSkills.map((s, i) => (
              <motion.button
                key={s.name}
                initial={{ opacity: 0, y: 20, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.03 }}
                onClick={() => setSearchParams({ thread: s.name })} // 🔗 Push to workspace param
                className="glass-panel rounded-2xl p-6 text-center hover-glow transition-all duration-500 group relative overflow-hidden h-44 flex flex-col items-center justify-center"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <motion.span className="text-4xl block mb-3" animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                  {s.emoji}
                </motion.span>
                <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{s.roadmap.length} levels</p>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Button variant="ghost" size="sm" onClick={() => setSearchParams({})} className="mb-4 group">
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Skills
            </Button>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{"📚"}</span>
              <h2 className="font-heading text-xl font-bold text-foreground">{selectedSkill} Roadmap</h2>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Generating custom skill curriculum for Ananta...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {activeRoadmap.map((level, li) => (
                  <motion.div key={level.level} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: li * 0.15 }}>
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20" whileHover={{ scale: 1.1, rotate: 5 }}>
                        {li + 1}
                      </motion.div>
                      <h3 className="font-heading font-semibold text-foreground">{level.level}</h3>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="ml-4 border-l-2 border-border pl-6 space-y-3">
                      {level.steps.map((step: string, si: number) => {
                        const done = completed.has(`${selectedSkill}-${step}`);
                        return (
                          <motion.button
                            key={step}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: li * 0.15 + si * 0.05 }}
                            whileHover={{ x: 3 }}
                            onClick={() => toggleComplete(`${selectedSkill}-${step}`)}
                            className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-300 ${
                              done ? "bg-primary/10 border border-primary/20" : "glass-panel hover-glow"
                            }`}
                          >
                            {done ? (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                              </motion.div>
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <span className={`text-sm ${done ? "text-primary" : "text-foreground"}`}>{step}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}