import React, { useState } from 'react';
import { GameView } from './components/GameView';
import { MainLobby } from './components/MainLobby';
import { GDDDocument } from './components/GDDDocument';
import { BalanceSandbox } from './components/BalanceSandbox';
import { CookieId, PetId, GameSettings } from './types';
import { 
  Gamepad2, 
  FileText, 
  Sliders, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Flame,
  Home
} from 'lucide-react';

const DEFAULT_SETTINGS: GameSettings = {
  baseSpeed: 520,
  gravity: 2100,
  jumpForce: -820,
  doubleJumpForce: -740,
  hpDrainRate: 2.8,
  jellyFrequency: 0.16,
  obstacleFrequency: 1.8,
  maxNinjaJumps: 3,
  sfxVolume: 0.8,
  bgmVolume: 0.5,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'lobby' | 'game' | 'gdd' | 'sandbox'>('lobby');
  const [selectedCookieId, setSelectedCookieId] = useState<CookieId>('ninja');
  const [selectedPetId, setSelectedPetId] = useState<PetId>('ghost');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameKey, setGameKey] = useState(1);

  const handleStartGame = () => {
    setGameKey((prev) => prev + 1);
    setActiveTab('game');
  };

  const handleRestartGame = () => {
    setGameKey((prev) => prev + 1);
    setActiveTab('game');
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div 
            onClick={() => setActiveTab('lobby')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Fredoka']">
                  쿠키 런 어드벤처
                </span>
                <span className="bg-amber-400/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  GDD & PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                PC 키보드 & 모바일 터치 지원 크로스플랫폼 횡스크롤 액션 런너
              </p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('lobby')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'lobby'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>메인 로비</span>
            </button>

            <button
              onClick={handleStartGame}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'game'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>🎮 게임 시작</span>
            </button>

            <button
              onClick={() => setActiveTab('gdd')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'gdd'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📋 기획안(GDD)</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>⚙️ 밸런스</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {activeTab === 'lobby' && (
          <MainLobby
            selectedCookieId={selectedCookieId}
            selectedPetId={selectedPetId}
            onSelectCookie={setSelectedCookieId}
            onSelectPet={setSelectedPetId}
            onStartGame={handleStartGame}
            onOpenGDD={() => setActiveTab('gdd')}
          />
        )}

        {activeTab === 'game' && (
          <GameView
            key={gameKey}
            settings={settings}
            selectedCookieId={selectedCookieId}
            selectedPetId={selectedPetId}
            onOpenGDD={() => setActiveTab('gdd')}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'gdd' && <GDDDocument />}

        {activeTab === 'sandbox' && (
          <BalanceSandbox
            settings={settings}
            onUpdateSettings={setSettings}
            onResetDefaults={handleResetDefaults}
            onRestartGame={handleRestartGame}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-400">
              <Monitor className="w-3.5 h-3.5" /> PC Chrome / Edge / Safari
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Smartphone className="w-3.5 h-3.5" /> Mobile iOS / Android Web & Hybrid App
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>쿠키런 오리지널 오븐 탈출 & 닌자맛 쿠키 메카닉스 완벽 재현</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
