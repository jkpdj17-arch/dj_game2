import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Gamepad2, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Heart, 
  Shield, 
  Layers, 
  Zap, 
  TrendingUp,
  Cpu,
  Coins
} from 'lucide-react';

export const GDDDocument: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'summary' | 'controls' | 'systems' | 'items' | 'characters' | 'stages' | 'tech' | 'bm'>('all');

  const gddMarkdown = `# 🎮 크로스플랫폼 횡스크롤 런닝 액션 게임 기획안 (GDD)
**프로젝트명**: 쿠키 런 어드벤처 (Cookie Run-Style Action Runner)
**타겟 플랫폼**: PC Web / Mobile Web / Hybrid App (iOS, Android)
**엔진 권장안**: HTML5 Canvas + WebGL (PixiJS / Phaser) or Unity WebGL
**기획 버전**: v1.0.0 (오븐 탈출 & 닌자 액션 테마)

---

## 1. 프로젝트 개요 (Executive Summary)
- **장르**: 2D 횡스크롤 캐주얼 런닝 액션 (Side-Scrolling Endless / Stage Runner)
- **핵심 재미 요소 (Core Fun)**:
  1. 점프와 슬라이드 단 2가지 조작으로 느끼는 리드미컬하고 짜릿한 회피 쾌감
  2. 젤리, 곰젤리, 코인을 싹쓸이 흡수할 때 느껴지는 시각·청각적 수집 카타르시스
  3. B-O-N-U-S-T-I-M-E 알파벳 수집 후 돌입하는 대규모 보너스 피버 타임
  4. PC와 모바일 어디서든 끊김 없이 동일한 손맛을 제공하는 크로스플랫폼 접근성

---

## 2. 크로스플랫폼 조작계 및 UI/UX 설계 (PC & Mobile Unified Controls)

### [모바일 조작 (Touch UI)]
- **좌측 하단 [JUMP] 터치패드**:
  - 1회 탭: 기본 1단 점프
  - 공중에서 추가 탭: 닌자 2단 회전 점프 / 3단 점프
- **우측 하단 [SLIDE] 터치패드**:
  - 누르고 있는 동안(Hold): 몸을 낮추어 바닥을 미끄러지는 슬라이드 자세 유지
  - 손을 떼면(Release): 즉시 달리기 자세로 복귀
  - 공중에서 슬라이드 입력 시: 지면으로 즉각 급강하(Fast Dive)

### [PC 키보드 조작 (Keyboard Mapping)]
| 동작 | 주 키 (Primary) | 보조 키 (Alternative) |
| :--- | :--- | :--- |
| **점프 (Jump)** | **D 키 / S 키** | Spacebar / W / ↑ (방향키 상) |
| **슬라이드 (Slide)** | **J 키 / K 키** | ↓ (방향키 하) (홀드 유지) |
| **일시정지 (Pause)** | ESC / P 키 | 화면 일시정지 아이콘 클릭 |

### [반응형 화면 대응]
- 기본 16:9 해상도 (1280 × 720 논리 좌표계)
- 모바일 가로 모드 자동 감지 및 전체화면 지원
- 노치 디자인(Safe Area)을 고려하여 좌우 버튼 및 상단 HUD 여백 자동 산출

---

## 3. 코어 게임 시스템 & 메카닉 (Core Gameplay Mechanics)

### 3.1 달리기 및 속도 곡선 (Running Speed)
- 기본 이동 속도: 520 px/sec
- 거리 비례 가속: 500m 주행마다 속도 3% 점진 증가 (최대 140% 상한선)
- 광속질주(Blast) 발동 시: 즉시 160% 가속 + 무적 판정

### 3.2 체력(HP) 시스템 & 생존 메커니즘
- 최대 체력(Max HP): 100
- **지속 감소율 (HP Drain)**: 매초 2.8%씩 고정 감소 (시간이 지날수록 체력 고갈 압박)
- **피격 대미지 (Damage)**: 장애물 충돌 시 HP -22 즉시 차감
- **무적 시간 (i-Frame)**: 피격 후 1.2초간 무적 상태(스프라이트 깜빡임)
- **체력 회복약 (Health Potion)**: 소형 물약(+15% 회복), 대형 물약(+35% 회복)
- **게임 오버 판정**: HP가 0이 되면 쓰러지며 런 종료, 최종 점수 정산

### 3.3 히트박스(Hitbox) 판정 기준
- 일반 달리기 상태: 폭 45px × 높이 75px
- 슬라이드 상태: 폭 70px × 높이 38px (높이가 약 50% 줄어들어 낮은 장애물 하단 통과)
- 거대화 상태: 폭 100px × 높이 115px (공격 판정으로 장애물 접촉 시 파괴)

---

## 4. 오브젝트 및 아이템 시스템 명세 (Objects & Items)

### 4.1 젤리 & 코인 (Score & Currency)
| 아이템명 | 외형 | 획득 점수 | 특수 기능 및 효과 |
| :--- | :--- | :--- | :--- |
| **일반 젤리 (Basic)** | 노란 물방울 | +300점 | 기본 스폰 젤리 |
| **노란 곰젤리 (Yellow Bear)** | 활짝 웃는 노란 곰 | +800점 | 곰젤리파티 시 다량 출현 |
| **분홍 곰젤리 (Pink Bear)** | 윙크하는 분홍 곰 | +1,200점 | 고득점 전용 곰젤리 |
| **왕곰젤리 (Giant Bear)** | 거대한 미소 황금 곰 | +5,000점 | 스테이지 핵심 하이라이트 구간 배치 |
| **골드 코인 (Coin)** | 반짝이는 금화 | +100점 / 1코인 | 상점 및 업그레이드 전용 재화 |
| **알파벳 젤리 (Alphabet)** | 빛나는 원형 구슬 | +2,000점 | B, O, N, U, S, T, I, M, E 9글자 수집용 |

### 4.2 소모성 버프 물약 (Potions)
1. **곰젤리파티 (Bear Jelly Party)**:
   - 8초간 지속. 화면 전체에 "곰젤리파티!" 연출 팝업
   - 주변 및 전방의 모든 일반 젤리가 노랑/분홍 곰젤리로 일괄 변환
2. **거대화 물약 (Giant Potion)**:
   - 6초간 캐릭터 크기 1.6배 확대
   - 몸통 충돌로 모든 장애물을 박살내며 파괴 점수(+2,000점) 획득
3. **자석 물약 (Magnet Potion)**:
   - 8초간 반경 280px 내의 모든 젤리와 코인을 플레이어에게 끌어당김
4. **광속질주 (Blast Potion)**:
   - 5초간 160% 스피드로 초고속 대시 + 완전 무적 + 자동 흡수

---

## 5. 보너스타임 (BONUSTIME) 피버 시스템
- **진입 조건**: 맵 전역에 드문드문 등장하는 [B] [O] [N] [U] [S] [T] [I] [M] [E] 9개 알파벳을 모두 모음
- **연출 및 페이즈 변환**:
  - 화면이 황금빛으로 번쩍이며 오븐 배경에서 아름다운 밤하늘/구름 천국으로 급상승!
  - 12초간 지속되며 플레이어의 체력 감소가 완전 정지됨
  - 거대한 무지개 궤적과 함께 곰젤리 하트, 왕곰젤리 떼가 쏟아져 대규모 점수 폭발!
  - 보너스타임 종료 시 안전하게 체력 +20% 보너스와 함께 일반 스테이지로 복귀

---

## 6. 캐릭터 & 펫 & 보물 시스템 스펙 (Character & Pet Synergy)

### 6.1 플레이어 캐릭터: 닌자맛 쿠키 (Ninja Cookie)
- **외형**: 짙은 파란색 닌자 복장, 표창 문양, 휘날리는 헤어밴드 머플러, 날카로운 눈매
- **특수 능력 (Multi-Jump)**:
  - 기본 캐릭터는 2단 점프까지만 가능하지만, 닌자 쿠키는 **최대 3단(업그레이드 시 10단) 점프** 가능
  - 점프 시 공중제비 아크로바틱 회전 및 푸른 표창 스파크 방출

### 6.2 전용 펫: 꼬마유령 (Ghost Pet)
- **외형**: 캐릭터 곁을 둥둥 떠다니는 귀여운 하얀 꼬마 유령
- **스킬**:
  - 낙사 구멍(Pit)에 추락 시 밧줄로 1회 즉시 구출
  - 체력 소진 시 1회 유령 부활 (체력 30% 회복 상태로 부활)

### 6.3 보물 슬롯 시스템 (하단 5개 슬롯)
- 장착형 패시브 아이템 장착으로 플레이 스타일 맞춤형 세팅:
  1. [자석 펜던트]: 자석 지속시간 및 흡인 범위 +20%
  2. [곰젤리 왕관]: 노랑/분홍 곰젤리 획득 점수 +25%
  3. [불사조의 깃털]: 보너스타임 지속시간 +3초
  4. [황금 나침반]: 코인 획득 시 10% 확률로 2배 획득
  5. [수호의 방패]: 1회 장애물 충돌 대미지 100% 흡수 방어

---

## 7. 스테이지 & 레벨 디자인 (Stage & Level Design)

### [테마 1: 마녀의 탈출 오븐 (Escape the Oven)]
- **분위기**: 붉게 타오르는 화로, 붉은 벽돌벽, 은색 금속 발판, 솟구치는 불티 파티클
- **장애물 패턴**:
  - **낮은 불꽃 함정 (Low Obstacle)**: 1단 점프로 경쾌하게 뛰어넘기
  - **높은 증기 파이프 (Tall Pipe)**: 2단 점프로 체공하여 넘어가야 하는 구조물
  - **공중 천장 가시/칼날 (Ceiling Obstacle)**: 점프하면 부딪히며, 오직 [SLIDE]로만 통과 가능
  - **연속 복합 리듬 패턴**: [점프] -> [2단 점프] -> [즉시 슬라이드]로 이어지는 핑거 리듬감

---

## 8. 기술 아키텍처 및 크로스플랫폼 최적화 방안
1. **렌더링 파이프라인**:
   - 60 FPS / 120 FPS 고정 타임스텝 물리학 계산 (Delta Time 기반 안정성)
   - 파티클 오브젝트 풀링(Object Pooling)으로 모바일 저사양 기기 메모리 누수 방지
2. **반응형 스케일러**:
   - HTML5 Canvas의 내부 렌더 해상도는 1280x720 고정, CSS 축소/확대(Letterboxing)를 통해 비율 왜곡 없는 선명한 화면 렌더링
3. **네이티브 오디오**:
   - Web Audio API 프로시저럴 합성 사운드로 외부 사운드 파일 다운로드 없이 0ms 즉각 발음

---

## 9. 비즈니스 모델(BM) & 라이브 서비스 확장 로드맵
- **1단계 (출시 단계)**: 싱글 런 랭킹전, 일일 퀘스트, 업적 보상 시스템
- **2단계 (성장 단계)**: 신규 캐릭터(천사맛, 좀비맛, 해적맛 등) 및 펫 조합 수집형 뽑기(Gacha)
- **3단계 (멀티플레이)**: 웹소켓(WebSocket) 기반 실시간 1:1 대전(고스트 러너 러닝 배틀)
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gddMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([gddMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CookieRun_CrossPlatform_GDD.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <FileText className="w-4 h-4" />
              <span>OFFICIAL GAME DESIGN DOCUMENT (GDD)</span>
              <span className="bg-amber-400/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">v1.0.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
              크로스플랫폼 횡스크롤 런닝 액션 게임 기획안
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              컴퓨터(PC 키보드)와 모바일(터치패드) 양방향 크로스플랫폼 지원 쿠키런 스타일 게임 설계서
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사 완료!' : '기획안 마크다운 복사'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>.MD 파일 다운로드</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto mt-6 pt-4 border-t border-slate-800/80 scrollbar-none text-xs md:text-sm">
          {[
            { id: 'all', label: '전체 보기' },
            { id: 'summary', label: '1. 개요 & USP' },
            { id: 'controls', label: '2. PC & 모바일 조작계' },
            { id: 'systems', label: '3. 코어 메카닉 (HP/점프/슬라이드)' },
            { id: 'items', label: '4. 젤리 & 곰젤리파티 & 아이템' },
            { id: 'characters', label: '5. 닌자맛 & 꼬마유령 & 보물' },
            { id: 'stages', label: '6. 보너스타임 & 레벨디자인' },
            { id: 'tech', label: '7. 기술 아키텍처' },
            { id: 'bm', label: '8. 비즈니스 모델(BM)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeSection === tab.id
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Document Body */}
      <div className="space-y-6">
        {/* Section 1: Summary */}
        {(activeSection === 'all' || activeSection === 'summary') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">SECTION 01</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">프로젝트 개요 및 핵심 셀링 포인트 (USP)</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <h3 className="text-amber-300 font-semibold text-sm mb-1 flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> PC & 모바일 완전 크로스플랫폼
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  키보드(Space, 방향키)와 모바일 터치 패드(좌 점프, 우 슬라이드)를 동시 지원하여 기기 제약 없이 직관적으로 플레이 가능합니다.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <h3 className="text-pink-400 font-semibold text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 곰젤리파티 & 시각적 쾌감
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  일반 젤리가 노랑/분홍 곰젤리와 왕곰젤리로 일괄 변환되는 곰젤리파티와 자석 흡입으로 극대화된 손맛을 선사합니다.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <h3 className="text-sky-400 font-semibold text-sm mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> BONUSTIME 피버 모드
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  9글자의 알파벳 젤리를 모으면 타오르는 오븐에서 구름 위 밤하늘로 상승하여 대량의 곰젤리를 파밍하는 피버 타임으로 전환됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Controls */}
        {(activeSection === 'all' || activeSection === 'controls') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">SECTION 02</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">크로스플랫폼 조작 체계 및 반응형 UX 설계</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* PC Controls */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center gap-2 text-blue-300 font-bold mb-3">
                  <Monitor className="w-4 h-4" />
                  <span>PC 브라우저 (데스크톱) 조작</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">점프 (1단 / 다단점프)</span>
                    <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">D / S 키 (보조: Space, ↑, W)</span>
                  </li>
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">슬라이드 (자세 유지)</span>
                    <span className="bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded font-mono font-bold">J / K 키 (보조: ↓)</span>
                  </li>
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">공중 급강하 (Fast Dive)</span>
                    <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">점프 중 J / K / ↓</span>
                  </li>
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">일시정지 (Pause)</span>
                    <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">ESC / P</span>
                  </li>
                </ul>
              </div>

              {/* Mobile Controls */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center gap-2 text-emerald-300 font-bold mb-3">
                  <Smartphone className="w-4 h-4" />
                  <span>모바일 / 태블릿 (터치스크린) 조작</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">좌측 하단 [JUMP] 패드</span>
                    <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">탭: 점프 / 연타: 다단점프</span>
                  </li>
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">우측 하단 [SLIDE] 패드</span>
                    <span className="bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded font-mono font-bold">홀드: 슬라이딩 유지</span>
                  </li>
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">터치 영역 크기 및 위치</span>
                    <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">반경 48px 대형 터치존</span>
                  </li>
                  <li className="flex items-start justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-white">시각적 피드백</span>
                    <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">터치 시 발광 링 및 진동 지원</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Core Mechanics */}
        {(activeSection === 'all' || activeSection === 'systems') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-red-400 text-xs font-bold uppercase tracking-wider">SECTION 03</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">코어 게임플레이 메카닉 & 밸런스 공식</h2>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  1. 체력(HP) 소진 및 생존 밸런스 공식
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  쿠키런의 긴장감의 원천은 <strong>지속적으로 줄어드는 체력</strong>과 <strong>생명 연장 물약</strong>의 획득입니다.
                </p>
                <div className="bg-slate-950/80 p-3 rounded-lg font-mono text-xs text-amber-300 border border-slate-800">
                  현재 HP = 최대 HP(100) - (초당 감소율 2.8% × 플레이 시간) - (충돌 횟수 × 22 HP) + (회복 물약 획득량)
                </div>
                <p className="text-slate-400 text-xs">
                  • <strong>충돌 무적 판정(i-Frame)</strong>: 피격 시 1.2초간 무적 상태(반투명 점멸)가 적용되어 연쇄 피해를 방지합니다.
                </p>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  2. 점프 및 슬라이드 물리 파라미터
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">중력 가속도 (Gravity)</span>
                    <span className="font-bold text-white text-sm">2,100 px/s²</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">1단 점프력 (Jump Force)</span>
                    <span className="font-bold text-white text-sm">-820 px/s (140px 체공)</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">2단/다단 점프력</span>
                    <span className="font-bold text-white text-sm">-740 px/s (공중 회전)</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">슬라이드 히트박스 감축</span>
                    <span className="font-bold text-emerald-400 text-sm">높이 75px ➔ 38px (50%↓)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Items & Jellies */}
        {(activeSection === 'all' || activeSection === 'items') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">SECTION 04</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">오브젝트 & 아이템 상세 명세</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">아이템</th>
                    <th className="py-3 px-4">타입</th>
                    <th className="py-3 px-4">점수 / 효과</th>
                    <th className="py-3 px-4">등장 확률 및 기획 의도</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-yellow-300 flex items-center gap-2">
                      <span className="text-base">💧</span> 일반 젤리
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">점수 젤리</td>
                    <td className="py-2.5 px-4 font-mono">+300 점</td>
                    <td className="py-2.5 px-4 text-slate-400">기본 동선 유도선(Arc Line) 배치</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-amber-400 flex items-center gap-2">
                      <span className="text-base">🐻</span> 노란 곰젤리
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">고급 젤리</td>
                    <td className="py-2.5 px-4 font-mono">+800 점</td>
                    <td className="py-2.5 px-4 text-slate-400">기본 웨이브 또는 곰젤리파티 시 다량 변환</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-pink-400 flex items-center gap-2">
                      <span className="text-base">🐻</span> 분홍 곰젤리
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">특수 젤리</td>
                    <td className="py-2.5 px-4 font-mono">+1,200 점</td>
                    <td className="py-2.5 px-4 text-slate-400">위험 구역이나 높은 공중 지점 보상으로 배치</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-amber-300 flex items-center gap-2">
                      <span className="text-xl">🌟</span> 왕곰젤리 (거대)
                    </td>
                    <td className="py-2.5 px-4 text-amber-400 font-bold">최고급 젤리</td>
                    <td className="py-2.5 px-4 font-mono text-amber-300 font-bold">+5,000 점</td>
                    <td className="py-2.5 px-4 text-slate-300">이미지 중앙 배치된 특대형 곰젤리 (성취감 극대화)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-yellow-400 flex items-center gap-2">
                      <span className="text-base">🪙</span> 코인 (Gold)
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">재화</td>
                    <td className="py-2.5 px-4 font-mono">+1 코인 / +100점</td>
                    <td className="py-2.5 px-4 text-slate-400">캐릭터 및 펫 강화 전용 통화</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-sky-400 flex items-center gap-2">
                      <span className="text-base">🔤</span> 알파벳 젤리
                    </td>
                    <td className="py-2.5 px-4 text-sky-300 font-bold">피버 트리거</td>
                    <td className="py-2.5 px-4 font-mono">+2,000점 / 문자 누적</td>
                    <td className="py-2.5 px-4 text-slate-300">B,O,N,U,S,T,I,M,E 9글자 수집 시 보너스타임 돌입</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-amber-500 flex items-center gap-2">
                      <span className="text-base">🧪</span> 곰젤리파티 물약
                    </td>
                    <td className="py-2.5 px-4 text-amber-400">변환 버프</td>
                    <td className="py-2.5 px-4 font-mono">8초간 모든 젤리 ➔ 곰젤리</td>
                    <td className="py-2.5 px-4 text-slate-300">화면에 &ldquo;곰젤리파티!&rdquo; 팝업 및 대량 득점</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-emerald-400 flex items-center gap-2">
                      <span className="text-base">▲</span> 거대화 물약
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400">파괴 버프</td>
                    <td className="py-2.5 px-4 font-mono">6초간 크기 1.6배 + 장애물 파괴</td>
                    <td className="py-2.5 px-4 text-slate-300">장애물 충돌 시 즉시 분쇄 +2,000점</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-red-400 flex items-center gap-2">
                      <span className="text-base">♥</span> 체력 회복 물약
                    </td>
                    <td className="py-2.5 px-4 text-red-400">생존 회복</td>
                    <td className="py-2.5 px-4 font-mono">HP +35% 회복</td>
                    <td className="py-2.5 px-4 text-slate-300">런 지속을 위해 반드시 획득해야 하는 핵심 오브젝트</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 5: Characters & Pets */}
        {(activeSection === 'all' || activeSection === 'characters') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">SECTION 05</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">캐릭터 & 펫 & 보물 시너지 스펙</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/70">
                <span className="text-blue-400 text-xs font-bold block mb-1">플레이어블 쿠키</span>
                <h3 className="text-lg font-bold text-white">닌자맛 쿠키 (Ninja Cookie)</h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">이미지에 등장하는 날렵한 파란색 닌자 복장의 쿠키</p>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>스킬: 다단 점프(Multi-Jump)</strong></li>
                  <li>기본 2단을 넘어 <strong>최대 3단 이상 공중제비 점프</strong> 가능</li>
                  <li>공중에서 뛰어난 궤적 수정 능력으로 낙사 방지 및 고공 곰젤리 획득 특화</li>
                  <li>슬라이드 시 지면에 마찰 스파크 파티클 연출</li>
                </ul>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/70">
                <span className="text-sky-400 text-xs font-bold block mb-1">동반 펫 (Companion Pet)</span>
                <h3 className="text-lg font-bold text-white">꼬마유령 펫 (Ghost Pet)</h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">캐릭터 좌측 상단을 둥둥 떠다니며 서포트하는 펫</p>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>스킬 1: 구덩이 낙사 구출 (1회)</strong></li>
                  <li>발판이 끊겨 아래로 추락할 때 밧줄로 플레이어를 끌어올림</li>
                  <li><strong>스킬 2: 체력 고갈 시 유령 부활 (1회)</strong></li>
                  <li>HP 0이 될 때 영혼 에너지로 체력 30%를 회복시키며 부활</li>
                </ul>
              </div>

              <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/70">
                <span className="text-amber-400 text-xs font-bold block mb-1">하단 보물 슬롯 (5개)</span>
                <h3 className="text-lg font-bold text-white">보물 세팅 (Treasure Deck)</h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">화면 하단 중앙에 배치된 5개의 보물 슬롯</p>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>슬롯 1: <strong>노란곰젤리 보물</strong> (곰젤리 점수 +200점)</li>
                  <li>슬롯 2: <strong>별빛 펜던트</strong> (보너스타임 체류시간 +2초)</li>
                  <li>슬롯 3: <strong>수호의 방패</strong> (장애물 충돌 1회 면제)</li>
                  <li>슬롯 4: <strong>초강력 자석</strong> (자석 흡인 범위 1.3배)</li>
                  <li>슬롯 5: <strong>코인 주머니</strong> (코인 획득량 15% 보너스)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Bonus Time & Stages */}
        {(activeSection === 'all' || activeSection === 'stages') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">SECTION 06</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">보너스타임(BONUSTIME) & 레벨 디자인</h2>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-white text-sm mb-2 text-amber-300">
                  ★ BONUSTIME 피버 시스템 플로우
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs">
                  <li><strong>알파벳 수집</strong>: 런 진행 중 [B] [O] [N] [U] [S] [T] [I] [M] [E] 총 9문자를 모두 모음. (좌측 상단 HUD에 불이 들어옴)</li>
                  <li><strong>천국 상승 연출</strong>: 9문자가 모이는 즉시 화면 플래시와 함께 캐릭터가 날개를 달고 하늘/밤하늘 구름 위로 솟구침!</li>
                  <li><strong>무적 피버 타임</strong>: 12초 동안 체력 감소가 멈추며, 노랑 곰젤리와 분홍 곰젤리, 그리고 거대 왕곰젤리가 하트와 무지개 대형으로 쏟아짐!</li>
                  <li><strong>복귀</strong>: 보너스타임 종료 시 체력 +20% 추가 보너스를 획득하고 안전하게 다시 탈출 오븐 지상 트랙으로 복귀.</li>
                </ol>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-white text-sm mb-2 text-orange-300">
                  탈출 오븐(Escape the Oven) 장애물 3대 배치 공식
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">1. 저지대 화로 함정 (Low)</span>
                    <p className="text-slate-400">높이 60px. 1단 점프로 통과 가능. 리듬감 형성을 위한 기본 장애물.</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-red-400 font-bold block mb-1">2. 고층 증기 굴뚝 (Tall)</span>
                    <p className="text-slate-400">높이 135px. 1단 점프로는 닿으며 반드시 2단 점프를 해야만 통과 가능.</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-blue-400 font-bold block mb-1">3. 천장 강철 칼날 (Ceiling)</span>
                    <p className="text-slate-400">지상 50px 위로 돌출. 점프 시 무조건 충돌하며 오직 [SLIDE]로만 통과 가능.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 7: Technical Architecture */}
        {(activeSection === 'all' || activeSection === 'tech') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">SECTION 07</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">기술 아키텍처 및 크로스플랫폼 최적화 방안</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-slate-300">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-emerald-300 text-sm mb-2">프레임 안정화 & 물리학 루프</h3>
                <p className="text-xs text-slate-400 mb-2">
                  모바일 기기의 주사율(60Hz, 90Hz, 120Hz) 차이로 인해 게임 속도가 달라지는 현상을 원천 차단하기 위해 <strong>Delta Time 기반 가변 보정</strong>과 고정 물리 타임스텝을 적용합니다.
                </p>
                <div className="bg-slate-950 p-2.5 rounded font-mono text-xs text-slate-300 border border-slate-800">
                  const dt = Math.min((now - lastTime) / 1000, 0.08);<br />
                  player.y += player.vy * dt;
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-emerald-300 text-sm mb-2">오디오 및 에셋 번들 제로 레이턴시</h3>
                <p className="text-xs text-slate-400 mb-2">
                  모바일 브라우저의 오디오 정책(User Gesture Required) 및 파일 로딩 렉을 없애기 위해 <strong>Web Audio API 프로시저럴 합성기</strong>를 내장하여 점프, 슬라이드, 젤리 획득음을 0ms 딜레이로 출력합니다.
                </p>
                <div className="bg-slate-950 p-2.5 rounded font-mono text-xs text-slate-300 border border-slate-800">
                  oscillator.type = &apos;triangle&apos;;<br />
                  gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 8: BM */}
        {(activeSection === 'all' || activeSection === 'bm') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">SECTION 08</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">비즈니스 모델(BM) & 라이브 서비스 로드맵</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
                  <Coins className="w-4 h-4" />
                  <span>1. 재화 경제 & 쿠키 해금 시스템</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  • <strong>크리스탈 즉시 구매 (Instant Bypass)</strong>: 미션 달성 여부와 무관하게 다이아몬드(크리스탈)로 원하는 쿠키를 즉시 구매 및 해금<br />
                  • <strong>미션 달성 코인 구매 (Mission-Gated Coin Unlock)</strong>: 각 쿠키별 고유 도전 과제(플레이어 레벨, 펫 보유 수, 누적 플레이 횟수 등)를 완수하면 골드 코인으로 구매 가능
                </p>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-pink-300 font-bold mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>2. 시즌제 랭킹전 & 패스 (Pass)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  • 매주 갱신되는 친구 및 글로벌 리더보드 순위 경쟁 (이미지 우측 상단 &apos;다음목표 97등&apos; 기반)<br />
                  • 달린 누적 거리 및 점수에 따라 단계별 보상을 해금하는 <strong>&apos;런너 패스(Runner Pass)&apos;</strong> 운영
                </p>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-sky-300 font-bold mb-2">
                  <Gamepad2 className="w-4 h-4" />
                  <span>3. 실시간 1:1 대전 확장 (Live)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  • WebSocket을 활용하여 실시간으로 상대방의 고스트 러너와 달리는 1:1 스피드 레이스 모드<br />
                  • 아이템전(상대방 시야 가리기, 장애물 소환 등)으로 e스포츠 캐주얼 재미 강화
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
