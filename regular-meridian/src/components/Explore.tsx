import { motion } from 'framer-motion';
import { ArrowLeft, Users, Target, Activity, History, Medal, Trophy } from 'lucide-react';

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
            The Ultimate Strategy Simulator
          </div>
          <h1 className="text-[48px] md:text-[72px] font-bold mb-6 tracking-tight text-[#0f172a] leading-[1.1]">
            Can You Achieve <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#10b981]">The Perfect Season?</span>
          </h1>
          <p className="text-[18px] md:text-[20px] text-[#475569] max-w-2xl mx-auto leading-relaxed">
            Build your greatest playing XI, master cricket team management, and attempt to achieve the impossible: a perfect 16-0 season. One loss ends the dream. Sixteen wins creates history.
          </p>
        </motion.section>

        {/* CORE PILLARS */}
        <section className="mt-[120px] px-6">
          <div className="text-center mb-16">
             <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-[#0f172a]">The 16-0 Experience.</h2>
             <p className="text-[16px] md:text-[18px] text-[#64748b] max-w-2xl mx-auto mt-4 leading-relaxed">
               Inspired by the excitement of franchise cricket, 16-0play combines the thrill of competitive sports with deep strategic gameplay.
             </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Build XI */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#e2e8f0] rounded-[20px] p-8 shadow-sm hover:shadow-md transition-all">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-blue-100">
                <Users className="text-blue-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-4 text-[#0f172a]">Build Your Greatest XI</h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Choose from legendary players, modern superstars, and all-time greats. Success isn't just about high ratings—you must balance batting depth, bowling strength, all-rounders, and team chemistry.
              </p>
            </motion.div>

            {/* Strategy */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#e2e8f0] rounded-[20px] p-8 shadow-sm hover:shadow-md transition-all">
              <div className="bg-emerald-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-emerald-100">
                <Target className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-4 text-[#0f172a]">Ultimate Strategy Challenge</h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                More than just a simulator, this is a strategy game where every match matters. Face difficult opponents, changing conditions, and pressure situations that test your ability to manage a winning team.
              </p>
            </motion.div>

            {/* Compete */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#e2e8f0] rounded-[20px] p-8 shadow-sm hover:shadow-md transition-all">
              <div className="bg-amber-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-amber-100">
                <Medal className="text-amber-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-4 text-[#0f172a]">Compete for the Best Record</h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                Track your season record, compare results with other players on the global leaderboard, and discover who has built the greatest cricket team. Every campaign becomes part of your story.
              </p>
            </motion.div>

            {/* Unpredictability */}
            <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#e2e8f0] rounded-[20px] p-8 shadow-sm hover:shadow-md transition-all">
              <div className="bg-purple-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-purple-100">
                <Activity className="text-purple-600" size={32} />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-4 text-[#0f172a]">Every Season is Different</h3>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                No two seasons are exactly alike. Momentum, tactical decisions, and a bit of luck play a role. Will you play aggressively to chase dominance, or build a balanced squad to survive the pressure?
              </p>
            </motion.div>
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

