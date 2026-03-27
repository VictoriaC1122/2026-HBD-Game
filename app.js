const MAX_HP = 100;
const MAX_RUN_SPEED = 2.9;
const GROUND_ACCEL = 0.52;
const AIR_ACCEL = 0.34;
const GROUND_FRICTION = 0.72;
const AIR_DRAG = 0.9;
const STOP_SPEED = 0.06;
const PHYSICS_FRAME = 1000 / 30;
const STATE_SYNC_INTERVAL = 1000 / 15;
const ATTACK_RANGE = 11;
const ATTACK_DAMAGE_MIN = 15;
const ATTACK_DAMAGE_MAX = 28;
const ATTACK_COOLDOWN = 620;
const JUMP_COOLDOWN = 680;
const JUMP_AIR_TIME = 700;
const HIT_STUN = 360;
const COUNTDOWN_STEPS = ["3", "2", "1", "FIGHT!"];

const avatarDefinitions = [
  { id: "rose", name: "Rose Hero", colors: ["#fb6f92", "#ffd6e0", "#84233e"], icon: "hero" },
  { id: "mint", name: "Mint Bunny", colors: ["#8de5c1", "#d3fff1", "#2a6d5a"], icon: "bunny" },
  { id: "pixel", name: "Pixel Fox", colors: ["#ff9b54", "#ffe1bf", "#723b17"], icon: "fox" },
  { id: "nova", name: "Nova Cat", colors: ["#8bb6ff", "#e2edff", "#304884"], icon: "cat" },
  { id: "mango", name: "Mango Dino", colors: ["#ffd166", "#fff1bf", "#8c5b13"], icon: "dino" },
  { id: "aqua", name: "Aqua Whale", colors: ["#72ddf7", "#def8ff", "#23667a"], icon: "whale" },
  { id: "cocoa", name: "Cocoa Pup", colors: ["#bc8d62", "#f2dec6", "#5a3d28"], icon: "pup" },
  { id: "violet", name: "Violet Mage", colors: ["#be97ff", "#f1e4ff", "#52388c"], icon: "mage" },
  { id: "pearl", name: "Pearl Chick", colors: ["#ff8d72", "#ffe4cc", "#7a3d25"], icon: "chick" },
  { id: "leaf", name: "Leaf Bear", colors: ["#9ed36a", "#eefbd9", "#3b6f1d"], icon: "bear" },
  { id: "ember", name: "Ember Star", colors: ["#ff7b5a", "#ffe1d8", "#833226"], icon: "star" },
  { id: "glow", name: "Glow Robot", colors: ["#85f4ff", "#e2fdff", "#305764"], icon: "robot" }
];

const appState = {
  mode: "host",
  peer: null,
  peerId: "",
  joinCode: "",
  hostConnection: null,
  players: new Map(),
  connections: new Map(),
  selectedAvatarId: avatarDefinitions[0].id,
  playerId: crypto.randomUUID(),
  localPlayer: null,
  localPlayerSnapshot: [],
  winnerId: null,
  joinUrl: "",
  gamePhase: "lobby",
  countdownValue: "",
  countdownTimer: null,
  audioContext: null,
  joinRequested: false,
  lastLocalMoveAt: 0,
  lastLocalJumpAt: 0,
  lastLocalAttackAt: 0,
  damageBursts: [],
  activeMoveDirection: null,
  localMoveTimer: null,
  renderLoopStarted: false,
  needsRender: true,
  lastRenderAt: 0,
  lastPhysicsAt: 0,
  lastStateSyncAt: 0
};

const el = {
  hostView: document.querySelector("#hostView"),
  playerView: document.querySelector("#playerView"),
  statusBanner: document.querySelector("#statusBanner"),
  tutorialOverlay: document.querySelector("#tutorialOverlay"),
  tutorialCloseButton: document.querySelector("#tutorialCloseButton"),
  qrCode: document.querySelector("#qrCode"),
  roomCode: document.querySelector("#roomCode"),
  joinUrl: document.querySelector("#joinUrl"),
  playerCount: document.querySelector("#playerCount"),
  hudPlayers: document.querySelector("#hudPlayers"),
  hudMode: document.querySelector("#hudMode"),
  hostLeader: document.querySelector("#hostLeader"),
  hostPhase: document.querySelector("#hostPhase"),
  hostNextStep: document.querySelector("#hostNextStep"),
  track: document.querySelector("#track"),
  podium: document.querySelector("#podium"),
  raceSummary: document.querySelector("#raceSummary"),
  countdownOverlay: document.querySelector("#countdownOverlay"),
  countdownNumber: document.querySelector("#countdownNumber"),
  countdownLabel: document.querySelector("#countdownLabel"),
  copyLinkButton: document.querySelector("#copyLinkButton"),
  startRaceButton: document.querySelector("#startRaceButton"),
  resetRaceButton: document.querySelector("#resetRaceButton"),
  avatarPicker: document.querySelector("#avatarPicker"),
  selectedAvatarName: document.querySelector("#selectedAvatarName"),
  playerName: document.querySelector("#playerName"),
  joinButton: document.querySelector("#joinButton"),
  joinPanel: document.querySelector("#joinPanel"),
  controllerPanel: document.querySelector("#controllerPanel"),
  playerGreeting: document.querySelector("#playerGreeting"),
  playerConnectionChip: document.querySelector("#playerConnectionChip"),
  playerHelperText: document.querySelector("#playerHelperText"),
  playerStatusChip: document.querySelector("#playerStatusChip"),
  playerActionChip: document.querySelector("#playerActionChip"),
  playerRoundBanner: document.querySelector("#playerRoundBanner"),
  playerLanePreview: document.querySelector("#playerLanePreview"),
  leftButton: document.querySelector("#leftButton"),
  rightButton: document.querySelector("#rightButton"),
  jumpButton: document.querySelector("#jumpButton"),
  attackButton: document.querySelector("#attackButton"),
  controllerHint: document.querySelector("#controllerHint")
};

function iconMarkup(icon, accent) {
  const paths = {
    fox: `<path d="M10 24h8v8h-8zM18 16h8v8h-8zM38 16h8v8h-8zM46 24h8v8h-8zM18 24h28v24H18zM22 36h4v4h-4zM38 36h4v4h-4zM28 44h8v4h-8z" fill="${accent}"/><path d="M22 28h20v12H22z" fill="#fff4df"/>`,
    bunny: `<path d="M20 6h8v18h-8zM36 6h8v18h-8zM16 22h32v28H16z" fill="${accent}"/><path d="M20 26h24v20H20z" fill="#fffaf2"/><path d="M24 34h4v4h-4zM36 34h4v4h-4zM30 42h4v4h-4z" fill="#2d2d2d"/>`,
    cat: `<path d="M16 18h8v8h-8zM24 10h8v8h-8zM32 10h8v8h-8zM40 18h8v8h-8zM16 26h32v24H16z" fill="${accent}"/><path d="M20 30h24v16H20z" fill="#fff4fb"/>`,
    bear: `<path d="M14 18h8v8h-8zM42 18h8v8h-8zM16 22h32v28H16z" fill="${accent}"/><path d="M20 26h24v20H20z" fill="#fffefc"/>`,
    hero: `<path d="M22 8h20v10H22zM18 18h28v12H18zM16 30h12v18H16zM36 30h12v18H36zM28 30h8v18h-8z" fill="${accent}"/><path d="M22 18h20v14H22z" fill="#fff4de"/>`,
    dino: `<path d="M16 18h20v8H16zM36 22h12v20H36zM20 26h20v20H20zM16 38h8v10h-8z" fill="${accent}"/><path d="M24 26h12v16H24z" fill="#f5ffed"/>`,
    whale: `<path d="M12 22h36v20H12zM48 26h6v12h-6zM20 18h18v6H20z" fill="${accent}"/><path d="M20 26h20v12H20z" fill="#def8ff"/>`,
    pup: `<path d="M16 18h10v8H16zM38 18h10v8H38zM18 24h28v24H18z" fill="${accent}"/><path d="M22 28h20v18H22z" fill="#fff7f0"/>`,
    mage: `<path d="M20 8h24v8H20zM16 16h32v10H16zM20 26h24v22H20z" fill="${accent}"/><path d="M24 20h16v20H24z" fill="#fff8ff"/>`,
    chick: `<path d="M18 16h28v8H18zM16 24h32v22H16z" fill="${accent}"/><path d="M20 28h24v16H20z" fill="#ffe9cc"/>`,
    star: `<path d="M28 10h8v8h8v8h8v8h-8v8h-8v8h-8v-8h-8v-8h-8v-8h8v-8h8z" fill="${accent}"/>`,
    robot: `<path d="M20 10h24v6H20zM18 18h28v24H18zM14 24h4v10h-4zM46 24h4v10h-4zM22 42h8v8h-8zM34 42h8v8h-8z" fill="${accent}"/><path d="M22 22h20v16H22z" fill="#edfdfd"/>`
  };

  return paths[icon];
}

function avatarSvg(avatar) {
  const [primary, secondary, accent] = avatar.colors;
  return `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${avatar.name}" shape-rendering="crispEdges">
      <defs>
        <linearGradient id="bg-${avatar.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" fill="url(#bg-${avatar.id})" />
      ${iconMarkup(avatar.icon, accent)}
    </svg>
  `;
}

function getAvatarById(id) {
  return avatarDefinitions.find((avatar) => avatar.id === id) || avatarDefinitions[0];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

function status(text) {
  el.statusBanner.textContent = text;
}

function maybeShowTutorial() {
  try {
    if (window.localStorage.getItem("birthday-battle-tutorial") === "seen") return;
  } catch (_error) {
  }
  el.tutorialOverlay?.classList.remove("hidden");
  el.tutorialOverlay?.setAttribute("aria-hidden", "false");
}

function closeTutorial() {
  el.tutorialOverlay?.classList.add("hidden");
  el.tutorialOverlay?.setAttribute("aria-hidden", "true");
  try {
    window.localStorage.setItem("birthday-battle-tutorial", "seen");
  } catch (_error) {
  }
}

function buildJoinUrl(hostId) {
  const url = new URL(window.location.href);
  url.searchParams.set("join", hostId);
  return url.toString();
}

function randomRoomCode(peerId) {
  return peerId.slice(-6).toUpperCase();
}

function qrServiceUrl(text, size = 220) {
  return `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=${size}`;
}

function renderQrFallback(url) {
  el.qrCode.innerHTML = "";
  const image = document.createElement("img");
  image.src = qrServiceUrl(url);
  image.width = 220;
  image.height = 220;
  image.alt = "加入房間 QR Code";
  image.loading = "eager";
  image.decoding = "async";
  el.qrCode.append(image);
}

async function renderQrCode(url) {
  const qrApi = window.QRCode || globalThis.QRCode;
  el.qrCode.innerHTML = "";

  if (qrApi?.toDataURL) {
    try {
      const dataUrl = await qrApi.toDataURL(url, { width: 220, margin: 1 });
      const image = document.createElement("img");
      image.src = dataUrl;
      image.width = 220;
      image.height = 220;
      image.alt = "加入房間 QR Code";
      el.qrCode.append(image);
      return;
    } catch (_error) {
    }
  }

  renderQrFallback(url);
}

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!appState.audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    appState.audioContext = new Context();
  }
  if (appState.audioContext.state === "suspended") {
    appState.audioContext.resume();
  }
  return appState.audioContext;
}

function playTone(frequency, duration, type = "square", volume = 0.05) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function playCountdownTone(step) {
  if (step === "FIGHT!") {
    playTone(640, 0.18, "square", 0.08);
    setTimeout(() => playTone(920, 0.2, "square", 0.08), 100);
    return;
  }
  playTone(440, 0.14, "square", 0.06);
}

function playHitTone() {
  playTone(210, 0.08, "sawtooth", 0.07);
}

function playVictoryFanfare() {
  playTone(523.25, 0.12, "square", 0.08);
  setTimeout(() => playTone(659.25, 0.12, "square", 0.08), 120);
  setTimeout(() => playTone(783.99, 0.2, "square", 0.08), 240);
}

function getPhaseLabel() {
  if (appState.gamePhase === "countdown") return "COUNTDOWN";
  if (appState.gamePhase === "battle") return "BATTLE";
  if (appState.gamePhase === "finished") return "FINISH";
  return "LOBBY";
}

function hostNextStepText(playerCount, aliveCount) {
  if (!playerCount) return "先讓玩家掃碼加入，畫面會自動顯示目前人數。";
  if (playerCount < 2) return "還差 1 位玩家，至少 2 人才能開始亂鬥。";
  if (appState.gamePhase === "countdown") return "倒數進行中，大家現在可以把手機拿好準備開打。";
  if (appState.gamePhase === "battle") return `亂鬥進行中，目前還有 ${aliveCount} 人存活。`;
  if (appState.gamePhase === "finished") return "本局已結束，按下重設本局就能快速再玩一場。";
  return "玩家都到齊了，按下開始亂鬥就會進入倒數。";
}

function updateHostUx(playerCount = appState.players.size, aliveCount = getAlivePlayers().length) {
  if (!el.hostNextStep) return;
  el.hostNextStep.innerHTML = `
    <strong>下一步</strong>
    <span>${hostNextStepText(playerCount, aliveCount)}</span>
  `;
}

function updatePlayerUxMeta() {
  if (!el.playerConnectionChip || !el.playerHelperText) return;

  const connected = Boolean(appState.hostConnection?.open);
  el.playerConnectionChip.textContent = connected ? "CONNECTED" : "RECONNECT";
  el.playerConnectionChip.classList.toggle("is-offline", !connected);

  if (!connected) {
    el.playerHelperText.textContent = "和房主的連線中斷了，請重新掃碼加入。";
    return;
  }

  if (appState.joinRequested) {
    el.playerHelperText.textContent = "加入請求已送出，正在等房主同步你的角色。";
    return;
  }

  if (!appState.localPlayer) {
    el.playerHelperText.textContent = "輸入名字、選角色後按下加入戰場。";
    return;
  }

  if (appState.gamePhase === "countdown") {
    el.playerHelperText.textContent = `倒數 ${appState.countdownValue || ""} 中，手先放在左右和攻擊鍵上。`;
    return;
  }

  if (appState.gamePhase === "battle") {
    el.playerHelperText.textContent = "長按左右持續移動，跳躍閃招，靠近後按 ATTACK。";
    return;
  }

  if (appState.gamePhase === "finished") {
    el.playerHelperText.textContent = "本局結束，等房主重設就能立刻再開一場。";
    return;
  }

  el.playerHelperText.textContent = "已加入成功，等房主按下開始亂鬥。";
}

function updateRoundBanner() {
  if (!el.playerRoundBanner) return;
  if (appState.gamePhase === "finished") {
    const winnerName = appState.localPlayerSnapshot.find((item) => item.id === appState.winnerId)?.name || "本局冠軍";
    el.playerRoundBanner.classList.remove("hidden");
    el.playerRoundBanner.innerHTML = `
      <strong>${winnerName}</strong>
      <span>本局已結束，等房主按下重設本局後再來一場。</span>
    `;
    return;
  }

  if (appState.gamePhase === "countdown") {
    el.playerRoundBanner.classList.remove("hidden");
    el.playerRoundBanner.innerHTML = `
      <strong>即將開打</strong>
      <span>倒數 ${appState.countdownValue || ""}，把手機橫著握會更好操作。</span>
    `;
    return;
  }

  el.playerRoundBanner.classList.add("hidden");
}

function combatStatusText(player) {
  if (!player || player.dead) return "OUT";
  if ((player.attackingUntil || 0) > Date.now()) return "SLASH";
  if ((player.hitUntil || 0) > Date.now()) return "HIT";
  if ((player.airborneUntil || 0) > Date.now()) return "JUMP";
  return "READY";
}

function isAirborne(player, now = Date.now()) {
  return (player.airborneUntil || 0) > now;
}

function isAlive(player) {
  return !player.dead && player.hp > 0;
}

function playerBottom(index) {
  return 72 + (index % 6) * 14;
}

function setupAvatarPicker() {
  el.avatarPicker.innerHTML = avatarDefinitions
    .map((avatar) => {
      const selectedClass = avatar.id === appState.selectedAvatarId ? "selected" : "";
      return `
        <button class="avatar-option ${selectedClass}" type="button" data-avatar="${avatar.id}">
          <div class="avatar-badge">${avatarSvg(avatar)}</div>
          <span>${escapeHtml(avatar.name)}</span>
        </button>
      `;
    })
    .join("");

  el.selectedAvatarName.textContent = getAvatarById(appState.selectedAvatarId).name;

  el.avatarPicker.querySelectorAll("[data-avatar]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedAvatarId = button.dataset.avatar;
      setupAvatarPicker();
    });
  });
}

function arenaDecorations() {
  return `
    <div class="battle-backdrop">
      <div class="battle-layer battle-sky"></div>
      <div class="battle-layer battle-clouds"></div>
      <div class="battle-layer battle-crystals"></div>
      <div class="battle-layer battle-trees"></div>
      <div class="battle-platform ground"></div>
      <div class="battle-platform float-a"></div>
      <div class="battle-platform float-b"></div>
      <div class="battle-platform float-c"></div>
      <div class="arena-totem left"></div>
      <div class="arena-totem right"></div>
      <div class="arena-gate"></div>
    </div>
  `;
}

function clampX(x) {
  return Math.max(6, Math.min(94, x));
}

function movementIntent(direction) {
  return direction === "left" ? -1 : 1;
}

function setPlayerMoveIntent(player, direction) {
  if (!player || player.dead) return false;
  const nextIntent = direction ? movementIntent(direction) : 0;
  const previousIntent = player.moveIntent || 0;
  if (nextIntent && player.direction !== direction) {
    player.direction = direction;
  }
  player.moveIntent = nextIntent;
  return previousIntent !== nextIntent;
}

function releasePlayerMoveIntent(player, direction = null) {
  if (!player) return false;
  if (!direction) {
    const changed = Boolean(player.moveIntent);
    player.moveIntent = 0;
    return changed;
  }
  const intended = movementIntent(direction);
  if ((player.moveIntent || 0) !== intended) return false;
  player.moveIntent = 0;
  return true;
}

function stepPlayerMotion(player, deltaScale, now = Date.now()) {
  if (!player) return false;
  const previousX = player.x;
  const previousVelocity = player.velocityX || 0;
  const previousDirection = player.direction;

  if (player.dead || appState.gamePhase !== "battle") {
    player.moveIntent = 0;
    player.velocityX = 0;
    return previousVelocity !== 0;
  }

  const airborne = isAirborne(player, now);
  const stunned = now < (player.hitUntil || 0);
  const intent = stunned ? 0 : (player.moveIntent || 0);
  const targetVelocity = intent * MAX_RUN_SPEED;
  const acceleration = (airborne ? AIR_ACCEL : GROUND_ACCEL) * deltaScale;

  if (intent !== 0) {
    const velocityDelta = targetVelocity - (player.velocityX || 0);
    player.velocityX = (player.velocityX || 0) + Math.sign(velocityDelta) * Math.min(Math.abs(velocityDelta), acceleration);
    player.direction = intent < 0 ? "left" : "right";
  } else {
    player.velocityX = (player.velocityX || 0) * Math.pow(airborne ? AIR_DRAG : GROUND_FRICTION, deltaScale);
    if (Math.abs(player.velocityX) < STOP_SPEED) {
      player.velocityX = 0;
    }
  }

  const nextX = clampX(player.x + (player.velocityX || 0) * deltaScale);
  if (nextX === 6 || nextX === 94) {
    player.velocityX = 0;
  }
  player.x = nextX;

  return Math.abs(player.x - previousX) > 0.01 || Math.abs((player.velocityX || 0) - previousVelocity) > 0.01 || previousDirection !== player.direction;
}

function advanceArenaPhysics(now) {
  if (appState.mode !== "host") return;
  if (!appState.lastPhysicsAt) {
    appState.lastPhysicsAt = now;
    return;
  }

  const elapsed = now - appState.lastPhysicsAt;
  if (elapsed < PHYSICS_FRAME) return;
  const deltaScale = Math.min(2.2, Math.max(0.8, elapsed / 16.67));
  appState.lastPhysicsAt = now;

  let changed = false;
  appState.players.forEach((player) => {
    changed = stepPlayerMotion(player, deltaScale, now) || changed;
  });

  if (!changed) return;
  appState.needsRender = true;

  if (now - appState.lastStateSyncAt >= STATE_SYNC_INTERVAL) {
    appState.lastStateSyncAt = now;
    broadcastState();
  }
}

function advanceLocalPhysics(now) {
  if (appState.mode !== "player" || !appState.localPlayer) return;
  if (!appState.lastPhysicsAt) {
    appState.lastPhysicsAt = now;
    return;
  }

  const elapsed = now - appState.lastPhysicsAt;
  if (elapsed < PHYSICS_FRAME) return;
  const deltaScale = Math.min(2.2, Math.max(0.8, elapsed / 16.67));
  appState.lastPhysicsAt = now;

  if (stepPlayerMotion(appState.localPlayer, deltaScale, now)) {
    appState.needsRender = true;
  }
}

function addDamageBurst(x, amount, crit = false) {
  appState.damageBursts.push({
    id: crypto.randomUUID(),
    x,
    amount,
    crit,
    createdAt: Date.now()
  });
  if (appState.damageBursts.length > 10) {
    appState.damageBursts = appState.damageBursts.slice(-10);
  }
  appState.needsRender = true;
}

function pruneDamageBursts() {
  const now = Date.now();
  appState.damageBursts = appState.damageBursts.filter((burst) => now - burst.createdAt < 820);
}

function hasLiveEffects() {
  const now = Date.now();
  if (appState.damageBursts.length) return true;
  for (const player of appState.players.values()) {
    if ((player.airborneUntil || 0) > now) return true;
    if ((player.attackingUntil || 0) > now) return true;
    if ((player.hitUntil || 0) > now) return true;
  }
  if (appState.localPlayer) {
    if ((appState.localPlayer.airborneUntil || 0) > now) return true;
    if ((appState.localPlayer.attackingUntil || 0) > now) return true;
    if ((appState.localPlayer.hitUntil || 0) > now) return true;
  }
  return false;
}

function startRenderLoop() {
  if (appState.renderLoopStarted) return;
  appState.renderLoopStarted = true;

  const tick = () => {
    const now = Date.now();
    pruneDamageBursts();
    advanceArenaPhysics(now);
    advanceLocalPhysics(now);
    const shouldRender = appState.needsRender || hasLiveEffects();

    if (shouldRender && now - appState.lastRenderAt >= 33 && appState.mode === "host") {
      appState.lastRenderAt = now;
      renderBattleArena([...appState.players.values()]);
    }

    if (shouldRender && now - appState.lastRenderAt >= 33 && appState.mode === "player" && appState.localPlayer) {
      appState.lastRenderAt = now;
      renderPlayerPreview(appState.localPlayer);
      updatePlayerStatus();
    }

    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

function renderCountdownOverlay() {
  if (appState.gamePhase !== "countdown" || !appState.countdownValue) {
    el.countdownOverlay.classList.add("hidden");
    return;
  }
  el.countdownOverlay.classList.remove("hidden");
  el.countdownNumber.textContent = appState.countdownValue;
  el.countdownLabel.textContent = appState.countdownValue === "FIGHT!" ? "BATTLE!" : "READY";
}

function renderPodium(players) {
  el.podium.innerHTML = players
    .slice(0, 4)
    .map((player, index) => {
      const avatar = getAvatarById(player.avatarId);
      const label = isAlive(player) ? `${player.hp} HP` : "淘汰";
      return `
        <div class="podium-card" data-rank="${index + 1}">
          <div class="avatar-badge">${avatarSvg(avatar)}</div>
          <div>
            <strong>${index + 1}. ${escapeHtml(player.name)}</strong>
            <span>${label}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderBattleArena(players) {
  appState.needsRender = false;
  const sorted = [...players].sort((a, b) => {
    if (Number(isAlive(b)) !== Number(isAlive(a))) return Number(isAlive(b)) - Number(isAlive(a));
    return b.hp - a.hp;
  });
  const crowdedMode = sorted.length >= 18;

  el.playerCount.textContent = String(sorted.length);
  el.hudPlayers.textContent = String(sorted.length);
  el.hudMode.textContent = getPhaseLabel();
  el.hostPhase.textContent = getPhaseLabel();

  const alivePlayers = sorted.filter(isAlive);
  el.hostLeader.textContent = alivePlayers[0]?.name || "全滅";
  updateHostUx(sorted.length, alivePlayers.length);

  const damageMarkup = appState.damageBursts
    .map(
      (burst) => `
        <div class="damage-burst ${burst.crit ? "crit" : ""}" style="left:${burst.x}%">-${burst.amount}</div>
      `
    )
    .join("");

  if (!sorted.length) {
    el.track.innerHTML = `
      <div class="battle-map">
        ${arenaDecorations()}
        <div class="battle-map-copy">
          <strong>等待玩家加入</strong>
          <span>掃描 QR Code 加入戰場，倒數後開始大亂鬥。</span>
        </div>
      </div>
    `;
    el.raceSummary.textContent = "等待玩家加入...";
    el.startRaceButton.disabled = true;
    renderCountdownOverlay();
    renderPodium([]);
    return;
  }

  el.startRaceButton.disabled = sorted.length < 2 || appState.gamePhase === "countdown";

  const fighterMarkup = sorted
    .map((player, index) => {
      const avatar = getAvatarById(player.avatarId);
      const healthPercent = Math.max(0, Math.round((player.hp / MAX_HP) * 100));
      const fighterClass = [
        "battle-fighter",
        crowdedMode ? "is-compact" : "",
        Math.abs(player.velocityX || 0) > 0.35 ? "is-running" : "",
        player.dead ? "is-dead" : "",
        isAirborne(player) ? "is-jumping" : "",
        (player.attackingUntil || 0) > Date.now() ? "is-attacking" : "",
        (player.hitUntil || 0) > Date.now() ? "is-hit" : "",
        player.direction === "left" ? "face-left" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <div class="${fighterClass}" style="left:${player.x}%; bottom:${playerBottom(index)}px">
          <div class="fighter-hp-bar">
            <div class="fighter-hp-fill" style="width:${healthPercent}%"></div>
          </div>
          <div class="fighter-meta">
            <span>${escapeHtml(crowdedMode ? player.name.slice(0, 8) : player.name)}</span>
            <strong>${Math.max(0, player.hp)}${crowdedMode ? "" : " HP"}</strong>
          </div>
          <div class="runner-avatar">${avatarSvg(avatar)}</div>
          <div class="fighter-status">${combatStatusText(player)}</div>
          ${(player.attackingUntil || 0) > Date.now() && !player.dead && !crowdedMode ? `<div class="attack-arc ${player.direction === "left" ? "left" : "right"}"></div>` : ""}
        </div>
      `;
    })
    .join("");

  el.track.innerHTML = `
    <div class="battle-map">
      ${arenaDecorations()}
      <div class="battle-map-header">
        <div class="battle-map-copy">
          <strong>生日亂鬥競技場</strong>
          <span>${crowdedMode ? "40 人同場優化模式啟動中，介面會自動精簡，讓大場面也保持順暢。" : "移動、跳躍、揮擊，把其他人打到血條歸零。最後活著的人獲勝。"}</span>
        </div>
        <div class="battle-chip">${alivePlayers.length} ALIVE</div>
      </div>
      ${fighterMarkup}
      ${damageMarkup}
    </div>
  `;

  renderPodium(sorted);

  if (appState.gamePhase === "countdown") {
    el.raceSummary.textContent = "倒數中，準備開打...";
  } else if (appState.gamePhase === "finished" && appState.winnerId) {
    const winner = appState.players.get(appState.winnerId);
    el.raceSummary.textContent = `${winner?.name || "有人"} 成為最後倖存者！`;
  } else if (appState.gamePhase === "battle") {
    el.raceSummary.textContent = `場上剩 ${alivePlayers.length} 人，亂鬥進行中！`;
  } else {
    el.raceSummary.textContent = sorted.length < 2 ? "至少要 2 位玩家才能開始" : "玩家已就位，按下開始亂鬥";
  }

  renderCountdownOverlay();
}

function renderPlayerPreview(player = appState.localPlayer) {
  if (!player) return;
  appState.needsRender = false;
  const avatar = getAvatarById(player.avatarId);
  const healthPercent = Math.max(0, Math.round((player.hp / MAX_HP) * 100));
  const fighterClass = [
    "battle-fighter",
    Math.abs(player.velocityX || 0) > 0.35 ? "is-running" : "",
    player.dead ? "is-dead" : "",
    isAirborne(player) ? "is-jumping" : "",
    (player.attackingUntil || 0) > Date.now() ? "is-attacking" : "",
    (player.hitUntil || 0) > Date.now() ? "is-hit" : "",
    player.direction === "left" ? "face-left" : ""
  ]
    .filter(Boolean)
    .join(" ");

  el.playerLanePreview.innerHTML = `
    <div class="battle-map preview-map">
      ${arenaDecorations()}
      <div class="${fighterClass} preview-fighter" style="left:${player.x}%; bottom:74px">
        <div class="fighter-hp-bar">
          <div class="fighter-hp-fill" style="width:${healthPercent}%"></div>
        </div>
        <div class="fighter-meta">
          <span>${escapeHtml(player.name)}</span>
          <strong>${Math.max(0, player.hp)} HP</strong>
        </div>
        <div class="runner-avatar">${avatarSvg(avatar)}</div>
        <div class="fighter-status">${combatStatusText(player)}</div>
      </div>
    </div>
  `;
}

function sendToAll(message) {
  appState.connections.forEach((connection) => {
    if (connection.open) {
      connection.send(message);
    }
  });
}

function broadcastState() {
  pruneDamageBursts();
  appState.needsRender = true;
  const payload = {
    type: "state",
    winnerId: appState.winnerId,
    gamePhase: appState.gamePhase,
    countdownValue: appState.countdownValue,
    players: [...appState.players.values()]
  };
  sendToAll(payload);
}

function createPlayer(messagePlayer) {
  return {
    id: messagePlayer.id,
    name: messagePlayer.name.slice(0, 16) || "Player",
    avatarId: messagePlayer.avatarId,
    x: 18 + Math.random() * 64,
    hp: MAX_HP,
    dead: false,
    direction: Math.random() > 0.5 ? "right" : "left",
    joinedAt: Date.now(),
    airborneUntil: 0,
    attackingUntil: 0,
    hitUntil: 0,
    moveIntent: 0,
    velocityX: 0,
    lastJumpAt: 0,
    lastAttackAt: 0
  };
}

function resetBattle() {
  clearTimeout(appState.countdownTimer);
  appState.countdownTimer = null;
  appState.winnerId = null;
  appState.gamePhase = "lobby";
  appState.countdownValue = "";
  appState.damageBursts = [];
  const players = [...appState.players.values()];
  players.forEach((player, index) => {
    player.hp = MAX_HP;
    player.dead = false;
    player.x = 14 + index * (68 / Math.max(1, players.length - 1 || 1));
    player.direction = index % 2 ? "left" : "right";
    player.airborneUntil = 0;
    player.attackingUntil = 0;
    player.hitUntil = 0;
    player.moveIntent = 0;
    player.velocityX = 0;
    player.lastJumpAt = 0;
    player.lastAttackAt = 0;
  });
  appState.lastPhysicsAt = 0;
  appState.lastStateSyncAt = 0;
  broadcastState();
}

function getAlivePlayers() {
  return [...appState.players.values()].filter(isAlive);
}

function maybeDeclareWinner() {
  const alivePlayers = getAlivePlayers();
  if (alivePlayers.length === 1 && appState.gamePhase === "battle") {
    appState.winnerId = alivePlayers[0].id;
    appState.gamePhase = "finished";
    sendToAll({ type: "winner", winnerId: alivePlayers[0].id, winnerName: alivePlayers[0].name });
    playVictoryFanfare();
  } else if (!alivePlayers.length && appState.gamePhase === "battle") {
    appState.winnerId = null;
    appState.gamePhase = "finished";
  }
}

function applyMoveStart(playerId, direction) {
  if (appState.gamePhase !== "battle") return;
  const player = appState.players.get(playerId);
  if (!player || player.dead || Date.now() < (player.hitUntil || 0)) return;
  if (setPlayerMoveIntent(player, direction)) {
    appState.needsRender = true;
  }
}

function applyMoveStop(playerId, direction = null) {
  const player = appState.players.get(playerId);
  if (!player || player.dead) return;
  if (releasePlayerMoveIntent(player, direction)) {
    appState.needsRender = true;
  }
}

function applyJump(playerId) {
  if (appState.gamePhase !== "battle") return;
  const player = appState.players.get(playerId);
  if (!player || player.dead) return;
  const now = Date.now();
  if (now - player.lastJumpAt < JUMP_COOLDOWN || now < (player.hitUntil || 0)) return;
  player.lastJumpAt = now;
  player.airborneUntil = now + JUMP_AIR_TIME;
  broadcastState();
}

function applyAttack(playerId) {
  if (appState.gamePhase !== "battle") return;
  const attacker = appState.players.get(playerId);
  if (!attacker || attacker.dead) return;
  const now = Date.now();
  if (now - attacker.lastAttackAt < ATTACK_COOLDOWN || now < (attacker.hitUntil || 0)) return;
  attacker.lastAttackAt = now;
  attacker.attackingUntil = now + 240;
  let anyHit = false;

  appState.players.forEach((target) => {
    if (target.id === attacker.id || target.dead) return;
    if (isAirborne(target, now) && !isAirborne(attacker, now)) return;
    const directionCheck = attacker.direction === "right" ? target.x >= attacker.x : target.x <= attacker.x;
    if (!directionCheck) return;
    if (Math.abs(target.x - attacker.x) > ATTACK_RANGE) return;

    const damage = Math.floor(ATTACK_DAMAGE_MIN + Math.random() * (ATTACK_DAMAGE_MAX - ATTACK_DAMAGE_MIN + 1));
    target.hp = Math.max(0, target.hp - damage);
    target.hitUntil = now + HIT_STUN;
    target.direction = target.x >= attacker.x ? "right" : "left";
    target.velocityX = attacker.direction === "right" ? 2.4 : -2.4;
    target.moveIntent = 0;
    target.x = clampX(target.x + target.velocityX * 1.1);
    attacker.velocityX = attacker.direction === "right" ? 1.1 : -1.1;
    addDamageBurst(target.x, damage, damage >= 24);
    anyHit = true;

    if (target.hp <= 0) {
      target.dead = true;
      target.airborneUntil = 0;
      target.attackingUntil = 0;
      target.velocityX = 0;
      target.moveIntent = 0;
    }
  });

  if (anyHit) {
    playHitTone();
  }

  maybeDeclareWinner();
  broadcastState();
}

function runCountdown(index = 0) {
  if (index >= COUNTDOWN_STEPS.length) {
    appState.countdownValue = "";
    appState.gamePhase = "battle";
    broadcastState();
    status("開打！");
    return;
  }

  appState.gamePhase = "countdown";
  appState.countdownValue = COUNTDOWN_STEPS[index];
  playCountdownTone(COUNTDOWN_STEPS[index]);
  broadcastState();
  appState.countdownTimer = setTimeout(() => runCountdown(index + 1), COUNTDOWN_STEPS[index] === "FIGHT!" ? 620 : 820);
}

function startBattleCountdown() {
  clearTimeout(appState.countdownTimer);
  resetBattle();
  runCountdown(0);
}

function updatePlayerStatus() {
  if (!appState.localPlayer) return;
  const me = appState.localPlayer;
  const winner = appState.winnerId ? me.id === appState.winnerId : false;

  if (appState.gamePhase === "countdown") {
    el.controllerHint.textContent = `倒數中 ${appState.countdownValue || ""}，準備左右移動、跳躍、攻擊。`;
    el.playerStatusChip.textContent = "COUNTDOWN";
    el.playerActionChip.textContent = `準備 ${appState.countdownValue || ""}`;
    el.leftButton.disabled = true;
    el.rightButton.disabled = true;
    el.jumpButton.disabled = true;
    el.attackButton.disabled = true;
  } else if (appState.gamePhase === "lobby") {
    el.controllerHint.textContent = "等待房主開始亂鬥。開始後用左右移動、跳躍和攻擊把別人打下去。";
    el.playerStatusChip.textContent = "WAITING";
    el.playerActionChip.textContent = "等待開打";
    el.leftButton.disabled = true;
    el.rightButton.disabled = true;
    el.jumpButton.disabled = true;
    el.attackButton.disabled = true;
  } else if (winner) {
    el.controllerHint.textContent = "你是最後的倖存者！等房主重設後可以再玩一局。";
    el.playerStatusChip.textContent = "WINNER";
    el.playerActionChip.textContent = "你活到最後";
    el.leftButton.disabled = true;
    el.rightButton.disabled = true;
    el.jumpButton.disabled = true;
    el.attackButton.disabled = true;
  } else if (me.dead) {
    el.controllerHint.textContent = "你已經被淘汰了，等房主重設下一局。";
    el.playerStatusChip.textContent = "DEAD";
    el.playerActionChip.textContent = "已淘汰";
    el.leftButton.disabled = true;
    el.rightButton.disabled = true;
    el.jumpButton.disabled = true;
    el.attackButton.disabled = true;
  } else if (appState.gamePhase === "finished") {
    const winnerName = appState.localPlayerSnapshot.find((item) => item.id === appState.winnerId)?.name;
    el.controllerHint.textContent = `${winnerName || "有人"} 活到最後，等房主重設下一局。`;
    el.playerStatusChip.textContent = "FINISHED";
    el.playerActionChip.textContent = `${winnerName || "有人"} 獲勝`;
    el.leftButton.disabled = true;
    el.rightButton.disabled = true;
    el.jumpButton.disabled = true;
    el.attackButton.disabled = true;
  } else {
    el.controllerHint.textContent = "左右移動接近對手，跳躍躲招，按 ATTACK 打出傷害。";
    el.playerStatusChip.textContent = "BATTLE";
    el.playerActionChip.textContent = me.hp <= 35 ? "殘血小心" : combatStatusText(me);
    el.leftButton.disabled = false;
    el.rightButton.disabled = false;
    el.jumpButton.disabled = false;
    el.attackButton.disabled = false;
  }

  updatePlayerUxMeta();
  updateRoundBanner();
}

function optimisticMove(direction) {
  if (!appState.localPlayer || appState.localPlayer.dead) return;
  setPlayerMoveIntent(appState.localPlayer, direction);
  appState.activeMoveDirection = direction;
  appState.needsRender = true;
}

function optimisticMoveStop(direction = null) {
  if (!appState.localPlayer) return;
  releasePlayerMoveIntent(appState.localPlayer, direction);
  if (!direction || appState.activeMoveDirection === direction) {
    appState.activeMoveDirection = null;
  }
  appState.needsRender = true;
}

function optimisticJump() {
  if (!appState.localPlayer || appState.localPlayer.dead) return;
  appState.localPlayer.airborneUntil = Date.now() + JUMP_AIR_TIME;
  appState.localPlayer.velocityX *= 1.04;
  appState.needsRender = true;
}

function optimisticAttack() {
  if (!appState.localPlayer || appState.localPlayer.dead) return;
  appState.localPlayer.attackingUntil = Date.now() + 220;
  appState.needsRender = true;
}

function stopMoveHold(sendMoveStop) {
  const activeDirection = appState.activeMoveDirection;
  appState.activeMoveDirection = null;
  if (appState.localMoveTimer) {
    window.clearInterval(appState.localMoveTimer);
    appState.localMoveTimer = null;
  }
  if (activeDirection && typeof sendMoveStop === "function") {
    optimisticMoveStop(activeDirection);
    sendMoveStop(activeDirection);
  }
}

function startMoveHold(event, direction, sendMoveStart, sendMoveStop) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  if (appState.activeMoveDirection && appState.activeMoveDirection !== direction) {
    stopMoveHold(sendMoveStop);
  }
  if (event.currentTarget?.setPointerCapture) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  if (appState.activeMoveDirection === direction) return;
  optimisticMove(direction);
  sendMoveStart(direction);
}

function applyRemoteState(message) {
  appState.winnerId = message.winnerId;
  appState.gamePhase = message.gamePhase || "lobby";
  appState.countdownValue = message.countdownValue || "";
  appState.localPlayerSnapshot = message.players;
  const latest = message.players.find((player) => player.id === appState.playerId);
  if (latest) {
    appState.localPlayer = latest;
    appState.needsRender = true;
  }
  renderCountdownOverlay();
  updatePlayerStatus();
  updatePlayerUxMeta();
  updateRoundBanner();
}

function registerConnection(connection) {
  connection.on("data", (message) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "join") {
      const player = createPlayer(message.player);
      appState.players.set(player.id, player);
      appState.connections.set(player.id, connection);
      connection.send({
        type: "joined",
        winnerId: appState.winnerId,
        gamePhase: appState.gamePhase,
        countdownValue: appState.countdownValue,
        player,
        players: [...appState.players.values()]
      });
      broadcastState();
      return;
    }

    if (message.type === "move") {
      applyMoveStart(message.playerId, message.direction);
    }

    if (message.type === "move-stop") {
      applyMoveStop(message.playerId, message.direction);
    }

    if (message.type === "jump") {
      applyJump(message.playerId);
    }

    if (message.type === "attack") {
      applyAttack(message.playerId);
    }
  });

  connection.on("close", () => {
    const playerId = [...appState.connections.entries()].find(([, conn]) => conn === connection)?.[0];
    if (playerId) {
      appState.connections.delete(playerId);
      appState.players.delete(playerId);
      maybeDeclareWinner();
      broadcastState();
    }
  });
}

function startHostMode() {
  appState.mode = "host";
  el.hostView.classList.remove("hidden");
  el.playerView.classList.add("hidden");
  status("正在建立戰場...");

  const peer = new window.Peer();
  appState.peer = peer;

  peer.on("open", async (id) => {
    appState.peerId = id;
    appState.joinCode = randomRoomCode(id);
    appState.joinUrl = buildJoinUrl(id);
    el.roomCode.textContent = appState.joinCode;
    el.joinUrl.textContent = appState.joinUrl;
    status("戰場建立成功，讓大家掃 QR Code 加入。");
    renderBattleArena([]);
    updateHostUx(0, 0);
    await renderQrCode(appState.joinUrl);
  });

  peer.on("connection", (connection) => {
    registerConnection(connection);
  });

  peer.on("error", (error) => {
    status(`連線發生問題：${error.type || "unknown error"}`);
  });
}

function startPlayerMode(hostId) {
  appState.mode = "player";
  el.hostView.classList.add("hidden");
  el.playerView.classList.remove("hidden");
  setupAvatarPicker();
  status("輸入名字、選頭像後，就能加入戰場。");
  updatePlayerUxMeta();

  const peer = new window.Peer();
  appState.peer = peer;

  peer.on("open", () => {
    const connection = peer.connect(hostId, { reliable: true });
    appState.hostConnection = connection;

    connection.on("open", () => {
      status("已連上房主，準備加入戰場。");
      el.joinButton.disabled = false;
      updatePlayerUxMeta();
    });

    connection.on("data", (message) => {
      if (!message || typeof message !== "object") return;

      if (message.type === "joined") {
        appState.joinRequested = false;
        appState.localPlayer = message.player;
        appState.localPlayerSnapshot = message.players;
        appState.gamePhase = message.gamePhase || "lobby";
        appState.countdownValue = message.countdownValue || "";
        appState.winnerId = message.winnerId;
        el.joinPanel.classList.add("hidden");
        el.controllerPanel.classList.remove("hidden");
        el.playerGreeting.textContent = `${message.player.name}，準備開打`;
        renderPlayerPreview(message.player);
        appState.lastPhysicsAt = 0;
        updatePlayerStatus();
        updatePlayerUxMeta();
        el.joinButton.textContent = "加入戰場";
        status("加入成功，等待亂鬥開始。");
      }

      if (message.type === "state") {
        applyRemoteState(message);
      }

      if (message.type === "winner") {
        appState.winnerId = message.winnerId;
        playVictoryFanfare();
        updatePlayerStatus();
        updatePlayerUxMeta();
      }
    });

    connection.on("close", () => {
      appState.joinRequested = false;
      status("與房主的連線中斷了，請重新掃碼加入。");
      el.leftButton.disabled = true;
      el.rightButton.disabled = true;
      el.jumpButton.disabled = true;
      el.attackButton.disabled = true;
      el.joinButton.disabled = true;
      el.joinButton.textContent = "重新加入";
      updatePlayerUxMeta();
      updateRoundBanner();
    });
  });

  peer.on("error", (error) => {
    status(`加入失敗：${error.type || "unknown error"}`);
  });
}

function wireEvents() {
  el.copyLinkButton.addEventListener("click", async () => {
    if (!appState.joinUrl) return;
    try {
      await navigator.clipboard.writeText(appState.joinUrl);
      status("加入連結已複製。");
    } catch (_error) {
      status("無法自動複製，請手動複製畫面上的加入網址。");
    }
  });

  el.startRaceButton.addEventListener("click", () => {
    getAudioContext();
    if (appState.players.size < 2) {
      status("至少要 2 位玩家才能開始。");
      return;
    }
    startBattleCountdown();
    status("倒數開始，準備開打！");
  });

  el.resetRaceButton.addEventListener("click", () => {
    resetBattle();
    status("本局已重設，玩家可以準備下一場。");
  });

  el.joinButton.disabled = true;
  el.joinButton.addEventListener("click", () => {
    if (appState.joinRequested || !appState.hostConnection?.open) return;
    const name = el.playerName.value.trim() || "Player";
    const avatar = getAvatarById(appState.selectedAvatarId);
    getAudioContext();
    appState.joinRequested = true;
    el.joinButton.disabled = true;
    el.joinButton.textContent = "加入中...";
    appState.hostConnection.send({
      type: "join",
      player: {
        id: appState.playerId,
        name,
        avatarId: avatar.id
      }
    });
    status("正在送出加入請求...");
    updatePlayerUxMeta();
  });

  el.tutorialCloseButton?.addEventListener("click", closeTutorial);
  el.tutorialOverlay?.addEventListener("click", (event) => {
    if (event.target === el.tutorialOverlay) {
      closeTutorial();
    }
  });

  const sendMove = (direction) => {
    if (!appState.hostConnection?.open || !appState.localPlayer) return;
    if (el.leftButton.disabled || el.rightButton.disabled || appState.gamePhase !== "battle") return;
    appState.hostConnection.send({ type: "move", playerId: appState.playerId, direction });
    playTone(direction === "left" ? 260 : 280, 0.03, "square", 0.03);
  };

  const sendMoveStop = (direction) => {
    if (!appState.hostConnection?.open || !appState.localPlayer) return;
    appState.hostConnection.send({ type: "move-stop", playerId: appState.playerId, direction });
  };

  const sendJump = () => {
    if (!appState.hostConnection?.open || !appState.localPlayer || el.jumpButton.disabled) return;
    const now = Date.now();
    if (now - appState.lastLocalJumpAt < JUMP_COOLDOWN) return;
    appState.lastLocalJumpAt = now;
    optimisticJump();
    appState.hostConnection.send({ type: "jump", playerId: appState.playerId });
    playTone(720, 0.05, "square", 0.04);
  };

  const sendAttack = () => {
    if (!appState.hostConnection?.open || !appState.localPlayer || el.attackButton.disabled) return;
    const now = Date.now();
    if (now - appState.lastLocalAttackAt < ATTACK_COOLDOWN) return;
    appState.lastLocalAttackAt = now;
    optimisticAttack();
    appState.hostConnection.send({ type: "attack", playerId: appState.playerId });
    playTone(340, 0.07, "sawtooth", 0.05);
  };

  const bindMoveButton = (button, direction) => {
    button.addEventListener("pointerdown", (event) => startMoveHold(event, direction, sendMove, sendMoveStop));
    const releaseMove = () => stopMoveHold(sendMoveStop);
    button.addEventListener("pointerup", releaseMove);
    button.addEventListener("pointercancel", releaseMove);
    button.addEventListener("pointerleave", releaseMove);
    button.addEventListener("lostpointercapture", releaseMove);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  };

  bindMoveButton(el.leftButton, "left");
  bindMoveButton(el.rightButton, "right");
  el.jumpButton.addEventListener("pointerdown", sendJump);
  el.attackButton.addEventListener("pointerdown", sendAttack);
  window.addEventListener("pointerup", () => stopMoveHold(sendMoveStop));
  window.addEventListener("pointercancel", () => stopMoveHold(sendMoveStop));
}

function init() {
  wireEvents();
  renderCountdownOverlay();
  startRenderLoop();
  updateHostUx(0, 0);
  updatePlayerUxMeta();
  updateRoundBanner();
  maybeShowTutorial();

  const params = new URLSearchParams(window.location.search);
  const join = params.get("join");

  if (join) {
    startPlayerMode(join);
  } else {
    startHostMode();
  }
}

init();
