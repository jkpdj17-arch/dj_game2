import React, { useEffect, useRef, useState } from 'react';
import { RunningGameEngine } from '../game/canvasEngine';
import { GameMode, GameSettings, BonusTimeProgress, CookieId, PetId, StageId } from '../types';
import { sound } from '../game/sound';
import { COOKIE_CHARACTERS, PET_CHARACTERS, STAGES } from '../game/constants';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Pause, 
  Play, 
  Maximize2, 
  Sparkles, 
  Info, 
  Trophy, 
  ChevronRight,
  HelpCircle,
  Home,
  Heart
} from 'lucide-react';

interface Props {
  settings: GameSettings;
  selectedCookieId: CookieId;
  selectedPetId: PetId;
  onOpenGDD: () => void;
  onBackToLobby: () => void;
}

export const GameView: React.FC<Props> = ({ 
  settings, 
  selectedCookieId, 
  selectedPetId,
  onOpenGDD, 
  onBackToLobby 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RunningGameEngine | null>(null);

  const [mode, setMode] = useState<GameMode>('RUN');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(80600);
  const [coins, setCoins] = useState(12);
  const [currentStage, setCurrentStage] = useState<StageId>('oven');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [gameOverStats, setGameOverStats] = useState<{ score: number; coins: number } | null>(null);
  const [bonusProgress, setBonusProgress] = useState<BonusTimeProgress>({
    letters: { B: true, O: true, N: false, U: false, S: false, T: false, I: false, M: false, E: false },
    count: 2,
  });
  const [showGuide, setShowGuide] = useState(false);
  const [jumpActive, setJumpActive] = useState(false);
  const [slideActive, setSlideActive] = useState(false);

  // Initialize engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new RunningGameEngine(canvasRef.current, settings, selectedCookieId, selectedPetId);
    engineRef.current = engine;

    engine.onStateUpdate = (state) => {
      setHp(state.hp);
      setScore(state.score);
      setCoins(state.coins);
      setMode(state.mode);
      setBonusProgress(state.bonusProgress);
      setCurrentStage(state.currentStage);
    };

    engine.onGameOver = (finalScore, finalCoins) => {
      setGameOverStats({ score: finalScore, coins: finalCoins });
      setMode('GAME_OVER');
    };

    engine.start();

    // Keyboard handlers: Jump [D, S, Space, W, Up], Slide [J, K, Down]
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'KeyD', 'KeyJ', 'KeyK'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyD' || e.code === 'KeyS' || e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        engine.handleJumpPress();
        setJumpActive(true);
      } else if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'ArrowDown') {
        engine.handleSlidePress(true);
        setSlideActive(true);
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (engine.mode === 'PAUSED') {
          engine.resume();
        } else if (engine.mode === 'RUN') {
          engine.pause();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' || e.code === 'KeyS' || e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        setJumpActive(false);
      } else if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'ArrowDown') {
        engine.handleSlidePress(false);
        setSlideActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.destroy();
    };
  }, []);

  // Sync cookie/pet or balance settings
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCharacterAndPet(selectedCookieId, selectedPetId);
      engineRef.current.settings = { ...engineRef.current.settings, ...settings };
    }
  }, [selectedCookieId, selectedPetId, settings]);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleRestart = () => {
    if (engineRef.current) {
      setGameOverStats(null);
      engineRef.current.restart(true);
    }
  };

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    if (mode === 'PAUSED') {
      engineRef.current.resume();
    } else {
      engineRef.current.pause();
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const onJumpDown = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setJumpActive(true);
    engineRef.current?.handleJumpPress();
  };

  const onJumpUp = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setJumpActive(false);
  };

  const onSlideDown = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSlideActive(true);
    engineRef.current?.handleSlidePress(true);
  };

  const onSlideUp = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSlideActive(false);
    engineRef.current?.handleSlidePress(false);
  };

  const currentCookie = COOKIE_CHARACTERS.find((c) => c.id === selectedCookieId) || COOKIE_CHARACTERS[0];
  const stageData = STAGES[currentStage] || STAGES.oven;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-4">
      {/* Top Controller Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition-all active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>메인 로비 (쿠키 선택)</span>
          </button>

          <div className="flex items-center gap-1.5 font-bold text-white bg-slate-800 px-2 py-1 rounded-lg">
            <span>{currentCookie.avatarIcon}</span>
            <span>{currentCookie.name}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="text-amber-300 font-semibold">PC 조작: [D] / [S] 점프, [J] / [K] 슬라이드</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">{stageData.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="게임 가이드"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={handleTogglePause}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={mode === 'PAUSED' ? '계속하기' : '일시정지'}
          >
            {mode === 'PAUSED' ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="다시 시작"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors hidden sm:block"
            title="전체화면"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Card (Collapsible) */}
      {showGuide && (
        <div className="w-full bg-slate-900 border border-amber-500/30 rounded-xl p-4 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between text-amber-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 실시간 맵 순환 & 대형 생명물약 가이드
            </span>
            <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="bg-slate-800/80 p-2 rounded">
              <strong className="text-emerald-300 block">🧪 커다란 생명물약</strong>
              맵이 바뀔 때 거대한 황금 플라스크 출현! HP 100% 완전 회복.
            </div>
            <div className="bg-slate-800/80 p-2 rounded">
              <strong className="text-sky-300 block">🗺️ 실시간 맵 전환</strong>
              탈출 오븐 ➔ 에메랄드 숲 ➔ 소다 해변 ➔ 캔디 은하수로 자동 워프.
            </div>
            <div className="bg-slate-800/80 p-2 rounded">
              <strong className="text-amber-300 block">⌨️ 컴퓨터 조작</strong>
              [D] / [S]로 점프하고 [J] / [K]로 미끄러져 장애물을 회피!
            </div>
            <div className="bg-slate-800/80 p-2 rounded">
              <strong className="text-pink-300 block">🔤 BONUSTIME</strong>
              9글자를 다 모으면 밤하늘 구름 위 천국으로 급상승!
            </div>
          </div>
        </div>
      )}

      {/* Game Stage Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-black select-none touch-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Touch Button Overlays */}
        <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-4 md:p-8">
          <button
            onPointerDown={onJumpDown}
            onPointerUp={onJumpUp}
            onPointerLeave={onJumpUp}
            className={`pointer-events-auto w-20 h-20 md:w-28 md:h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-xl backdrop-blur-sm ${
              jumpActive
                ? 'bg-blue-600/80 border-blue-300 shadow-blue-500/50 scale-105'
                : 'bg-slate-900/60 border-white/40 hover:border-blue-400'
            }`}
          >
            <span className="font-extrabold text-lg md:text-2xl text-white tracking-wider font-['Fredoka']">
              JUMP
            </span>
            <span className="text-[10px] md:text-xs text-blue-200 font-bold opacity-90">
              D / S 키
            </span>
          </button>

          <button
            onPointerDown={onSlideDown}
            onPointerUp={onSlideUp}
            onPointerLeave={onSlideUp}
            className={`pointer-events-auto w-20 h-20 md:w-28 md:h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-xl backdrop-blur-sm ${
              slideActive
                ? 'bg-orange-600/80 border-orange-300 shadow-orange-500/50 scale-105'
                : 'bg-slate-900/60 border-white/40 hover:border-orange-400'
            }`}
          >
            <span className="font-extrabold text-lg md:text-2xl text-white tracking-wider font-['Fredoka']">
              SLIDE
            </span>
            <span className="text-[10px] md:text-xs text-orange-200 font-bold opacity-90">
              J / K 키
            </span>
          </button>
        </div>

        {/* Pause Overlay */}
        {mode === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <div className="text-3xl font-extrabold text-amber-400 tracking-wider">
              일시정지 (PAUSED)
            </div>
            <p className="text-slate-300 text-sm">
              잠시 숨을 고르는 중입니다.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleTogglePause}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg active:scale-95"
              >
                <Play className="w-4 h-4" />
                <span>계속 달리기</span>
              </button>
              <button
                onClick={onBackToLobby}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all active:scale-95 border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>메인 화면으로</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {mode === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-sm bg-slate-900 border-2 border-red-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">탈출 실패 (RUN OVER)</h3>
                <p className="text-xs text-slate-400 mt-0.5">체력이 모두 소진되었습니다!</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">최종 점수 (Score)</span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {gameOverStats?.score.toLocaleString() ?? score.toLocaleString()} 점
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">획득 코인 (Coins)</span>
                  <span className="text-sm font-bold text-yellow-400 font-mono">
                    🪙 {gameOverStats?.coins ?? coins}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">도달 스테이지</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {stageData.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleRestart}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 달리기 (RETRY)</span>
                </button>
                <button
                  onClick={onBackToLobby}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>다른 쿠키 선택하러 가기 (메인)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Component Comparison Card */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">
              스테이지 워프 & 대형 생명물약 시스템 정상 작동 중
            </span>
            <span className="text-slate-400 text-[11px]">
              1,000m 질주 시 다음 맵으로 실시간 전환되며, 워프 관문 및 STAGE 4 무한 모드에서 [커다란 생명물약]이 생성됩니다.
            </span>
          </div>
        </div>

        <button
          onClick={onOpenGDD}
          className="whitespace-nowrap flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold text-xs"
        >
          <span>기획서(GDD) 확인</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
