import { motion } from 'framer-motion';
import { ArrowLeft, Users, Trophy, Flame, AlertTriangle, Scale, Lock, Star, Target } from 'lucide-react';

const combos = [
  { p1: 'Virat Kohli', p2: 'AB de Villiers', boost: 3 },
  { p1: 'MS Dhoni', p2: 'Suresh Raina', boost: 3 },
  { p1: 'Sunil Narine', p2: 'Andre Russell', boost: 3 },
  { p1: 'Rohit Sharma', p2: 'Jasprit Bumrah', boost: 2 },
  { p1: 'MS Dhoni', p2: 'Ravindra Jadeja', boost: 2 },
  { p1: 'David Warner', p2: 'Rashid Khan', boost: 1 },
];

const candidates = [
  {
    title: 'The Balanced Dynasty',
    subtitle: 'One of the strongest balanced XIs ever assembled.',
    scoreLabel: 'Chemistry Score',
    scoreValue: 'Very High',
    strengths: [
      'Exceptional chemistry', 'Elite bowling attack', 'Strong finishers', 'Excellent role balance', 'Perfect overseas distribution'
    ],
    badges: ['Dhoni + Raina', 'Russell + Narine', 'Rohit + Bumrah', 'Dhoni + Jadeja'],
    players: [
      { pos: 'WK', name: 'MS Dhoni', year: '2013' },
      { pos: 'BAT', name: 'Virat Kohli', year: '2016' },
      { pos: 'BAT', name: 'Rohit Sharma', year: '2020' },
      { pos: 'BAT', name: 'David Warner', year: '2016' },
      { pos: 'BAT', name: 'Suresh Raina', year: '2013' },
      { pos: 'AR', name: 'Andre Russell', year: '2019' },
      { pos: 'AR', name: 'Ravindra Jadeja', year: '2021' },
      { pos: 'AR', name: 'Sunil Narine', year: '2018' },
      { pos: 'BOWL', name: 'Jasprit Bumrah', year: '2020' },
      { pos: 'BOWL', name: 'Lasith Malinga', year: '2011' },
      { pos: 'BOWL', name: 'Rashid Khan', year: '2020' },
    ]
  },
  {
    title: 'The Peak Performance XI',
    subtitle: 'Built around some of the greatest individual IPL seasons ever produced.',
    scoreLabel: 'Peak Power Rating',
    scoreValue: 'Elite',
    strengths: [
      'Explosive batting lineup', 'Multiple match winners', 'Strong spin attack', 'Massive game-changing potential'
    ],
    badges: [],
    players: [
      { pos: 'WK', name: 'MS Dhoni', year: '2013' },
      { pos: 'BAT', name: 'Virat Kohli', year: '2016' },
      { pos: 'BAT', name: 'Chris Gayle', year: '2012' },
      { pos: 'BAT', name: 'David Warner', year: '2016' },
      { pos: 'BAT', name: 'Suryakumar Yadav', year: '2023' },
      { pos: 'AR', name: 'Andre Russell', year: '2019' },
      { pos: 'AR', name: 'Ravindra Jadeja', year: '2021' },
      { pos: 'AR', name: 'Hardik Pandya', year: '2022' },
      { pos: 'BOWL', name: 'Jasprit Bumrah', year: '2020' },
      { pos: 'BOWL', name: 'Yuzvendra Chahal', year: '2022' },
      { pos: 'BOWL', name: 'Sunil Narine', year: '2018' },
    ]
  },
  {
    title: 'The IPL Legends XI',
    subtitle: 'Built from players who defined entire IPL eras.',
    scoreLabel: 'Legacy Score',
    scoreValue: 'Legendary',
    strengths: [
      'Legendary IPL pedigree', 'Elite finishers', 'Strong chemistry', 'Championship-winning core'
    ],
    badges: [],
    players: [
      { pos: 'WK', name: 'MS Dhoni', year: '2013' },
      { pos: 'BAT', name: 'Virat Kohli', year: '2016' },
      { pos: 'BAT', name: 'Rohit Sharma', year: '2020' },
      { pos: 'BAT', name: 'Suresh Raina', year: '2013' },
      { pos: 'BAT', name: 'AB de Villiers', year: '2016' },
      { pos: 'AR', name: 'Kieron Pollard', year: '2019' },
      { pos: 'AR', name: 'Ravindra Jadeja', year: '2021' },
      { pos: 'AR', name: 'Andre Russell', year: '2019' },
      { pos: 'BOWL', name: 'Jasprit Bumrah', year: '2020' },
      { pos: 'BOWL', name: 'Lasith Malinga', year: '2011' },
      { pos: 'BOWL', name: 'Yuzvendra Chahal', year: '2022' },
    ]
  }
];

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-[#0a0f16] text-white p-4 md:p-12 pb-32 font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      
      {/* Top Nav */}
      <div className="max-w-4xl mx-auto mb-12 relative z-10">
        <a href="/">
          <motion.div whileHover={{ x: -5 }} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer font-semibold uppercase tracking-wider text-xs">
            <ArrowLeft size={16} /> Back to Draft
          </motion.div>
        </a>
      </div>

      <div className="max-w-4xl mx-auto space-y-24 relative z-10">
        
        {/* HERO SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-[100px] -z-10" />
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-700 pb-2">
            What is 16-0?
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            A strategic team-building challenge where you attempt to draft the <strong className="text-white">greatest IPL Playing XI of all time</strong>.
          </p>
          <p className="mt-4 text-gray-500 text-lg">
            Choose players from <strong>any</strong> IPL season (2008–2026).
            <br />The objective is simple: Build the strongest legal XI possible.
          </p>
          <div className="mt-8 inline-block bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm text-yellow-500/80 font-mono text-sm uppercase tracking-widest shadow-2xl">
            Caution: The strongest team is <strong className="text-yellow-400">NOT</strong> always the team with the highest ratings.
          </div>
        </motion.section>

        {/* RULES SECTION */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <Scale className="text-blue-400" size={32} />
            <h2 className="text-3xl font-bold">Team Building Rules</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Rule 1 */}
            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lock size={100} />
              </div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Rule 1</span> Max 4 Overseas</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                A Playing XI can contain at most 4 overseas players. The interface will automatically lock once you reach this limit.
              </p>
              <div className="bg-black/40 rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="text-green-400 flex items-center gap-2">✅ ABD (2016)</div>
                <div className="text-green-400 flex items-center gap-2">✅ Warner (2016)</div>
                <div className="text-green-400 flex items-center gap-2">✅ Narine (2018)</div>
                <div className="text-green-400 flex items-center gap-2">✅ Russell (2019)</div>
                <div className="h-px bg-gray-800 my-2" />
                <div className="text-red-400 flex items-center gap-2 opacity-60">❌ Cannot add Rashid Khan</div>
              </div>
            </motion.div>

            {/* Rule 2 */}
            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 relative overflow-hidden shadow-xl">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">Rule 2</span> Strength ≠ Rating</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                The game does not simply average player ratings. An 89-rated synergistic team will outperform a 92-rated random collection of stars.
              </p>
              
              <div className="bg-black/40 rounded-xl p-4 flex flex-col items-center justify-center h-40">
                <div className="text-center font-bold text-lg mb-2">Team Strength =</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-gray-800 px-3 py-1.5 rounded-lg text-gray-300">Player Ratings</span>
                  <span className="text-green-400 font-black">+</span>
                  <span className="bg-green-900/30 border border-green-800/50 text-green-400 px-3 py-1.5 rounded-lg">Bonuses</span>
                  <span className="text-red-400 font-black">-</span>
                  <span className="bg-red-900/30 border border-red-800/50 text-red-400 px-3 py-1.5 rounded-lg">Penalties</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CHEMISTRY BONUSES */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <Flame className="text-orange-500" size={32} />
            <h2 className="text-3xl font-bold">Hidden Chemistry Bonuses</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-2xl text-lg">
            Certain legendary partnerships receive hidden chemistry boosts. Drafting historic duos will permanently increase your overall team strength.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {combos.map((c, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="bg-gradient-to-br from-orange-900/20 to-red-900/10 border border-orange-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="font-bold text-sm text-gray-200 mb-1 z-10">{c.p1}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 z-10">&</div>
                <div className="font-bold text-sm text-gray-200 mb-4 z-10">{c.p2}</div>
                
                <div className="bg-orange-500 text-black font-black text-xl px-4 py-1 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)] z-10">
                  +{c.boost}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PENALTIES */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <AlertTriangle className="text-red-500" size={32} />
            <h2 className="text-3xl font-bold">Stacking Too Many Superstars</h2>
          </div>
          
          <div className="bg-gradient-to-br from-[#1a1515] to-[#0f0a0a] border border-red-900/30 rounded-3xl p-6 md:p-10 shadow-2xl">
            <p className="text-gray-400 mb-8 max-w-2xl text-lg leading-relaxed">
              Many users believe selecting 11 legends guarantees a 16-0 season. <strong className="text-red-400">This is false.</strong> The game applies harsh diminishing returns to prevent identical &quot;meta&quot; teams.
            </p>
            
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold">95+ Rated Player Penalty Scale</div>
              
              {[
                { n: '1st', label: 'First player', pen: 'No penalty', color: 'bg-green-500' },
                { n: '2nd', label: 'Second player', pen: 'No penalty', color: 'bg-green-500' },
                { n: '3rd', label: 'Third player', pen: '-2 Team Score', color: 'bg-orange-500', width: '30%' },
                { n: '4th', label: 'Fourth player', pen: '-4 Team Score', color: 'bg-red-500', width: '60%' },
                { n: '5th', label: 'Fifth player', pen: '-6 Team Score', color: 'bg-red-700', width: '100%' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-4 bg-black/40 rounded-xl p-3 relative overflow-hidden">
                  {row.width && (
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: row.width }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`absolute top-0 bottom-0 right-0 ${row.color} opacity-10`} 
                    />
                  )}
                  <div className="w-10 text-center text-xs font-mono font-bold text-gray-500">{row.n}</div>
                  <div className="flex-1 font-semibold text-sm">{row.label}</div>
                  <div className={`text-sm font-bold ${row.pen === 'No penalty' ? 'text-green-400' : 'text-red-400'}`}>{row.pen}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM DIVERSITY */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <Users className="text-teal-400" size={32} />
            <h2 className="text-3xl font-bold">Team Diversity Bonus</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-2xl text-lg">
            A balanced squad is mathematically superior to a team crammed with 11 pure batters. To unlock the highest simulation odds, your squad should resemble a real T20 franchise.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Top-Order Anchors', 'Aggressive Finishers', 'Pace Bowling All-Rounders', 'Mystery Spinners', 'Death Bowlers'].map(role => (
              <div key={role} className="bg-teal-900/20 border border-teal-800/30 text-teal-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm">
                <Target size={14} /> {role}
              </div>
            ))}
          </div>
        </section>

        {/* THE SECRET OF 16-0 */}
        <section className="relative py-20 my-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-[#0a0f16] to-[#0a0f16] -z-10" />
          <div className="text-center max-w-3xl mx-auto">
            <Star className="text-yellow-500 mx-auto mb-6" size={48} />
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight">The Perfect Team Exists.</h2>
            <p className="text-xl text-gray-300 leading-relaxed mb-6">
              Somewhere in the game engine, there are a handful of playing XIs mathematically capable of simulating a flawless 16-0 season on Hard difficulty.
            </p>
            <p className="text-lg text-gray-500 mb-8">
              Not every user will discover them. Not every user will build them. The strongest XI is locked behind a delicate balance of chemistry bonuses, era coverage, budget constraints, and overseas restrictions.
            </p>
            <div className="inline-block bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              Finding it is the game.
            </div>
          </div>
        </section>

        {/* ULTIMATE XI CANDIDATES */}
        <section>
          <div className="flex items-center gap-4 mb-8 justify-center">
            <Trophy className="text-yellow-400" size={32} />
            <h2 className="text-3xl font-bold">Ultimate XI Candidates</h2>
          </div>
          <p className="text-center text-gray-400 mb-12 text-lg max-w-3xl mx-auto leading-relaxed">
            These are some of the strongest legal Playing XIs discovered so far. Each team is built using different philosophies such as chemistry, peak performance, role balance, and historical impact. 
            <strong className="text-white block mt-2">There may still be stronger combinations waiting to be discovered.</strong>
          </p>

          <div className="space-y-12">
            {candidates.map((cand, idx) => (
              <div key={idx} className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                
                <div className="text-center mb-10">
                  <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2">Candidate #{idx + 1}</div>
                  <h2 className="text-3xl font-black text-white">{cand.title}</h2>
                  <p className="text-gray-400 mt-2 text-sm">{cand.subtitle}</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Players list split into two columns internally for better layout, or just one list if small */}
                  <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                    {cand.players.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors cursor-default">
                        <div className="w-10 text-center font-bold text-[10px] text-gray-500 uppercase">{p.pos}</div>
                        <div className="flex-1 font-bold text-sm text-gray-200">{p.name}</div>
                        <div className="text-xs text-yellow-500 font-mono bg-yellow-500/10 px-2 py-1 rounded">{p.year}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sidebar stats */}
                  <div className="bg-[#0f141e] rounded-2xl p-6 border border-gray-800 space-y-6">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{cand.scoreLabel}</div>
                      <div className="text-2xl font-black text-yellow-400">{cand.scoreValue}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Key Strengths</div>
                      <ul className="space-y-2">
                        {cand.strengths.map(s => (
                          <li key={s} className="flex items-start gap-2 text-sm text-gray-300">
                            <Target size={14} className="text-teal-500 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {cand.badges.length > 0 && (
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Chemistry Links</div>
                        <div className="flex flex-wrap gap-2">
                          {cand.badges.map(b => (
                            <span key={b} className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-1 rounded font-bold">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center text-sm text-gray-500 border-t border-gray-800 pt-8 max-w-2xl mx-auto">
            There is no officially confirmed strongest XI. These lineups represent some of the strongest combinations discovered so far. Experiment with chemistry, ratings, eras, and team balance to discover your own Ultimate XI.
          </div>
        </section>

        {/* DISCOVERY SYSTEM / LEADERBOARD PLACEHOLDER */}
        <section>
          <div className="flex items-center gap-4 mb-8 justify-center">
            <Trophy className="text-yellow-400" size={32} />
            <h2 className="text-3xl font-bold">Ultimate XI Discovery System</h2>
          </div>
          <p className="text-center text-gray-400 mb-10 text-sm max-w-xl mx-auto">
            (Coming Soon) Compete globally to discover the most optimized squads. Submit your 16-0 runs and climb the discovery leaderboards.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Highest Team Strength', icon: '💪' },
              { title: 'Most Chemistry', icon: '🧪' },
              { title: 'Best Budget Team', icon: '🪙' },
              { title: 'Fastest 16-0 Run', icon: '⚡' },
            ].map(l => (
              <div key={l.title} className="bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed shadow-inner">
                <div className="text-3xl mb-3">{l.icon}</div>
                <div className="text-sm font-bold text-gray-300 leading-tight">{l.title}</div>
                <div className="text-[10px] text-gray-600 uppercase mt-4 tracking-widest">Locked</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
