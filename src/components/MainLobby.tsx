import React, { useState, useEffect } from 'react';
import { CookieCharacter, CookieId, PetCharacter, PetId, Rarity } from '../types';
import { COOKIE_CHARACTERS, PET_CHARACTERS, STAGES, STAGE_SEQUENCE } from '../game/constants';
import { 
  Play, 
  Sparkles, 
  Heart, 
  Wind, 
  Check, 
  Info, 
  Compass, 
  Award,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  Zap,
  Infinity as InfinityIcon,
  Gift,
  ShoppingBag,
  Coins,
  Gem,
  Trophy,
  Star,
  Shield,
  RefreshCw,
  X,
  Lock,
  Unlock,
  Crown,
  Dice5,
  Mail,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Medal,
  Sliders,
  Settings,
  ArrowUpCircle,
  TrendingUp,
  Package,
  HelpCircle
} from 'lucide-react';
import { sound } from '../game/sound';

interface Props {
  selectedCookieId: CookieId;
  selectedPetId: PetId;
  onSelectCookie: (id: CookieId) => void;
  onSelectPet: (id: PetId) => void;
  onStartGame: () => void;
  onOpenGDD: () => void;
}

export const MainLobby: React.FC<Props> = ({
  selectedCookieId,
  selectedPetId,
  onSelectCookie,
  onSelectPet,
  onStartGame,
  onOpenGDD,
}) => {
  // Wallet & Resource States (Cookie Run Mobile Game Economy)
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('cr_coins');
    return saved ? parseInt(saved, 10) : 32000;
  });
  const [crystals, setCrystals] = useState<number>(() => {
    const saved = localStorage.getItem('cr_crystals');
    return saved ? parseInt(saved, 10) : 750;
  });
  const [hearts, setHearts] = useState<number>(5);
  const [heartTimer, setHeartTimer] = useState<number>(240); // seconds to next heart
  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    const saved = localStorage.getItem('cr_player_level');
    return saved ? parseInt(saved, 10) : 8;
  });
  const [playerExp, setPlayerExp] = useState<number>(() => {
    const saved = localStorage.getItem('cr_player_exp');
    return saved ? parseInt(saved, 10) : 650;
  });
  const [runsPlayed, setRunsPlayed] = useState<number>(() => {
    const saved = localStorage.getItem('cr_runs_played');
    return saved ? parseInt(saved, 10) : 4;
  });
  const maxExp = playerLevel * 200;

  // Unlocked & Level Statuses
  // Starter unlocked cookie is 'brave' (user can unlock others via mission+coin or instant crystal!)
  const [unlockedCookieIds, setUnlockedCookieIds] = useState<CookieId[]>(() => {
    const saved = localStorage.getItem('cr_unlocked_cookies');
    return saved ? JSON.parse(saved) : ['brave'];
  });
  const [unlockedPetIds, setUnlockedPetIds] = useState<PetId[]>(() => {
    const saved = localStorage.getItem('cr_unlocked_pets');
    return saved ? JSON.parse(saved) : ['choco_drop'];
  });
  const [petLevels, setPetLevels] = useState<Record<PetId, number>>(() => {
    const saved = localStorage.getItem('cr_pet_levels');
    return saved ? JSON.parse(saved) : {
      choco_drop: 2,
      ghost: 1,
      rocket: 1,
      celestial_star: 1,
      jelly_drop: 1,
      brain_gum: 1,
      pirate_bomb: 1,
      oak_barrel: 1,
      grimoire: 1,
      dreamcatcher: 1,
    };
  });
  const [cookieLevels, setCookieLevels] = useState<Record<CookieId, number>>(() => {
    const saved = localStorage.getItem('cr_cookie_levels');
    return saved ? JSON.parse(saved) : {
      brave: 3,
      ninja: 1,
      cherry: 1,
      angel: 1,
      hero: 1,
      zombie: 1,
      pirate: 1,
      vampire: 1,
      wizard: 1,
      moonlight: 1,
    };
  });

  // Pre-Game Power-up Booster Toggles
  const [boosters, setBoosters] = useState<{ shield: boolean; magnet: boolean; blast: boolean; hp: boolean }>({
    shield: true,
    magnet: false,
    blast: false,
    hp: true,
  });

  // UI Tab & Modal States
  const [activeTab, setActiveTab] = useState<'lobby' | 'cookies' | 'pets' | 'gacha' | 'ranking' | 'missions' | 'shop'>('lobby');
  const [cookieFilter, setCookieFilter] = useState<'all' | 'unlocked' | 'mission_ready' | 'locked'>('all');
  const [selectedCookieForModal, setSelectedCookieForModal] = useState<CookieCharacter | null>(null);
  const [isGachaModalOpen, setIsGachaModalOpen] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [gachaResults, setGachaResults] = useState<{ pet: PetCharacter; isNew: boolean; level: number }[]>([]);
  const [gachaAnimStep, setGachaAnimStep] = useState<'closed' | 'opening' | 'revealed'>('closed');
  const [showProbModal, setShowProbModal] = useState<boolean>(false);
  const [showMailbox, setShowMailbox] = useState<boolean>(false);
  const [showAttendance, setShowAttendance] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [claimedQuests, setClaimedQuests] = useState<number[]>([]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('cr_coins', coins.toString());
    localStorage.setItem('cr_crystals', crystals.toString());
    localStorage.setItem('cr_player_level', playerLevel.toString());
    localStorage.setItem('cr_player_exp', playerExp.toString());
    localStorage.setItem('cr_runs_played', runsPlayed.toString());
    localStorage.setItem('cr_unlocked_cookies', JSON.stringify(unlockedCookieIds));
    localStorage.setItem('cr_unlocked_pets', JSON.stringify(unlockedPetIds));
    localStorage.setItem('cr_pet_levels', JSON.stringify(petLevels));
    localStorage.setItem('cr_cookie_levels', JSON.stringify(cookieLevels));
  }, [coins, crystals, playerLevel, playerExp, runsPlayed, unlockedCookieIds, unlockedPetIds, petLevels, cookieLevels]);

  // Heart refill countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setHeartTimer((prev) => {
        if (prev <= 1) {
          setHearts((h) => Math.min(5, h + 1));
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3200);
  };

  const currentCookie = COOKIE_CHARACTERS.find((c) => c.id === selectedCookieId) || COOKIE_CHARACTERS[0];
  const currentPet = PET_CHARACTERS.find((p) => p.id === selectedPetId) || PET_CHARACTERS[0];
  const isCombiActive = currentPet.combiCookieId === currentCookie.id;

  const handleSelectCookie = (cookie: CookieCharacter) => {
    if (!unlockedCookieIds.includes(cookie.id)) {
      setSelectedCookieForModal(cookie);
      return;
    }
    onSelectCookie(cookie.id);
    sound.playPotion();
  };

  const handleSelectPet = (pet: PetCharacter) => {
    if (!unlockedPetIds.includes(pet.id)) {
      showToast(`🔒 ${pet.name}는 미보유 펫입니다. 펫 뽑기 상점에서 소환하세요!`);
      return;
    }
    onSelectPet(pet.id);
    sound.playPotion();
  };

  const handleLevelUpPlayer = () => {
    setPlayerLevel((prev) => prev + 1);
    setPlayerExp(0);
    sound.playGiantBear();
    showToast(`⭐ 축하합니다! 플레이어 레벨 ${playerLevel + 1} 달성!`);
  };

  const handleLevelUpCookie = (cookie: CookieCharacter) => {
    const currentLv = cookieLevels[cookie.id] || 1;
    if (currentLv >= 10) {
      showToast(`⭐ ${cookie.name}는 이미 최고 레벨(Lv.10 MAX)입니다!`);
      return;
    }
    const cost = currentLv * 2500;
    if (coins < cost) {
      showToast(`🪙 코인이 부족합니다! (${cost.toLocaleString()} 코인 필요)`);
      return;
    }
    setCoins((c) => c - cost);
    setCookieLevels((prev) => ({ ...prev, [cookie.id]: currentLv + 1 }));
    sound.playGiantBear();
    showToast(`⭐ ${cookie.name} Lv.${currentLv + 1} 레벨업 완료! HP & 점수 상승!`);
  };

  // Check if a cookie's unlock mission has been completed
  const checkIsMissionCompleted = (cookie: CookieCharacter): { 
    completed: boolean; 
    current: number; 
    target: number; 
    text: string;
    progressPercent: number;
  } => {
    if (!cookie.unlockMission) {
      return { completed: true, current: 1, target: 1, text: '조건 없음 (무료 해금)', progressPercent: 100 };
    }
    const mission = cookie.unlockMission;
    let current = 0;
    const target = mission.targetValue;

    switch (mission.type) {
      case 'level':
        current = playerLevel;
        break;
      case 'pets_count':
        current = unlockedPetIds.length;
        break;
      case 'coins_earned':
        current = coins;
        break;
      case 'runs_played':
        current = runsPlayed;
        break;
      case 'pet_level_count':
        current = Object.values(petLevels).filter((lv) => lv >= 2).length;
        break;
      default:
        current = playerLevel;
    }

    const completed = current >= target;
    const progressPercent = Math.min(100, Math.floor((current / target) * 100));

    return {
      completed,
      current,
      target,
      text: mission.description,
      progressPercent,
    };
  };

  // 1. Buy cookie with COINS (Only possible if mission is completed!)
  const handleUnlockCookieWithCoins = (cookie: CookieCharacter) => {
    const missionStatus = checkIsMissionCompleted(cookie);
    if (!missionStatus.completed) {
      showToast(`🔒 해금 미션을 먼저 완료해야 코인으로 구매할 수 있습니다! (${missionStatus.text})`);
      sound.playPotion();
      return;
    }

    const cost = cookie.unlockCostCoins || 4000;
    if (coins < cost) {
      showToast(`🪙 코인이 부족합니다! (${cost.toLocaleString()} 코인 필요)`);
      return;
    }
    setCoins((c) => c - cost);
    setUnlockedCookieIds((prev) => [...prev, cookie.id]);
    onSelectCookie(cookie.id);
    setSelectedCookieForModal(null);
    sound.playGiantBear();
    showToast(`🎉 미션 달성 보상! ${cookie.name}를 코인(${cost.toLocaleString()}🪙)으로 해금했습니다!`);
  };

  // 2. Buy cookie with CRYSTALS (Instant purchase, bypasses mission!)
  const handleUnlockCookieWithCrystals = (cookie: CookieCharacter) => {
    const cost = cookie.unlockCostCrystals || 100;
    if (crystals < cost) {
      showToast(`💎 크리스탈이 부족합니다! (${cost} 크리스탈 필요)`);
      return;
    }
    setCrystals((cr) => cr - cost);
    setUnlockedCookieIds((prev) => [...prev, cookie.id]);
    onSelectCookie(cookie.id);
    setSelectedCookieForModal(null);
    sound.playGiantBear();
    showToast(`💎 크리스탈(${cost}💎)로 ${cookie.name}를 즉시 해금했습니다!`);
  };

  // Gacha Mechanics (1x or 10x draw)
  const handlePerformGacha = (count: 1 | 10, currency: 'coins' | 'crystals', isPickup: boolean = false) => {
    const cost = currency === 'coins' ? (count === 1 ? 1000 : 9000) : (count === 1 ? 20 : 180);
    if (currency === 'coins' && coins < cost) {
      showToast(`🪙 코인이 부족합니다! (${cost.toLocaleString()} 코인 필요)`);
      return;
    }
    if (currency === 'crystals' && crystals < cost) {
      showToast(`💎 크리스탈이 부족합니다! (${cost} 크리스탈 필요)`);
      return;
    }

    if (currency === 'coins') setCoins((c) => c - cost);
    else setCrystals((cr) => cr - cost);

    setIsDrawing(true);
    setIsGachaModalOpen(true);
    setGachaAnimStep('opening');
    sound.playStageWarp();

    const drawn: { pet: PetCharacter; isNew: boolean; level: number }[] = [];
    const newUnlocked = [...unlockedPetIds];
    const newLevels = { ...petLevels };

    for (let i = 0; i < count; i++) {
      const rand = Math.random() * 100;
      let targetPet: PetCharacter;

      if (isPickup && rand < 35) {
        // Boosted Dreamcatcher Legendary rate on pick-up banner
        targetPet = PET_CHARACTERS.find((p) => p.id === 'dreamcatcher') || PET_CHARACTERS[0];
      } else if (rand < 25) {
        targetPet = PET_CHARACTERS.find((p) => p.rarity === 'COMMON') || PET_CHARACTERS[0];
      } else if (rand < 65) {
        const rares = PET_CHARACTERS.filter((p) => p.rarity === 'RARE');
        targetPet = rares[Math.floor(Math.random() * rares.length)];
      } else if (rand < 90) {
        const epics = PET_CHARACTERS.filter((p) => p.rarity === 'EPIC');
        targetPet = epics[Math.floor(Math.random() * epics.length)];
      } else {
        const legendaries = PET_CHARACTERS.filter((p) => p.rarity === 'LEGENDARY');
        targetPet = legendaries[Math.floor(Math.random() * legendaries.length)] || PET_CHARACTERS[PET_CHARACTERS.length - 1];
      }

      const isNew = !newUnlocked.includes(targetPet.id);
      if (isNew) {
        newUnlocked.push(targetPet.id);
        newLevels[targetPet.id] = 1;
      } else {
        newLevels[targetPet.id] = (newLevels[targetPet.id] || 1) + 1;
      }

      drawn.push({
        pet: targetPet,
        isNew,
        level: newLevels[targetPet.id] || 1,
      });
    }

    setUnlockedPetIds(newUnlocked);
    setPetLevels(newLevels);

    setTimeout(() => {
      setGachaAnimStep('revealed');
      setIsDrawing(false);
      setGachaResults(drawn);
      sound.playGiantBear();
    }, 1800);
  };

  const getRarityBadge = (rarity: Rarity) => {
    switch (rarity) {
      case 'COMMON':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-700 text-slate-200">COMMON</span>;
      case 'RARE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white shadow-sm shadow-blue-500/50">RARE</span>;
      case 'EPIC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white shadow-sm shadow-purple-500/50">EPIC</span>;
      case 'LEGENDARY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-300 via-rose-400 to-indigo-400 text-slate-950 shadow-lg shadow-amber-400/60 animate-pulse border border-white">
            ★ LEGENDARY
          </span>
        );
    }
  };

  const handleStartWithHeart = () => {
    if (hearts <= 0) {
      showToast('💔 생명 하트가 부족합니다! 충전 후 달려보세요!');
      return;
    }
    setHearts((h) => h - 1);
    setRunsPlayed((r) => r + 1);
    sound.playGiantBear();
    onStartGame();
  };

  // Filter cookies based on active filter tab
  const filteredCookies = COOKIE_CHARACTERS.filter((cookie) => {
    const isUnlocked = unlockedCookieIds.includes(cookie.id);
    const missionStatus = checkIsMissionCompleted(cookie);

    if (cookieFilter === 'unlocked') return isUnlocked;
    if (cookieFilter === 'mission_ready') return !isUnlocked && missionStatus.completed;
    if (cookieFilter === 'locked') return !isUnlocked;
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-300 select-none pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP MOBILE GAME STATUS HEADER (Level, Stamina, Coins, Crystals, Actions) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-3.5 md:p-4 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Profile & Level */}
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer group" onClick={() => setActiveTab('cookies')}>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 p-0.5 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
                {currentCookie.avatarIcon}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[11px] font-black px-1.5 py-0.2 rounded-full border border-slate-900 shadow">
              Lv.{playerLevel}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base">{currentCookie.name}</span>
              <span className="bg-gradient-to-r from-amber-400/20 to-rose-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>다이아몬드 III</span>
              </span>
            </div>
            {/* EXP Bar & Quick Level Up */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-28 sm:w-36 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, (playerExp / maxExp) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {playerExp}/{maxExp} XP
              </span>
              <button
                onClick={handleLevelUpPlayer}
                className="text-[9px] bg-amber-400/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-400/40 transition-colors"
                title="레벨업 테스트"
              >
                +Lv
              </button>
            </div>
          </div>
        </div>

        {/* Currency & Stamina Status Bar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          {/* Hearts / Stamina */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-rose-500/40 px-3 py-1.5 rounded-2xl shadow-inner">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-rose-300 leading-none">{hearts}/5</span>
              <span className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">{formatTimer(heartTimer)}</span>
            </div>
            <button 
              onClick={() => { setHearts(5); sound.playPotion(); showToast('❤️ 생명 하트가 완충되었습니다!'); }}
              className="w-5 h-5 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center text-xs font-black transition-colors"
            >
              +
            </button>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/40 px-3 py-1.5 rounded-2xl shadow-inner">
            <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-sm shadow-amber-400/50">
              🪙
            </div>
            <span className="text-xs font-black text-amber-300 font-mono">{coins.toLocaleString()}</span>
            <button 
              onClick={() => { setCoins((c) => c + 5000); sound.playPotion(); showToast('🪙 +5,000 코인 충전 완료!'); }}
              className="w-5 h-5 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 flex items-center justify-center text-xs font-black transition-colors"
              title="코인 무료 충전"
            >
              +
            </button>
          </div>

          {/* Crystals */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-500/40 px-3 py-1.5 rounded-2xl shadow-inner">
            <Gem className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black text-cyan-300 font-mono">{crystals.toLocaleString()}</span>
            <button 
              onClick={() => { setCrystals((cr) => cr + 200); sound.playPotion(); showToast('💎 +200 크리스탈 충전 완료!'); }}
              className="w-5 h-5 rounded-full bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 flex items-center justify-center text-xs font-black transition-colors"
              title="크리스탈 무료 충전"
            >
              +
            </button>
          </div>

          {/* Attendance Check-in Button */}
          <button 
            onClick={() => setShowAttendance(true)}
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="출석 체크"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">출석부</span>
          </button>

          {/* Mailbox */}
          <button 
            onClick={() => setShowMailbox(true)}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="우편함"
          >
            <Mail className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
              3
            </span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <Sparkles className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DUAL UNLOCK SHOP HIGHLIGHT BANNER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border-2 border-amber-400/60 p-4 md:p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
              💎
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950">
                  ★ 쿠키 상점 시스템
                </span>
                <span className="text-xs text-amber-300 font-bold">크리스탈 즉시 구매 & 미션 달성 코인 구매</span>
              </div>
              <h3 className="text-base md:text-lg font-black text-white mt-0.5">
                원하는 쿠키를 <span className="text-cyan-300">크리스탈로 즉시 해금</span>하거나, <span className="text-amber-300">고유 미션 달성 후 코인으로 해금</span>하세요!
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab('cookies'); setCookieFilter('all'); }}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
            >
              🍪 쿠키 상점 바로가기
            </button>
            <button 
              onClick={() => handlePerformGacha(10, 'coins', true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md active:scale-95 transition-all"
            >
              🎁 10회 펫 뽑기 (9,000🪙)
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CENTER HERO PODIUM & CHARACTER SHOWCASE */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-950 border-2 border-indigo-500/30 p-6 md:p-8 shadow-2xl">
        {/* Background glowing stage lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Cookie & Pet Podium */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[320px]">
            {/* Interactive Speech Bubble Quote */}
            <div 
              onClick={() => {
                sound.playPotion();
                showToast(`💬 "${currentCookie.quote}"`);
              }}
              className="relative bg-slate-900/95 border-2 border-amber-400/60 rounded-2xl px-5 py-2.5 mb-5 text-center max-w-sm shadow-xl shadow-amber-500/10 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-amber-300 font-black text-xs md:text-sm">
                "{currentCookie.quote}"
              </span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-amber-400/60 rotate-45" />
            </div>

            {/* Character & Pet Duo Rendering Stage */}
            <div className="relative flex items-center justify-center gap-6 py-3">
              {/* Pet Floating Avatar */}
              <div className="relative flex flex-col items-center group">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 transition-transform hover:scale-110 cursor-pointer animate-bounce"
                  style={{
                    backgroundColor: currentPet.color,
                    borderColor: currentPet.accentColor,
                    boxShadow: `0 0 30px ${currentPet.color}90`,
                  }}
                  onClick={() => setActiveTab('pets')}
                >
                  {currentPet.avatarIcon}
                </div>
                <span className="mt-2 bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-black px-3 py-1 rounded-full shadow">
                  Lv.{petLevels[currentPet.id] || 1} {currentPet.name}
                </span>
              </div>

              {/* Cookie Main Avatar & Podium */}
              <div className="relative flex flex-col items-center">
                <div 
                  className="w-32 h-32 rounded-3xl flex items-center justify-center text-7xl shadow-2xl border-4 transition-transform hover:scale-105 cursor-pointer relative"
                  style={{
                    backgroundColor: currentCookie.color,
                    borderColor: currentCookie.accentColor,
                    boxShadow: `0 0 45px ${currentCookie.color}99`,
                  }}
                  onClick={() => setActiveTab('cookies')}
                >
                  {currentCookie.avatarIcon}
                  <div className="absolute -top-3 -right-3">
                    {getRarityBadge(currentCookie.rarity)}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="bg-slate-900/90 border border-amber-400 text-amber-300 text-sm font-black px-4 py-1.5 rounded-full shadow-lg">
                    Lv.{cookieLevels[currentCookie.id] || 1} {currentCookie.name}
                  </span>
                  <button
                    onClick={() => handleLevelUpCookie(currentCookie)}
                    className="p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow transition-all hover:scale-110"
                    title="레벨업"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Podium Base Light */}
            <div className="w-80 h-8 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent rounded-full blur-sm -mt-1" />

            {/* Combi Bonus Activation Ribbon */}
            <div className="mt-4 w-full max-w-md">
              {isCombiActive ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-indigo-500/35 to-rose-500/25 border-2 border-amber-300 shadow-2xl text-center animate-pulse">
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm">
                    <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>[✨ {currentCookie.rarity === 'LEGENDARY' ? 'LEGENDARY' : ''} 콤비 보너스 발동 중!]</span>
                  </div>
                  <p className="text-xs text-amber-100 font-semibold mt-1">
                    {currentPet.combiBonusDesc}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">
                    💡 <strong>{currentCookie.name}</strong>의 단짝 콤비 펫을 장착하면 특별 콤비 보너스가 발동합니다!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Game Mode Info & Pre-Game Boosters & Big Start Action */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-black">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>1,000m 스테이지 주행 & STAGE 4 무한 은하수 질주</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300">
                  전설의 달빛을 품고 은하수 끝까지!
                </span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                스테이지 1~3은 <strong>1,000m 주행 시마다</strong> 맵이 전환되며, 
                마지막 <strong>STAGE 4(캔디 은하수)</strong>에 도달하면 무한 모드로 진입합니다! 
                1,000m 구간마다 <strong className="text-rose-400">[커다란 생명물약]</strong>을 획득하고 최고 기록을 세워보세요!
              </p>
            </div>

            {/* Pre-Game Booster Power-ups Selection */}
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-200">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>경기 시작 부스터 아이템</span>
                </span>
                <span className="text-[11px] text-slate-400">장착 시 레이스 자동 적용</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => setBoosters((b) => ({ ...b, shield: !b.shield }))}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    boosters.shield
                      ? 'bg-blue-600/30 border-blue-400 text-blue-200 shadow-sm shadow-blue-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>방어막</span>
                </button>

                <button
                  onClick={() => setBoosters((b) => ({ ...b, hp: !b.hp }))}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    boosters.hp
                      ? 'bg-rose-600/30 border-rose-400 text-rose-200 shadow-sm shadow-rose-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>체력 +15%</span>
                </button>

                <button
                  onClick={() => setBoosters((b) => ({ ...b, magnet: !b.magnet }))}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    boosters.magnet
                      ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>초반 자력</span>
                </button>

                <button
                  onClick={() => setBoosters((b) => ({ ...b, blast: !b.blast }))}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    boosters.blast
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>광속 스타트</span>
                </button>
              </div>
            </div>

            {/* Giant Big Play Button & Gacha Quick Access */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                onClick={handleStartWithHeart}
                className="w-full sm:flex-1 flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black text-xl md:text-2xl shadow-2xl shadow-orange-500/40 hover:scale-[1.03] active:scale-95 transition-all border-2 border-amber-200"
              >
                <Play className="w-7 h-7 fill-current" />
                <span>게임 시작! (START)</span>
                <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded-lg text-slate-950 font-bold">
                  -1 ❤️
                </span>
              </button>

              <button
                onClick={() => handlePerformGacha(1, 'coins')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-4.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all border border-purple-400"
              >
                <Gift className="w-5 h-5" />
                <span>🎁 펫 소환 (1,000🪙)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ROSTER NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'lobby'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>전체 둘러보기</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'cookies'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🍪 쿠키 상점 & 선택 ({unlockedCookieIds.length}/{COOKIE_CHARACTERS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pets')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'pets'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🐾 펫 선택 ({unlockedPetIds.length}/{PET_CHARACTERS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gacha')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'gacha'
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-900 text-purple-400 hover:text-white hover:bg-purple-950/40 border border-purple-500/30'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>🎁 펫 뽑기 상점</span>
          </button>

          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'ranking'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>🏆 트로피 랭킹</span>
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'missions'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>일일 미션</span>
          </button>
        </div>

        <button
          onClick={() => setShowProbModal(true)}
          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-bold"
        >
          <Info className="w-3.5 h-3.5" />
          <span>소환 확률 안내</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. COOKIE ROSTER & SHOP GRID */}
      {/* ========================================================================= */}
      {(activeTab === 'lobby' || activeTab === 'cookies') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>🍪 쿠키 상점 & 라인업</span>
                <span className="text-xs bg-amber-400/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
                  총 10종 ({unlockedCookieIds.length}종 보유)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                💎 <strong>크리스탈 즉시 구매</strong> 또는 🎯 <strong>해금 미션 달성 후 코인 구매</strong>로 쿠키를 획득하세요!
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                onClick={() => setCookieFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  cookieFilter === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                전체 ({COOKIE_CHARACTERS.length})
              </button>
              <button
                onClick={() => setCookieFilter('unlocked')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  cookieFilter === 'unlocked'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                보유 중 ({unlockedCookieIds.length})
              </button>
              <button
                onClick={() => setCookieFilter('mission_ready')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  cookieFilter === 'mission_ready'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                코인 구매 가능 ({
                  COOKIE_CHARACTERS.filter((c) => !unlockedCookieIds.includes(c.id) && checkIsMissionCompleted(c).completed).length
                })
              </button>
              <button
                onClick={() => setCookieFilter('locked')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  cookieFilter === 'locked'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                미보유 ({COOKIE_CHARACTERS.length - unlockedCookieIds.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCookies.map((cookie) => {
              const isSelected = selectedCookieId === cookie.id;
              const isUnlocked = unlockedCookieIds.includes(cookie.id);
              const level = cookieLevels[cookie.id] || 1;
              const matchingPet = PET_CHARACTERS.find((p) => p.combiCookieId === cookie.id);
              const missionStatus = checkIsMissionCompleted(cookie);

              return (
                <div
                  key={cookie.id}
                  onClick={() => isUnlocked ? handleSelectCookie(cookie) : setSelectedCookieForModal(cookie)}
                  className={`relative overflow-hidden rounded-3xl p-5 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900/95 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                      : isUnlocked
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      : missionStatus.completed
                      ? 'bg-slate-900/80 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/80 border-slate-800/60 opacity-90 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 relative"
                        style={{
                          backgroundColor: cookie.color,
                          borderColor: cookie.accentColor,
                        }}
                      >
                        {cookie.avatarIcon}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-slate-950/70 rounded-2xl flex items-center justify-center">
                            <Lock className="w-6 h-6 text-amber-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-base">{cookie.name}</h4>
                          {getRarityBadge(cookie.rarity)}
                        </div>
                        <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                          {isUnlocked ? `Lv.${level} • ${cookie.title}` : cookie.title}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                        출전 중
                      </span>
                    ) : isUnlocked ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]">
                        보유 중
                      </span>
                    ) : missionStatus.completed ? (
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-[11px] shadow animate-pulse">
                        🪙 코인 구매 가능!
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[11px]">
                        잠김
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {cookie.desc}
                  </p>

                  {/* Locked Cookie Mission Progress Status */}
                  {!isUnlocked && cookie.unlockMission && (
                    <div className={`mt-3 p-3 rounded-2xl border text-xs space-y-1.5 ${
                      missionStatus.completed
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-950/90 border-slate-800 text-slate-300'
                    }`}>
                      <div className="flex items-center justify-between gap-2 font-bold">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          {missionStatus.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>미션: {cookie.unlockMission.description}</span>
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          missionStatus.completed
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-amber-400'
                        }`}>
                          {missionStatus.completed ? '미션 완료!' : `${missionStatus.current}/${missionStatus.target}`}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {!missionStatus.completed && (
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${missionStatus.progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar (Coins vs Crystals vs LevelUp) */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>HP +{cookie.bonusHp}</span>
                      <span>점프 {cookie.maxJumps}단</span>
                    </div>

                    {isUnlocked ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLevelUpCookie(cookie);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-colors"
                          title="레벨업"
                        >
                          Lv.Up ({((cookieLevels[cookie.id] || 1) * 2500).toLocaleString()}🪙)
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCookie(cookie);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200'
                          }`}
                        >
                          {isSelected ? '출전 중' : '선택'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {/* Option 1: Coin Unlock (Enabled ONLY if mission is cleared) */}
                        <button
                          disabled={!missionStatus.completed}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockCookieWithCoins(cookie);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-md flex items-center gap-1 transition-all ${
                            missionStatus.completed
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 shadow-amber-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                          title={missionStatus.completed ? '미션 달성 보상: 코인으로 구매' : '미션 완료 후 코인 구매 가능'}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{cookie.unlockCostCoins.toLocaleString()} 🪙</span>
                        </button>

                        {/* Option 2: Crystal Instant Unlock (Always enabled regardless of mission) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockCookieWithCrystals(cookie);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-cyan-600/30 flex items-center gap-1 transition-all active:scale-95"
                          title="크리스탈로 즉시 해금 (미션 불필요)"
                        >
                          <Gem className="w-3.5 h-3.5" />
                          <span>{cookie.unlockCostCrystals} 💎</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Matching Combi Pet Indicator */}
                  {matchingPet && (
                    <div className="mt-2.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span>단짝 펫:</span>
                        <strong className="text-slate-200">{matchingPet.name} {matchingPet.avatarIcon}</strong>
                      </span>
                      {isUnlocked && unlockedPetIds.includes(matchingPet.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCookie(cookie);
                            handleSelectPet(matchingPet);
                            showToast(`✨ ${cookie.name} & ${matchingPet.name} 콤비 동시 장착!`);
                          }}
                          className="text-amber-400 hover:underline font-bold"
                        >
                          콤비 세트 장착
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PET ROSTER GRID */}
      {/* ========================================================================= */}
      {(activeTab === 'lobby' || activeTab === 'pets') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>🐾 펫 라인업 & 도감</span>
              <span className="text-xs bg-purple-400/20 text-purple-400 px-2.5 py-0.5 rounded-full font-bold">
                10종 완비 (레전더리 드림캐쳐 포함)
              </span>
            </h3>
            <button
              onClick={() => setActiveTab('gacha')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>펫 뽑기 상점 열기</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PET_CHARACTERS.map((pet) => {
              const isSelected = selectedPetId === pet.id;
              const isUnlocked = unlockedPetIds.includes(pet.id);
              const level = petLevels[pet.id] || 1;
              const matchingCookie = COOKIE_CHARACTERS.find((c) => c.id === pet.combiCookieId);

              return (
                <div
                  key={pet.id}
                  onClick={() => isUnlocked ? handleSelectPet(pet) : undefined}
                  className={`relative overflow-hidden rounded-3xl p-5 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900/95 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                      : isUnlocked
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      : 'bg-slate-950/80 border-slate-800/60 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 relative"
                        style={{
                          backgroundColor: pet.color,
                          borderColor: pet.accentColor,
                        }}
                      >
                        {pet.avatarIcon}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-slate-950/80 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-base">{pet.name}</h4>
                          {getRarityBadge(pet.rarity)}
                        </div>
                        <p className="text-xs text-purple-300/90 font-medium mt-0.5">
                          {isUnlocked ? `Lv.${level} • ${pet.title}` : pet.title}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                        선택됨
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {pet.desc}
                  </p>

                  <div className="mt-3 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{pet.specialSkill}</span>
                    </div>
                    {matchingCookie && (
                      <p className="text-[11px] text-slate-400">
                        단짝 쿠키: <strong className="text-slate-200">{matchingCookie.name} {matchingCookie.avatarIcon}</strong> ({pet.combiBonusDesc})
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {isUnlocked ? `보유 중 (Lv.${level})` : '소환 상점에서 획득 가능'}
                    </span>

                    {isUnlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPet(pet);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200'
                        }`}
                      >
                        {isSelected ? '장착 중' : '장착'}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('gacha');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow"
                      >
                        뽑으러 가기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DEDICATED PET GACHA SHOP TAB */}
      {/* ========================================================================= */}
      {activeTab === 'gacha' && (
        <div className="space-y-6 bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-purple-500/30 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/30 text-purple-300 border border-purple-400/40">
                  🎁 펫 부화 & 소환소
                </span>
                <span className="text-xs text-amber-300 font-bold">중복 획득 시 펫 자동 레벨업!</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                신비로운 펫 알 부화 상점
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                코인 또는 크리스탈로 알을 부화시켜 강력한 능력의 단짝 펫을 소환하세요!
              </p>
            </div>

            <button
              onClick={() => setShowProbModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
            >
              <Info className="w-4 h-4 text-amber-400" />
              <span>확률 정보 확인</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner 1: Moonlight & Dreamcatcher Pickup Summon */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 border-2 border-amber-400 p-6 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-300 to-rose-400 text-slate-950">
                    ★ PICK-UP 소환
                  </span>
                  <span className="text-xs text-amber-300 font-bold">드림캐쳐 확률 35% UP!</span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-20 h-20 rounded-full bg-indigo-950 border-4 border-amber-400 flex items-center justify-center text-4xl shadow-xl shadow-amber-400/30 animate-bounce">
                    🪶
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">레전더리 드림캐쳐 픽업</h4>
                    <p className="text-xs text-purple-200 mt-0.5">
                      달빛술사 쿠키 콤비! 6.5초마다 꿈조각 별빛 젤리 폭풍 & 체력 소모 25% 감소!
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handlePerformGacha(1, 'coins', true)}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs border border-slate-600 transition-all active:scale-95 shadow"
                >
                  🪙 1회 소환 (1,000🪙)
                </button>

                <button
                  onClick={() => handlePerformGacha(10, 'coins', true)}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-xl shadow-amber-500/30"
                >
                  ✨ 10회 소환 (9,000🪙)
                </button>
              </div>
            </div>

            {/* Banner 2: Premium Crystal Summon */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-cyan-400 p-6 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950">
                    💎 프리미엄 크리스탈 소환
                  </span>
                  <span className="text-xs text-cyan-300 font-bold">에픽/레전더리 확률 2배!</span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-20 h-20 rounded-2xl bg-cyan-950 border-4 border-cyan-400 flex items-center justify-center text-4xl shadow-xl shadow-cyan-400/30">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">고급 펫 프리미엄 소환</h4>
                    <p className="text-xs text-cyan-200 mt-0.5">
                      크리스탈로 소환 시 높은 확률로 에픽 및 레전더리 등급 펫을 획득할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handlePerformGacha(1, 'crystals', false)}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs border border-cyan-500/40 transition-all active:scale-95 shadow"
                >
                  💎 1회 소환 (20💎)
                </button>

                <button
                  onClick={() => handlePerformGacha(10, 'crystals', false)}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs transition-all active:scale-95 shadow-xl shadow-cyan-500/30"
                >
                  💎 10회 연속 소환 (180💎)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DAILY MISSIONS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'missions' && (
        <div className="space-y-4 bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span>일일 미션 & 챌린지</span>
              </h3>
              <p className="text-xs text-slate-400">매일 미션을 완료하고 코인과 크리스탈을 획득하세요</p>
            </div>
            <span className="text-xs bg-emerald-400/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-400/30">
              매일 00:00 초기화
            </span>
          </div>

          <div className="space-y-3">
            {[
              { id: 1, title: '🏃 1,000m 완주하여 다음 스테이지 진입하기', reward: '3,000 🪙', isCoins: true, amount: 3000 },
              { id: 2, title: '✨ 콤비 펫 스킬 5회 발동하기', reward: '50 💎', isCoins: false, amount: 50 },
              { id: 3, title: '❤️ 생명물약 3회 이상 획득하기', reward: '2,000 🪙', isCoins: true, amount: 2000 },
              { id: 4, title: '🌙 레전더리 쿠키 또는 펫으로 플레이 1회', reward: '100 💎', isCoins: false, amount: 100 },
            ].map((mission) => {
              const isClaimed = claimedQuests.includes(mission.id);

              return (
                <div 
                  key={mission.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <h5 className="font-extrabold text-white text-sm">{mission.title}</h5>
                    <span className="text-xs text-amber-300 font-bold">보상: {mission.reward}</span>
                  </div>

                  <button
                    disabled={isClaimed}
                    onClick={() => {
                      if (mission.isCoins) setCoins((c) => c + mission.amount);
                      else setCrystals((cr) => cr + mission.amount);
                      setClaimedQuests((prev) => [...prev, mission.id]);
                      sound.playGiantBear();
                      showToast(`🎉 보상 수령 완료! (${mission.reward})`);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      isClaimed
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-95'
                    }`}
                  >
                    {isClaimed ? '수령 완료' : '보상 받기'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TROPHY RANKINGS TAB */}
      {activeTab === 'ranking' && (
        <div className="space-y-4 bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <span>트로피 챔피언스 리그 랭킹</span>
              </h3>
              <p className="text-xs text-slate-400">실시간 글로벌 오븐 탈출 최고 점수 순위</p>
            </div>
            <span className="text-xs bg-amber-400/20 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-400/30">
              시즌 1 종료까지 D-3
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { rank: 1, name: '달빛술사_마스터', score: '28,450,100', cookie: '달빛술사 쿠키', pet: '드림캐쳐', tier: 'GRAND MASTER' },
              { rank: 2, name: '오븐브레이커', score: '24,120,500', cookie: '닌자맛 쿠키', pet: '꼬마유령', tier: 'MASTER' },
              { rank: 3, name: '체리팡팡', score: '19,890,200', cookie: '체리맛 쿠키', pet: '로켓폭죽', tier: 'MASTER' },
              { rank: 4, name: '나 (User)', score: '15,420,000', cookie: currentCookie.name, pet: currentPet.name, tier: 'DIAMOND III', isMe: true },
              { rank: 5, name: '마법의밤', score: '12,980,000', cookie: '마법사맛 쿠키', pet: '마법사전', tier: 'DIAMOND' },
            ].map((item) => (
              <div 
                key={item.rank}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  item.isMe 
                    ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10' 
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm ${
                    item.rank === 1 ? 'bg-amber-400 text-slate-950' :
                    item.rank === 2 ? 'bg-slate-300 text-slate-950' :
                    item.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm font-extrabold">{item.name}</strong>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                        {item.tier}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{item.cookie} + {item.pet}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-amber-300 text-base">{item.score}</span>
                  <span className="block text-[10px] text-slate-400">점수</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. DEDICATED COOKIE PURCHASE / UNLOCK MODAL */}
      {/* ========================================================================= */}
      {selectedCookieForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-400/80 rounded-3xl p-6 md:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-white text-lg">쿠키 해금 및 획득</h4>
              </div>
              <button 
                onClick={() => setSelectedCookieForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cookie Showcase Card */}
            <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 shrink-0"
                style={{
                  backgroundColor: selectedCookieForModal.color,
                  borderColor: selectedCookieForModal.accentColor,
                }}
              >
                {selectedCookieForModal.avatarIcon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{selectedCookieForModal.name}</h3>
                  {getRarityBadge(selectedCookieForModal.rarity)}
                </div>
                <p className="text-xs text-amber-300 font-bold">{selectedCookieForModal.title}</p>
                <p className="text-[11px] text-slate-300 line-clamp-2">{selectedCookieForModal.desc}</p>
              </div>
            </div>

            {/* Stats & Skills breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">체력 / 점프</span>
                <span className="font-bold text-white">HP +{selectedCookieForModal.bonusHp} • 점프 {selectedCookieForModal.maxJumps}단</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">특수 능력</span>
                <span className="font-bold text-amber-300 truncate block">{selectedCookieForModal.specialSkill}</span>
              </div>
            </div>

            {/* Mission Unlock Status Section */}
            {selectedCookieForModal.unlockMission && (
              <div className={`p-4 rounded-2xl border space-y-2 ${
                checkIsMissionCompleted(selectedCookieForModal).completed
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-100'
                  : 'bg-slate-950/90 border-slate-800 text-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    {checkIsMissionCompleted(selectedCookieForModal).completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-400" />
                    )}
                    <span>해금 미션: {selectedCookieForModal.unlockMission.description}</span>
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    checkIsMissionCompleted(selectedCookieForModal).completed
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-amber-400'
                  }`}>
                    {checkIsMissionCompleted(selectedCookieForModal).completed 
                      ? '달성 완료 (코인 구매 가능!)' 
                      : `진행도 ${checkIsMissionCompleted(selectedCookieForModal).current}/${checkIsMissionCompleted(selectedCookieForModal).target}`
                    }
                  </span>
                </div>

                {!checkIsMissionCompleted(selectedCookieForModal).completed && (
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${checkIsMissionCompleted(selectedCookieForModal).progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Two Purchase Buttons */}
            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>구매 방식 선택</span>
                <span>보유: {coins.toLocaleString()}🪙 / {crystals.toLocaleString()}💎</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method 1: Coin Unlock (Requires Mission) */}
                <button
                  disabled={!checkIsMissionCompleted(selectedCookieForModal).completed}
                  onClick={() => handleUnlockCookieWithCoins(selectedCookieForModal)}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                    checkIsMissionCompleted(selectedCookieForModal).completed
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-sm font-black">
                    <Coins className="w-4 h-4" />
                    <span>{selectedCookieForModal.unlockCostCoins.toLocaleString()} 🪙</span>
                  </div>
                  <span className="text-[10px] font-bold">
                    {checkIsMissionCompleted(selectedCookieForModal).completed ? '미션 달성 코인 구매' : '미션 완료 후 코인 구매 가능'}
                  </span>
                </button>

                {/* Method 2: Crystal Unlock (Instant bypass) */}
                <button
                  onClick={() => handleUnlockCookieWithCrystals(selectedCookieForModal)}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black flex flex-col items-center justify-center gap-1 shadow-xl shadow-cyan-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-1.5 text-sm font-black">
                    <Gem className="w-4 h-4" />
                    <span>{selectedCookieForModal.unlockCostCrystals} 💎</span>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-200">
                    크리스탈 즉시 구매 (미션 무관)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. GACHA REVEAL MODAL */}
      {/* ========================================================================= */}
      {isGachaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 border-2 border-purple-500/60 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            {gachaAnimStep === 'opening' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-6">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-1 animate-spin shadow-2xl shadow-purple-500/50 flex items-center justify-center text-6xl">
                  🎁
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white animate-pulse">
                    신비로운 전설의 황금 알을 부화시키는 중...
                  </h3>
                  <p className="text-xs text-purple-300">어떤 강력한 단짝 펫이 나타날까요?</p>
                </div>
              </div>
            )}

            {gachaAnimStep === 'revealed' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black border border-purple-500/40">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>소환 성공!</span>
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white mt-2">
                    새로운 펫 동료를 만났습니다!
                  </h3>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-[340px] overflow-y-auto p-2">
                  {gachaResults.map((res, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 relative shadow-lg"
                    >
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow border-2"
                        style={{ backgroundColor: res.pet.color, borderColor: res.pet.accentColor }}
                      >
                        {res.pet.avatarIcon}
                      </div>

                      <div>
                        <h5 className="font-extrabold text-white text-xs truncate w-full">{res.pet.name}</h5>
                        <span className="text-[10px] text-amber-300 font-bold">
                          {res.isNew ? '✨ NEW!' : `Lv.${res.level}`}
                        </span>
                      </div>

                      {getRarityBadge(res.pet.rarity)}

                      <button
                        onClick={() => {
                          handleSelectPet(res.pet);
                          setIsGachaModalOpen(false);
                          showToast(`🐾 ${res.pet.name}를 즉시 장착했습니다!`);
                        }}
                        className="w-full py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px]"
                      >
                        즉시 장착
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handlePerformGacha(1, 'coins')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                  >
                    1회 더 소환 (1,000🪙)
                  </button>

                  <button
                    onClick={() => setIsGachaModalOpen(false)}
                    className="px-8 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg transition-colors"
                  >
                    확인 및 닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. ATTENDANCE CHECK-IN MODAL */}
      {/* ========================================================================= */}
      {showAttendance && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>7일 연속 출석 보상</span>
              </h4>
              <button onClick={() => setShowAttendance(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {[
                { day: 'Day 1', reward: '1,000🪙', icon: '🪙', isChecked: true },
                { day: 'Day 2', reward: '50💎', icon: '💎', isChecked: true },
                { day: 'Day 3', reward: '3,000🪙', icon: '🪙', isChecked: true },
                { day: 'Day 4', reward: '100💎', icon: '💎', isChecked: false, today: true },
                { day: 'Day 5', reward: '5,000🪙', icon: '🪙', isChecked: false },
                { day: 'Day 6', reward: '200💎', icon: '💎', isChecked: false },
                { day: 'Day 7', reward: '레전더리 알', icon: '🎁', isChecked: false, special: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl flex flex-col items-center text-center space-y-1 border ${
                    item.today 
                      ? 'bg-amber-500/20 border-amber-400 shadow-lg animate-pulse'
                      : item.isChecked
                      ? 'bg-slate-950/80 border-slate-800 opacity-60'
                      : 'bg-slate-950/50 border-slate-800'
                  } ${item.special ? 'col-span-2 bg-gradient-to-r from-purple-950 to-indigo-950 border-purple-500/50' : ''}`}
                >
                  <span className="text-[10px] font-black text-slate-400">{item.day}</span>
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[11px] font-extrabold text-white">{item.reward}</span>
                  {item.isChecked && <span className="text-[9px] text-emerald-400 font-bold">출석완료</span>}
                  {item.today && (
                    <button
                      onClick={() => {
                        setCrystals((cr) => cr + 100);
                        sound.playGiantBear();
                        showToast('🎉 Day 4 출석 보상 100💎 수령 완료!');
                        setShowAttendance(false);
                      }}
                      className="w-full py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px]"
                    >
                      받기
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAttendance(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. PROBABILITY / GACHA DROP TABLE MODAL */}
      {/* ========================================================================= */}
      {showProbModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <span>펫 소환 확률 안내</span>
              </h4>
              <button onClick={() => setShowProbModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-amber-400">★ LEGENDARY (드림캐쳐)</span>
                <span className="font-mono font-bold text-slate-200">10.0% (픽업 이벤트)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-purple-400">★ EPIC (마법사전, 천사별, 젤리코, 뚝딱이, 참나무통)</span>
                <span className="font-mono font-bold text-slate-200">25.0%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-blue-400">★ RARE (꼬마유령, 로켓폭죽, 브레인껌)</span>
                <span className="font-mono font-bold text-slate-200">40.0%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-slate-400">★ COMMON (초코방울)</span>
                <span className="font-mono font-bold text-slate-200">25.0%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              * 이미 보유한 펫을 중복으로 획득하면 <strong>펫 레벨이 +1 상승</strong>하며 스킬 쿨타임 단축 및 점수 배율이 증가합니다!
            </p>

            <button
              onClick={() => setShowProbModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. MAILBOX MODAL */}
      {/* ========================================================================= */}
      {showMailbox && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <span>우편함 (보상 수령)</span>
              </h4>
              <button onClick={() => setShowMailbox(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-white text-xs">🌙 레전더리 달빛술사 & 드림캐쳐 출시 기념</h5>
                  <p className="text-[11px] text-slate-400">탈출러 여러분을 위한 특별 지원금</p>
                </div>
                <button 
                  onClick={() => { setCoins((c) => c + 10000); setCrystals((cr) => cr + 300); sound.playPotion(); showToast('🪙 +10,000 코인 & 💎 +300 크리스탈 수령!'); }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
                >
                  수령 (10,000🪙)
                </button>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-white text-xs">✨ 1,000m 무한 스테이지 질주 보급품</h5>
                  <p className="text-[11px] text-slate-400">생명 하트 및 크리스탈 지원</p>
                </div>
                <button 
                  onClick={() => { setCrystals((cr) => cr + 200); setHearts(5); sound.playPotion(); showToast('💎 +200 크리스탈 & ❤️ 하트 충전 완료!'); }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs"
                >
                  수령 (200💎)
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowMailbox(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
