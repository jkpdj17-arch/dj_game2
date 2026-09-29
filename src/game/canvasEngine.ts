/**
 * High-performance 2D Canvas Game Engine
 * Features:
 * - Multi-character support (Ninja, Brave, Cherry, Angel, Hero)
 * - Dynamic stage transitions (Oven -> Emerald Forest -> Soda Ocean -> Candy Galaxy)
 * - Large Life Potion (커다란 생명물약) spawn at map transitions for dramatic recovery
 * - Straight line jellies with obstacle-matched jumping/sliding guide paths
 * - Faithful Cookie Run recreation of UI, HUD, Bonustime, and Sound
 */

import {
  GameMode,
  PlayerState,
  JellyItem,
  Obstacle,
  FloatingText,
  Particle,
  GameSettings,
  BonusTimeProgress,
  CookieId,
  PetId,
  StageId,
} from '../types';
import { sound } from './sound';
import { COOKIE_CHARACTERS, PET_CHARACTERS, STAGES, STAGE_SEQUENCE } from './constants';

export class RunningGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Game Dimensions (logical coordinate system 1280 x 720)
  public readonly width = 1280;
  public readonly height = 720;
  public readonly groundY = 560;

  // State
  public mode: GameMode = 'RUN';
  public player: PlayerState;
  public bonusProgress: BonusTimeProgress;
  public jellies: JellyItem[] = [];
  public obstacles: Obstacle[] = [];
  public floatingTexts: FloatingText[] = [];
  public particles: Particle[] = [];
  public settings: GameSettings;

  // Selected character & pet & stage
  public selectedCookieId: CookieId = 'brave';
  public selectedPetId: PetId = 'choco_drop';
  private petSkillTimer: number = 0;
  private zombieRevivesLeft: number = 3;
  private pirateRevived: boolean = false;
  private wizardSpellTimer: number = 0;
  private moonlightSpellTimer: number = 0;
  public currentStageIndex: number = 0;
  private stageDistanceThreshold: number = 50000; // 1000 meters in-game distance (50px = 1m)
  private lastStageWarpDistance: number = 0;
  private stageTransitionTimer: number = 0;
  private stageTransitionActive: boolean = false;
  private nextStageId: StageId = 'forest';

  // Spawners & timers
  private obstacleSpawnTimer = 0;
  private emberSpawnTimer = 0;
  private bonusTimeDuration = 0;
  public gameDistance = 0;
  private nextId = 1;

  // Background parallax offsets
  private bgOffset = 0;
  private floorOffset = 0;

  // Controls state
  public isJumpPressed = false;
  public isSlidePressed = false;

  // Callbacks for UI updates
  public onStateUpdate?: (state: {
    hp: number;
    score: number;
    coins: number;
    mode: GameMode;
    bonusProgress: BonusTimeProgress;
    currentStage: StageId;
    cookieId: CookieId;
  }) => void;

  public onGameOver?: (finalScore: number, finalCoins: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    customSettings?: Partial<GameSettings>,
    initialCookieId: CookieId = 'ninja',
    initialPetId: PetId = 'ghost'
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.selectedCookieId = initialCookieId;
    this.selectedPetId = initialPetId;

    const cookieData = COOKIE_CHARACTERS.find((c) => c.id === initialCookieId) || COOKIE_CHARACTERS[0];

    // Pet passive & combi bonus adjustments
    let hpDrain = 2.8;
    if (initialPetId === 'choco_drop' && initialCookieId === 'brave') {
      hpDrain = 2.1; // Brave + Choco Drop Combi: HP drain reduced
    }

    let maxJumps = cookieData.maxJumps;
    if (initialCookieId === 'ninja' && initialPetId === 'ghost') {
      maxJumps = 4; // Ninja + Ghost Combi: 4th acrobatic spin jump!
    }

    this.settings = {
      baseSpeed: 520,
      gravity: 2100,
      jumpForce: -820,
      doubleJumpForce: -740,
      hpDrainRate: hpDrain, // % per second
      jellyFrequency: 0.16,
      obstacleFrequency: 1.8,
      maxNinjaJumps: maxJumps,
      sfxVolume: 0.8,
      bgmVolume: 0.5,
      ...customSettings,
    };

    this.player = this.createInitialPlayer(initialCookieId, initialPetId, maxJumps);
    this.bonusProgress = this.createInitialBonusProgress();

    this.resizeCanvas();
  }

  public setCharacterAndPet(cookieId: CookieId, petId: PetId) {
    this.selectedCookieId = cookieId;
    this.selectedPetId = petId;
    const cookieData = COOKIE_CHARACTERS.find((c) => c.id === cookieId) || COOKIE_CHARACTERS[0];
    this.player.cookieId = cookieId;
    this.player.petId = petId;

    let maxJumps = cookieData.maxJumps;
    if (cookieId === 'ninja' && petId === 'ghost') {
      maxJumps = 4;
    }

    this.player.maxJumps = maxJumps;
    this.settings.maxNinjaJumps = maxJumps;
    this.player.maxHp = 100 + cookieData.bonusHp;
    this.player.hp = this.player.maxHp;

    if (petId === 'choco_drop' && cookieId === 'brave') {
      this.settings.hpDrainRate = 2.1;
    } else {
      this.settings.hpDrainRate = 2.8;
    }
  }

  private createInitialPlayer(cookieId: CookieId = 'ninja', petId: PetId = 'ghost', maxJumpsOverride?: number): PlayerState {
    const cookieData = COOKIE_CHARACTERS.find((c) => c.id === cookieId) || COOKIE_CHARACTERS[0];
    const maxHp = 100 + cookieData.bonusHp;
    const jumps = maxJumpsOverride || cookieData.maxJumps;

    return {
      x: 180,
      y: this.groundY - 90,
      width: 60,
      height: 90,
      vy: 0,
      isGrounded: true,
      isSliding: false,
      jumpCount: 0,
      maxJumps: jumps,
      hp: maxHp,
      maxHp: maxHp,
      score: 80600,
      coins: 12,
      targetRank: 97,
      isInvincible: false,
      invincibleTimer: 0,
      isGiant: false,
      giantTimer: 0,
      isSpeedBoost: false,
      speedBoostTimer: 0,
      isMagnet: false,
      magnetTimer: 0,
      isBearParty: false,
      bearPartyTimer: 0,
      cookieId: cookieId,
      petId: petId,
      currentStage: STAGE_SEQUENCE[this.currentStageIndex] || 'oven',
      stageTransitionProgress: 0,
    };
  }

  private createInitialBonusProgress(): BonusTimeProgress {
    const letters = ['B', 'O', 'N', 'U', 'S', 'T', 'I', 'M', 'E'];
    const letterMap: { [key: string]: boolean } = {};
    letters.forEach((l, idx) => {
      letterMap[l] = idx < 2; // B, O initially lit
    });
    return {
      letters: letterMap,
      count: 2,
    };
  }

  public resizeCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  public start() {
    this.mode = 'RUN';
    this.lastTime = performance.now();
    sound.startBGM();
    this.loop(this.lastTime);
  }

  public pause() {
    if (this.mode === 'RUN' || this.mode === 'BONUS_TIME') {
      this.mode = 'PAUSED';
      sound.stopBGM();
    }
  }

  public resume() {
    if (this.mode === 'PAUSED') {
      this.mode = 'RUN';
      this.lastTime = performance.now();
      sound.startBGM();
      this.loop(this.lastTime);
    }
  }

  public restart(resetScore: boolean = true) {
    this.currentStageIndex = 0;
    this.lastStageWarpDistance = 0;
    this.stageTransitionActive = false;
    this.stageTransitionTimer = 0;
    let maxJumps = 2;
    const cData = COOKIE_CHARACTERS.find((c) => c.id === this.selectedCookieId);
    if (cData) maxJumps = cData.maxJumps;
    if (this.selectedCookieId === 'ninja' && this.selectedPetId === 'ghost') maxJumps = 4;

    this.player = this.createInitialPlayer(this.selectedCookieId, this.selectedPetId, maxJumps);
    if (resetScore) {
      this.player.score = 0;
      this.player.coins = 0;
    }
    this.bonusProgress = this.createInitialBonusProgress();
    this.jellies = [];
    this.obstacles = [];
    this.floatingTexts = [];
    this.particles = [];
    this.gameDistance = 0;
    this.mode = 'RUN';
    this.lastTime = performance.now();
    sound.startBGM();
    if (!this.animFrameId) {
      this.loop(this.lastTime);
    }
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopBGM();
  }

  // --- INPUT HANDLING ---

  public handleJumpPress() {
    if (this.mode === 'GAME_OVER') return;
    if (this.player.isSliding) {
      this.player.isSliding = false;
    }

    if (this.player.jumpCount < this.player.maxJumps) {
      const isMulti = this.player.jumpCount > 0;
      this.player.vy = isMulti ? this.settings.doubleJumpForce : this.settings.jumpForce;
      this.player.jumpCount++;
      this.player.isGrounded = false;

      sound.playJump(isMulti);

      this.createJumpParticles(this.player.x + 30, this.player.y + this.player.height);

      if (isMulti) {
        this.addFloatingText(
          this.player.x + 20,
          this.player.y - 20,
          this.player.jumpCount === 2 ? 'DOUBLE JUMP!' : `${this.player.jumpCount}단 점프!`,
          '#60a5fa',
          20
        );
      }
    }
  }

  public handleSlidePress(pressed: boolean) {
    this.isSlidePressed = pressed;
    if (this.mode === 'GAME_OVER') return;

    if (pressed) {
      if (this.player.isGrounded) {
        this.player.isSliding = true;
        sound.playSlide();
      } else {
        this.player.vy = Math.max(this.player.vy, 950); // Fast dive
      }
    } else {
      this.player.isSliding = false;
    }
  }

  // --- MAIN LOOP ---

  private loop = (time: number) => {
    if (this.mode === 'PAUSED') return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.08);
    this.lastTime = time;

    this.update(dt);
    this.render();

    if (this.mode !== 'GAME_OVER') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  };

  // --- UPDATE LOGIC ---

  private update(dt: number) {
    const isBonus = this.mode === 'BONUS_TIME';
    const speedMultiplier = this.player.isSpeedBoost ? 1.6 : (isBonus ? 1.25 : 1.0);
    const currentSpeed = this.settings.baseSpeed * speedMultiplier;

    this.gameDistance += currentSpeed * dt;
    this.bgOffset += (currentSpeed * 0.3) * dt;
    this.floorOffset += currentSpeed * dt;

    // 1. Health Drain (stops during Bonus Time)
    if (!isBonus && this.mode === 'RUN') {
      let drain = this.settings.hpDrainRate;
      if (this.selectedPetId === 'brain_gum') drain *= 0.85; // Brain gum passive 15% reduction
      this.player.hp -= drain * dt;

      if (this.player.hp <= 0) {
        // Check Zombie Revival
        if (this.selectedCookieId === 'zombie' && this.zombieRevivesLeft > 0) {
          this.zombieRevivesLeft--;
          const isCombi = this.selectedPetId === 'brain_gum';
          const reviveHp = isCombi ? this.player.maxHp * 0.5 : this.player.maxHp * 0.35;
          this.player.hp = reviveHp;
          this.player.isInvincible = true;
          this.player.invincibleTimer = 3.0;
          sound.playPotion();
          this.addFloatingText(this.player.x + 80, this.player.y - 40, `🧟 [좀비 부활!] 남은 부활: ${this.zombieRevivesLeft}회`, '#84cc16', 22);
        } else if (this.selectedCookieId === 'pirate' && !this.pirateRevived) {
          // Check Pirate Ghost Transformation
          this.pirateRevived = true;
          const isCombi = this.selectedPetId === 'pirate_bomb';
          const reviveHp = isCombi ? 60 : 40;
          this.player.hp = reviveHp;
          this.player.isInvincible = true;
          this.player.invincibleTimer = 4.0;
          this.player.isSpeedBoost = true;
          this.player.speedBoostTimer = 3.5;
          sound.playGiantBear();
          this.addFloatingText(this.player.x + 80, this.player.y - 40, '🏴‍☠️ [유령 해적 각성!] 무적 유령 질주!', '#fbbf24', 22);
        } else {
          this.player.hp = 0;
          this.triggerGameOver();
          return;
        }
      }
    }

    // Moonlight Cookie Legendary Starlight Flight & Meteor Shower
    if (this.selectedCookieId === 'moonlight' && this.mode === 'RUN') {
      this.moonlightSpellTimer += dt;
      if (this.moonlightSpellTimer >= 8.5) {
        this.moonlightSpellTimer = 0;
        sound.playGiantBear();
        const isCombi = this.selectedPetId === 'dreamcatcher';
        const duration = isCombi ? 4.5 : 3.0;
        this.player.isInvincible = true;
        this.player.invincibleTimer = duration;
        this.player.isSpeedBoost = true;
        this.player.speedBoostTimer = duration;
        this.player.isMagnet = true;
        this.player.magnetTimer = duration;

        this.addFloatingText(this.player.x + 80, this.player.y - 45, isCombi ? '🌙 [달빛술사 콤비] 별빛 그믐달 유성우 질주!' : '🌙 달빛 마법 유성우 비행!', '#fde047', 24);
        this.obstacles.forEach((o) => {
          if (o.x > this.player.x && o.x < this.player.x + 600) {
            o.destroyed = true;
            this.createDestroyParticles(o.x + o.width / 2, o.y + o.height / 2);
          }
        });
        for (let i = 0; i < (isCombi ? 10 : 7); i++) {
          this.jellies.push({
            id: this.nextId++,
            x: this.player.x + 100 + i * 50,
            y: this.groundY - 140 - Math.sin(i * 0.6) * 45,
            width: 40,
            height: 40,
            type: 'yellow_bear',
            value: isCombi ? 3500 : 2000,
            collected: false,
            animOffset: i,
          });
        }
      }
    }

    // 2. Power-up timers
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
      if (this.player.invincibleTimer <= 0) this.player.isInvincible = false;
    }
    if (this.player.giantTimer > 0) {
      this.player.giantTimer -= dt;
      if (this.player.giantTimer <= 0) this.player.isGiant = false;
    }
    if (this.player.speedBoostTimer > 0) {
      this.player.speedBoostTimer -= dt;
      if (this.player.speedBoostTimer <= 0) this.player.isSpeedBoost = false;
    }
    if (this.player.magnetTimer > 0) {
      this.player.magnetTimer -= dt;
      if (this.player.magnetTimer <= 0) this.player.isMagnet = false;
    }
    if (this.player.bearPartyTimer > 0) {
      this.player.bearPartyTimer -= dt;
      if (this.player.bearPartyTimer <= 0) this.player.isBearParty = false;
    }

    // 3. Stage Transition Check & Distance Threshold
    this.checkStageProgression(dt);

    // 3.5 Pet Skills Update
    this.updatePetSkills(dt);

    // 4. Bonus Time duration
    if (isBonus) {
      this.bonusTimeDuration -= dt;
      if (this.bonusTimeDuration <= 0) {
        this.exitBonusTime();
      }
    }

    // 5. Player Physics
    this.updatePlayerPhysics(dt);

    // 6. Spawning
    if (isBonus) {
      this.updateBonusTimeSpawning(dt);
    } else {
      this.updateStandardSpawning(dt);
    }

    // 7. Jellies update & collection
    this.updateJellies(dt, currentSpeed);

    // 8. Obstacles update & collision
    if (!isBonus) {
      this.updateObstacles(dt, currentSpeed);
    }

    // 9. Particles & floating texts
    this.updateEffects(dt);

    // 10. Notify external state listeners
    if (this.onStateUpdate) {
      this.onStateUpdate({
        hp: this.player.hp,
        score: this.player.score,
        coins: this.player.coins,
        mode: this.mode,
        bonusProgress: this.bonusProgress,
        currentStage: this.player.currentStage,
        cookieId: this.player.cookieId,
      });
    }
  }

  /**
   * Stage Progression Logic:
   * When distance exceeds threshold, trigger map transition!
   * Clears obstacles, spawns a massive Super Life Potion (커다란 생명물약),
   * smoothly warps to the next stage theme, and displays stage clear fanfare!
   */
  private updatePetSkills(dt: number) {
    if (this.mode !== 'RUN') return;
    this.petSkillTimer += dt;

    switch (this.selectedPetId) {
      case 'ghost': {
        // 꼬마유령 (닌자맛 콤비): 8초마다 유령 파동 발동
        if (this.petSkillTimer >= 8.0) {
          this.petSkillTimer = 0;
          sound.playGiantBear();
          this.obstacles.forEach((o) => {
            if (o.x > this.player.x && o.x < this.player.x + 400) {
              o.destroyed = true;
              this.createDestroyParticles(o.x + o.width / 2, o.y + o.height / 2);
            }
          });
          this.addFloatingText(this.player.x + 80, this.player.y - 40, '👻 꼬마유령 파도 발동!', '#93c5fd', 20);
          for (let i = 0; i < 5; i++) {
            this.jellies.push({
              id: this.nextId++,
              x: this.player.x + 150 + i * 45,
              y: this.groundY - 120 - Math.sin(i) * 30,
              width: 36,
              height: 36,
              type: 'pink_bear',
              value: 1200,
              collected: false,
              animOffset: i,
            });
          }
        }
        break;
      }

      case 'choco_drop': {
        // 초코방울 (용감한 쿠키 콤비): 10초마다 초코 자력 오라
        if (this.petSkillTimer >= 10.0) {
          this.petSkillTimer = 0;
          const isCombi = this.selectedCookieId === 'brave';
          const duration = isCombi ? 6 : 4;
          this.player.magnetTimer = duration;
          this.player.isMagnet = true;
          sound.playPotion();
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '🍫 [용감한 콤비] 초코 자력 파동!' : '🍫 초코 자력 오라 발동!', '#d97706', 20);
        }
        break;
      }

      case 'rocket': {
        // 로켓폭죽 (체리맛 콤비): 8초마다 로켓 폭발
        if (this.petSkillTimer >= 8.0) {
          this.petSkillTimer = 0;
          sound.playGiantBear();
          const isCombi = this.selectedCookieId === 'cherry';
          const bonusVal = isCombi ? 1800 : 1000;
          this.obstacles.forEach((o) => {
            if (o.x > this.player.x && o.x < this.player.x + 450) {
              o.destroyed = true;
              this.createDestroyParticles(o.x + o.width / 2, o.y + o.height / 2);
            }
          });
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '🚀 [체리 콤비] 체리 로켓 대폭발!' : '🚀 로켓 폭죽 발사!', '#fca5a5', 20);
          for (let i = 0; i < 6; i++) {
            this.jellies.push({
              id: this.nextId++,
              x: this.player.x + 130 + i * 42,
              y: this.groundY - 110 - Math.sin(i) * 35,
              width: 36,
              height: 36,
              type: 'pink_bear',
              value: bonusVal,
              collected: false,
              animOffset: i,
            });
          }
        }
        break;
      }

      case 'celestial_star': {
        // 천사별 (천사맛 콤비): 12초마다 미니 생명물약 생성
        if (this.petSkillTimer >= 12.0) {
          this.petSkillTimer = 0;
          sound.playPotion();
          const isCombi = this.selectedCookieId === 'angel';
          const recoveryVal = isCombi ? 1200 : 800;
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '⭐ [천사 콤비] 축복의 생명물약!' : '⭐ 수호별 생명물약 생성!', '#fef08a', 20);
          this.jellies.push({
            id: this.nextId++,
            x: this.player.x + 180,
            y: this.groundY - 90,
            width: 44,
            height: 44,
            type: 'potion_hp',
            value: recoveryVal,
            collected: false,
            animOffset: 0,
          });
        }
        break;
      }

      case 'brain_gum': {
        // 브레인껌 (좀비맛 콤비): 8초마다 핑크 브레인 젤리 생성
        if (this.petSkillTimer >= 8.0) {
          this.petSkillTimer = 0;
          sound.playPotion();
          const isCombi = this.selectedCookieId === 'zombie';
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '🧠 [좀비 콤비] 불사신 뇌세포 젤리!' : '🧠 브레인 젤리 분출!', '#f472b6', 20);
          for (let i = 0; i < 5; i++) {
            this.jellies.push({
              id: this.nextId++,
              x: this.player.x + 130 + i * 40,
              y: this.groundY - 110 - Math.sin(i) * 25,
              width: 38,
              height: 38,
              type: 'pink_bear',
              value: 1500,
              collected: false,
              animOffset: i,
            });
          }
        }
        break;
      }

      case 'pirate_bomb': {
        // 뚝딱이 포탄 (해적맛 콤비): 6초마다 대포알 폭격
        if (this.petSkillTimer >= 6.0) {
          this.petSkillTimer = 0;
          sound.playGiantBear();
          const isCombi = this.selectedCookieId === 'pirate';
          this.obstacles.forEach((o) => {
            if (o.x > this.player.x && o.x < this.player.x + 500) {
              o.destroyed = true;
              this.createDestroyParticles(o.x + o.width / 2, o.y + o.height / 2);
            }
          });
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '💣 [해적 콤비] 대포 폭격 & 황금 코인 비!' : '💣 대포알 폭격 발사!', '#fbbf24', 20);
          for (let i = 0; i < 8; i++) {
            this.jellies.push({
              id: this.nextId++,
              x: this.player.x + 100 + i * 45,
              y: this.groundY - 100 - Math.sin(i * 0.7) * 35,
              width: 32,
              height: 32,
              type: 'coin',
              value: isCombi ? 400 : 200,
              collected: false,
              animOffset: i,
            });
          }
        }
        break;
      }

      case 'oak_barrel': {
        // 참나무 주스통 (뱀파이어맛 콤비): 9초마다 포도주스 회복 젤리
        if (this.petSkillTimer >= 9.0) {
          this.petSkillTimer = 0;
          sound.playPotion();
          const isCombi = this.selectedCookieId === 'vampire';
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '🍷 [뱀파이어 콤비] 최상급 포도즙 회복!' : '🍷 포도주스 젤리 생성!', '#e11d48', 20);
          for (let i = 0; i < 3; i++) {
            this.jellies.push({
              id: this.nextId++,
              x: this.player.x + 140 + i * 50,
              y: this.groundY - 95,
              width: 42,
              height: 42,
              type: 'potion_hp',
              value: isCombi ? 1500 : 900,
              collected: false,
              animOffset: i,
            });
          }
        }
        break;
      }

      case 'grimoire': {
        // 마법사전 (마법사맛 콤비): 7초마다 마법서 개방
        if (this.petSkillTimer >= 7.0) {
          this.petSkillTimer = 0;
          sound.playGiantBear();
          const isCombi = this.selectedCookieId === 'wizard';
          this.obstacles.forEach((o) => {
            if (o.x > this.player.x && o.x < this.player.x + 450) {
              o.destroyed = true;
              this.createDestroyParticles(o.x + o.width / 2, o.y + o.height / 2);
            }
          });
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '📖 [마법사 콤비] 마법서 대폭풍!' : '📖 마법서 발동!', '#a5b4fc', 20);
          for (let i = 0; i < 8; i++) {
            this.jellies.push({
              id: this.nextId++,
              x: this.player.x + 120 + i * 40,
              y: this.groundY - 120 - Math.sin(i * 0.8) * 35,
              width: 36,
              height: 36,
              type: 'yellow_bear',
              value: isCombi ? 2500 : 1500,
              collected: false,
              animOffset: i,
            });
          }
        }
        break;
      }

      case 'dreamcatcher': {
        // 드림캐쳐 (달빛술사 콤비 - LEGENDARY): 6.5초마다 꿈조각 별빛 젤리 폭풍 & 장애물 정화
        if (this.petSkillTimer >= 6.5) {
          this.petSkillTimer = 0;
          sound.playGiantBear();
          const isCombi = this.selectedCookieId === 'moonlight';
          this.obstacles.forEach((o) => {
            if (o.x > this.player.x && o.x < this.player.x + 550) {
              o.destroyed = true;
              this.createDestroyParticles(o.x + o.width / 2, o.y + o.height / 2);
            }
          });
          this.addFloatingText(this.player.x + 80, this.player.y - 40, isCombi ? '🪶 [달빛술사 콤비] 꿈조각 별무리 축복!' : '🪶 악몽 정화 & 꿈조각 젤리 소환!', '#fbbf24', 22);
          for (let i = 0; i < 9; i++) {
            this.jellies.push({
              id: this.nextId++,
              x: this.player.x + 110 + i * 45,
              y: this.groundY - 110 - Math.sin(i * 0.7) * 40,
              width: 38,
              height: 38,
              type: 'pink_bear',
              value: isCombi ? 3200 : 1800,
              collected: false,
              animOffset: i,
            });
          }
        }
        break;
      }
    }
  }

  /**
   * Stage Progression Logic:
   * Stage 1, 2, 3 progression -> Stage 4 is INFINITE!
   * Every 1000m interval in Stage 4 spawns a Giant Super Life Potion (커다란 생명물약)!
   */
  private checkStageProgression(dt: number) {
    if (this.mode === 'BONUS_TIME') return;

    if (this.stageTransitionActive) {
      this.stageTransitionTimer += dt;
      this.player.stageTransitionProgress = Math.min(1, this.stageTransitionTimer / 1.5);

      if (this.stageTransitionTimer >= 1.5) {
        // Complete transition
        this.player.currentStage = this.nextStageId;
        this.stageTransitionActive = false;
        this.stageTransitionTimer = 0;
        this.player.stageTransitionProgress = 0;

        if (this.nextStageId === 'candy_galaxy' && this.currentStageIndex === STAGE_SEQUENCE.length - 1) {
          const metersRun = Math.floor(this.gameDistance / 50);
          this.addFloatingText(this.width / 2, 230, `✨ [STAGE 4 무한 질주] ${metersRun}m 돌파! ✨`, '#f0abfc', 32);
          this.addFloatingText(this.width / 2, 270, `🎁 커다란 생명물약 등장! 체력 100% 회복!`, '#fde047', 22);
        } else {
          const nextTheme = STAGES[this.nextStageId];
          this.addFloatingText(this.width / 2, 240, nextTheme.name, '#38bdf8', 36);
          this.addFloatingText(this.width / 2, 280, `${nextTheme.subTitle} (1000m 돌파!)`, '#facc15', 22);
        }
      }
      return;
    }

    // Trigger stage warp or infinite Stage 4 milestone
    const stageRunDistance = this.gameDistance - this.lastStageWarpDistance;
    if (stageRunDistance >= this.stageDistanceThreshold && !this.stageTransitionActive) {
      this.lastStageWarpDistance = this.gameDistance;
      this.triggerStageTransition();
    }
  }

  private triggerStageTransition() {
    if (this.currentStageIndex < STAGE_SEQUENCE.length - 1) {
      this.currentStageIndex += 1;
      this.nextStageId = STAGE_SEQUENCE[this.currentStageIndex];
    } else {
      // Stage 4 Infinite Mode: Stay at Stage 4 ('candy_galaxy') endlessly!
      this.currentStageIndex = STAGE_SEQUENCE.length - 1;
      this.nextStageId = 'candy_galaxy';
    }

    this.stageTransitionActive = true;
    this.stageTransitionTimer = 0;

    sound.playStageWarp();

    // Clear imminent obstacles for a clean, celebratory transition gate
    this.obstacles = [];

    // SPAWN THE GIANT SUPER LIFE POTION right in the transition / 200m gateway!
    const potionX = this.width + 120;
    this.jellies.push({
      id: this.nextId++,
      x: potionX,
      y: this.groundY - 110,
      width: 76,
      height: 76,
      type: 'potion_super_hp',
      value: 5000,
      collected: false,
      animOffset: 0,
    });

    // Golden celebratory coins flanking the super potion
    for (let c = -3; c <= 3; c++) {
      if (c === 0) continue;
      this.jellies.push({
        id: this.nextId++,
        x: potionX + c * 48,
        y: this.groundY - 55,
        width: 32,
        height: 32,
        type: 'coin',
        value: 200,
        collected: false,
        animOffset: 0,
      });
    }

    if (this.currentStageIndex === STAGE_SEQUENCE.length - 1 && this.nextStageId === 'candy_galaxy') {
      const metersRun = Math.floor(this.gameDistance / 50);
      this.addFloatingText(this.width / 2, 190, '★ STAGE 4 무한 질주 구간! ★', '#e879f9', 34);
      this.addFloatingText(this.width / 2, 230, `${metersRun}m 돌파 기념 커다란 생명물약!`, '#ef4444', 26);
    } else {
      this.addFloatingText(this.width / 2, 190, '★ STAGE WARP PORTAL! ★', '#38bdf8', 34);
      this.addFloatingText(this.width / 2, 230, '커다란 생명물약 발견!', '#ef4444', 26);
    }
  }

  private updatePlayerPhysics(dt: number) {
    if (this.mode === 'BONUS_TIME') {
      const targetY = 320 + Math.sin(this.gameDistance * 0.005) * 60;
      this.player.y += (targetY - this.player.y) * 4 * dt;
      this.player.vy = 0;
      this.player.isGrounded = false;
      this.player.isSliding = false;
      return;
    }

    this.player.vy += this.settings.gravity * dt;
    this.player.y += this.player.vy * dt;

    const currentHeight = this.player.isSliding ? 45 : (this.player.isGiant ? 130 : 90);
    const floorY = this.groundY - currentHeight;

    if (this.player.y >= floorY) {
      this.player.y = floorY;
      this.player.vy = 0;
      this.player.isGrounded = true;
      this.player.jumpCount = 0;

      if (this.isSlidePressed) {
        this.player.isSliding = true;
      }
    } else {
      this.player.isGrounded = false;
    }

    // Slide friction sparks
    if (this.player.isGrounded && this.player.isSliding) {
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.player.x + 20 + Math.random() * 20,
          y: this.groundY - 5,
          vx: -150 - Math.random() * 100,
          vy: -60 - Math.random() * 80,
          color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
          size: 4 + Math.random() * 4,
          alpha: 1,
          life: 0.3,
          maxLife: 0.3,
        });
      }
    }
  }

  private updateStandardSpawning(dt: number) {
    if (this.stageTransitionActive) return; // Pause spawning during stage warp gate

    this.obstacleSpawnTimer += dt;
    if (this.obstacleSpawnTimer >= this.settings.obstacleFrequency) {
      this.obstacleSpawnTimer = 0;
      this.spawnSynchronizedPattern();
    }

    this.emberSpawnTimer += dt;
    if (this.emberSpawnTimer >= 0.08) {
      this.emberSpawnTimer = 0;
      const theme = STAGES[this.player.currentStage];
      this.particles.push({
        x: Math.random() * this.width,
        y: this.groundY + 10 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 40 - 80,
        vy: -120 - Math.random() * 140,
        color: theme.ambientParticleColor,
        size: 3 + Math.random() * 4,
        alpha: 0.8,
        life: 1.2,
        maxLife: 1.2,
      });
    }
  }

  private updateBonusTimeSpawning(dt: number) {
    // Bonus time rainbow fields
    if (Math.random() < 0.3) {
      const baseY = 320;
      for (let i = 0; i < 4; i++) {
        const isPink = Math.random() > 0.45;
        this.jellies.push({
          id: this.nextId++,
          x: this.width + i * 40,
          y: baseY,
          width: 38,
          height: 38,
          type: isPink ? 'pink_bear' : 'yellow_bear',
          value: isPink ? 1200 : 800,
          collected: false,
          animOffset: 0,
        });
      }

      if (Math.random() < 0.25) {
        this.jellies.push({
          id: this.nextId++,
          x: this.width + 180,
          y: baseY - 60,
          width: 90,
          height: 90,
          type: 'giant_bear',
          value: 5000,
          collected: false,
          animOffset: 0,
        });
      }
    }
  }

  private spawnSynchronizedPattern() {
    const startX = this.width + 60;
    const isParty = this.player.isBearParty;
    const randPattern = Math.random();

    const missingLetters = Object.entries(this.bonusProgress.letters)
      .filter(([_, collected]) => !collected)
      .map(([letter]) => letter);

    const maybeLetter = (Math.random() < 0.25 && missingLetters.length > 0)
      ? missingLetters[Math.floor(Math.random() * missingLetters.length)]
      : null;

    if (randPattern < 0.28) {
      // 1. Low Obstacle with Jump Arc
      const obsW = 50;
      const obsH = 60;
      const obsX = startX + 160;
      const obsY = this.groundY - obsH;

      this.obstacles.push({
        id: this.nextId++,
        x: obsX,
        y: obsY,
        width: obsW,
        height: obsH,
        type: 'low',
        requiresSlide: false,
        requiresDoubleJump: false,
      });

      const totalJellies = 14;
      const spacing = 38;
      for (let i = 0; i < totalJellies; i++) {
        const jx = startX + i * spacing;
        let jy = this.groundY - 55;

        const distToObs = jx - (obsX + obsW / 2);
        if (Math.abs(distToObs) < 140) {
          const norm = distToObs / 140;
          const arc = Math.cos(norm * (Math.PI / 2)) * 125;
          jy -= arc;
        }

        const isPeak = Math.abs(distToObs) < 25;
        let type: JellyItem['type'] = isParty ? 'yellow_bear' : 'basic';
        let val = isParty ? 800 : 300;

        if (isPeak && maybeLetter) {
          type = 'alphabet';
          val = 2000;
        } else if (isPeak && Math.random() < 0.5) {
          type = 'pink_bear';
          val = 1200;
        } else if (Math.random() < 0.25) {
          type = 'coin';
          val = 100;
        }

        this.jellies.push({
          id: this.nextId++,
          x: jx,
          y: jy,
          width: type === 'basic' ? 28 : (type === 'alphabet' ? 44 : 36),
          height: type === 'basic' ? 32 : (type === 'alphabet' ? 44 : 36),
          type,
          letter: type === 'alphabet' ? maybeLetter! : undefined,
          value: val,
          collected: false,
          animOffset: 0,
        });
      }

    } else if (randPattern < 0.54) {
      // 2. Tall Obstacle with Double Jump Arc
      const obsW = 54;
      const obsH = 135;
      const obsX = startX + 180;
      const obsY = this.groundY - obsH;

      this.obstacles.push({
        id: this.nextId++,
        x: obsX,
        y: obsY,
        width: obsW,
        height: obsH,
        type: 'tall',
        requiresSlide: false,
        requiresDoubleJump: true,
      });

      const totalJellies = 15;
      const spacing = 40;
      for (let i = 0; i < totalJellies; i++) {
        const jx = startX + i * spacing;
        let jy = this.groundY - 55;

        const distToObs = jx - (obsX + obsW / 2);
        if (Math.abs(distToObs) < 180) {
          const norm = distToObs / 180;
          const arc = Math.cos(norm * (Math.PI / 2)) * 180;
          jy -= arc;
        }

        const isApex = Math.abs(distToObs) < 30;
        let type: JellyItem['type'] = isParty ? 'yellow_bear' : 'basic';
        let val = isParty ? 800 : 300;

        if (isApex) {
          type = maybeLetter ? 'alphabet' : 'pink_bear';
          val = type === 'alphabet' ? 2000 : 1200;
        } else if (Math.random() < 0.3) {
          type = 'yellow_bear';
          val = 800;
        }

        this.jellies.push({
          id: this.nextId++,
          x: jx,
          y: jy,
          width: type === 'basic' ? 28 : (type === 'alphabet' ? 44 : 36),
          height: type === 'basic' ? 32 : (type === 'alphabet' ? 44 : 36),
          type,
          letter: type === 'alphabet' ? maybeLetter! : undefined,
          value: val,
          collected: false,
          animOffset: 0,
        });
      }

    } else if (randPattern < 0.78) {
      // 3. Ceiling Obstacle with Slide Line
      const obsW = 100;
      const obsH = 130;
      const obsX = startX + 160;
      const obsY = this.groundY - 170;

      this.obstacles.push({
        id: this.nextId++,
        x: obsX,
        y: obsY,
        width: obsW,
        height: obsH,
        type: 'ceiling',
        requiresSlide: true,
        requiresDoubleJump: false,
      });

      const totalJellies = 14;
      const spacing = 38;
      for (let i = 0; i < totalJellies; i++) {
        const jx = startX + i * spacing;
        const isUnderObs = jx >= obsX - 20 && jx <= obsX + obsW + 20;
        const jy = isUnderObs ? this.groundY - 28 : this.groundY - 55;

        let type: JellyItem['type'] = isParty ? 'yellow_bear' : 'basic';
        let val = isParty ? 800 : 300;

        if (isUnderObs && Math.random() < 0.6) {
          type = 'coin';
          val = 100;
        }

        this.jellies.push({
          id: this.nextId++,
          x: jx,
          y: jy,
          width: type === 'basic' ? 28 : 34,
          height: type === 'basic' ? 32 : 34,
          type,
          value: val,
          collected: false,
          animOffset: 0,
        });
      }

    } else {
      // 4. Straight Line with Items / Giant Bear
      const totalJellies = 16;
      const spacing = 40;
      const hasGiantBear = Math.random() < 0.45;
      const hasPotion = !hasGiantBear && Math.random() < 0.7;

      for (let i = 0; i < totalJellies; i++) {
        const jx = startX + i * spacing;
        const jy = this.groundY - 55;

        let type: JellyItem['type'] = isParty ? 'yellow_bear' : 'basic';
        let val = isParty ? 800 : 300;

        if (Math.random() < 0.25) {
          type = 'yellow_bear';
          val = 800;
        } else if (Math.random() < 0.15) {
          type = 'coin';
          val = 100;
        }

        this.jellies.push({
          id: this.nextId++,
          x: jx,
          y: jy,
          width: type === 'basic' ? 28 : 36,
          height: type === 'basic' ? 32 : 36,
          type,
          value: val,
          collected: false,
          animOffset: 0,
        });
      }

      if (hasGiantBear) {
        this.jellies.push({
          id: this.nextId++,
          x: startX + 7 * spacing,
          y: this.groundY - 145,
          width: 95,
          height: 95,
          type: 'giant_bear',
          value: 5000,
          collected: false,
          animOffset: 0,
        });
      } else if (hasPotion) {
        const potions: JellyItem['type'][] = [
          'potion_bear_party',
          'potion_giant',
          'potion_magnet',
          'potion_blast',
          'potion_hp',
        ];
        const pType = potions[Math.floor(Math.random() * potions.length)];
        this.jellies.push({
          id: this.nextId++,
          x: startX + 7 * spacing,
          y: this.groundY - 75,
          width: 48,
          height: 48,
          type: pType,
          value: 1500,
          collected: false,
          animOffset: 0,
        });
      }
    }
  }

  private updateJellies(dt: number, speed: number) {
    const playerBox = this.getPlayerHitbox();
    // Angel cookie passive magnet or active magnet
    const isAngel = this.player.cookieId === 'angel';
    const magnetRange = this.player.isMagnet ? 290 : (isAngel ? 140 : 0);

    for (let i = this.jellies.length - 1; i >= 0; i--) {
      const jelly = this.jellies[i];
      jelly.x -= speed * dt;

      if (magnetRange > 0 && !jelly.collected) {
        const dx = (playerBox.x + playerBox.w / 2) - (jelly.x + jelly.width / 2);
        const dy = (playerBox.y + playerBox.h / 2) - (jelly.y + jelly.height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist < magnetRange) {
          jelly.x += (dx / dist) * 750 * dt;
          jelly.y += (dy / dist) * 750 * dt;
        }
      }

      if (!jelly.collected && this.checkCollision(playerBox, {
        x: jelly.x,
        y: jelly.y,
        w: jelly.width,
        h: jelly.height,
      })) {
        this.collectJelly(jelly);
        jelly.collected = true;
      }

      if (jelly.x + jelly.width < -50 || jelly.collected) {
        this.jellies.splice(i, 1);
      }
    }
  }

  private collectJelly(jelly: JellyItem) {
    // Brave cookie 10% score boost
    const scoreMult = this.player.cookieId === 'brave' ? 1.1 : 1.0;
    this.player.score += Math.round(jelly.value * scoreMult);

    this.createSparkleParticles(jelly.x + jelly.width / 2, jelly.y + jelly.height / 2, jelly.type);

    switch (jelly.type) {
      case 'basic':
        sound.playJelly();
        break;

      case 'yellow_bear':
        sound.playBearJelly(false);
        this.addFloatingText(jelly.x, jelly.y, `+${jelly.value}`, '#fbbf24', 18);
        break;

      case 'pink_bear':
        sound.playBearJelly(true);
        this.addFloatingText(jelly.x, jelly.y, `+${jelly.value}`, '#f472b6', 18);
        break;

      case 'giant_bear':
        sound.playGiantBear();
        this.addFloatingText(jelly.x, jelly.y - 20, `+${jelly.value}!`, '#facc15', 28);
        break;

      case 'coin':
        this.player.coins += 1;
        sound.playCoin();
        break;

      case 'alphabet':
        if (jelly.letter) {
          this.bonusProgress.letters[jelly.letter] = true;
          this.bonusProgress.count++;
          sound.playAlphabet();
          this.addFloatingText(jelly.x, jelly.y - 25, `BONUS [${jelly.letter}]!`, '#38bdf8', 22);

          const allCollected = Object.values(this.bonusProgress.letters).every((val) => val);
          if (allCollected) {
            this.enterBonusTime();
          }
        }
        break;

      case 'potion_hp':
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
        sound.playPotion();
        this.addFloatingText(jelly.x, jelly.y - 20, 'HP RECOVER +35%', '#ef4444', 22);
        break;

      // ★ 요청사항: 맵 전환 시 등장하는 거대한 생명물약 (Super Large HP Potion)
      case 'potion_super_hp':
        this.player.hp = this.player.maxHp; // 100% Full recovery!
        sound.playSuperPotion();
        this.addFloatingText(this.player.x + 30, this.player.y - 40, '★ 커다란 생명물약 HP 100% 회복! ★', '#22c55e', 32);
        this.createSuperPotionParticles(jelly.x + jelly.width / 2, jelly.y + jelly.height / 2);
        break;

      case 'potion_bear_party':
        this.player.isBearParty = true;
        this.player.bearPartyTimer = 8.0;
        sound.playBearParty();
        this.addFloatingText(this.width / 2, 220, '곰젤리파티!', '#f59e0b', 36);

        this.jellies.forEach((j) => {
          if (j.type === 'basic') {
            j.type = Math.random() > 0.4 ? 'pink_bear' : 'yellow_bear';
            j.value = j.type === 'pink_bear' ? 1200 : 800;
          }
        });
        break;

      case 'potion_giant':
        this.player.isGiant = true;
        this.player.giantTimer = 6.0;
        sound.playPotion();
        this.addFloatingText(this.player.x, this.player.y - 30, '거대화!', '#10b981', 30);
        break;

      case 'potion_magnet':
        this.player.isMagnet = true;
        this.player.magnetTimer = 8.0;
        sound.playPotion();
        this.addFloatingText(this.player.x, this.player.y - 30, '자석 활성화!', '#06b6d4', 24);
        break;

      case 'potion_blast':
        this.player.isSpeedBoost = true;
        this.player.speedBoostTimer = 5.0;
        this.player.isInvincible = true;
        this.player.invincibleTimer = 5.0;
        sound.playPotion();
        this.addFloatingText(this.player.x, this.player.y - 30, '광속질주!', '#e11d48', 30);
        break;
    }
  }

  private updateObstacles(dt: number, speed: number) {
    const playerBox = this.getPlayerHitbox();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= speed * dt;

      if (!obs.destroyed && this.checkCollision(playerBox, {
        x: obs.x,
        y: obs.y,
        w: obs.width,
        h: obs.height,
      })) {
        if (this.player.isGiant || this.player.isSpeedBoost) {
          obs.destroyed = true;
          sound.playDestroy();
          this.createDestroyParticles(obs.x + obs.width / 2, obs.y + obs.height / 2);
          this.player.score += 2000;
          this.addFloatingText(obs.x, obs.y, 'SMASH! +2000', '#f97316', 22);
        } else if (!this.player.isInvincible) {
          this.player.hp -= 22;
          this.player.isInvincible = true;
          this.player.invincibleTimer = 1.2;
          sound.playHit();
          this.addFloatingText(this.player.x + 20, this.player.y - 20, '-22 HP', '#ef4444', 24);

          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.triggerGameOver();
            return;
          }
        }
      }

      if (obs.x + obs.width < -80 || obs.destroyed) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private enterBonusTime() {
    this.mode = 'BONUS_TIME';
    this.bonusTimeDuration = 12.0;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
    sound.playBonusTimeEnter();
    this.addFloatingText(this.width / 2, 200, '★ BONUS TIME! ★', '#38bdf8', 42);

    Object.keys(this.bonusProgress.letters).forEach((k) => {
      this.bonusProgress.letters[k] = false;
    });
    this.bonusProgress.count = 0;
    this.obstacles = [];
  }

  private exitBonusTime() {
    this.mode = 'RUN';
    this.player.y = this.groundY - 90;
    this.player.vy = 0;
    this.addFloatingText(this.width / 2, 200, 'BACK TO RUNNING!', '#f59e0b', 32);
  }

  private triggerGameOver() {
    this.mode = 'GAME_OVER';
    sound.stopBGM();
    if (this.onGameOver) {
      this.onGameOver(this.player.score, this.player.coins);
    }
  }

  // --- HITBOX & COLLISION ---

  private getPlayerHitbox() {
    const isSliding = this.player.isSliding;
    const isGiant = this.player.isGiant;

    const w = isGiant ? 100 : (isSliding ? 70 : 45);
    const h = isGiant ? 115 : (isSliding ? 38 : 75);
    const x = this.player.x + (isSliding ? 0 : 8);
    const y = this.player.y + (isSliding ? 30 : 10);

    return { x, y, w, h };
  }

  private checkCollision(
    rectA: { x: number; y: number; w: number; h: number },
    rectB: { x: number; y: number; w: number; h: number }
  ) {
    return (
      rectA.x < rectB.x + rectB.w &&
      rectA.x + rectA.w > rectB.x &&
      rectA.y < rectB.y + rectB.h &&
      rectA.y + rectA.h > rectB.y
    );
  }

  // --- PARTICLES & EFFECTS ---

  private createSparkleParticles(x: number, y: number, type: JellyItem['type']) {
    const colors =
      type === 'pink_bear'
        ? ['#f472b6', '#fb7185', '#ffffff']
        : type === 'coin'
        ? ['#facc15', '#fde047', '#eab308']
        : ['#fbbf24', '#fef08a', '#ffffff'];

    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0.35,
        maxLife: 0.35,
        shape: 'sparkle',
      });
    }
  }

  private createSuperPotionParticles(x: number, y: number) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color: Math.random() > 0.4 ? '#22c55e' : (Math.random() > 0.5 ? '#facc15' : '#ffffff'),
        size: 5 + Math.random() * 6,
        alpha: 1,
        life: 0.8,
        maxLife: 0.8,
        shape: 'sparkle',
      });
    }
  }

  private createJumpParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y - 5,
        vx: (Math.random() - 0.5) * 160 - 50,
        vy: -20 - Math.random() * 70,
        color: '#93c5fd',
        size: 4 + Math.random() * 4,
        alpha: 0.9,
        life: 0.3,
        maxLife: 0.3,
      });
    }
  }

  private createDestroyParticles(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 250;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color: Math.random() > 0.5 ? '#f97316' : '#78350f',
        size: 5 + Math.random() * 6,
        alpha: 1,
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string, size: number) {
    this.floatingTexts.push({
      id: this.nextId++,
      x,
      y,
      text,
      color,
      size,
      alpha: 1,
      vy: -70,
      life: 1.1,
    });
  }

  private updateEffects(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.1);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- RENDERING ---

  private render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.mode === 'BONUS_TIME') {
      this.renderBonusBackground();
    } else {
      this.renderThemedBackground();
    }

    if (this.mode !== 'BONUS_TIME') {
      this.renderThemedFloor();
    }

    this.renderObstacles();
    this.renderJellies();
    this.renderPet();
    this.renderPlayer();
    this.renderParticles();
    this.renderFloatingTexts();
    this.renderHUD();

    // Render Stage Transition Flash Gateway overlay
    if (this.stageTransitionActive) {
      this.renderStageTransitionOverlay();
    }
  }

  private renderThemedBackground() {
    const theme = STAGES[this.player.currentStage];

    // Background Gradient based on Current Stage
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, theme.bgGradTop);
    bgGrad.addColorStop(0.5, theme.bgGradMid);
    bgGrad.addColorStop(1, theme.bgGradBot);
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Parallax Pillars / Scenery
    this.ctx.save();
    const brickWidth = 140;
    const offset = -(this.bgOffset % brickWidth);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 3;

    for (let x = offset - brickWidth; x < this.width + brickWidth; x += brickWidth) {
      this.ctx.fillStyle = theme.brickColor;
      this.ctx.fillRect(x, 80, brickWidth - 10, 480);
      this.ctx.strokeRect(x, 80, brickWidth - 10, 480);

      for (let y = 140; y < 520; y += 90) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + brickWidth - 10, y);
        this.ctx.stroke();
      }
    }
    this.ctx.restore();

    // Bottom Ambient Lava / River / Cosmic Glow
    const glowGrad = this.ctx.createLinearGradient(0, this.groundY, 0, this.height);
    glowGrad.addColorStop(0, theme.floorStructure);
    glowGrad.addColorStop(1, '#050505');
    this.ctx.fillStyle = glowGrad;
    this.ctx.fillRect(0, this.groundY + 20, this.width, this.height - this.groundY);
  }

  private renderBonusBackground() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#3b0764');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 123 + this.gameDistance * 0.1) % this.width);
      const sy = (i * 77) % (this.height - 100);
      const sz = (i % 3) + 1;
      this.ctx.globalAlpha = 0.4 + Math.sin(this.gameDistance * 0.01 + i) * 0.4;
      this.ctx.fillRect(sx, sy, sz, sz);
    }
    this.ctx.globalAlpha = 1.0;

    this.ctx.fillStyle = 'rgba(253, 224, 71, 0.15)';
    for (let c = 0; c < 4; c++) {
      const cx = ((c * 350 - this.gameDistance * 0.2) % (this.width + 200)) - 100;
      this.ctx.beginPath();
      this.ctx.arc(cx, 580, 140, 0, Math.PI * 2);
      this.ctx.arc(cx + 100, 560, 160, 0, Math.PI * 2);
      this.ctx.arc(cx + 200, 590, 130, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderThemedFloor() {
    const theme = STAGES[this.player.currentStage];
    this.ctx.save();

    // Top metal trim bar
    const barGrad = this.ctx.createLinearGradient(0, this.groundY, 0, this.groundY + 16);
    barGrad.addColorStop(0, theme.floorBarTop);
    barGrad.addColorStop(1, theme.floorBarBot);
    this.ctx.fillStyle = barGrad;
    this.ctx.fillRect(0, this.groundY, this.width, 16);

    // Platform struts & railings
    const strutSpacing = 80;
    const offset = -(this.floorOffset % strutSpacing);
    this.ctx.strokeStyle = theme.floorBarTop;
    this.ctx.lineWidth = 5;

    for (let x = offset; x < this.width + strutSpacing; x += strutSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + 10, this.groundY + 16);
      this.ctx.lineTo(x + 10, this.groundY + 90);
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x + 10, this.groundY + 8, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = theme.floorBarBot;
    this.ctx.fillRect(0, this.groundY + 80, this.width, 14);

    this.ctx.restore();
  }

  private renderStageTransitionOverlay() {
    this.ctx.save();
    const p = this.player.stageTransitionProgress;
    // Radiant white-golden warp wave
    const alpha = Math.sin(p * Math.PI) * 0.55;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Warp light streaks
    this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
    this.ctx.lineWidth = 4;
    for (let i = 0; i < 15; i++) {
      const y = (i * 50 + (p * 500)) % this.height;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private renderObstacles() {
    for (const obs of this.obstacles) {
      if (obs.destroyed) continue;

      this.ctx.save();
      if (obs.type === 'ceiling') {
        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(obs.x + obs.width / 2 - 4, 0, 8, obs.y);

        this.ctx.fillStyle = '#991b1b';
        this.ctx.beginPath();
        this.ctx.roundRect(obs.x, obs.y, obs.width, obs.height - 20, 8);
        this.ctx.fill();
        this.ctx.strokeStyle = '#f87171';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.fillStyle = '#f87171';
        const spikeCount = 3;
        const sW = obs.width / spikeCount;
        for (let s = 0; s < spikeCount; s++) {
          this.ctx.beginPath();
          this.ctx.moveTo(obs.x + s * sW, obs.y + obs.height - 20);
          this.ctx.lineTo(obs.x + (s + 0.5) * sW, obs.y + obs.height);
          this.ctx.lineTo(obs.x + (s + 1) * sW, obs.y + obs.height - 20);
          this.ctx.fill();
        }

        this.ctx.fillStyle = '#fef08a';
        this.ctx.font = 'bold 16px Jua, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SLIDE!', obs.x + obs.width / 2, obs.y + 40);
      } else if (obs.type === 'tall') {
        const pipeGrad = this.ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
        pipeGrad.addColorStop(0, '#475569');
        pipeGrad.addColorStop(0.5, '#94a3b8');
        pipeGrad.addColorStop(1, '#334155');
        this.ctx.fillStyle = pipeGrad;
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        this.ctx.fillStyle = '#dc2626';
        this.ctx.fillRect(obs.x - 4, obs.y, obs.width + 8, 18);
        this.ctx.fillRect(obs.x - 4, obs.y + obs.height / 2, obs.width + 8, 14);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(obs.x + obs.width / 2, obs.y - 10, 14, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#78350f';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        this.ctx.strokeStyle = '#b45309';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        this.ctx.fillStyle = '#ea580c';
        this.ctx.beginPath();
        this.ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 12, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  private renderJellies() {
    for (const jelly of this.jellies) {
      if (jelly.collected) continue;

      this.ctx.save();
      const cx = jelly.x + jelly.width / 2;
      const cy = jelly.y + jelly.height / 2;
      const bob = Math.sin(this.gameDistance * 0.008 + jelly.animOffset) * 4;

      this.ctx.translate(cx, cy + bob);

      switch (jelly.type) {
        case 'basic':
          this.drawBasicJelly(jelly.width, jelly.height);
          break;
        case 'yellow_bear':
          this.drawBearJelly('#facc15', '#eab308', jelly.width, false);
          break;
        case 'pink_bear':
          this.drawBearJelly('#f472b6', '#db2777', jelly.width, true);
          break;
        case 'giant_bear':
          this.drawGiantBearJelly(jelly.width);
          break;
        case 'coin':
          this.drawCoin(jelly.width);
          break;
        case 'alphabet':
          this.drawAlphabetJelly(jelly.letter || 'A', jelly.width);
          break;
        case 'potion_super_hp':
          this.drawSuperHpPotion(jelly.width);
          break;
        case 'potion_hp':
        case 'potion_bear_party':
        case 'potion_giant':
        case 'potion_magnet':
        case 'potion_blast':
          this.drawPotion(jelly.type, jelly.width);
          break;
      }

      this.ctx.restore();
    }
  }

  private drawBasicJelly(w: number, h: number) {
    const grad = this.ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(1, '#eab308');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.ellipse(-w * 0.2, -h * 0.2, w * 0.15, h * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawBearJelly(mainColor: string, shadowColor: string, size: number, isPink: boolean) {
    const r = size * 0.38;

    this.ctx.fillStyle = mainColor;
    this.ctx.beginPath();
    this.ctx.arc(-r * 0.8, -r * 0.75, r * 0.45, 0, Math.PI * 2);
    this.ctx.arc(r * 0.8, -r * 0.75, r * 0.45, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = isPink ? '#fbcfe8' : '#fef08a';
    this.ctx.beginPath();
    this.ctx.arc(-r * 0.8, -r * 0.75, r * 0.25, 0, Math.PI * 2);
    this.ctx.arc(r * 0.8, -r * 0.75, r * 0.25, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = mainColor;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = isPink ? '#f43f5e' : '#fb923c';
    this.ctx.beginPath();
    this.ctx.arc(-r * 0.55, r * 0.2, r * 0.2, 0, Math.PI * 2);
    this.ctx.arc(r * 0.55, r * 0.2, r * 0.2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#451a03';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';

    this.ctx.beginPath();
    this.ctx.arc(-r * 0.35, -r * 0.1, r * 0.2, Math.PI * 1.1, Math.PI * 1.9);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(r * 0.35, -r * 0.1, r * 0.2, Math.PI * 1.1, Math.PI * 1.9);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, r * 0.2, r * 0.25, 0.1, Math.PI - 0.1);
    this.ctx.stroke();
  }

  private drawGiantBearJelly(size: number) {
    const r = size * 0.42;

    this.ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fde047';
    this.ctx.beginPath();
    this.ctx.arc(-r * 0.85, -r * 0.8, r * 0.42, 0, Math.PI * 2);
    this.ctx.arc(r * 0.85, -r * 0.8, r * 0.42, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#f472b6';
    this.ctx.beginPath();
    this.ctx.arc(-r * 0.85, -r * 0.8, r * 0.24, 0, Math.PI * 2);
    this.ctx.arc(r * 0.85, -r * 0.8, r * 0.24, 0, Math.PI * 2);
    this.ctx.fill();

    const grad = this.ctx.createRadialGradient(-r * 0.3, -r * 0.3, 5, 0, 0, r);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.7, '#facc15');
    grad.addColorStop(1, '#eab308');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fb7185';
    this.ctx.beginPath();
    this.ctx.arc(-r * 0.6, r * 0.18, r * 0.26, 0, Math.PI * 2);
    this.ctx.arc(r * 0.6, r * 0.18, r * 0.26, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#881337';
    this.ctx.beginPath();
    this.ctx.arc(0, r * 0.25, r * 0.35, 0, Math.PI);
    this.ctx.fill();

    this.ctx.fillStyle = '#f43f5e';
    this.ctx.beginPath();
    this.ctx.arc(0, r * 0.42, r * 0.2, 0, Math.PI);
    this.ctx.fill();

    this.ctx.strokeStyle = '#451a03';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.arc(-r * 0.38, -r * 0.1, r * 0.22, Math.PI * 1.15, Math.PI * 1.85);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(r * 0.38, -r * 0.1, r * 0.22, Math.PI * 1.15, Math.PI * 1.85);
    this.ctx.stroke();
  }

  /**
   * ★ 커다란 생명물약 (Super Large HP Potion)
   * 특대형 황금 테두리와 붉은 에너지가 맥동하는 거대한 생명 플라스크 물약
   */
  private drawSuperHpPotion(size: number) {
    const r = size * 0.45;

    // Golden pulsating aura
    const pulse = Math.sin(this.gameDistance * 0.02) * 6;
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r * 1.35 + pulse, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
    this.ctx.fill();

    // Large glass flask
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(0, 2, r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#facc15';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Red Life Liquid
    const liquidGrad = this.ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
    liquidGrad.addColorStop(0, '#fca5a5');
    liquidGrad.addColorStop(0.5, '#ef4444');
    liquidGrad.addColorStop(1, '#991b1b');
    this.ctx.fillStyle = liquidGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 2, r * 0.85, 0, Math.PI * 2);
    this.ctx.fill();

    // Golden Crown / Cross Heart
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('♥', 0, 4);

    // Flask cap
    this.ctx.fillStyle = '#d97706';
    this.ctx.fillRect(-r * 0.35, -r - 8, r * 0.7, 12);
  }

  private drawCoin(size: number) {
    const r = size * 0.45;
    this.ctx.fillStyle = '#eab308';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fde047';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ca8a04';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('1', 0, 1);
  }

  private drawAlphabetJelly(letter: string, size: number) {
    const r = size * 0.45;

    const grad = this.ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    grad.addColorStop(0, '#7dd3fc');
    grad.addColorStop(0.7, '#0284c7');
    grad.addColorStop(1, '#0369a1');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#e0f2fe';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 22px Fredoka, Jua, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(letter, 0, 1);
  }

  private drawPotion(type: JellyItem['type'], size: number) {
    const r = size * 0.45;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(0, 4, r * 0.9, 0, Math.PI * 2);
    this.ctx.fill();

    let liquidColor = '#ef4444';
    let icon = '♥';

    if (type === 'potion_bear_party') {
      liquidColor = '#f59e0b';
      icon = '🐻';
    } else if (type === 'potion_giant') {
      liquidColor = '#10b981';
      icon = '▲';
    } else if (type === 'potion_magnet') {
      liquidColor = '#06b6d4';
      icon = '🧲';
    } else if (type === 'potion_blast') {
      liquidColor = '#e11d48';
      icon = '⚡';
    }

    this.ctx.fillStyle = liquidColor;
    this.ctx.beginPath();
    this.ctx.arc(0, 4, r * 0.75, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(icon, 0, 4);
  }

  private renderPet() {
    this.ctx.save();
    const petData = PET_CHARACTERS.find((p) => p.id === this.selectedPetId) || PET_CHARACTERS[0];
    const petX = this.player.x - 58;
    const petY = this.player.y + 12 + Math.sin(this.gameDistance * 0.012) * 12;

    this.ctx.translate(petX, petY);

    // Glowing Aura Ring
    this.ctx.fillStyle = petData.color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 26, 0, Math.PI * 2);
    this.ctx.globalAlpha = 0.35 + Math.sin(this.gameDistance * 0.02) * 0.15;
    this.ctx.fill();

    // Main Pet Body Rendering based on Pet ID
    this.ctx.globalAlpha = 1.0;

    switch (this.selectedPetId) {
      case 'choco_drop': {
        // 초코방울: 초콜릿 물방울 소용돌이
        const grad = this.ctx.createRadialGradient(-4, -4, 2, 0, 0, 18);
        grad.addColorStop(0, '#d97706');
        grad.addColorStop(0.6, '#78350f');
        grad.addColorStop(1, '#451a03');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -18);
        this.ctx.bezierCurveTo(14, -6, 18, 10, 0, 18);
        this.ctx.bezierCurveTo(-18, 10, -14, -6, 0, -18);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fde047';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // White cream swirl on top
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-4, -4, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Cute face
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-4, 3, 3, 0, Math.PI * 2);
        this.ctx.arc(4, 3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(-3, 3, 1.5, 0, Math.PI * 2);
        this.ctx.arc(5, 3, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'ghost': {
        // 꼬마유령: 반투명 하늘색 유령 & 꼬리
        const grad = this.ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
        grad.addColorStop(0, '#e0f2fe');
        grad.addColorStop(0.7, '#60a5fa');
        grad.addColorStop(1, '#2563eb');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(0, -4, 16, Math.PI, 0, false);
        this.ctx.bezierCurveTo(16, 14, 8, 20, 0, 14);
        this.ctx.bezierCurveTo(-8, 20, -16, 14, -16, -4);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Cute glowing eyes & mouth
        this.ctx.fillStyle = '#1e3a8a';
        this.ctx.beginPath();
        this.ctx.arc(-5, -4, 3, 0, Math.PI * 2);
        this.ctx.arc(5, -4, 3, 0, Math.PI * 2);
        this.ctx.arc(0, 3, 3.5, 0, Math.PI);
        this.ctx.fill();
        break;
      }

      case 'rocket': {
        // 로켓폭죽: 빨간 스트라이프 폭죽 로켓
        this.ctx.fillStyle = '#dc2626';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -20);
        this.ctx.lineTo(12, 10);
        this.ctx.lineTo(-12, 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#fde047';
        this.ctx.fillRect(-10, -2, 20, 4);
        this.ctx.fillRect(-10, 6, 20, 3);
        // Spark trail
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(0, 16, 5 + Math.sin(this.gameDistance * 0.05) * 3, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'celestial_star': {
        // 천사별: 황금 별 & 작은 천사 날개
        this.ctx.fillStyle = '#ffffff';
        // mini wings
        this.ctx.beginPath();
        this.ctx.ellipse(-14, 0, 8, 4, -Math.PI / 6, 0, Math.PI * 2);
        this.ctx.ellipse(14, 0, 8, 4, Math.PI / 6, 0, Math.PI * 2);
        this.ctx.fill();

        const grad = this.ctx.createRadialGradient(-2, -2, 2, 0, 0, 16);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.7, '#facc15');
        grad.addColorStop(1, '#eab308');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const rExt = 16;
          const rInt = 8;
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x1 = Math.cos(angle) * rExt;
          const y1 = Math.sin(angle) * rExt;
          if (i === 0) this.ctx.moveTo(x1, y1);
          else this.ctx.lineTo(x1, y1);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        break;
      }

      case 'jelly_drop': {
        // 젤리코 큐브: 네온 사이버 큐브
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.fillRect(-14, -14, 28, 28);
        this.ctx.strokeStyle = '#67e8f9';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-14, -14, 28, 28);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-6, -6, 12, 12);
        break;
      }

      case 'brain_gum': {
        // 브레인껌: 핑크 뇌모양 젤리 껌
        this.ctx.fillStyle = '#ec4899';
        this.ctx.beginPath();
        this.ctx.arc(-6, -4, 10, 0, Math.PI * 2);
        this.ctx.arc(6, -4, 10, 0, Math.PI * 2);
        this.ctx.arc(0, 6, 11, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fbcfe8';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        break;
      }

      case 'pirate_bomb': {
        // 뚝딱이 포탄: 해적 대포알 & 불꽃 도화선
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.arc(0, 2, 16, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        // Skull mark
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('☠', 0, 6);
        // Fuse
        this.ctx.strokeStyle = '#d97706';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -14);
        this.ctx.quadraticCurveTo(8, -20, 4, -24);
        this.ctx.stroke();
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(4, -24, 4 + Math.sin(this.gameDistance * 0.05) * 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'oak_barrel': {
        // 참나무 주스통: 와인통 & 포도주스
        this.ctx.fillStyle = '#78350f';
        this.ctx.beginPath();
        this.ctx.roundRect(-14, -16, 28, 32, 6);
        this.ctx.fill();
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.fillStyle = '#e11d48';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 7, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }

      case 'grimoire': {
        // 마법사전: 보라색 마법서
        this.ctx.fillStyle = '#4338ca';
        this.ctx.beginPath();
        this.ctx.roundRect(-15, -16, 30, 32, 4);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fde047';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('★', 0, 4);
        break;
      }

      case 'dreamcatcher': {
        // 드림캐쳐 (LEGENDARY): 별무리 깃털 & 그믐달 링
        // Outer Dreamcatcher Golden Ring
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, -4, 15, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner Star Web
        this.ctx.strokeStyle = '#c084fc';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          this.ctx.moveTo(0, -4);
          this.ctx.lineTo(Math.cos(a) * 14, -4 + Math.sin(a) * 14);
        }
        this.ctx.stroke();

        // Center glowing jewel
        this.ctx.fillStyle = '#fde047';
        this.ctx.beginPath();
        this.ctx.arc(0, -4, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // 3 Hanging Star Feathers with gentle sway
        const sway = Math.sin(this.gameDistance * 0.03) * 4;
        this.ctx.fillStyle = '#818cf8';
        this.ctx.beginPath();
        this.ctx.ellipse(-8 + sway * 0.5, 15, 3.5, 9, Math.PI / 12, 0, Math.PI * 2);
        this.ctx.ellipse(8 + sway * 0.5, 15, 3.5, 9, -Math.PI / 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.ellipse(sway, 18, 4, 11, 0, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }
    }

    this.ctx.restore();
  }

  /**
   * Render Player with distinctive, authentic Cookie Run vector art for all 9 characters!
   */
  private renderPlayer() {
    this.ctx.save();
    const p = this.player;

    if (p.isInvincible && Math.floor(p.invincibleTimer * 15) % 2 === 0) {
      this.ctx.globalAlpha = 0.45;
    }

    const scale = p.isGiant ? 1.6 : 1.0;
    const cx = p.x + 30;
    const cy = p.y + (p.isSliding ? 25 : 45);

    this.ctx.translate(cx, cy);
    this.ctx.scale(scale, scale);

    if (p.isSpeedBoost) {
      this.ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
      this.ctx.fillRect(-65, -35, 45, 65);
    }

    const isAirborne = !p.isGrounded;
    const isSliding = p.isSliding;

    if (isAirborne && p.jumpCount > 1) {
      const rot = (this.gameDistance * 0.035) % (Math.PI * 2);
      this.ctx.rotate(rot);
    }

    const cookieId = p.cookieId;
    const cookieData = COOKIE_CHARACTERS.find((c) => c.id === cookieId) || COOKIE_CHARACTERS[0];
    const runCycle = Math.sin(this.gameDistance * 0.025);

    // ==========================================
    // 1. SLIDING STANCE
    // ==========================================
    if (isSliding) {
      // Main sliding cookie dough base
      const doughColor = cookieId === 'zombie' ? '#65a30d' : (cookieId === 'ninja' ? '#1e3a8a' : (cookieId === 'brave' ? '#c27838' : cookieData.color));
      this.ctx.fillStyle = doughColor;
      this.ctx.beginPath();
      this.ctx.roundRect(-30, -12, 60, 26, 12);
      this.ctx.fill();

      // Head in slide
      this.ctx.beginPath();
      this.ctx.arc(18, -6, 16, 0, Math.PI * 2);
      this.ctx.fill();

      // Face cutout / Eyes
      this.ctx.fillStyle = cookieId === 'zombie' ? '#bef264' : '#fed7aa';
      this.ctx.fillRect(16, -10, 14, 8);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(20, -9, 6, 5);
      this.ctx.fillStyle = cookieId === 'vampire' ? '#dc2626' : (cookieId === 'ninja' ? '#0284c7' : '#0f172a');
      this.ctx.fillRect(23, -8, 3, 4);

      // Unique accessory in slide
      if (cookieId === 'ninja') {
        // Ninja flowing scarf
        this.ctx.fillStyle = '#60a5fa';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -8);
        this.ctx.lineTo(-50, -18 + Math.sin(this.gameDistance * 0.06) * 6);
        this.ctx.lineTo(-10, -2);
        this.ctx.fill();
      } else if (cookieId === 'cherry') {
        // Cherry on head
        this.ctx.fillStyle = '#e11d48';
        this.ctx.beginPath();
        this.ctx.arc(18, -20, 8, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'angel') {
        // Halo & Wings
        this.ctx.strokeStyle = '#facc15';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, -24, 18, 4);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(-15, -15, 18, 8, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'pirate') {
        // Pirate hat
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(10, -20, 20, 8);
      } else if (cookieId === 'moonlight') {
        // Moonlight starlight hair and crescent
        this.ctx.fillStyle = '#312e81';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -8);
        this.ctx.lineTo(-55, -14 + Math.sin(this.gameDistance * 0.05) * 8);
        this.ctx.lineTo(-10, 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.fillText('🌙', 16, -20);
      }
    } else {
      // ==========================================
      // 2. RUNNING / JUMPING STANCE
      // ==========================================

      // A. Back Accessories (Cape / Wings / Scarf / Booster / Galaxy Hair)
      if (cookieId === 'ninja') {
        // Dual streaming ninja blue scarves
        this.ctx.fillStyle = '#60a5fa';
        this.ctx.beginPath();
        this.ctx.moveTo(-16, -24);
        this.ctx.lineTo(-52, -34 + Math.sin(this.gameDistance * 0.04) * 10);
        this.ctx.lineTo(-16, -16);
        this.ctx.fill();
      } else if (cookieId === 'angel') {
        // Large pure white angel wings
        const flap = Math.sin(this.gameDistance * 0.03) * 6;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(-24, -20 + flap, 22, 12, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#e0f2fe';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      } else if (cookieId === 'hero') {
        // Jet booster flames
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.fillRect(-24, -14, 10, 20);
        this.ctx.fillStyle = '#f97316';
        this.ctx.beginPath();
        this.ctx.moveTo(-24, -4);
        this.ctx.lineTo(-44 - Math.random() * 12, -4);
        this.ctx.lineTo(-24, 6);
        this.ctx.fill();
      } else if (cookieId === 'vampire') {
        // Gothic crimson cape
        this.ctx.fillStyle = '#7f1d1d';
        this.ctx.beginPath();
        this.ctx.moveTo(-14, -22);
        this.ctx.lineTo(-44, -10 + Math.sin(this.gameDistance * 0.03) * 8);
        this.ctx.lineTo(-12, 10);
        this.ctx.fill();
      } else if (cookieId === 'wizard') {
        // Starry purple cloak
        this.ctx.fillStyle = '#312e81';
        this.ctx.beginPath();
        this.ctx.moveTo(-14, -22);
        this.ctx.lineTo(-46, -14 + Math.sin(this.gameDistance * 0.03) * 8);
        this.ctx.lineTo(-12, 12);
        this.ctx.fill();
      } else if (cookieId === 'moonlight') {
        // Flowing cosmic night-sky starry galaxy hair
        const sway = Math.sin(this.gameDistance * 0.03) * 8;
        this.ctx.fillStyle = '#312e81';
        this.ctx.beginPath();
        this.ctx.moveTo(-14, -30);
        this.ctx.bezierCurveTo(-35, -45 + sway, -60, -20 + sway, -50, 6 + sway);
        this.ctx.bezierCurveTo(-38, 12, -22, -6, -12, -10);
        this.ctx.fill();
        this.ctx.strokeStyle = '#818cf8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Starry glitter dots in hair
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(-36, -24 + sway, 2.5, 0, Math.PI * 2);
        this.ctx.arc(-46, -10 + sway, 3, 0, Math.PI * 2);
        this.ctx.arc(-30, 2 + sway, 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'brave') {
        // Candy Cane on back
        this.ctx.strokeStyle = '#dc2626';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(-8, 8);
        this.ctx.lineTo(-24, -24);
        this.ctx.arc(-20, -28, 6, Math.PI * 0.8, 0);
        this.ctx.stroke();
      }

      // B. Legs
      const legColor = cookieId === 'zombie' ? '#65a30d' : (cookieId === 'ninja' ? '#1e3a8a' : (cookieId === 'brave' ? '#c27838' : cookieData.color));
      this.ctx.strokeStyle = legColor;
      this.ctx.lineWidth = 10;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(-6, 14);
      this.ctx.lineTo(-6 - (isAirborne ? -8 : runCycle * 18), 38);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(6, 14);
      this.ctx.lineTo(6 + (isAirborne ? 12 : runCycle * 18), 38);
      this.ctx.stroke();

      // C. Body / Tunic
      this.ctx.fillStyle = legColor;
      this.ctx.beginPath();
      this.ctx.roundRect(-18, -14, 36, 32, 10);
      this.ctx.fill();

      // D. Chest Emblems & Costumes
      if (cookieId === 'brave') {
        // 2 Yellow candy buttons
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
        this.ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'ninja') {
        // Silver Shuriken star emblem
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✦', 0, 4);
      } else if (cookieId === 'cherry') {
        // Cherry button
        this.ctx.fillStyle = '#fda4af';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'angel') {
        // Angel cyan cross
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillRect(-2, -8, 4, 16);
        this.ctx.fillRect(-6, -4, 12, 4);
      } else if (cookieId === 'hero') {
        // Glowing cyan reactor
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      } else if (cookieId === 'pirate') {
        // Red coat lapels & gold buttons
        this.ctx.fillStyle = '#991b1b';
        this.ctx.fillRect(-16, -12, 32, 28);
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
        this.ctx.arc(-6, 6, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'zombie') {
        // Skull candy belt
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('☠', 0, 8);
      }

      // E. Head
      const headColor = cookieId === 'brave' ? '#c27838' : (cookieId === 'zombie' ? '#65a30d' : cookieData.color);
      this.ctx.fillStyle = headColor;
      this.ctx.beginPath();
      this.ctx.arc(0, -26, 22, 0, Math.PI * 2);
      this.ctx.fill();

      // F. Distinct Head Accessories
      if (cookieId === 'brave') {
        // White royal icing hair swirl
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, -42, 6, 0, Math.PI * 2);
        this.ctx.arc(6, -38, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Big brave eyes
        this.ctx.fillStyle = '#451a03';
        this.ctx.beginPath();
        this.ctx.arc(4, -28, 4, 0, Math.PI * 2);
        this.ctx.arc(14, -28, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(5, -29, 1.5, 0, Math.PI * 2);
        this.ctx.arc(15, -29, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        // Happy smile
        this.ctx.strokeStyle = '#451a03';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(9, -21, 6, 0.2, Math.PI * 0.8);
        this.ctx.stroke();
      } else if (cookieId === 'ninja') {
        // Ninja cowl & headband
        this.ctx.fillStyle = '#60a5fa';
        this.ctx.fillRect(-22, -34, 44, 7);
        // Face cutout & sharp cyan eyes
        this.ctx.fillStyle = '#fed7aa';
        this.ctx.fillRect(0, -30, 20, 9);
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillRect(8, -28, 8, 4);
      } else if (cookieId === 'cherry') {
        // Twin red cherry buns with green leaf
        this.ctx.fillStyle = '#e11d48';
        this.ctx.beginPath();
        this.ctx.arc(-14, -40, 10, 0, Math.PI * 2);
        this.ctx.arc(10, -42, 11, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(8, -52, 3, 10);
        // Cute face & blush
        this.ctx.fillStyle = '#fed7aa';
        this.ctx.beginPath();
        this.ctx.arc(4, -24, 14, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fb7185';
        this.ctx.beginPath();
        this.ctx.arc(12, -20, 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'angel') {
        // Golden glowing halo
        this.ctx.strokeStyle = '#fde047';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -48, 18, 5, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        // Blonde curly hair
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(-12, -32, 8, 0, Math.PI * 2);
        this.ctx.arc(0, -38, 9, 0, Math.PI * 2);
        this.ctx.arc(12, -34, 8, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'hero') {
        // High-tech helmet with green HUD visor
        this.ctx.fillStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.roundRect(2, -32, 18, 10, 4);
        this.ctx.fill();
      } else if (cookieId === 'zombie') {
        // Bandage wrap & funny mismatch eyes
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.fillRect(-22, -38, 44, 8);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(4, -26, 6, 0, Math.PI * 2);
        this.ctx.arc(15, -28, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(4, -26, 3, 3);
        this.ctx.fillRect(15, -28, 2, 2);
      } else if (cookieId === 'pirate') {
        // Captain Hat with Golden Skull
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.moveTo(-24, -30);
        this.ctx.lineTo(24, -30);
        this.ctx.lineTo(16, -46);
        this.ctx.lineTo(-16, -46);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#facc15';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('☠', 0, -34);
        // Eye patch
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(10, -28, 7, 7);
      } else if (cookieId === 'vampire') {
        // Vampire red eyes & high collar
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(6, -26, 3, 0, Math.PI * 2);
        this.ctx.arc(14, -26, 3, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'wizard') {
        // Starry Wizard Hat
        this.ctx.fillStyle = '#312e81';
        this.ctx.beginPath();
        this.ctx.moveTo(-24, -30);
        this.ctx.lineTo(24, -30);
        this.ctx.lineTo(8, -58);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#fde047';
        this.ctx.beginPath();
        this.ctx.arc(0, -30, 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'moonlight') {
        // Moonlight Golden Crescent Tiara & Cosmic Bangs
        this.ctx.fillStyle = '#3730a3';
        this.ctx.beginPath();
        this.ctx.arc(-8, -34, 8, 0, Math.PI * 2);
        this.ctx.arc(8, -34, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Golden Crescent Crown
        this.ctx.fillStyle = '#fde047';
        this.ctx.beginPath();
        this.ctx.arc(0, -44, 8, Math.PI * 0.2, Math.PI * 1.8);
        this.ctx.arc(4, -44, 6, Math.PI * 1.8, Math.PI * 0.2, true);
        this.ctx.fill();

        // Starry mysterious eyes
        this.ctx.fillStyle = '#818cf8';
        this.ctx.beginPath();
        this.ctx.arc(6, -26, 3.5, 0, Math.PI * 2);
        this.ctx.arc(14, -26, 3.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(7, -27, 1.2, 0, Math.PI * 2);
        this.ctx.arc(15, -27, 1.2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // G. Arms / Held Items
      this.ctx.strokeStyle = headColor;
      this.ctx.lineWidth = 8;
      this.ctx.beginPath();
      this.ctx.moveTo(10, -6);
      this.ctx.lineTo(26, -4 + (isAirborne ? -10 : 0));
      this.ctx.stroke();

      // Unique held items
      if (cookieId === 'cherry') {
        // Giant glowing cherry bomb
        this.ctx.fillStyle = '#e11d48';
        this.ctx.beginPath();
        this.ctx.arc(32, -4, 10, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'wizard') {
        // Magic staff
        this.ctx.strokeStyle = '#d97706';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(26, 12);
        this.ctx.lineTo(30, -20);
        this.ctx.stroke();
        this.ctx.fillStyle = '#ec4899';
        this.ctx.beginPath();
        this.ctx.arc(30, -22, 6, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (cookieId === 'moonlight') {
        // Glowing Crescent Moon Wand / Staff
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(26, 14);
        this.ctx.lineTo(32, -22);
        this.ctx.stroke();

        // Crescent moon topper
        this.ctx.fillStyle = '#fde047';
        this.ctx.beginPath();
        this.ctx.arc(32, -26, 8, Math.PI * 0.2, Math.PI * 1.8);
        this.ctx.arc(35, -26, 6, Math.PI * 1.8, Math.PI * 0.2, true);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  private renderParticles() {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;

      if (p.shape === 'sparkle') {
        this.ctx.translate(p.x, p.y);
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size);
        this.ctx.lineTo(p.size * 0.3, 0);
        this.ctx.lineTo(p.size, 0);
        this.ctx.lineTo(p.size * 0.3, 0);
        this.ctx.lineTo(0, p.size);
        this.ctx.lineTo(-p.size * 0.3, 0);
        this.ctx.lineTo(-p.size, 0);
        this.ctx.lineTo(-p.size * 0.3, 0);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  private renderFloatingTexts() {
    for (const ft of this.floatingTexts) {
      this.ctx.save();
      this.ctx.globalAlpha = ft.alpha;
      this.ctx.font = `bold ${ft.size}px Jua, Fredoka, sans-serif`;
      this.ctx.fillStyle = ft.color;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 4;
      this.ctx.textAlign = 'center';
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    }
  }

  private renderHUD() {
    this.ctx.save();

    // 1. BONUSTIME Letters
    const bonusWord = ['B', 'O', 'N', 'U', 'S', 'T', 'I', 'M', 'E'];
    const bonusStartX = 32;
    const bonusStartY = 42;

    this.ctx.font = '900 24px Fredoka, Jua, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    bonusWord.forEach((char, idx) => {
      const isLit = this.bonusProgress.letters[char];
      const charX = bonusStartX + idx * 24;

      if (isLit) {
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.strokeStyle = '#78350f';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(char, charX, bonusStartY);
        this.ctx.fillText(char, charX, bonusStartY);
      } else {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(char, charX, bonusStartY);
        this.ctx.fillText(char, charX, bonusStartY);
      }
    });

    // 2. HEALTH BAR
    const hpX = 32;
    const hpY = 66;
    const hpWidth = 720;
    const hpHeight = 28;

    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(hpX + 10, hpY + 14, 20, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('♥', hpX + 10, hpY + 15);

    const trackX = hpX + 34;
    const trackWidth = hpWidth - 34;
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.beginPath();
    this.ctx.roundRect(trackX, hpY, trackWidth, hpHeight, 14);
    this.ctx.fill();
    this.ctx.strokeStyle = '#facc15';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    const hpRatio = Math.max(0, Math.min(1, this.player.hp / this.player.maxHp));
    const fillWidth = Math.max(0, trackWidth * hpRatio);

    if (fillWidth > 0) {
      const hpGrad = this.ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
      hpGrad.addColorStop(0, '#ef4444');
      hpGrad.addColorStop(0.35, '#f97316');
      hpGrad.addColorStop(1, '#fde047');

      this.ctx.fillStyle = hpGrad;
      this.ctx.beginPath();
      this.ctx.roundRect(trackX + 2, hpY + 2, fillWidth - 4, hpHeight - 4, 12);
      this.ctx.fill();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fillRect(trackX + 10, hpY + 5, fillWidth - 20, 5);
    }

    // 3. STATS (Coins, Score, Next Target Rank, Current Stage Tag)
    const currentTheme = STAGES[this.player.currentStage];
    const isStage4Infinite = this.player.currentStage === 'candy_galaxy';
    const metersRun = Math.floor(this.gameDistance / 50);
    const stageMeters = Math.min(1000, Math.floor((this.gameDistance - this.lastStageWarpDistance) / 50));
    
    // Stage Tag Badge in HUD
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.beginPath();
    this.ctx.roundRect(trackX, hpY + 32, 280, 26, 8);
    this.ctx.fill();
    this.ctx.strokeStyle = isStage4Infinite ? '#f0abfc' : '#38bdf8';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.font = 'bold 13px Jua, sans-serif';
    this.ctx.fillStyle = '#fde047';
    this.ctx.textAlign = 'left';
    if (isStage4Infinite) {
      this.ctx.fillText(`🗺️ STAGE 4: 캔디 은하수 (무한: ${metersRun}m)`, trackX + 10, hpY + 49);
    } else {
      this.ctx.fillText(`🗺️ ${currentTheme.name} [${stageMeters}m / 1000m]`, trackX + 10, hpY + 49);
    }

    const coinX = this.width - 440;
    this.ctx.fillStyle = '#eab308';
    this.ctx.beginPath();
    this.ctx.arc(coinX, 42, 14, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.font = '900 24px Fredoka, Jua, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.textAlign = 'left';
    this.ctx.strokeText(`${this.player.coins}`, coinX + 20, 44);
    this.ctx.fillText(`${this.player.coins}`, coinX + 20, 44);

    const scoreX = this.width - 240;
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.arc(scoreX - 25, 42, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.font = '900 32px Fredoka, Jua, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 5;
    this.ctx.textAlign = 'left';
    const scoreStr = this.player.score.toLocaleString();
    this.ctx.strokeText(scoreStr, scoreX, 44);
    this.ctx.fillText(scoreStr, scoreX, 44);

    this.ctx.font = 'bold 16px Jua, sans-serif';
    this.ctx.fillStyle = '#fef08a';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('다음목표', this.width - 40, 80);
    this.ctx.font = '900 22px Fredoka, Jua, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`${this.player.targetRank}등`, this.width - 40, 106);

    // 4. BOTTOM TREASURE SLOTS
    const slotCount = 5;
    const slotSize = 46;
    const slotSpacing = 8;
    const totalSlotW = slotCount * slotSize + (slotCount - 1) * slotSpacing;
    const slotStartX = (this.width - totalSlotW) / 2;
    const slotY = this.height - 56;

    for (let s = 0; s < slotCount; s++) {
      const sx = slotStartX + s * (slotSize + slotSpacing);
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      this.ctx.beginPath();
      this.ctx.roundRect(sx, slotY, slotSize, slotSize, 8);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '18px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const icons = ['🧪', '⭐', '🛡️', '🧲', '🎒'];
      this.ctx.fillText(icons[s], sx + slotSize / 2, slotY + slotSize / 2);
    }

    // 5. TOUCH BUTTON OVERLAYS
    const jumpBtnX = 40;
    const jumpBtnY = this.height - 110;
    const btnRadius = 48;

    this.ctx.fillStyle = this.isJumpPressed ? 'rgba(59, 130, 246, 0.75)' : 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.arc(jumpBtnX + btnRadius, jumpBtnY + btnRadius, btnRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = this.isJumpPressed ? '#93c5fd' : 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    this.ctx.font = '900 24px Fredoka, Jua, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Jump', jumpBtnX + btnRadius, jumpBtnY + btnRadius - 6);
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.fillText('D / S 키', jumpBtnX + btnRadius, jumpBtnY + btnRadius + 16);

    const slideBtnX = this.width - 40 - btnRadius * 2;
    const slideBtnY = this.height - 110;

    this.ctx.fillStyle = this.isSlidePressed ? 'rgba(249, 115, 22, 0.75)' : 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.arc(slideBtnX + btnRadius, slideBtnY + btnRadius, btnRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = this.isSlidePressed ? '#fdba74' : 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    this.ctx.font = '900 24px Fredoka, Jua, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Slide', slideBtnX + btnRadius, slideBtnY + btnRadius - 6);
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.fillText('J / K 키', slideBtnX + btnRadius, slideBtnY + btnRadius + 16);

    this.ctx.restore();
  }
}
