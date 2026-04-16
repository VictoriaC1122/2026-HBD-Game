const CONFIG = {
  maxPlayers: 50,
  worldWidth: 100,
  roundSeconds: 120,
  syncMs: 66,
  lobbyRenderMs: 250,
  staleMs: 18_000,
  physicsStep: 1000 / 60,
  gravity: 0.042,
  runAccel: 0.032,
  maxSpeed: 0.55,
  friction: 0.86,
  jumpVelocity: 1.42,
  attackRange: 7.6,
  attackArcMs: 230,
  attackCooldownMs: 620,
  hitStunMs: 280,
  inputMinMs: 45
};

const PHASE = {
  LOBBY: "lobby",
  COUNTDOWN: "countdown",
  BATTLE: "battle",
  FINISHED: "finished"
};

const AVATARS = [
  { id: "rose", name: "Crimson Warrior", title: "烈焰劍冠", color: "#ff5f86", accent: "#ffd166", weapon: "劍" },
  { id: "mint", name: "Mint Archer", title: "風息弓姬", color: "#4bd6a4", accent: "#d8fff0", weapon: "弓" },
  { id: "pixel", name: "Amber Thief", title: "流光影刃", color: "#ff9f43", accent: "#fff0bf", weapon: "匕首" },
  { id: "nova", name: "Sky Knight", title: "蒼穹騎士", color: "#6aa7ff", accent: "#e3efff", weapon: "槍" },
  { id: "mango", name: "Moss Lancer", title: "叢林槍鋒", color: "#c4d94c", accent: "#fff6a4", weapon: "長槍" },
  { id: "aqua", name: "Wave Pirate", title: "潮汐船長", color: "#43d7f5", accent: "#dff9ff", weapon: "彎刀" },
  { id: "cocoa", name: "Cocoa Boxer", title: "拳風鬥士", color: "#b57a50", accent: "#ffe0c2", weapon: "拳套" },
  { id: "violet", name: "Violet Wizard", title: "星塵法皇", color: "#a77cff", accent: "#efe2ff", weapon: "法杖" },
  { id: "pearl", name: "Sun Priest", title: "晨曦祭司", color: "#ffbc70", accent: "#fff0d5", weapon: "聖鈴" },
  { id: "leaf", name: "Leaf Hunter", title: "森語獵手", color: "#7bc85a", accent: "#eefbd9", weapon: "短弓" },
  { id: "ember", name: "Ember Assassin", title: "燼火刺客", color: "#ff744f", accent: "#ffe1d8", weapon: "雙刃" },
  { id: "glow", name: "Nova Mechanic", title: "新星機匠", color: "#77ecff", accent: "#e2fdff", weapon: "機械拳" }
];

const PLATFORMS = [
  { id: "ground", x: 0, y: 0, w: 100, h: 8 },
  { id: "mush-left", x: 10, y: 25, w: 22, h: 4 },
  { id: "bridge", x: 38, y: 36, w: 24, h: 4 },
  { id: "tree-right", x: 68, y: 29, w: 24, h: 4 },
  { id: "high-left", x: 24, y: 53, w: 16, h: 4 },
  { id: "high-right", x: 76, y: 49, w: 17, h: 4 }
];

const el = {
  hostView: document.querySelector("#hostView"),
  playerView: document.querySelector("#playerView"),
  toast: document.querySelector("#toast"),
  qrCode: document.querySelector("#qrCode"),
  roomCode: document.querySelector("#roomCode"),
  joinUrl: document.querySelector("#joinUrl"),
  playerCount: document.querySelector("#playerCount"),
  hudMode: document.querySelector("#hudMode"),
  hudAlive: document.querySelector("#hudAlive"),
  hudTimer: document.querySelector("#hudTimer"),
  hostLeader: document.querySelector("#hostLeader"),
  raceSummary: document.querySelector("#raceSummary"),
  playerGrid: document.querySelector("#playerGrid"),
  lobbySummary: document.querySelector("#lobbySummary"),
  battleFeed: document.querySelector("#battleFeed"),
  arenaCanvas: document.querySelector("#arenaCanvas"),
  countdownOverlay: document.querySelector("#countdownOverlay"),
  countdownNumber: document.querySelector("#countdownNumber"),
  countdownLabel: document.querySelector("#countdownLabel"),
  winnerOverlay: document.querySelector("#winnerOverlay"),
  startGameButton: document.querySelector("#startGameButton"),
  playAgainButton: document.querySelector("#playAgainButton"),
  resetGameButton: document.querySelector("#resetGameButton"),
  copyLinkButton: document.querySelector("#copyLinkButton"),
  soundToggleButton: document.querySelector("#soundToggleButton"),
  cleanupButton: document.querySelector("#cleanupButton"),
  maxPlayersInput: document.querySelector("#maxPlayersInput"),
  phaseSelect: document.querySelector("#phaseSelect"),
  joinPanel: document.querySelector("#joinPanel"),
  controllerPanel: document.querySelector("#controllerPanel"),
  playerName: document.querySelector("#playerName"),
  avatarPicker: document.querySelector("#avatarPicker"),
  selectedAvatarName: document.querySelector("#selectedAvatarName"),
  joinButton: document.querySelector("#joinButton"),
  playerConnectionChip: document.querySelector("#playerConnectionChip"),
  playerGreeting: document.querySelector("#playerGreeting"),
  playerStatusSummary: document.querySelector("#playerStatusSummary"),
  playerRoundBanner: document.querySelector("#playerRoundBanner"),
  playerPreviewCanvas: document.querySelector("#playerPreviewCanvas"),
  leftButton: document.querySelector("#leftButton"),
  rightButton: document.querySelector("#rightButton"),
  jumpButton: document.querySelector("#jumpButton"),
  attackButton: document.querySelector("#attackButton"),
  attackCooldown: document.querySelector("#attackCooldown")
};

const state = {
  mode: "host",
  peer: null,
  serverSocket: null,
  serverUrl: "",
  hostConnection: null,
  roomId: "",
  roomCode: "",
  joinUrl: "",
  phase: PHASE.LOBBY,
  players: new Map(),
  connections: new Map(),
  selectedAvatarId: AVATARS[0].id,
  localPlayerId: getOrCreateClientId(),
  snapshot: [],
  countdownValue: "",
  winnerId: "",
  feed: [],
  sound: true,
  maxPlayers: CONFIG.maxPlayers,
  roundStartedAt: 0,
  lastSyncAt: 0,
  lastFrameAt: 0,
  lastLobbyRenderAt: 0,
  lastInputSentAt: 0,
  input: { left: false, right: false },
  audio: null,
  dirtyLobby: true,
  dirtyHud: true,
  dirtyFeed: true,
  dirtyWinner: true,
  lastPlayerGridHtml: "",
  lastFeedHtml: ""
};

const hostCtx = el.arenaCanvas?.getContext("2d");
const previewCtx = el.playerPreviewCanvas?.getContext("2d");

function getOrCreateClientId() {
  try {
    const key = "birthday-battle-client-id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  } catch (_error) {
    return crypto.randomUUID();
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

function avatarById(id) {
  return AVATARS.find((avatar) => avatar.id === id) || AVATARS[0];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setText(target, text) {
  if (!target) return;
  const next = String(text);
  if (target.textContent !== next) target.textContent = next;
}

function setVisible(target, visible) {
  target?.classList.toggle("hidden", !visible);
}

function setStatus(title, detail) {
  if (!el.playerStatusSummary) return;
  const html = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
  if (el.playerStatusSummary.innerHTML !== html) el.playerStatusSummary.innerHTML = html;
}

function toast(message) {
  setText(el.toast, message);
  el.toast?.classList.remove("hidden");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.toast?.classList.add("hidden"), 2200);
}

function addFeed(message, tone = "info") {
  state.feed.unshift({ id: crypto.randomUUID(), message, tone, at: Date.now() });
  state.feed = state.feed.slice(0, 8);
  state.dirtyFeed = true;
}

function getAudio() {
  if (!state.sound) return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!state.audio) state.audio = new Ctx();
  if (state.audio.state === "suspended") state.audio.resume();
  return state.audio;
}

function tone(freq, dur = 0.08, type = "square", gainValue = 0.04) {
  const ctx = getAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function chord(notes) {
  notes.forEach(([freq, delay, dur]) => window.setTimeout(() => tone(freq, dur, "triangle", 0.05), delay));
}

function vibration(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function buildJoinUrl(hostId) {
  const url = new URL(window.location.href);
  url.searchParams.set("join", hostId);
  url.searchParams.delete("room");
  return url.toString();
}

function buildServerJoinUrl(serverUrl, room) {
  const url = new URL(window.location.href);
  url.searchParams.delete("join");
  url.searchParams.set("server", serverUrl);
  url.searchParams.set("room", room);
  return url.toString();
}

function roomCodeFromId(id) {
  return id.slice(-6).toUpperCase();
}

function renderQrFallback(url) {
  if (!el.qrCode) return;
  el.qrCode.innerHTML = "";
  const image = document.createElement("img");
  image.src = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=260`;
  image.alt = "Scan to join";
  image.width = 260;
  image.height = 260;
  image.onerror = () => {
    el.qrCode.textContent = "QR 載入失敗，請使用加入連結。";
  };
  el.qrCode.append(image);
}

async function renderQr(url) {
  if (!el.qrCode) return;
  el.qrCode.innerHTML = "";
  const qr = window.QRCode || globalThis.QRCode;
  if (qr?.toDataURL) {
    try {
      const dataUrl = await qr.toDataURL(url, { width: 260, margin: 1 });
      const image = document.createElement("img");
      image.src = dataUrl;
      image.alt = "Scan to join";
      image.width = 260;
      image.height = 260;
      el.qrCode.append(image);
      return;
    } catch (_error) {
    }
  }
  renderQrFallback(url);
}

function avatarBadge(avatar) {
  return `
    <span class="mini-avatar" style="--c:${avatar.color}; --a:${avatar.accent}">
      <i></i>
    </span>
  `;
}

function setupAvatarPicker() {
  if (!el.avatarPicker) return;
  el.avatarPicker.innerHTML = AVATARS.map((avatar) => `
    <button class="avatar-option ${avatar.id === state.selectedAvatarId ? "selected" : ""}" data-avatar="${avatar.id}" type="button">
      ${avatarBadge(avatar)}
      <strong>${escapeHtml(avatar.name)}</strong>
      <span>${escapeHtml(avatar.weapon)}</span>
    </button>
  `).join("");
  setText(el.selectedAvatarName, avatarById(state.selectedAvatarId).name);
  el.avatarPicker.querySelectorAll("[data-avatar]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAvatarId = button.dataset.avatar;
      setupAvatarPicker();
    });
  });
}

function createPlayer(payload, connection) {
  const avatar = avatarById(payload.avatarId);
  const index = state.players.size;
  return {
    id: payload.id,
    name: String(payload.name || "Player").slice(0, 16),
    avatarId: avatar.id,
    x: 10 + (index % 10) * 8.5,
    y: 8,
    vx: 0,
    vy: 0,
    dir: index % 2 ? -1 : 1,
    hp: 100,
    dead: false,
    ready: true,
    connected: Boolean(connection?.open),
    lastSeen: Date.now(),
    input: { left: false, right: false },
    attackUntil: 0,
    hitUntil: 0,
    lastAttackAt: 0,
    lastJumpAt: 0,
    stats: { hits: 0, eliminations: 0, damage: 0, survivedMs: 0 }
  };
}

function compactPlayer(player) {
  return {
    id: player.id,
    n: player.name,
    a: player.avatarId,
    x: Number(player.x.toFixed(2)),
    y: Number(player.y.toFixed(2)),
    h: player.hp,
    d: player.dir,
    dead: player.dead,
    c: player.connected,
    atk: player.attackUntil,
    hit: player.hitUntil,
    r: player.ready,
    s: player.stats
  };
}

function snapshot() {
  return {
    t: "state",
    phase: state.phase,
    countdown: state.countdownValue,
    winnerId: state.winnerId,
    maxPlayers: state.maxPlayers,
    roomCode: state.roomCode,
    startedAt: state.roundStartedAt,
    feed: state.feed.slice(0, 5),
    players: [...state.players.values()].map(compactPlayer)
  };
}

function send(connection, message) {
  if (connection?.open) connection.send(message);
}

function sendServer(message) {
  if (state.serverSocket?.readyState === WebSocket.OPEN) {
    state.serverSocket.send(JSON.stringify(message));
  }
}

function broadcast(message) {
  state.connections.forEach((connection) => send(connection, message));
}

function broadcastSnapshot(force = false) {
  const now = Date.now();
  if (!force && now - state.lastSyncAt < CONFIG.syncMs) return;
  state.lastSyncAt = now;
  const roomState = snapshot();
  if (state.serverSocket?.readyState === WebSocket.OPEN && state.mode === "host") {
    sendServer({ t: "host-state", room: state.roomCode, state: roomState });
  }
  broadcast(roomState);
}

function registerConnection(connection) {
  connection.on("data", (message) => handleHostMessage(connection, message));
  connection.on("close", () => {
    const entry = [...state.connections.entries()].find(([, conn]) => conn === connection);
    if (!entry) return;
    const player = state.players.get(entry[0]);
    if (player) {
      player.connected = false;
      player.input.left = false;
      player.input.right = false;
      addFeed(`${player.name} disconnected`, "warn");
    }
    state.connections.delete(entry[0]);
    state.dirtyLobby = true;
    broadcastSnapshot(true);
  });
}

function handleHostMessage(connection, message) {
  if (!message || typeof message !== "object") return;
  if (message.t === "client-event") {
    handleHostMessage(connection, { ...message.event, id: message.id });
    return;
  }
  if (message.t === "player-joined") {
    const playerPayload = message.player;
    if (!playerPayload?.id) return;
    const player = state.players.get(playerPayload.id) || createPlayer(playerPayload, connection);
    player.connected = true;
    player.lastSeen = Date.now();
    player.name = String(playerPayload.name || player.name).slice(0, 16);
    player.avatarId = avatarById(playerPayload.avatarId).id;
    state.players.set(player.id, player);
    addFeed(`${player.name} joined the arena`, "join");
    state.dirtyLobby = true;
    broadcastSnapshot(true);
    return;
  }
  if (message.t === "player-disconnected") {
    const player = state.players.get(message.id);
    if (player) {
      player.connected = false;
      player.input.left = false;
      player.input.right = false;
      addFeed(`${player.name} disconnected`, "warn");
      state.dirtyLobby = true;
      broadcastSnapshot(true);
    }
    return;
  }
  const now = Date.now();

  if (message.t === "join") {
    if (!message.p?.id) return;
    if (!state.players.has(message.p.id) && state.players.size >= state.maxPlayers) {
      send(connection, { t: "join-rejected", reason: "ROOM_FULL" });
      return;
    }
    const player = state.players.get(message.p.id) || createPlayer(message.p, connection);
    player.connected = true;
    player.lastSeen = now;
    player.avatarId = avatarById(message.p.avatarId).id;
    player.name = String(message.p.name || player.name).slice(0, 16);
    state.players.set(player.id, player);
    state.connections.set(player.id, connection);
    send(connection, { t: "joined", you: player.id, state: snapshot() });
    addFeed(`${player.name} joined the arena`, "join");
    state.dirtyLobby = true;
    broadcastSnapshot(true);
    tone(660, 0.06);
    return;
  }

  if (message.t === "input") {
    const player = state.players.get(message.id);
    if (!player || player.dead) return;
    player.lastSeen = now;
    player.connected = true;
    const input = message.i || {};
    player.input.left = Boolean(input.left);
    player.input.right = Boolean(input.right);
    if (input.jump) tryJump(player, now);
    if (input.attack) tryAttack(player, now);
  }

  if (message.t === "heartbeat") {
    const player = state.players.get(message.id);
    if (player) {
      player.lastSeen = now;
      player.connected = true;
    }
  }
}

function resetRound(nextPhase = PHASE.LOBBY) {
  state.phase = nextPhase;
  state.winnerId = "";
  state.countdownValue = "";
  state.roundStartedAt = 0;
  [...state.players.values()].forEach((player, index) => {
    player.x = 8 + (index % 12) * 7.4;
    player.y = 8;
    player.vx = 0;
    player.vy = 0;
    player.hp = 100;
    player.dead = false;
    player.dir = index % 2 ? -1 : 1;
    player.attackUntil = 0;
    player.hitUntil = 0;
    player.input.left = false;
    player.input.right = false;
    player.stats = { hits: 0, eliminations: 0, damage: 0, survivedMs: 0 };
  });
  addFeed("Round reset. Get ready.", "info");
  state.dirtyHud = true;
  state.dirtyLobby = true;
  state.dirtyWinner = true;
  broadcastSnapshot(true);
}

function startCountdown() {
  if (state.players.size < 2) {
    toast("至少需要 2 位玩家才能開始。");
    return;
  }
  resetRound(PHASE.COUNTDOWN);
  const steps = ["3", "2", "1", "FIGHT"];
  let index = 0;
  const next = () => {
    state.phase = PHASE.COUNTDOWN;
    state.countdownValue = steps[index];
    state.dirtyHud = true;
    broadcastSnapshot(true);
    tone(index < 3 ? 440 : 760, index < 3 ? 0.08 : 0.18);
    if (index >= steps.length - 1) {
      window.setTimeout(() => {
        state.phase = PHASE.BATTLE;
        state.countdownValue = "";
        state.roundStartedAt = Date.now();
        addFeed("Battle started", "info");
        broadcastSnapshot(true);
      }, 650);
      return;
    }
    index += 1;
    window.setTimeout(next, 820);
  };
  next();
}

function forcePhase(phase) {
  if (phase === PHASE.COUNTDOWN) {
    startCountdown();
    return;
  }
  if (phase === PHASE.BATTLE) {
    resetRound(PHASE.BATTLE);
    state.roundStartedAt = Date.now();
  } else if (phase === PHASE.FINISHED) {
    state.phase = PHASE.FINISHED;
  } else {
    resetRound(PHASE.LOBBY);
  }
  broadcastSnapshot(true);
}

function cleanupInactive() {
  const now = Date.now();
  let removed = 0;
  [...state.players.entries()].forEach(([id, player]) => {
    if (!player.connected || now - player.lastSeen > CONFIG.staleMs) {
      state.players.delete(id);
      state.connections.delete(id);
      removed += 1;
    }
  });
  if (removed) addFeed(`Removed ${removed} inactive player${removed > 1 ? "s" : ""}`, "warn");
  state.dirtyLobby = true;
  broadcastSnapshot(true);
}

function kickPlayer(id) {
  const player = state.players.get(id);
  if (!player) return;
  send(state.connections.get(id), { t: "kicked" });
  state.connections.get(id)?.close?.();
  state.connections.delete(id);
  state.players.delete(id);
  addFeed(`${player.name} removed from room`, "warn");
  state.dirtyLobby = true;
  broadcastSnapshot(true);
}

function tryJump(player, now) {
  if (state.phase !== PHASE.BATTLE || player.dead || now - player.lastJumpAt < 520 || player.y > 9.2) return;
  player.lastJumpAt = now;
  player.vy = CONFIG.jumpVelocity;
}

function tryAttack(attacker, now) {
  if (state.phase !== PHASE.BATTLE || attacker.dead || now - attacker.lastAttackAt < CONFIG.attackCooldownMs) return;
  attacker.lastAttackAt = now;
  attacker.attackUntil = now + CONFIG.attackArcMs;
  let didHit = false;
  [...state.players.values()].forEach((target) => {
    if (target.id === attacker.id || target.dead) return;
    if (Math.abs(target.y - attacker.y) > 9) return;
    const dx = target.x - attacker.x;
    if (Math.sign(dx || attacker.dir) !== attacker.dir) return;
    if (Math.abs(dx) > CONFIG.attackRange) return;
    const damage = Math.floor(15 + Math.random() * 14);
    target.hp = Math.max(0, target.hp - damage);
    target.hitUntil = now + CONFIG.hitStunMs;
    target.vx += attacker.dir * 0.7;
    target.vy = Math.max(target.vy, 0.25);
    attacker.stats.hits += 1;
    attacker.stats.damage += damage;
    didHit = true;
    addFeed(`${attacker.name} hit ${target.name} for ${damage}`, "hit");
    send(state.connections.get(attacker.id), { t: "hit-confirm", target: target.name, damage });
    send(state.connections.get(target.id), { t: "got-hit", from: attacker.name, damage });
    if (target.hp <= 0 && !target.dead) {
      target.dead = true;
      target.input.left = false;
      target.input.right = false;
      attacker.stats.eliminations += 1;
      addFeed(`${target.name} was eliminated by ${attacker.name}`, "ko");
      send(state.connections.get(target.id), { t: "eliminated", by: attacker.name });
      chord([[180, 0, 0.08], [120, 70, 0.1]]);
    }
  });
  if (didHit) {
    tone(210, 0.05, "sawtooth", 0.05);
    vibration([20, 20, 35]);
  } else {
    tone(420, 0.035, "triangle", 0.025);
  }
  checkWinner();
  broadcastSnapshot(true);
}

function checkWinner() {
  if (state.phase !== PHASE.BATTLE) return;
  const alive = [...state.players.values()].filter((player) => !player.dead);
  if (alive.length === 1 && state.players.size > 1) {
    state.winnerId = alive[0].id;
    state.phase = PHASE.FINISHED;
    alive[0].stats.survivedMs = Date.now() - state.roundStartedAt;
    addFeed(`${alive[0].name} wins the round`, "win");
    state.dirtyWinner = true;
    chord([[523, 0, 0.12], [659, 110, 0.12], [784, 220, 0.18], [1046, 360, 0.24]]);
    broadcast({ t: "winner", id: alive[0].id, name: alive[0].name });
  }
}

function groundForX(x) {
  const platform = PLATFORMS
    .filter((p) => x >= p.x && x <= p.x + p.w)
    .sort((a, b) => b.y - a.y)[0];
  return platform ? platform.y + pHeight(platform) : 8;
}

function pHeight(platform) {
  return platform.id === "ground" ? 0 : platform.h;
}

function simulateHost(now) {
  if (!state.lastFrameAt) state.lastFrameAt = now;
  const dt = Math.min(2.5, (now - state.lastFrameAt) / 16.67);
  state.lastFrameAt = now;
  if (state.phase !== PHASE.BATTLE) return;

  const elapsed = Math.floor((now - state.roundStartedAt) / 1000);
  if (elapsed >= CONFIG.roundSeconds) {
    const alive = [...state.players.values()].filter((player) => !player.dead);
    alive.sort((a, b) => b.hp - a.hp);
    state.winnerId = alive[0]?.id || "";
    state.phase = PHASE.FINISHED;
    addFeed(`${alive[0]?.name || "No one"} wins by time`, "win");
    state.dirtyWinner = true;
    broadcastSnapshot(true);
    return;
  }

  [...state.players.values()].forEach((player) => {
    if (player.dead) return;
    if (now - player.lastSeen > CONFIG.staleMs) {
      player.connected = false;
      player.input.left = false;
      player.input.right = false;
    }
    if (now < player.hitUntil) {
      player.vx *= 0.97;
    } else {
      const dir = Number(player.input.right) - Number(player.input.left);
      if (dir) {
        player.dir = dir;
        player.vx += dir * CONFIG.runAccel * dt;
      }
    }
    player.vx = clamp(player.vx, -CONFIG.maxSpeed, CONFIG.maxSpeed);
    player.x = clamp(player.x + player.vx * dt, 3, 97);
    player.vx *= Math.pow(CONFIG.friction, dt);
    player.vy -= CONFIG.gravity * dt;
    player.y += player.vy * dt;
    const ground = groundForX(player.x);
    if (player.y <= ground) {
      player.y = ground;
      player.vy = 0;
    }
  });
  checkWinner();
  broadcastSnapshot();
}

function updateHostHud(now) {
  const players = [...state.players.values()];
  const alive = players.filter((p) => !p.dead);
  const winner = state.players.get(state.winnerId);
  const remaining = state.phase === PHASE.BATTLE
    ? Math.max(0, CONFIG.roundSeconds - Math.floor((now - state.roundStartedAt) / 1000))
    : null;
  setText(el.playerCount, `${players.length} / ${state.maxPlayers}`);
  setText(el.hudMode, state.phase.toUpperCase());
  setText(el.hudAlive, alive.length);
  setText(el.hudTimer, remaining == null ? "--" : `${remaining}s`);
  setText(el.hostLeader, winner?.name || alive.sort((a, b) => b.hp - a.hp)[0]?.name || "等待中");
  setText(el.raceSummary, summaryText(players.length, alive.length));
  el.phaseSelect.value = state.phase;
  state.dirtyHud = false;
}

function summaryText(total, alive) {
  if (!total) return "等待玩家加入...";
  if (state.phase === PHASE.LOBBY) return `${total} 位玩家已加入，準備後開始。`;
  if (state.phase === PHASE.COUNTDOWN) return `倒數 ${state.countdownValue || ""}，手機輸入暫時鎖定。`;
  if (state.phase === PHASE.BATTLE) return `場上剩 ${alive} 人，戰鬥進行中。`;
  if (state.phase === PHASE.FINISHED) return "本局結束，準備下一局。";
  return "";
}

function renderLobby(now) {
  if (!state.dirtyLobby && now - state.lastLobbyRenderAt < CONFIG.lobbyRenderMs) return;
  state.lastLobbyRenderAt = now;
  const players = [...state.players.values()];
  setText(el.lobbySummary, `${players.length} joined`);
  el.playerGrid?.classList.toggle("empty-state", players.length === 0);
  const html = players.length
    ? players.map((player) => {
      const avatar = avatarById(player.avatarId);
      const status = player.connected ? (player.dead ? "out" : "ready") : "disconnected";
      return `
        <article class="player-tile ${status}" data-player="${escapeHtml(player.id)}">
          ${avatarBadge(avatar)}
          <div>
            <strong>${escapeHtml(player.name)}</strong>
            <span>${escapeHtml(avatar.name)} · ${status}</span>
          </div>
          <button class="kick-button" data-kick="${escapeHtml(player.id)}" title="Remove player">×</button>
        </article>
      `;
    }).join("")
    : "<p>玩家加入後會出現在這裡。</p>";
  if (state.lastPlayerGridHtml !== html && el.playerGrid) {
    el.playerGrid.innerHTML = html;
    state.lastPlayerGridHtml = html;
    el.playerGrid.querySelectorAll("[data-kick]").forEach((button) => {
      button.addEventListener("click", () => kickPlayer(button.dataset.kick));
    });
  }
  state.dirtyLobby = false;
}

function renderFeed() {
  if (!state.dirtyFeed || !el.battleFeed) return;
  const html = state.feed.length
    ? state.feed.map((item) => `<li class="${item.tone}">${escapeHtml(item.message)}</li>`).join("")
    : "<li>房間準備中，等待玩家掃碼加入。</li>";
  if (state.lastFeedHtml !== html) {
    el.battleFeed.innerHTML = html;
    state.lastFeedHtml = html;
  }
  state.dirtyFeed = false;
}

function renderWinnerOverlay() {
  const winner = state.players.get(state.winnerId);
  setVisible(el.winnerOverlay, state.phase === PHASE.FINISHED && winner);
  if (!winner || state.phase !== PHASE.FINISHED || !state.dirtyWinner) return;
  const avatar = avatarById(winner.avatarId);
  el.winnerOverlay.innerHTML = `
    <div class="winner-card" style="--winner:${avatar.color}; --accent:${avatar.accent}">
      ${avatarBadge(avatar)}
      <span>WINNER</span>
      <strong>${escapeHtml(winner.name)}</strong>
      <p>${escapeHtml(avatar.title)} · ${winner.stats.eliminations} KOs · ${winner.stats.hits} hits</p>
      <button id="winnerPlayAgain" class="primary-button">Play Again</button>
    </div>
  `;
  el.winnerOverlay.querySelector("#winnerPlayAgain")?.addEventListener("click", startCountdown);
  state.dirtyWinner = false;
}

function renderCountdown() {
  const visible = state.phase === PHASE.COUNTDOWN && state.countdownValue;
  setVisible(el.countdownOverlay, visible);
  if (!visible) return;
  setText(el.countdownNumber, state.countdownValue);
  setText(el.countdownLabel, state.countdownValue === "FIGHT" ? "BATTLE START" : "GET READY");
}

function worldToCanvas(x, y, canvas) {
  return {
    x: (x / CONFIG.worldWidth) * canvas.width,
    y: canvas.height - 74 - y * 7.4
  };
}

function drawArena(ctx, canvas, players, now, compact = false) {
  if (!ctx || !canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#a9e7ff");
  sky.addColorStop(0.48, "#f7f0ff");
  sky.addColorStop(1, "#66b567");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  drawBackground(ctx, w, h, now, compact);
  drawPlatforms(ctx, canvas);
  players.forEach((player, index) => drawPlayer(ctx, canvas, player, index, now, compact));
  drawForeground(ctx, w, h, compact);
}

function drawBackground(ctx, w, h, now, compact) {
  ctx.save();
  ctx.globalAlpha = compact ? 0.72 : 1;
  drawCloud(ctx, 110 + Math.sin(now / 1800) * 10, 80, 1.1);
  drawCloud(ctx, w - 220, 118, 0.82);
  drawCloud(ctx, w * 0.52, 54, 0.66);
  ctx.fillStyle = "#7ccf83";
  drawHill(ctx, -40, h - 166, 320, 170);
  drawHill(ctx, w - 360, h - 178, 410, 190);
  ctx.fillStyle = "#8b5f42";
  for (let i = 0; i < 5; i += 1) {
    drawHouse(ctx, 170 + i * 155, h - 178 + (i % 2) * 12, i);
  }
  ctx.restore();
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.beginPath();
  ctx.ellipse(x, y, 46 * s, 20 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 34 * s, y - 13 * s, 32 * s, 25 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 72 * s, y, 48 * s, 22 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHill(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, 0);
  ctx.fill();
}

function drawHouse(ctx, x, y, index) {
  ctx.fillStyle = index % 2 ? "#f9d29d" : "#ffd7e7";
  ctx.fillRect(x, y, 74, 58);
  ctx.fillStyle = index % 2 ? "#9e5fbb" : "#e66f77";
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 8);
  ctx.lineTo(x + 36, y - 36);
  ctx.lineTo(x + 82, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#73513d";
  ctx.fillRect(x + 28, y + 24, 18, 34);
}

function drawPlatforms(ctx, canvas) {
  PLATFORMS.forEach((platform) => {
    const left = (platform.x / 100) * canvas.width;
    const top = canvas.height - 74 - platform.y * 7.4;
    const width = (platform.w / 100) * canvas.width;
    const height = platform.id === "ground" ? 52 : 24;
    ctx.fillStyle = platform.id === "ground" ? "#4f8e4e" : "#8b5f3f";
    roundRect(ctx, left, top, width, height, 16);
    ctx.fill();
    ctx.fillStyle = platform.id === "ground" ? "#7ad46d" : "#e1b071";
    roundRect(ctx, left, top, width, 12, 14);
    ctx.fill();
  });
}

function drawForeground(ctx, w, h, compact) {
  if (compact) return;
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 97) % w;
    const y = h - 48 - (i % 3) * 4;
    ctx.fillStyle = i % 2 ? "#ff7ab0" : "#fff07a";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d8a47";
    ctx.fillRect(x - 1, y + 4, 2, 11);
  }
}

function drawPlayer(ctx, canvas, player, index, now, compact) {
  const avatar = avatarById(player.avatarId || player.a);
  const x = player.x;
  const y = player.y ?? 8;
  const hp = player.hp ?? player.h ?? 100;
  const dead = Boolean(player.dead);
  const dir = player.dir ?? player.d ?? 1;
  const atk = player.attackUntil ?? player.atk ?? 0;
  const hit = player.hitUntil ?? player.hit ?? 0;
  const pos = worldToCanvas(x, y, canvas);
  const size = compact ? 20 : 27;
  const bob = dead ? 0 : Math.sin(now / 130 + index) * 2;
  ctx.save();
  ctx.translate(pos.x, pos.y + bob);
  ctx.globalAlpha = dead ? 0.38 : 1;

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, size + 7, size * 0.8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (atk > now && !compact) {
    ctx.strokeStyle = avatar.accent;
    ctx.lineWidth = 10;
    ctx.shadowBlur = 18;
    ctx.shadowColor = avatar.color;
    ctx.beginPath();
    ctx.arc(dir > 0 ? 24 : -24, -4, 35, dir > 0 ? -0.8 : Math.PI - 0.8, dir > 0 ? 0.8 : Math.PI + 0.8);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = avatar.color;
  roundRect(ctx, -size * 0.62, -size * 0.1, size * 1.24, size * 1.35, 12);
  ctx.fill();
  ctx.fillStyle = avatar.accent;
  roundRect(ctx, -size * 0.42, size * 0.28, size * 0.84, size * 0.3, 8);
  ctx.fill();
  ctx.fillStyle = "#ffe4c7";
  ctx.beginPath();
  ctx.arc(0, -size * 0.56, size * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = avatar.color;
  ctx.beginPath();
  ctx.arc(-2 * dir, -size * 0.78, size * 0.6, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#25314f";
  ctx.fillRect(-6 * dir, -size * 0.58, 3, 3);
  ctx.fillRect(7 * dir, -size * 0.58, 3, 3);

  if (hit > now) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    ctx.strokeRect(-size * 0.85, -size * 1.1, size * 1.7, size * 2.1);
  }

  ctx.restore();

  if (!compact) {
    drawPlayerHud(ctx, pos.x, pos.y, player.name || player.n, hp, dead);
  }
}

function drawPlayerHud(ctx, x, y, name, hp, dead) {
  ctx.save();
  ctx.font = "800 14px Outfit, Noto Sans TC, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(28,26,44,0.62)";
  ctx.fillStyle = "#fff";
  ctx.strokeText(name, x, y - 52);
  ctx.fillText(name, x, y - 52);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  roundRect(ctx, x - 36, y - 46, 72, 9, 6);
  ctx.fill();
  ctx.fillStyle = dead ? "#798094" : hp > 45 ? "#5ee28b" : hp > 20 ? "#ffd166" : "#ff5f75";
  roundRect(ctx, x - 36, y - 46, 72 * Math.max(0, hp) / 100, 9, 6);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hostLoop(now) {
  simulateHost(now);
  const players = [...state.players.values()];
  const compact = players.length >= 30;
  drawArena(hostCtx, el.arenaCanvas, players, now, compact);
  if (state.dirtyHud || state.phase === PHASE.BATTLE || now - state.lastLobbyRenderAt > CONFIG.lobbyRenderMs) updateHostHud(now);
  renderLobby(now);
  renderFeed();
  renderCountdown();
  renderWinnerOverlay();
  window.requestAnimationFrame(hostLoop);
}

function updateFromSnapshot(roomState) {
  state.phase = roomState.phase || PHASE.LOBBY;
  state.countdownValue = roomState.countdown || "";
  state.winnerId = roomState.winnerId || "";
  state.maxPlayers = roomState.maxPlayers || CONFIG.maxPlayers;
  state.roomCode = roomState.roomCode || state.roomCode;
  state.roundStartedAt = roomState.startedAt || 0;
  state.snapshot = Array.isArray(roomState.players) ? roomState.players : [];
  state.feed = Array.isArray(roomState.feed) ? roomState.feed : state.feed;
}

function localPlayer() {
  return state.snapshot.find((player) => player.id === state.localPlayerId);
}

function renderPlayerUi(now) {
  const me = localPlayer();
  const connected = Boolean(state.hostConnection?.open);
  el.playerConnectionChip?.classList.toggle("offline", !connected);
  setText(el.playerConnectionChip, connected ? "CONNECTED" : "RECONNECT");
  if (!me) {
    setStatus(connected ? "READY" : "RECONNECT", connected ? "選角色後加入戰場。" : "和房主斷線，請重新掃碼。");
    setControls(false);
    return;
  }
  const avatar = avatarById(me.a);
  setText(el.playerGreeting, `${me.n} · ${avatar.weapon}`);
  const out = Boolean(me.dead);
  const active = connected && state.phase === PHASE.BATTLE && !out;
  setControls(active);
  if (state.phase === PHASE.COUNTDOWN) setStatus("COUNTDOWN", `倒數 ${state.countdownValue || ""}，準備拇指位置。`);
  else if (out) setStatus("OUT", "你已經被淘汰，等下一局再戰。");
  else if (state.phase === PHASE.BATTLE) setStatus("BATTLE", `HP ${me.h}，左右移動、跳躍、靠近攻擊。`);
  else if (state.phase === PHASE.FINISHED) setStatus("RESULT", state.winnerId === me.id ? "你贏了！等房主再開一局。" : "本局結束，等房主再開一局。");
  else setStatus("WAITING", "已加入房間，等房主開始。");

  setVisible(el.playerRoundBanner, state.phase === PHASE.FINISHED || out);
  if (state.phase === PHASE.FINISHED) {
    const winner = state.snapshot.find((p) => p.id === state.winnerId);
    el.playerRoundBanner.innerHTML = `<strong>${escapeHtml(winner?.n || "本局結束")}</strong><span>等待房主按下再來一局。</span>`;
  } else if (out) {
    el.playerRoundBanner.innerHTML = "<strong>OUT</strong><span>你已淘汰，現在可以幫朋友加油。</span>";
  }

  const cooldown = Math.max(0, ((me.lastAttackAt || 0) + CONFIG.attackCooldownMs - now) / CONFIG.attackCooldownMs);
  el.attackCooldown?.style.setProperty("--cooldown", `${cooldown * 100}%`);
  drawArena(previewCtx, el.playerPreviewCanvas, [me], now, true);
  renderCountdown();
  window.requestAnimationFrame(renderPlayerUi);
}

function setControls(enabled) {
  [el.leftButton, el.rightButton, el.jumpButton, el.attackButton].forEach((button) => {
    if (button && button.disabled === enabled) button.disabled = !enabled;
  });
}

function sendInput(extra = {}) {
  const now = Date.now();
  const urgent = extra.jump || extra.attack;
  if (!urgent && now - state.lastInputSentAt < CONFIG.inputMinMs) return;
  state.lastInputSentAt = now;
  const inputMessage = {
    t: "input",
    id: state.localPlayerId,
    i: {
      left: state.input.left,
      right: state.input.right,
      ...extra
    }
  };
  if (state.serverSocket?.readyState === WebSocket.OPEN) {
    sendServer({ t: "client-event", room: state.roomCode, id: state.localPlayerId, event: inputMessage });
    return;
  }
  send(state.hostConnection, inputMessage);
}

function bindControllerButton(button, onDown, onUp) {
  if (!button) return;
  const down = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    button.classList.add("pressed");
    button.setPointerCapture?.(event.pointerId);
    onDown();
  };
  const up = () => {
    button.classList.remove("pressed");
    onUp?.();
  };
  button.addEventListener("pointerdown", down, { passive: false });
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("pointerleave", up);
  button.addEventListener("lostpointercapture", up);
}

function wireHostControls() {
  el.startGameButton?.addEventListener("click", startCountdown);
  el.playAgainButton?.addEventListener("click", startCountdown);
  el.resetGameButton?.addEventListener("click", () => resetRound(PHASE.LOBBY));
  el.cleanupButton?.addEventListener("click", cleanupInactive);
  el.copyLinkButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(state.joinUrl);
      toast("Join link copied.");
    } catch (_error) {
      toast("請手動複製加入網址。");
    }
  });
  el.soundToggleButton?.addEventListener("click", () => {
    state.sound = !state.sound;
    el.soundToggleButton.setAttribute("aria-pressed", String(state.sound));
    setText(el.soundToggleButton, state.sound ? "Sound On" : "Sound Off");
  });
  el.maxPlayersInput?.addEventListener("change", () => {
    state.maxPlayers = clamp(Number(el.maxPlayersInput.value) || CONFIG.maxPlayers, 2, 50);
    el.maxPlayersInput.value = state.maxPlayers;
    state.dirtyHud = true;
    broadcastSnapshot(true);
  });
  el.phaseSelect?.addEventListener("change", () => forcePhase(el.phaseSelect.value));
}

function wirePlayerControls() {
  bindControllerButton(el.leftButton, () => {
    state.input.left = true;
    sendInput();
  }, () => {
    state.input.left = false;
    sendInput();
  });
  bindControllerButton(el.rightButton, () => {
    state.input.right = true;
    sendInput();
  }, () => {
    state.input.right = false;
    sendInput();
  });
  bindControllerButton(el.jumpButton, () => {
    sendInput({ jump: true });
    vibration(18);
    tone(720, 0.04);
  });
  bindControllerButton(el.attackButton, () => {
    sendInput({ attack: true });
    vibration(20);
    tone(380, 0.04, "sawtooth");
  });
  window.addEventListener("blur", releaseMovement);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseMovement();
  });
}

function releaseMovement() {
  if (!state.input.left && !state.input.right) return;
  state.input.left = false;
  state.input.right = false;
  sendInput();
}

function startHostMode() {
  state.mode = "host";
  setVisible(el.hostView, true);
  setVisible(el.playerView, false);
  wireHostControls();
  if (!window.Peer) {
    toast("PeerJS 載入失敗，請重新整理。");
    return;
  }
  const peer = new window.Peer();
  state.peer = peer;
  peer.on("open", async (id) => {
    state.roomId = id;
    state.roomCode = roomCodeFromId(id);
    state.joinUrl = buildJoinUrl(id);
    setText(el.roomCode, state.roomCode);
    setText(el.joinUrl, state.joinUrl);
    addFeed("Room created. Scan to join.", "info");
    await renderQr(state.joinUrl);
    toast("Room ready. Players can join now.");
    window.requestAnimationFrame(hostLoop);
  });
  peer.on("connection", registerConnection);
  peer.on("error", (error) => toast(`Connection error: ${error.type || "unknown"}`));
}

function startServerHostMode(serverUrl) {
  state.mode = "host";
  state.serverUrl = serverUrl;
  setVisible(el.hostView, true);
  setVisible(el.playerView, false);
  wireHostControls();
  const socket = new WebSocket(serverUrl);
  state.serverSocket = socket;
  socket.addEventListener("open", () => {
    sendServer({ t: "create-room" });
    toast("Connected to room server.");
  });
  socket.addEventListener("message", async (event) => {
    const message = JSON.parse(event.data);
    if (message.t === "room-created") {
      state.roomCode = message.code;
      state.maxPlayers = Math.min(Number(message.maxPlayers) || CONFIG.maxPlayers, 50);
      state.joinUrl = buildServerJoinUrl(serverUrl, state.roomCode);
      setText(el.roomCode, state.roomCode);
      setText(el.joinUrl, state.joinUrl);
      el.maxPlayersInput.value = state.maxPlayers;
      addFeed("Server room created. Scan to join.", "info");
      await renderQr(state.joinUrl);
      window.requestAnimationFrame(hostLoop);
      return;
    }
    handleHostMessage(null, message);
  });
  socket.addEventListener("close", () => toast("Room server disconnected."));
  socket.addEventListener("error", () => toast("Room server connection failed."));
}

function startPlayerMode(hostId) {
  state.mode = "player";
  setVisible(el.hostView, false);
  setVisible(el.playerView, true);
  setupAvatarPicker();
  wirePlayerControls();
  setStatus("CONNECTING", "正在連接房主...");
  if (!window.Peer) {
    setStatus("ERROR", "連線套件載入失敗，請重新整理。");
    return;
  }
  const peer = new window.Peer();
  state.peer = peer;
  peer.on("open", () => {
    const connection = peer.connect(hostId, { reliable: true });
    state.hostConnection = connection;
    connection.on("open", () => {
      setText(el.playerConnectionChip, "CONNECTED");
      el.joinButton.disabled = false;
      setStatus("READY", "輸入暱稱、選角色後加入戰場。");
    });
    connection.on("data", handlePlayerMessage);
    connection.on("close", () => {
      setStatus("RECONNECT", "和房主斷線，請重新掃碼加入。");
      setControls(false);
    });
    window.setInterval(() => send(connection, { t: "heartbeat", id: state.localPlayerId }), 3000);
  });
  peer.on("error", () => setStatus("ERROR", "加入失敗，請確認 QR Code 或重新整理。"));

  el.joinButton?.addEventListener("click", () => {
    if (!state.hostConnection?.open) return;
    const name = el.playerName.value.trim() || "Player";
    el.joinButton.disabled = true;
    setStatus("JOINING", "正在加入房間...");
    send(state.hostConnection, {
      t: "join",
      p: { id: state.localPlayerId, name, avatarId: state.selectedAvatarId }
    });
  });
}

function startServerPlayerMode(serverUrl, room) {
  state.mode = "player";
  state.serverUrl = serverUrl;
  state.roomCode = room;
  setVisible(el.hostView, false);
  setVisible(el.playerView, true);
  setupAvatarPicker();
  wirePlayerControls();
  setStatus("CONNECTING", "正在連接房間伺服器...");
  const socket = new WebSocket(serverUrl);
  state.serverSocket = socket;
  socket.addEventListener("open", () => {
    setText(el.playerConnectionChip, "CONNECTED");
    el.joinButton.disabled = false;
    setStatus("READY", "輸入暱稱、選角色後加入戰場。");
  });
  socket.addEventListener("message", (event) => handlePlayerMessage(JSON.parse(event.data)));
  socket.addEventListener("close", () => {
    setStatus("RECONNECT", "和房間伺服器斷線，請重新掃碼。");
    setControls(false);
  });
  window.setInterval(() => {
    sendServer({ t: "client-event", room: state.roomCode, id: state.localPlayerId, event: { t: "heartbeat", id: state.localPlayerId } });
  }, 3000);
  el.joinButton?.addEventListener("click", () => {
    if (state.serverSocket?.readyState !== WebSocket.OPEN) return;
    const name = el.playerName.value.trim() || "Player";
    el.joinButton.disabled = true;
    setStatus("JOINING", "正在加入房間...");
    sendServer({
      t: "join-room",
      room: state.roomCode,
      player: { id: state.localPlayerId, name, avatarId: state.selectedAvatarId }
    });
  });
}

function handlePlayerMessage(message) {
  if (!message || typeof message !== "object") return;
  if (message.t === "join-rejected") {
    setStatus("ROOM FULL", "房間已滿，請等待房主清除玩家。");
    el.joinButton.disabled = false;
    return;
  }
  if (message.t === "joined") {
    updateFromSnapshot(message.state);
    setVisible(el.joinPanel, false);
    setVisible(el.controllerPanel, true);
    toast("Joined arena.");
    vibration(35);
    window.requestAnimationFrame(renderPlayerUi);
    return;
  }
  if (message.t === "state") {
    updateFromSnapshot(message);
    return;
  }
  if (message.t === "hit-confirm") {
    setStatus("HIT CONFIRM", `命中 ${message.target}，造成 ${message.damage} 傷害。`);
    el.attackButton?.classList.add("confirmed");
    window.setTimeout(() => el.attackButton?.classList.remove("confirmed"), 360);
    vibration([35, 20, 45]);
    return;
  }
  if (message.t === "got-hit") {
    setStatus("HIT", `被 ${message.from} 命中，受到 ${message.damage} 傷害。`);
    vibration([20, 35, 20]);
    return;
  }
  if (message.t === "eliminated") {
    setStatus("OUT", `你被 ${message.by} 淘汰了。`);
    setControls(false);
    vibration([80, 40, 80]);
    return;
  }
  if (message.t === "winner") {
    chord([[523, 0, 0.1], [784, 120, 0.16]]);
  }
  if (message.t === "kicked") {
    setStatus("REMOVED", "你已被房主移出房間。");
    setControls(false);
  }
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const serverUrl = params.get("server");
  const serverRoom = params.get("room");
  const hostId = params.get("join");
  if (serverUrl && serverRoom) startServerPlayerMode(serverUrl, serverRoom);
  else if (serverUrl) startServerHostMode(serverUrl);
  else if (hostId) startPlayerMode(hostId);
  else startHostMode();
}

init();
