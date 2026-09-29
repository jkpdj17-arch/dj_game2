/**
 * Game Types & Interfaces
 */

export type GameMode = 'RUN' | 'BONUS_TIME' | 'GAME_OVER' | 'PAUSED' | 'IDLE';

export type CookieId = 
  | 'brave' 
  | 'ninja' 
  | 'cherry' 
  | 'angel' 
  | 'hero' 
  | 'zombie' 
  | 'pirate' 
  | 'vampire' 
  | 'wizard'
  | 'moonlight';

export type PetId = 
  | 'choco_drop' 
  | 'ghost' 
  | 'rocket' 
  | 'celestial_star' 
  | 'jelly_drop' 
  | 'brain_gum' 
  | 'pirate_bomb' 
  | 'oak_barrel' 
  | 'grimoire'
  | 'dreamcatcher';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface PetCharacter {
  id: PetId;
  name: string;
  title: string;
  desc: string;
  specialSkill: string;
  combiCookieId: CookieId;
  combiBonusDesc: string;
  avatarIcon: string;
  color: string;
  accentColor: string;
  rarity: Rarity;
  unlockCostCoins?: number;
  unlockCostCrystals?: number;
}

export interface CookieUnlockMission {
  description: string;
  type: 'level' | 'pets_count' | 'stage_reached' | 'coins_earned' | 'runs_played' | 'pet_level_count' | 'infinite_distance';
  targetValue: number;
}

export interface CookieCharacter {
  id: CookieId;
  name: string;
  title: string;
  desc: string;
  specialSkill: string;
  maxJumps: number;
  bonusHp: number;
  color: string;
  accentColor: string;
  unlocked: boolean;
  avatarIcon: string;
  rarity: Rarity;
  quote: string;
  unlockCostCoins: number;
  unlockCostCrystals: number;
  unlockMission?: CookieUnlockMission;
}

export type StageId = 'oven' | 'forest' | 'ocean' | 'candy_galaxy';

export interface StageTheme {
  id: StageId;
  name: string;
  subTitle: string;
  bgGradTop: string;
  bgGradMid: string;
  bgGradBot: string;
  floorBarTop: string;
  floorBarBot: string;
  floorStructure: string;
  ambientParticleColor: string;
  brickColor: string;
  glowColor: string;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isGrounded: boolean;
  isSliding: boolean;
  jumpCount: number;
  maxJumps: number;
  hp: number;
  maxHp: number;
  score: number;
  coins: number;
  targetRank: number;
  isInvincible: boolean;
  invincibleTimer: number;
  isGiant: boolean;
  giantTimer: number;
  isSpeedBoost: boolean;
  speedBoostTimer: number;
  isMagnet: boolean;
  magnetTimer: number;
  isBearParty: boolean;
  bearPartyTimer: number;
  cookieId: CookieId;
  petId: PetId;
  currentStage: StageId;
  stageTransitionProgress: number; // 0 to 1 during map transition
}

export type JellyType = 
  | 'basic' 
  | 'yellow_bear' 
  | 'pink_bear' 
  | 'giant_bear' 
  | 'coin' 
  | 'alphabet' 
  | 'potion_hp' 
  | 'potion_super_hp' 
  | 'potion_bear_party' 
  | 'potion_giant' 
  | 'potion_magnet' 
  | 'potion_blast';

export interface JellyItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: JellyType;
  value: number;
  letter?: string; // for 'BONUSTIME'
  collected: boolean;
  animOffset: number;
}

export type ObstacleType = 'low' | 'tall' | 'ceiling' | 'spike';

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  requiresSlide: boolean;
  requiresDoubleJump?: boolean;
  destroyed?: boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'star' | 'circle' | 'sparkle';
}

export interface GameSettings {
  baseSpeed: number;
  gravity: number;
  jumpForce: number;
  doubleJumpForce: number;
  hpDrainRate: number; // HP drained per second
  jellyFrequency: number;
  obstacleFrequency: number;
  maxNinjaJumps: number;
  sfxVolume: number;
  bgmVolume: number;
}

export interface BonusTimeProgress {
  letters: { [key: string]: boolean }; // B, O, N, U, S, T, I, M, E
  count: number;
}
