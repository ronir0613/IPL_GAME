import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2, Building2, Coins, ShieldCheck, Scale, Target, Users, Info, Trophy, History } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] font-sans selection:bg-[#171717] selection:text-[#f2f2f2] overflow-x-hidden">
      
      {/* Top Nav */}
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center relative z-10">
        <a href="/">
          <motion.div whileHover={{ x: -2 }} className="inline-flex items-center gap-2 text-[#4d4d4d] hover:text-[#171717] transition-colors cursor-pointer text-[14px] font-medium tracking-tight">
            <ArrowLeft size={16} /> Back to Home
          </motion.div>
        </a>
      </div>

      <div className="max-w-[1400px] mx-auto pb-32">
        
        {/* HERO SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative py-[160px] px-6 overflow-hidden rounded-[16px] bg-white mx-4 mt-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#ebebeb]"
        >
          {/* Dynamic background gradient */}
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.12] pointer-events-none -z-10"
               style={{
                 background: 'radial-gradient(circle at 20% 0%, #0ea5e9, transparent 40%), radial-gradient(circle at 80% 100%, #10b981, transparent 40%), radial-gradient(circle at 50% 50%, #f59e0b, transparent 40%)',
                 filter: 'blur(80px)'
               }}
          />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f8fafc] text-[#475569] text-[13px] font-semibold mb-8 border border-[#e2e8f0] shadow-sm">
            <Trophy size={14} className="text-[#f59e0b]" />
            Engine Architecture
          </div>
          <h1 className="text-[48px] md:text-[72px] font-bold mb-6 tracking-tight text-[#0f172a] leading-[1.1]">
            Understand the Game. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#10b981]">Master The Mechanics.</span>
          </h1>
          <p className="text-[18px] md:text-[20px] text-[#475569] max-w-2xl mx-auto leading-relaxed">
            The 16-0 engine powers a deterministic cricket simulation where your drafting choices dictate every boundary, wicket, and championship run. Explore the mechanics below.
          </p>
        </motion.section>

        {/* THE MODES SECTION */}
        <section className="mt-[160px] px-6">
          <div className="text-center mb-16">
             <div className="font-mono text-[12px] uppercase tracking-widest text-[#64748b] mb-4">Gameplay</div>
             <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-[#0f172a]">The Modes.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Classic */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#e2e8f0] rounded-[20px] p-8 shadow-sm hover:shadow-md transition-all flex flex-col items-start">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-blue-100">
                <Gamepad2 className="text-blue-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-4 text-[#0f172a]">Classic</h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                The quintessential 16-0 experience. Build your all-time IPL XI, simulate a full season against powerful AI franchises, and attempt to achieve the elusive perfect undefeated run.
              </p>
            </motion.div>

            {/* Franchise */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#e2e8f0] rounded-[20px] p-8 shadow-sm hover:shadow-md transition-all flex flex-col items-start">
              <div className="bg-purple-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-purple-100">
                <Building2 className="text-purple-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-4 text-[#0f172a]">Franchise</h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Take long-term control. Manage budgets, negotiate contracts, and navigate player aging across multiple seasons to establish an unstoppable historic dynasty.
              </p>
            </motion.div>

            {/* Gamble */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#e2e8f0] rounded-[20px] p-8 shadow-sm hover:shadow-md transition-all flex flex-col items-start">
              <div className="bg-red-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-red-100">
                <Coins className="text-red-500" size={32} />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-4 text-[#0f172a]">Gamble</h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                High stakes, high rewards. Wager your built-up currency on specific match outcomes, player milestones, and playoff brackets to multiply your resources.
              </p>
            </motion.div>
          </div>
        </section>

        {/* PLAYER RATINGS DISTRIBUTION */}
        <section className="mt-[160px] px-6">
          <div className="bg-[#0f172a] rounded-[24px] p-12 md:p-[64px] text-[#ffffff] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none"
                 style={{
                   background: 'radial-gradient(circle at 100% 0%, #3b82f6, transparent 70%)'
                 }}
            />
            <div className="max-w-4xl mx-auto relative z-10">
              <div className="font-mono text-[12px] uppercase tracking-widest text-[#94a3b8] mb-4">Scaling</div>
              <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-8">Player Ratings Distribution.</h2>
              
              <div className="space-y-6">
                <p className="text-[18px] text-[#94a3b8] leading-relaxed mb-6">
                  Player ratings range dynamically from 70 to 99, calculated precisely from historical performance, peak consistency, and contextual impact during their specific IPL season. 
                </p>

                <div className="bg-[#1e293b] border border-[#334155] rounded-[12px] p-6 mb-12 flex items-start gap-4 shadow-lg">
                  <div className="text-[#94a3b8] mt-0.5 shrink-0">
                    <Info size={24} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-[#f8fafc] mb-2">Note on Ratings</h4>
                    <p className="text-[15px] text-[#94a3b8] leading-relaxed">
                      Ratings are internally balanced specifically for the 16-0 simulation engine. They are subjective approximations meant to ensure competitive gameplay, and do not serve as definitive rankings of real-life abilities or historical greatness.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    { label: 'Legendary', range: '95 - 99', desc: 'The absolute peak seasons (e.g., Kohli 2016). Rare, match-winning, game-breaking capability.', color: 'border-pink-500' },
                    { label: 'Elite', range: '90 - 94', desc: 'Consistent top-tier performers and MVP candidates. The backbone of championship teams.', color: 'border-purple-500' },
                    { label: 'Star', range: '85 - 89', desc: 'Highly reliable match-winners who command their roles with authority.', color: 'border-blue-500' },
                    { label: 'Solid', range: '80 - 84', desc: 'Quality standard players. Good contributors but require strategic support.', color: 'border-emerald-500' },
                    { label: 'Depth', range: '70 - 79', desc: 'Bench players and role-fillers. High variance in performance.', color: 'border-gray-500' },
                  ].map((tier, idx) => (
                    <div key={idx} className={`flex flex-col md:flex-row md:items-center gap-4 bg-[#1e293b] p-6 rounded-[12px] border-l-[4px] ${tier.color} shadow-md transition-all hover:translate-x-1`}>
                      <div className="w-32 font-bold text-[18px] tracking-tight">{tier.label}</div>
                      <div className="font-mono text-[14px] bg-[#0f172a] text-white px-3 py-1.5 rounded-[6px] border border-[#334155]">{tier.range}</div>
                      <div className="text-[15px] text-[#94a3b8] flex-1 leading-relaxed">{tier.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM BUILDING GUIDE */}
        <section className="mt-[160px] px-6">
          <div className="text-center mb-16">
             <div className="font-mono text-[12px] uppercase tracking-widest text-[#64748b] mb-4">Strategy</div>
             <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-[#0f172a]">Team Building Guide.</h2>
             <p className="text-[16px] md:text-[18px] text-[#64748b] max-w-2xl mx-auto mt-4 leading-relaxed">
               Raw rating averages do not guarantee success. The engine rewards synergistic, balanced teams that adhere to real-world franchise constraints.
             </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Rule 1 */}
            <div className="bg-white border border-[#e2e8f0] p-8 rounded-[20px] shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-[#0ea5e9]" size={28} />
                <h3 className="text-[22px] font-bold tracking-tight text-[#0f172a]">The Overseas Rule</h3>
              </div>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Like real life, your Playing XI is strictly limited to a maximum of 4 overseas players. Fielding 5 or more overseas players breaks regulations and immediately invalidates your lineup. You must balance domestic strength with international firepower.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="bg-white border border-[#e2e8f0] p-8 rounded-[20px] shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="text-[#0ea5e9]" size={28} />
                <h3 className="text-[22px] font-bold tracking-tight text-[#0f172a]">Role Balance</h3>
              </div>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                A team of 11 pure batters will collapse under engine pressure. The simulation checks for structural integrity: having at least 7 batting options, 5 bowling options, and versatile all-rounders drastically improves your win probabilities.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="bg-white border border-[#e2e8f0] p-8 rounded-[20px] shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-[#0ea5e9]" size={28} />
                <h3 className="text-[22px] font-bold tracking-tight text-[#0f172a]">Franchise Cores</h3>
              </div>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Selecting a disjointed set of all-stars from 10 different franchises lowers team cohesion. Drafting a solid "core" of 3 to 5 players from the same historic IPL franchise (e.g., a CSK core or MI core) grants significant identity boosts during simulation.
              </p>
            </div>

            {/* Rule 4 */}
            <div className="bg-white border border-[#e2e8f0] p-8 rounded-[20px] shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-[#0ea5e9]" size={28} />
                <h3 className="text-[22px] font-bold tracking-tight text-[#0f172a]">Diminishing Returns</h3>
              </div>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Attempting to stack an XI entirely composed of 95+ rated legends will trigger heavy diminishing returns. The engine enforces realism; stars need role-players to support them. A balanced 89-rated synergistic team often outperforms a broken 93-rated team.
              </p>
            </div>
          </div>
        </section>

        {/* THE 16-0 MISSION */}
        <section className="mt-[160px] px-6">
          <div className="bg-[#0f172a] rounded-[32px] p-12 md:p-[80px] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-20 pointer-events-none"
                 style={{
                   background: 'radial-gradient(circle at 100% 50%, #10b981, transparent 70%)'
                 }}
            />
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <History className="text-[#34d399] mx-auto mb-8" size={48} strokeWidth={1.5} />
              <h2 className="text-[36px] md:text-[56px] font-bold tracking-tight mb-8 leading-tight">
                Thousands can win matches.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34d399] to-[#60a5fa]">Very few become legends.</span>
              </h2>
              
              <p className="text-[18px] md:text-[22px] text-[#94a3b8] leading-relaxed mb-12 max-w-2xl mx-auto">
                Build your greatest playing XI, test your strategy, climb the leaderboard, and attempt the ultimate challenge in cricket gaming.
              </p>
              
              <a href="/">
                <button className="bg-white text-[#0f172a] px-10 py-5 rounded-full font-bold text-[18px] hover:bg-[#f8fafc] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Start Your Journey Now
                </button>
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

