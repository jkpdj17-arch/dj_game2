import React from 'react';
import { GameSettings } from '../types';
import { Sliders, RotateCcw, Play, Zap } from 'lucide-react';

interface Props {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetDefaults: () => void;
  onRestartGame: () => void;
}

export const BalanceSandbox: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
  onRestartGame,
}) => {
  const handleChange = (key: keyof GameSettings, value: number) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">실시간 게임 밸런스 샌드박스 (Inspector)</h2>
            <p className="text-xs text-slate-400">
              기획안의 물리값과 난이도 파라미터를 실시간으로 조절하며 게임 플레이에 즉시 반영해볼 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 복원</span>
          </button>
          <button
            onClick={onRestartGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors active:scale-95 shadow-md shadow-amber-500/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>게임 재시작</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Run Speed */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">기본 이동 속도 (Base Speed)</span>
            <span className="font-mono font-bold text-amber-400">{settings.baseSpeed} px/s</span>
          </div>
          <input
            type="range"
            min={300}
            max={900}
            step={20}
            value={settings.baseSpeed}
            onChange={(e) => handleChange('baseSpeed', Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            기본 권장값: 520 px/s (쿠키런 특유의 속도감과 반응 시간의 균형점)
          </p>
        </div>

        {/* Gravity */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">중력 가속도 (Gravity)</span>
            <span className="font-mono font-bold text-amber-400">{settings.gravity} px/s²</span>
          </div>
          <input
            type="range"
            min={1200}
            max={3200}
            step={100}
            value={settings.gravity}
            onChange={(e) => handleChange('gravity', Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            기본 권장값: 2,100 px/s² (체공 시간이 너무 늘어지거나 급락하지 않는 묵직한 착지감)
          </p>
        </div>

        {/* Jump Force */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">1단 점프력 (Jump Force)</span>
            <span className="font-mono font-bold text-blue-400">{settings.jumpForce} px/s</span>
          </div>
          <input
            type="range"
            min={-1100}
            max={-600}
            step={20}
            value={settings.jumpForce}
            onChange={(e) => handleChange('jumpForce', Number(e.target.value))}
            className="w-full accent-blue-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            기본 권장값: -820 px/s (1단 낮은 장애물을 아슬아슬하게 넘어가는 정밀도)
          </p>
        </div>

        {/* Double Jump Force */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">2단/다단 점프력 (Double Jump)</span>
            <span className="font-mono font-bold text-blue-400">{settings.doubleJumpForce} px/s</span>
          </div>
          <input
            type="range"
            min={-1000}
            max={-500}
            step={20}
            value={settings.doubleJumpForce}
            onChange={(e) => handleChange('doubleJumpForce', Number(e.target.value))}
            className="w-full accent-blue-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            기본 권장값: -740 px/s (공중제비 회전과 함께 고공 굴뚝을 돌파)
          </p>
        </div>

        {/* HP Drain Rate */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">체력 지속 감소율 (HP Drain / sec)</span>
            <span className="font-mono font-bold text-red-400">{settings.hpDrainRate}% /초</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={6.0}
            step={0.2}
            value={settings.hpDrainRate}
            onChange={(e) => handleChange('hpDrainRate', Number(e.target.value))}
            className="w-full accent-red-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            기본 권장값: 2.8% (약 35초 생존 한계선, 물약 없이는 유지 불가)
          </p>
        </div>

        {/* Ninja Max Jumps */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">닌자맛 쿠키 최대 점프 횟수</span>
            <span className="font-mono font-bold text-emerald-400">{settings.maxNinjaJumps}단 점프</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={settings.maxNinjaJumps}
            onChange={(e) => handleChange('maxNinjaJumps', Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            이미지의 닌자맛 쿠키 시그니처 능력. 업그레이드 시 최대 8~10단까지 확장
          </p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
        <Zap className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-200 leading-relaxed">
          수치를 수정한 뒤 상단의 <strong>[🎮 게임 플레이]</strong> 탭으로 이동하면 변경된 물리 법칙이 실시간으로 적용되어 있습니다! 직접 점프와 슬라이드를 해보며 최적의 손맛을 조율해보세요.
        </p>
      </div>
    </div>
  );
};
