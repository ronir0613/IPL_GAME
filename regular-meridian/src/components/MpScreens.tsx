import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Settings, Play, ArrowRight, User, Shield, Swords, RefreshCw, Volume2, ShieldAlert, MessageSquare, X, Send, Trophy, LogOut, ClipboardList, Gavel, ChevronDown, HelpCircle } from 'lucide-react';
import type { Player, MpPlayer, MpSettings, MpState, MatchResult, MatchPrepConfig } from '@/lib/types';
import { IPL_TEAMS } from '@/lib/types';
import { ratingColor, initials } from '@/lib/engine';
import { getBidIncrement } from '@/lib/multiplayer';

// Helper: rating color utility (local fallback if needed)
function getRatingBg(rating: number) {
  return ratingColor(rating);
}

// ─── Multiplayer Lobby Screen ──────────────────────────────────────────────
interface MpLobbyScreenProps {
  state: MpState;
  peerId: string;
  onUpdateSettings: (settings: MpSettings) => void;
  onSelectFranchise: (franchise: string) => void;
  onStartDraft: () => void;
  onLeave: () => void;
}

export function MpLobbyScreen({ state, peerId, onUpdateSettings, onSelectFranchise, onStartDraft, onLeave }: MpLobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const hostPlayer = useMemo(() => state.players.find(p => p.isHost), [state.players]);
  const localPlayer = useMemo(() => state.players.find(p => p.peerId === peerId), [state.players, peerId]);
  const localPlayerFranchiseData = useMemo(() => IPL_TEAMS.find(t => t.short === localPlayer?.franchise), [localPlayer]);

  const availableFranchises = useMemo(() => {
    return IPL_TEAMS.filter(t => !state.players.some(p => p.peerId !== peerId && p.franchise === t.short));
  }, [state.players, peerId]);

  const copyCode = () => {
    navigator.clipboard.writeText(state.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettingChange = (field: keyof MpSettings, value: any) => {
    if (!state.isHost) return;
    onUpdateSettings({
      ...state.settings,
      [field]: value
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-3 md:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl card p-5 md:p-6 border border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md shadow-2xl rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 animate-rgb-strip" />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-[var(--card-border)] pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-[var(--text-primary)]">Multiplayer Lobby</h1>
            <p className="text-[var(--text-muted)] text-sm">Organize squad auction and league settings</p>
          </div>
          <button onClick={onLeave} className="btn-secondary px-4 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase rounded-lg">
            Leave Room
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Franchise Selector Grid */}
          <div className="space-y-4">
            {/* Franchise Selector Grid */}
            <div className="bg-[var(--color-canvas-soft)]/50 backdrop-blur-md p-4 rounded-2xl border border-[var(--card-border)]">
              <label className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest block mb-2.5">Choose Your Franchise</label>
              <div className="grid grid-cols-2 gap-2">
                {IPL_TEAMS.slice(0, 10).map((t) => {
                  const owner = state.players.find(p => p.franchise === t.short);
                  const isSelf = owner?.peerId === peerId;
                  const isTaken = !!owner && !isSelf;

                  return (
                    <button
                      key={t.short}
                      disabled={isTaken}
                      onClick={() => onSelectFranchise(t.short)}
                      className={`relative px-3 py-2 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-[64px] overflow-hidden cursor-pointer ${
                        isSelf
                          ? 'bg-[var(--card-bg)] shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                          : isTaken
                          ? 'bg-black/25 opacity-30 border-[var(--card-border)] cursor-not-allowed'
                          : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:border-blue-500/50 hover:scale-[1.02]'
                      }`}
                      style={{
                        borderColor: isSelf ? t.color : undefined
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: t.color }} />
                      
                      <div className="flex flex-col justify-between h-full pt-1 w-full">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)] truncate max-w-[85%]">
                            {t.name}
                          </span>
                          {isSelf && (
                            <span className="text-[9px] text-green-400 font-bold bg-green-500/10 px-1 py-0.2 rounded flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center w-full mt-1.5">
                          <span className="text-[9px] font-mono font-extrabold px-1 py-0.2 rounded" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                            {t.short}
                          </span>
                          {isTaken && (
                            <span className="text-[8px] text-[var(--text-muted)] italic truncate max-w-[65%]">
                              {owner.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Room Code, Players, Settings, Start */}
          <div className="space-y-4">
            {/* Room Code */}
            <div className="bg-[var(--color-canvas-soft)]/50 backdrop-blur-md p-4 rounded-xl border border-[var(--card-border)] relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-widest block mb-0.5">Active Room Code</label>
                  <span className="text-2xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 filter drop-shadow-[0_2px_8px_rgba(59,130,246,0.2)]">{state.roomId}</span>
                </div>
                <button onClick={copyCode} className="btn-primary px-4 py-2 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  {copied ? <Check size={13} className="text-green-300" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Auction Settings */}
            <div className="bg-[var(--color-canvas-soft)]/50 backdrop-blur-md p-4 rounded-xl border border-[var(--card-border)]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5 border-b border-[var(--card-border)] pb-1.5">
                <Settings size={14} /> Auction Settings
              </h3>

              <div className="space-y-3">
                {/* Rounds */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold text-[var(--text-primary)]">Rounds (Picks)</span>
                    <span className="text-blue-400 font-bold">{state.settings.rounds} rounds</span>
                  </div>
                  {state.isHost ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleSettingChange('rounds', 11)} className={`py-1 rounded-lg border text-[10px] font-bold transition-all ${state.settings.rounds === 11 ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-[var(--card-border)] hover:bg-[var(--card-bg)]'}`}>
                        11 (XI Only)
                      </button>
                      <button onClick={() => handleSettingChange('rounds', 15)} className={`py-1 rounded-lg border text-[10px] font-bold transition-all ${state.settings.rounds === 15 ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-[var(--card-border)] hover:bg-[var(--card-bg)]'}`}>
                        15 (With Bench)
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[var(--text-muted)] italic">Managed by host</div>
                  )}
                </div>

                {/* Pick Timer & Overseas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-[var(--text-primary)]">Timer</span>
                      <span className="text-blue-400 font-bold">{state.settings.turnTimer}s</span>
                    </div>
                    {state.isHost ? (
                      <select
                        value={state.settings.turnTimer}
                        onChange={(e) => handleSettingChange('turnTimer', parseInt(e.target.value))}
                        className="w-full px-2 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md text-[var(--text-primary)] font-bold text-[10px] focus:outline-none"
                      >
                        <option value={20} className="bg-white text-neutral-900">20 Seconds</option>
                        <option value={30} className="bg-white text-neutral-900">30 Seconds</option>
                        <option value={45} className="bg-white text-neutral-900">45 Seconds</option>
                      </select>
                    ) : (
                      <div className="text-[10px] text-[var(--text-muted)] italic">Managed by host</div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-[var(--text-primary)]">Overseas Limit</span>
                      <span className="text-blue-400 font-bold">{state.settings.maxOverseas} OS</span>
                    </div>
                    {state.isHost ? (
                      <select
                        value={state.settings.maxOverseas}
                        onChange={(e) => handleSettingChange('maxOverseas', parseInt(e.target.value))}
                        className="w-full px-2 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md text-[var(--text-primary)] font-bold text-[10px] focus:outline-none"
                      >
                        <option value={4} className="bg-white text-neutral-900">4 Players Max</option>
                        <option value={5} className="bg-white text-neutral-900">5 Players Max</option>
                      </select>
                    ) : (
                      <div className="text-[10px] text-[var(--text-muted)] italic">Managed by host</div>
                    )}
                  </div>
                </div>

                {/* Auction Format */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold text-[var(--text-primary)]">Auction Format</span>
                    <span className="text-blue-400 font-bold">{state.settings.auctionFormat === 'long' ? 'Longer (320 Players)' : 'Shorter (140 Players)'}</span>
                  </div>
                  {state.isHost ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleSettingChange('auctionFormat', 'short')} 
                        className={`py-1 rounded-lg border text-[10px] font-bold transition-all ${state.settings.auctionFormat !== 'long' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-[var(--card-border)] hover:bg-[var(--card-bg)]'}`}
                      >
                        Shorter (140)
                      </button>
                      <button 
                        onClick={() => handleSettingChange('auctionFormat', 'long')} 
                        className={`py-1 rounded-lg border text-[10px] font-bold transition-all ${state.settings.auctionFormat === 'long' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-[var(--card-border)] hover:bg-[var(--card-bg)]'}`}
                      >
                        Longer (320)
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[var(--text-muted)] italic">Managed by host</div>
                  )}
                </div>
              </div>
            </div>

            {/* Connected Players */}
            <div className="bg-[var(--color-canvas-soft)]/50 backdrop-blur-md p-4 rounded-xl border border-[var(--card-border)]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Users size={14} /> Players Connected ({state.players.length}/10)
                </h3>
                {10 - state.players.length > 0 && (
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded-full font-bold">
                    +{10 - state.players.length} AI Teams
                  </span>
                )}
              </div>
              
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {state.players.map((p) => {
                  const franchiseData = IPL_TEAMS.find(t => t.short === p.franchise);
                  return (
                    <motion.div
                      layoutId={`player-${p.peerId}`}
                      key={p.peerId}
                      className="flex justify-between items-center p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[9px]"
                          style={{ backgroundColor: franchiseData?.color || '#374151' }}
                        >
                          {p.franchise === 'TBD' ? '?' : p.franchise}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)] flex items-center gap-1 font-sans">
                            {p.name}
                            {p.isHost && <Shield size={10} className="text-yellow-400" />}
                            {p.peerId === peerId && <span className="text-[9px] text-gray-500">(You)</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] text-[var(--text-muted)]">Connected</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            {state.isHost ? (
              <div className="space-y-2">
                <button
                  onClick={onStartDraft}
                  disabled={state.players.length < 2 || state.players.some(p => p.franchise === 'TBD')}
                  className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  Start Auction
                </button>
                {state.players.some(p => p.franchise === 'TBD') && (
                  <p className="text-center text-[10px] text-yellow-500 font-semibold animate-pulse">
                    Waiting for all players to select a franchise.
                  </p>
                )}
                {state.players.length < 2 && (
                  <p className="text-center text-[10px] text-[var(--text-muted)]">
                    Need at least 2 players to start auction
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl text-center text-xs text-yellow-500 font-medium">
                Waiting for the host to launch the auction...
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface MpDraftScreenProps {
  state: MpState;
  players: Player[]; // complete player pool
  peerId: string;
  onPlaceBid: (bid: number) => void;
  onForceStartSeason: () => void;
  onSkipPlayer: () => void;
}

export function MpDraftScreen({ state, players, peerId, onPlaceBid, onForceStartSeason, onSkipPlayer }: MpDraftScreenProps) {
  const [activeInspector, setActiveInspector] = useState<string>(peerId); // view roster tab
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const myRoster = useMemo(() => state.rosters[peerId] || [], [state.rosters, peerId]);
  const myPurse = useMemo(() => state.purses[peerId] ?? 12000, [state.purses, peerId]);

  const activePlayer = state.activeAuctionPlayer;
  const currentBid = state.currentBid;
  const highestBidder = state.highestBidder;
  const bidTimer = state.bidTimer;

  // Next Bid price calculation
  const nextIncrement = getBidIncrement(currentBid);
  const nextBidPrice = currentBid + nextIncrement;

  // Bidding states
  const isBiddingActive = highestBidder !== null;
  const bidPriceToPlace = isBiddingActive ? nextBidPrice : currentBid;

  // Roster checks
  const myOverseasCount = myRoster.filter(p => p.is_overseas).length;
  const isRosterFull = myRoster.length >= state.settings.rounds;

  // Reserve check: keep at least ₹20L per remaining slot
  const minRequiredReserve = (state.settings.rounds - myRoster.length - 1) * 20;
  const hasPurseForBid = myPurse - bidPriceToPlace >= minRequiredReserve;
  
  // Can place bid checks
  const isHighestBidderSelf = highestBidder === peerId;
  const isOverseasCapHit = activePlayer?.is_overseas && myOverseasCount >= state.settings.maxOverseas;
  const canBid = !isRosterFull && !isHighestBidderSelf && hasPurseForBid && !isOverseasCapHit;
  const hasSkipped = state.skippedPeers?.includes(peerId) || false;

  // Check if all human teams have at least 11 players
  const humanPlayers = state.players.filter(p => p.franchise !== 'TBD');
  const readyHumanCount = humanPlayers.filter(p => (state.rosters[p.peerId] || []).length >= 11).length;
  const readyForForceStart = humanPlayers.length > 0 && readyHumanCount === humanPlayers.length;

  // Filter out AI teams from Standings
  const humanTeamIds = useMemo(() => {
    return state.draftOrder.filter(id => !id.startsWith('AI_'));
  }, [state.draftOrder]);

  // Get name of highest bidder
  const highestBidderName = useMemo(() => {
    if (!highestBidder) return 'Base Price';
    if (highestBidder === peerId) return 'YOU';
    if (highestBidder.startsWith('AI_')) {
      return `AI - ${highestBidder.split('_')[1]}`;
    }
    const clientPlayer = state.players.find(p => p.peerId === highestBidder);
    return clientPlayer ? clientPlayer.name : 'Client';
  }, [highestBidder, state.players, peerId]);

  // Get color of highest bidder
  const highestBidderColor = useMemo(() => {
    if (!highestBidder) return 'var(--text-muted)';
    if (highestBidder.startsWith('AI_')) {
      const code = highestBidder.split('_')[1];
      return IPL_TEAMS.find(t => t.short === code)?.color || '#555';
    }
    const clientPlayer = state.players.find(p => p.peerId === highestBidder);
    return IPL_TEAMS.find(t => t.short === clientPlayer?.franchise)?.color || '#3b82f6';
  }, [highestBidder, state.players]);

  // Current active set details
  const currentSetName = activePlayer?.set_name || 'Marquee Set';
  const totalInActiveSet = players.filter(p => p.set_name === currentSetName).length;
  const pickedInActiveSet = players.filter(p => p.set_name === currentSetName && state.pickedIds.includes(p.id)).length;

  return (
    <div className="h-auto lg:h-[calc(100vh-76px)] flex flex-col p-4 md:p-5 bg-[var(--color-canvas-soft)] text-[var(--text-primary)] overflow-y-auto lg:overflow-hidden font-sans">
      {/* Compact Header Row */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-6 py-3.5 mb-4 gap-4 shadow-lg shrink-0">
        <div>
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
            {state.isAcceleratedRound ? 'ACCELERATED ROUND' : 'CURRENT PLAYER SET'}
          </div>
          <div className="text-base font-black text-[var(--text-primary)] truncate flex items-center gap-2">
            <span>{currentSetName}</span>
            <span className="text-xs text-[var(--text-primary)] font-bold bg-[var(--color-canvas-soft-2)] px-2 py-0.5 rounded-full border border-[var(--card-border)]">
              {pickedInActiveSet + (activePlayer ? 1 : 0)} / {totalInActiveSet}
            </span>
          </div>
        </div>

        {/* Compact Bidding Timer / Info */}
        <div className="flex items-center gap-4 bg-[var(--color-canvas-soft-2)] px-5 py-2 rounded-xl border border-[var(--card-border)] shadow-inner">
          <div className="text-right">
            <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">CURRENT BIDDER</div>
            <div className="text-sm font-black tracking-tight" style={{ color: highestBidderColor }}>
              {highestBidderName} · <span className="text-blue-600 dark:text-blue-400 font-extrabold">₹{(currentBid / 100).toFixed(2)} Cr</span>
            </div>
          </div>
          <div className="w-px h-6 bg-[var(--card-border)]" />
          <div className="flex items-center justify-center">
            <span className={`text-2xl font-mono font-black filter drop-shadow ${bidTimer <= 3 ? 'text-red-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`}>
              {bidTimer}s
            </span>
          </div>
        </div>

        {/* Action Controls & Status */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-canvas-soft-2)] border border-[var(--card-border)] hover:border-neutral-500 rounded-xl text-xs font-bold text-[var(--text-primary)] transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ClipboardList size={12} />
            <span>Logs ({state.auctionLogs.length})</span>
          </button>
          
          <div className="w-px h-6 bg-[var(--card-border)]" />

          {state.isHost ? (
            <button
              onClick={onForceStartSeason}
              disabled={!readyForForceStart}
              className={`py-2.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow ${readyForForceStart ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white cursor-pointer' : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'}`}
            >
              <Play size={12} />
              Start Season ({readyHumanCount}/{humanPlayers.length} Ready)
            </button>
          ) : (
            <div className="text-right text-xs">
              <div className="font-bold text-[var(--text-primary)]">Roster: {myRoster.length}/15</div>
              <div className="text-green-400 font-extrabold mt-0.5">Purse: ₹{(myPurse / 100).toFixed(2)} Cr</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Drafting 3-Column Layout */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 pb-2">
        {/* Left Column: Franchises Standings (Human Only) */}
        <div className="flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 overflow-hidden shadow-lg h-[280px] lg:h-full">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3 flex justify-between items-center">
            <span>Franchises Standings</span>
            <span>Budget</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {humanTeamIds.map(teamId => {
              const roster = state.rosters[teamId] || [];
              const purse = state.purses[teamId] ?? 12000;
              const isMe = teamId === peerId;

              // Extract team code
              const franchise = state.players.find(p => p.peerId === teamId)?.franchise || '???';
              const teamName = state.players.find(p => p.peerId === teamId)?.name || 'Player';
              const teamData = IPL_TEAMS.find(t => t.short === franchise);
              
              // Count overseas
              const osCount = roster.filter(p => p.is_overseas).length;

              return (
                <div 
                  key={teamId}
                  onClick={() => setActiveInspector(teamId)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${activeInspector === teamId ? 'border-blue-500 bg-blue-600/5' : 'border-[var(--card-border)] bg-[var(--color-canvas-soft)]/50 hover:border-[var(--color-hairline-strong)]'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow"
                      style={{ backgroundColor: teamData?.color || '#555' }}
                    >
                      {franchise}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span className="truncate max-w-[100px]">{teamName}</span>
                        {isMe && <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded uppercase font-bold">YOU</span>}
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                        Roster: {roster.length}/15 (OS: {osCount}/4)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-green-400">
                      ₹{(purse / 100).toFixed(2)} Cr
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-0.5 font-mono">
                      Avg: ₹{(roster.length === 15 ? 0 : purse / (15 - roster.length)).toFixed(1)} L
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Nominated Player Card */}
        <div className="flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 overflow-hidden shadow-lg h-auto min-h-[380px] lg:h-full justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-2">
            <span>Nominated Cricketer</span>
            {activePlayer?.is_overseas && (
              <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-black uppercase">
                OVERSEAS
              </span>
            )}
          </h3>

          {activePlayer ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Minimalist Premium Sports Card Display */}
              <div className="h-[180px] w-full bg-[var(--color-canvas-soft)]/50 backdrop-blur-md rounded-2xl border border-[var(--card-border)] relative overflow-hidden flex flex-col justify-between p-5 my-3 group hover:border-neutral-700/50 transition-all duration-300">
                {/* Visual Glow */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-15 blur-2xl pointer-events-none transition-all duration-500" 
                  style={{ background: getRatingBg(activePlayer.overall) }}
                ></div>

                {/* Card Top: Rating and Role */}
                <div className="flex justify-between items-center w-full z-10">
                  <span className="text-2xl font-mono font-black tracking-tight" style={{ color: getRatingBg(activePlayer.overall) }}>
                    {activePlayer.overall}
                  </span>
                  <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-[var(--text-primary)] bg-[var(--color-canvas-soft-2)] px-2 py-0.5 rounded border border-[var(--card-border)]">
                    {activePlayer.role}
                  </span>
                </div>

                {/* Card Center: Player Name */}
                <div className="z-10 py-1">
                  <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                    {activePlayer.name}
                  </h2>
                </div>

                {/* Card Bottom: Team and Status info */}
                <div className="flex justify-between items-center w-full z-10 border-t border-[var(--card-border)] pt-2.5 text-[10px] text-[var(--text-muted)] font-semibold">
                  <span>LAST TEAM: {activePlayer.team}</span>
                  {activePlayer.is_overseas && (
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                      OVERSEAS
                    </span>
                  )}
                </div>
              </div>

              {/* Bidding Controls CTA */}
              <div className="space-y-3 shrink-0 pt-2">
                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] px-1">
                  <span>Required Reserve Purse:</span>
                  <span className="font-bold text-[var(--text-primary)]">₹{(minRequiredReserve / 100).toFixed(2)} Cr</span>
                </div>

                 {hasSkipped ? (
                   <button disabled className="w-full py-3 bg-[var(--color-canvas-soft-2)] text-[var(--text-muted)] border border-[var(--card-border)] text-xs font-black uppercase tracking-wider rounded-xl cursor-not-allowed">
                     {isBiddingActive ? 'DROPPED OUT' : 'SKIPPED'}
                   </button>
                 ) : isHighestBidderSelf ? (
                   <button disabled className="w-full py-3 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs font-black uppercase tracking-wider rounded-xl cursor-not-allowed animate-pulse">
                     YOU HAVE HIGHEST BID!
                   </button>
                 ) : (
                   <div className="flex gap-2">
                     <button
                       disabled={!canBid}
                       onClick={() => onPlaceBid(isBiddingActive ? nextBidPrice : state.currentBid)}
                       className={`flex-[2] py-3 px-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${canBid ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400 shadow-lg shadow-blue-950/10' : 'bg-[var(--color-canvas-soft-2)] text-[var(--text-muted)] border border-[var(--card-border)] cursor-not-allowed'}`}
                     >
                       {isRosterFull ? (
                         <span>ROSTER FULL</span>
                       ) : isOverseasCapHit ? (
                         <span>OVERSEAS LIMIT HIT</span>
                       ) : !hasPurseForBid ? (
                         <span>RESERVE VIOLATION</span>
                       ) : (
                         <>
                           <span>{isBiddingActive ? 'PLACE BID' : 'BID BASE'}</span>
                           <span className="text-[9px] opacity-80 font-mono">
                             ₹{((isBiddingActive ? nextBidPrice : state.currentBid) / 100).toFixed(2)} Cr
                           </span>
                         </>
                       )}
                     </button>
                     <button
                       onClick={onSkipPlayer}
                       className="flex-1 py-3 px-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-950/20 transition-all cursor-pointer flex items-center justify-center"
                     >
                       {isBiddingActive ? 'DROP' : 'SKIP'}
                     </button>
                   </div>
                 )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs italic text-[var(--text-muted)] py-12">
              Auction finished! Waiting for host to start the season.
            </div>
          )}
        </div>

        {/* Right Column: Roster Inspector */}
        <div className="flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 overflow-hidden shadow-lg h-[320px] lg:h-full">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Roster: {
              activeInspector.startsWith('AI_') 
                ? `AI - ${activeInspector.split('_')[1]}` 
                : (state.players.find(p => p.peerId === activeInspector)?.name || 'Franchise')
            } ({(state.rosters[activeInspector] || []).length}/15)
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {(state.rosters[activeInspector] || []).length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-12 text-xs italic">
                No cricketers acquired yet.
              </div>
            ) : (
              (state.rosters[activeInspector] || []).map((player, idx) => (
                <div key={player.id} className="flex justify-between items-center p-2 rounded-lg border border-[var(--card-border)] bg-black/10 hover:border-neutral-700/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-bold text-[var(--text-muted)] font-mono w-4">{idx + 1}.</span>
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-[9px]"
                      style={{ backgroundColor: getRatingBg(player.overall) }}
                    >
                      {player.overall}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1">
                        {player.name}
                        {player.is_overseas && <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1 rounded font-bold uppercase">OS</span>}
                      </div>
                      <div className="text-[8px] text-[var(--text-muted)] mt-0.5">{player.role} • {player.team}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toggleable Auction Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowLogs(false)} 
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-[var(--color-canvas-soft-2)]"
            >
              <X size={16} />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-600 shrink-0" /> Auction Gavel History
            </h3>
            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 text-xs">
              {state.auctionLogs.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] py-12 italic">
                  Gavel has not fallen yet.
                </div>
              ) : (
                state.auctionLogs.map((log, idx) => {
                  let logColor = 'text-[var(--text-primary)]';
                  if (log.includes('SOLD')) logColor = 'text-emerald-400 font-bold';
                  else if (log.includes('UNSOLD')) logColor = 'text-[var(--text-muted)] italic';
                  
                  const cleanLog = log.replace(/^(🔨|❌)\s*/, '');
                  const isSold = log.startsWith('🔨');
                  const isUnsold = log.startsWith('❌');

                  return (
                    <div key={idx} className={`p-2.5 rounded-xl bg-[var(--color-canvas-soft-2)] border border-[var(--card-border)] ${logColor} flex items-start gap-2`}>
                      {isSold && <Gavel className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                      {isUnsold && <X className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />}
                      <span className="flex-1">{cleanLog}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Multiplayer Match Center Screen ─────────────────────────────────────────
interface MpMatchCenterScreenProps {
  state: MpState;
  peerId: string;
  onSelectLineup: (playingXI: Player[], impactBench: Player[], captainName: string) => void;
  onSimulateRound: () => void;
  onGoToResults: () => void;
}

export function MpMatchCenterScreen({ state, peerId, onSelectLineup, onSimulateRound, onGoToResults }: MpMatchCenterScreenProps) {
  const myRoster = useMemo(() => state.rosters[peerId] || [], [state.rosters, peerId]);
  
  // Tactical configuration state
  const [playingXI, setPlayingXI] = useState<Player[]>([]);
  const [impactBench, setImpactBench] = useState<Player[]>([]);
  const [captain, setCaptain] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // Auto-fill core playing XI initially
  useEffect(() => {
    if (myRoster.length > 0 && playingXI.length === 0) {
      // Pick top 11 by overall
      const sorted = [...myRoster].sort((a, b) => b.overall - a.overall);
      setPlayingXI(sorted.slice(0, 11));
      setImpactBench(sorted.slice(11));
      if (sorted.length > 0) setCaptain(sorted[0].name);
    }
  }, [myRoster]);

  const handleTogglePlayer = (player: Player) => {
    if (submitted) return;
    
    const inXI = playingXI.find(p => p.id === player.id);
    if (inXI) {
      // Move from XI to Bench
      setPlayingXI(playingXI.filter(p => p.id !== player.id));
      setImpactBench([...impactBench, player]);
      if (captain === player.name) {
        const remaining = playingXI.filter(p => p.id !== player.id);
        setCaptain(remaining.length > 0 ? remaining[0].name : '');
      }
    } else {
      // Move from Bench to XI
      if (playingXI.length >= 11) {
        alert('You already have 11 players in your Starting XI. Remove a player first.');
        return;
      }
      setImpactBench(impactBench.filter(p => p.id !== player.id));
      setPlayingXI([...playingXI, player]);
      if (!captain) setCaptain(player.name);
    }
  };

  const handleSubmit = () => {
    if (playingXI.length !== 11) {
      alert('You must select exactly 11 players for your Starting XI.');
      return;
    }
    
    // Check overseas limits
    const overseasCount = playingXI.filter(p => p.is_overseas).length;
    if (overseasCount > state.settings.maxOverseas) {
      alert(`Invalid XI: You have ${overseasCount} overseas players in your Starting XI. Maximum allowed is ${state.settings.maxOverseas}.`);
      return;
    }

    // Check WK requirement
    const hasWK = playingXI.some(p => p.role === 'WK');
    if (!hasWK) {
      alert('Invalid XI: You must have at least 1 Wicketkeeper (WK) in your Starting XI.');
      return;
    }

    if (!captain) {
      alert('You must select a Captain.');
      return;
    }

    setSubmitted(true);
    onSelectLineup(playingXI, impactBench, captain);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 bg-[var(--color-canvas-soft)] text-[var(--text-primary)] font-sans">
      {/* Top Header */}
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center mb-6 border-b border-[var(--card-border)] pb-4">
        <div>
          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
            IPL League Tournament
          </span>
          <h1 className="text-3xl font-black uppercase text-[var(--text-primary)] mt-1">Match Day Center</h1>
        </div>
        
        {state.isHost && (
          <div className="flex gap-2">
            {state.isDraftComplete && (
              <button
                onClick={onSimulateRound}
                disabled={state.readyCount < state.players.filter(p => p.franchise !== 'TBD').length}
                className="btn-primary px-6 py-3 text-sm font-bold uppercase rounded-xl flex items-center gap-1.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Swords size={18} />
                Start Season & Simulate ({state.readyCount}/{state.players.filter(p => p.franchise !== 'TBD').length} Ready)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Columns (2/3 width): Squad & Tactics Selector */}
        <div className="lg:col-span-2 flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4 border-b border-[var(--card-border)] pb-3">
            <h3 className="font-extrabold text-base text-[var(--text-primary)]">
              Tactical Lineup Selector
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${submitted ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'}`}>
              {submitted ? 'Tactics Locked' : 'Lineup Incomplete'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-4">
            {/* Squad Pool */}
            <div className="border border-[var(--card-border)] rounded-xl p-3 bg-[var(--color-canvas-soft-2)]/60 flex flex-col h-[400px]">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">DRAFTED SQUAD (Click to toggle)</div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {myRoster.map((player) => {
                  const isSelected = playingXI.some(p => p.id === player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => handleTogglePlayer(player)}
                      disabled={submitted}
                      className={`w-full flex justify-between items-center p-2.5 rounded-lg border text-left transition-all ${isSelected ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10' : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--card-border)]/20'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: getRatingBg(player.overall) }}>
                          {player.overall}
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            {player.name}
                            {player.is_overseas && <span className="text-[8px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1 rounded font-bold">OS</span>}
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)]">{player.role} • {player.team}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)]'}`}>
                        {isSelected ? 'Starting' : 'Bench'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected XI Details */}
            <div className="border border-[var(--card-border)] rounded-xl p-3 bg-[var(--color-canvas-soft-2)]/60 flex flex-col h-[400px]">
              <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-muted)] mb-2">
                <span>STARTING XI ({playingXI.length}/11)</span>
                <span>WK: {playingXI.filter(p => p.role === 'WK').length} • OS: {playingXI.filter(p => p.is_overseas).length}/4</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {playingXI.length === 0 ? (
                  <div className="text-center text-[var(--text-muted)] py-12 text-xs italic">
                    Select players from the left pool to build your XI.
                  </div>
                ) : (
                  playingXI.map((player) => (
                    <div key={player.id} className="flex justify-between items-center p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)]">
                      <div className="flex items-center gap-2">
                        <div className="w-5.5 h-5.5 rounded flex items-center justify-center font-bold text-white text-[9px]" style={{ backgroundColor: getRatingBg(player.overall) }}>
                          {player.overall}
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            {player.name}
                            {player.name === captain && <span className="text-[8px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1 rounded font-bold uppercase">C</span>}
                          </div>
                          <span className="text-[9.5px] text-[var(--text-muted)]">{player.role}</span>
                        </div>
                      </div>
                      
                      {!submitted && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCaptain(player.name)}
                            className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${captain === player.name ? 'bg-yellow-500/25 border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                          >
                            Set Captain
                          </button>
                          <button
                            onClick={() => handleTogglePlayer(player)}
                            className="text-[9px] font-bold uppercase text-red-600 dark:text-red-400 hover:opacity-80"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {!submitted ? (
            <button onClick={handleSubmit} className="w-full btn-primary py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-md">
              Lock Tactics & Lineup
            </button>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">
              Ready! Waiting for other managers to lock lineups...
            </div>
          )}
        </div>

        {/* Right Column: Lobby Readiness & Standing Table Preview */}
        <div className="space-y-6">
          {/* Readiness Tracker */}
          <div className="card p-4 border border-[var(--card-border)] bg-[var(--card-bg)]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Room Readiness
            </h3>
            <div className="space-y-2">
              {state.players.map((p) => {
                const isReady = p.isReady || (p.peerId === peerId && submitted);
                const franchiseData = IPL_TEAMS.find(t => t.short === p.franchise);
                return (
                  <div key={p.peerId} className="flex justify-between items-center p-2.5 border border-[var(--card-border)] rounded-xl text-xs bg-[var(--card-bg)] shadow-sm hover:border-[var(--card-border)]/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-[9px]"
                        style={{ backgroundColor: franchiseData?.color || '#374151' }}
                      >
                        {p.franchise === 'TBD' ? '?' : p.franchise}
                      </div>
                      <span className="font-bold text-[var(--text-primary)]">{p.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${isReady ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'}`}>
                      {isReady ? 'READY' : 'SELECTING XI'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matches & Results summary */}
          <div className="card p-4 border border-[var(--card-border)] bg-[var(--card-bg)]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Fixtures & Outcomes
            </h3>
            {state.activeMatches.length === 0 ? (
              <div className="text-center text-xs text-[var(--text-muted)] italic py-8">
                Simulation results will display here.
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {state.activeMatches.map((m, idx) => (
                  <div key={idx} className="p-2 border border-[var(--card-border)] rounded-lg text-xs bg-[var(--color-canvas-soft-2)]/60 flex flex-col gap-1">
                    <div className="flex justify-between font-bold">
                      <span>{m.homeTeam} vs {m.awayTeam}</span>
                      <span className="text-blue-600 dark:text-blue-400">{m.winner} Won</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{m.homeScore} vs {m.awayScore}</span>
                      <span>{m.margin}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Multiplayer Setup Screen (Name & Lobby choice) ─────────────────────────
interface MpConnectionSetupScreenProps {
  onBack: () => void;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  isConnecting: boolean;
  errorMsg: string;
}

function TroubleshootingTips() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 border border-[var(--card-border)]/60 rounded-xl overflow-hidden bg-black/10 transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 text-xs font-bold uppercase tracking-wider transition-all"
      >
        <span className="flex items-center gap-2 text-blue-400">
          <HelpCircle size={15} />
          Troubleshooting Tips
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <ChevronDown size={14} className="text-blue-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1.5 text-xs text-[var(--text-muted)] space-y-3 border-t border-[var(--card-border)]/30 font-medium leading-relaxed">
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  1. Check Host Status
                </h4>
                <p className="pl-3 text-[var(--text-muted)]/80">
                  Ensure the host player has created the room and is waiting on the lobby screen. A client cannot connect before the host is ready.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  2. Verify Room Code
                </h4>
                <p className="pl-3 text-[var(--text-muted)]/80">
                  Double check the 5-letter Room Code. It must match the host's room code exactly.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  3. Network & VPN Blocks
                </h4>
                <p className="pl-3 text-[var(--text-muted)]/80">
                  Corporate firewalls, public Wi-Fi (like school or coffee shops), or active VPNs frequently block WebRTC connections. Try disconnecting from your VPN or switching to a mobile hotspot.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  4. Browser Extensions
                </h4>
                <p className="pl-3 text-[var(--text-muted)]/80">
                  Some adblockers or privacy extensions block WebRTC/PeerJS. Try accessing the page in an Incognito/Private window.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MpConnectionSetupScreen({ onBack, onCreateRoom, onJoinRoom, isConnecting, errorMsg }: MpConnectionSetupScreenProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [actionType, setActionType] = useState<'create' | 'join'>('create');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (actionType === 'create') {
      onCreateRoom(name.trim());
    } else {
      if (!code.trim() || code.trim().length !== 5) {
        alert('Please enter a valid 5-character Room Code.');
        return;
      }
      onJoinRoom(name.trim(), code.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card p-6 border border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md shadow-2xl rounded-2xl"
      >
        <h2 className="text-2xl font-black uppercase tracking-wider text-center text-[var(--text-primary)] mb-6">
          Multiplayer Connection
        </h2>

        {errorMsg && (
          <div className="mb-4 space-y-2">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0" /> 
              <span>{errorMsg}</span>
            </div>
            <TroubleshootingTips />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Name */}
          <div>
            <label className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider block mb-1">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Captain Cool"
              maxLength={15}
              className="w-full px-4 py-2 bg-black/10 border border-[var(--card-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-black/10 p-1 rounded-lg border border-[var(--card-border)]">
            <button
              type="button"
              onClick={() => setActionType('create')}
              className={`py-1.5 rounded-md text-xs font-bold uppercase transition-all ${actionType === 'create' ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)]'}`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setActionType('join')}
              className={`py-1.5 rounded-md text-xs font-bold uppercase transition-all ${actionType === 'join' ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)]'}`}
            >
              Join Room
            </button>
          </div>

          {/* Join Code (Only for Join) */}
          {actionType === 'join' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
              <label className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider block">Enter 5-Letter Room Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ABXYZ"
                maxLength={5}
                className="w-full px-4 py-2 bg-black/10 border border-[var(--card-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center text-lg uppercase"
              />
            </motion.div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onBack} className="w-1/3 btn-secondary py-2.5 rounded-xl font-bold uppercase text-xs">
              Back
            </button>
            <button type="submit" disabled={isConnecting} className="w-2/3 btn-primary py-2.5 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-1">
              {isConnecting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  {actionType === 'create' ? 'Create' : 'Join'} Room
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface MpChatBoxProps {
  chatMessages: { sender: string; text: string; timestamp: string; color?: string }[];
  onSendMessage: (text: string) => void;
  currentUser: string;
}

export function MpChatBox({ chatMessages, onSendMessage, currentUser }: MpChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    } else if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.sender !== currentUser) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [chatMessages, isOpen, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 sm:w-96 h-[450px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 backdrop-blur-md"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} />
                <span className="font-black text-sm uppercase tracking-wider">Lobby Chat</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--color-canvas-soft-2)]/30 max-h-[340px]">
              {chatMessages.length === 0 ? (
                <div className="text-center text-xs italic text-neutral-500 py-24">
                  No messages yet. Say hello!
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.sender === currentUser;
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-bold mb-0.5" style={{ color: msg.color || '#9ca3af' }}>
                        {msg.sender}
                      </span>
                      <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] break-words ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[var(--color-canvas-soft-2)] text-[var(--text-primary)] border border-[var(--card-border)] rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] mt-0.5">{msg.timestamp}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-3 border-t border-[var(--card-border)] bg-[var(--card-bg)] flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-[var(--color-canvas-soft)] border border-[var(--card-border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center cursor-pointer border-none">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-blue-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer relative border-none"
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[var(--color-canvas)]">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

