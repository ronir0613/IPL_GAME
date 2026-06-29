import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2, Building2, Coins, ShieldCheck, Scale, Target, Users, Info } from 'lucide-react';

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
          className="text-center relative py-[192px] px-6 overflow-hidden rounded-[12px] bg-white mx-4 mt-4 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] border border-[#ebebeb]"
        >
          {/* Mesh gradient as atmospheric background */}
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.2] pointer-events-none -z-10"
               style={{
                 background: 'radial-gradient(circle at 15% 50%, #007cf0, transparent 40%), radial-gradient(circle at 85% 30%, #ff0080, transparent 40%), radial-gradient(circle at 50% 80%, #f9cb28, transparent 40%)',
                 filter: 'blur(60px)'
               }}
          />
          
          <div className="font-mono text-[12px] uppercase tracking-widest text-[#888888] mb-6">Engine Architecture</div>
          <h1 className="text-[48px] md:text-[64px] font-semibold mb-6 tracking-[-2.4px] text-[#171717] leading-tight">
            Understand the Game.
          </h1>
          <p className="text-[18px] text-[#4d4d4d] max-w-2xl mx-auto leading-[28px]">
            The 16-0 engine powers a deterministic cricket simulation where your drafting choices dictate every boundary, wicket, and championship run. Explore the mechanics below.
          </p>
        </motion.section>

        {/* THE MODES SECTION */}
        <section className="mt-[192px] px-6">
          <div className="text-center mb-16">
             <div className="font-mono text-[12px] uppercase tracking-widest text-[#888888] mb-4">Gameplay</div>
             <h2 className="text-[32px] font-semibold tracking-[-1.28px] text-[#171717]">The Modes.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Classic */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#ebebeb] rounded-[8px] p-8 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] flex flex-col items-start">
              <div className="bg-[#fafafa] p-4 rounded-full mb-6 border border-[#ebebeb]">
                <Gamepad2 className="text-[#007cf0]" size={32} />
              </div>
              <h3 className="text-[24px] font-semibold tracking-[-0.96px] mb-4">Classic</h3>
              <p className="text-[16px] text-[#4d4d4d] leading-[24px]">
                The quintessential 16-0 experience. Build your all-time IPL XI, simulate a full season against powerful AI franchises, and attempt to achieve the elusive perfect undefeated run.
              </p>
            </motion.div>

            {/* Franchise */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#ebebeb] rounded-[8px] p-8 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] flex flex-col items-start">
              <div className="bg-[#fafafa] p-4 rounded-full mb-6 border border-[#ebebeb]">
                <Building2 className="text-[#7928ca]" size={32} />
              </div>
              <h3 className="text-[24px] font-semibold tracking-[-0.96px] mb-4">Franchise</h3>
              <p className="text-[16px] text-[#4d4d4d] leading-[24px]">
                Take long-term control. Manage budgets, negotiate contracts, and navigate player aging across multiple seasons to establish an unstoppable historic dynasty.
              </p>
            </motion.div>

            {/* Gamble */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#ebebeb] rounded-[8px] p-8 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] flex flex-col items-start">
              <div className="bg-[#fafafa] p-4 rounded-full mb-6 border border-[#ebebeb]">
                <Coins className="text-[#ff4d4d]" size={32} />
              </div>
              <h3 className="text-[24px] font-semibold tracking-[-0.96px] mb-4">Gamble</h3>
              <p className="text-[16px] text-[#4d4d4d] leading-[24px]">
                High stakes, high rewards. Wager your built-up currency on specific match outcomes, player milestones, and playoff brackets to multiply your resources.
              </p>
            </motion.div>
          </div>
        </section>

        {/* PLAYER RATINGS DISTRIBUTION */}
        <section className="mt-[192px] px-6">
          <div className="bg-[#171717] rounded-[12px] p-12 md:p-[64px] text-[#ffffff] shadow-[0_2px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.1)]">
            <div className="max-w-4xl mx-auto">
              <div className="font-mono text-[12px] uppercase tracking-widest text-[#a1a1a1] mb-4">Scaling</div>
              <h2 className="text-[32px] font-semibold tracking-[-1.28px] mb-8">Player Ratings Distribution.</h2>
              
              <div className="space-y-6">
                <p className="text-[18px] text-[#a1a1a1] leading-[28px] mb-6">
                  Player ratings range dynamically from 70 to 99, calculated precisely from historical performance, peak consistency, and contextual impact during their specific IPL season. 
                </p>

                <div className="bg-[#262626] border border-[#333] rounded-[8px] p-5 mb-12 flex items-start gap-4">
                  <div className="text-[#a1a1a1] mt-0.5 shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-medium text-[#f2f2f2] mb-1">Note on Ratings</h4>
                    <p className="text-[14px] text-[#888888] leading-[22px]">
                      Ratings are internally balanced specifically for the 16-0 simulation engine. They are subjective approximations meant to ensure competitive gameplay, and do not serve as definitive rankings of real-life abilities or historical greatness.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    { label: 'Legendary', range: '95 - 99', desc: 'The absolute peak seasons (e.g., Kohli 2016). Rare, match-winning, game-breaking capability.', color: 'border-[#ff0080]' },
                    { label: 'Elite', range: '90 - 94', desc: 'Consistent top-tier performers and MVP candidates. The backbone of championship teams.', color: 'border-[#7928ca]' },
                    { label: 'Star', range: '85 - 89', desc: 'Highly reliable match-winners who command their roles with authority.', color: 'border-[#007cf0]' },
                    { label: 'Solid', range: '80 - 84', desc: 'Quality standard players. Good contributors but require strategic support.', color: 'border-[#50e3c2]' },
                    { label: 'Depth', range: '70 - 79', desc: 'Bench players and role-fillers. High variance in performance.', color: 'border-[#a1a1a1]' },
                  ].map((tier, idx) => (
                    <div key={idx} className={`flex flex-col md:flex-row md:items-center gap-4 bg-[#262626] p-6 rounded-[8px] border-l-[4px] ${tier.color} shadow-sm`}>
                      <div className="w-32 font-semibold text-[18px] tracking-tight">{tier.label}</div>
                      <div className="font-mono text-[13px] bg-[#171717] px-3 py-1 rounded-[4px] border border-[#333]">{tier.range}</div>
                      <div className="text-[14px] text-[#a1a1a1] flex-1 leading-[24px]">{tier.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM BUILDING GUIDE */}
        <section className="mt-[192px] px-6">
          <div className="text-center mb-16">
             <div className="font-mono text-[12px] uppercase tracking-widest text-[#888888] mb-4">Strategy</div>
             <h2 className="text-[32px] font-semibold tracking-[-1.28px] text-[#171717]">Team Building Guide.</h2>
             <p className="text-[18px] text-[#4d4d4d] max-w-2xl mx-auto mt-4 leading-[28px]">
               Raw rating averages do not guarantee success. The engine rewards synergistic, balanced teams that adhere to real-world franchise constraints.
             </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Rule 1 */}
            <div className="bg-white border border-[#ebebeb] p-8 rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-[#171717]" size={24} />
                <h3 className="text-[20px] font-semibold tracking-[-0.6px]">The Overseas Rule</h3>
              </div>
              <p className="text-[16px] text-[#4d4d4d] leading-[24px]">
                Like real life, your Playing XI is strictly limited to a maximum of 4 overseas players. Fielding 5 or more overseas players breaks regulations and immediately invalidates your lineup. You must balance domestic strength with international firepower.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="bg-white border border-[#ebebeb] p-8 rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="text-[#171717]" size={24} />
                <h3 className="text-[20px] font-semibold tracking-[-0.6px]">Role Balance</h3>
              </div>
              <p className="text-[16px] text-[#4d4d4d] leading-[24px]">
                A team of 11 pure batters will collapse under engine pressure. The simulation checks for structural integrity: having at least 7 batting options, 5 bowling options, and versatile all-rounders drastically improves your win probabilities.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="bg-white border border-[#ebebeb] p-8 rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-[#171717]" size={24} />
                <h3 className="text-[20px] font-semibold tracking-[-0.6px]">Franchise Cores</h3>
              </div>
              <p className="text-[16px] text-[#4d4d4d] leading-[24px]">
                Selecting a disjointed set of all-stars from 10 different franchises lowers team cohesion. Drafting a solid "core" of 3 to 5 players from the same historic IPL franchise (e.g., a CSK core or MI core) grants significant identity boosts during simulation.
              </p>
            </div>

            {/* Rule 4 */}
            <div className="bg-white border border-[#ebebeb] p-8 rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-[#171717]" size={24} />
                <h3 className="text-[20px] font-semibold tracking-[-0.6px]">Diminishing Returns</h3>
              </div>
              <p className="text-[16px] text-[#4d4d4d] leading-[24px]">
                Attempting to stack an XI entirely composed of 95+ rated legends will trigger heavy diminishing returns. The engine enforces realism; stars need role-players to support them. A balanced 89-rated synergistic team often outperforms a broken 93-rated team.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
