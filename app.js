const FINISH_DISTANCE = 100;
const BOOST_STEP = 7;
const BASE_STEP = 3;
const HOP_COOLDOWN = 125;
const JUMP_COOLDOWN = 620;
const JUMP_AIR_TIME = 720;
const COUNTDOWN_STEPS = ["3", "2", "1", "GO!"];
const laneThemes = ["sky", "sunset", "night", "cave"];

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

const laneZones = [
  { position: 23, type: "boost", icon: "★" },
  { position: 39, type: "trap", icon: "!" },
  { position: 56, type: "boost", icon: "★" },
  { position: 74, type: "trap", icon: "!" }
];

const laneObstacles = [
  { position: 17, type: "crate" },
  { position: 34, type: "spike" },
  { position: 51, type: "spring" },
  { position: 67, type: "crate" },
  { position: 83, type: "spike" }
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
  raceStarted: false,
  winnerId: null,
  joinUrl: "",
  gamePhase: "lobby",
  countdownValue: "",
  countdownTimer: null,
  audioContext: null,
  joinRequested: false,
  lastLocalHopAt: 0,
  lastLocalJumpAt: 0
};

const el = {
  hostView: document.querySelector("#hostView"),
  playerView: document.querySelector("#playerView"),
  statusBanner: document.querySelector("#statusBanner"),
  qrCode: document.querySelector("#qrCode"),
  roomCode: document.querySelector("#roomCode"),
  joinUrl: document.querySelector("#joinUrl"),
  playerCount: document.querySelector("#playerCount"),
  hudPlayers: document.querySelector("#hudPlayers"),
  hudMode: document.querySelector("#hudMode"),
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
  playerLanePreview: document.querySelector("#playerLanePreview"),
  boostButton: document.querySelector("#boostButton"),
  jumpButton: document.querySelector("#jumpButton"),
  controllerHint: document.querySelector("#controllerHint")
};

function iconMarkup(icon, accent) {
  const paths = {
    fox: `<path d="M10 24h8v8h-8zM18 16h8v8h-8zM38 16h8v8h-8zM46 24h8v8h-8zM18 24h28v24H18zM22 36h4v4h-4zM38 36h4v4h-4zM28 44h8v4h-8z" fill="${accent}"/><path d="M22 28h20v12H22z" fill="#fff4df"/>`,
    bunny: `<path d="M20 6h8v18h-8zM36 6h8v18h-8zM16 22h32v28H16z" fill="${accent}"/><path d="M20 26h24v20H20z" fill="#fffaf2"/><path d="M24 34h4v4h-4zM36 34h4v4h-4zM30 42h4v4h-4z" fill="#2d2d2d"/>`,
    cat: `<path d="M16 18h8v8h-8zM24 10h8v8h-8zM32 10h8v8h-8zM40 18h8v8h-8zM16 26h32v24H16z" fill="${accent}"/><path d="M20 30h24v16H20z" fill="#fff4fb"/><path d="M24 36h4v4h-4zM36 36h4v4h-4zM28 42h8v4h-8z" fill="#2d2d2d"/>`,
    bear: `<path d="M14 18h8v8h-8zM42 18h8v8h-8zM16 22h32v28H16z" fill="${accent}"/><path d="M20 26h24v20H20z" fill="#fffefc"/><path d="M24 34h4v4h-4zM36 34h4v4h-4zM28 42h8v4h-8z" fill="#2d2d2d"/>`,
    hero: `<path d="M22 8h20v10H22zM18 18h28v12H18zM16 30h12v18H16zM36 30h12v18H36zM28 30h8v18h-8z" fill="${accent}"/><path d="M22 18h20v14H22z" fill="#fff4de"/><path d="M26 22h4v4h-4zM34 22h4v4h-4zM28 28h8v4h-8z" fill="#2d2d2d"/>`,
    dino: `<path d="M16 18h20v8H16zM36 22h12v20H36zM20 26h20v20H20zM16 38h8v10h-8z" fill="${accent}"/><path d="M24 26h12v16H24z" fill="#f5ffed"/><path d="M26 30h4v4h-4zM34 30h4v4h-4zM28 38h8v4h-8z" fill="#2d2d2d"/>`,
    whale: `<path d="M12 22h36v20H12zM48 26h6v12h-6zM20 18h18v6H20z" fill="${accent}"/><path d="M20 26h20v12H20z" fill="#def8ff"/><path d="M24 30h4v4h-4zM36 30h4v4h-4zM28 36h8v4h-8z" fill="#2d2d2d"/>`,
    pup: `<path d="M16 18h10v8H16zM38 18h10v8H38zM18 24h28v24H18z" fill="${accent}"/><path d="M22 28h20v18H22z" fill="#fff7f0"/><path d="M24 34h4v4h-4zM36 34h4v4h-4zM28 42h8v4h-8z" fill="#2d2d2d"/>`,
    mage: `<path d="M20 8h24v8H20zM16 16h32v10H16zM20 26h24v22H20z" fill="${accent}"/><path d="M24 20h16v20H24z" fill="#fff8ff"/><path d="M26 28h4v4h-4zM34 28h4v4h-4zM28 36h8v4h-8z" fill="#2d2d2d"/>`,
    chick: `<path d="M18 16h28v8H18zM16 24h32v22H16z" fill="${accent}"/><path d="M20 28h24v16H20z" fill="#ffe9cc"/><path d="M24 32h4v4h-4zM36 32h4v4h-4zM28 38h8v4h-8z" fill="#2d2d2d"/><path d="M28 40h8v4h-8z" fill="#ff9348"/>`,
    star: `<path d="M28 10h8v8h8v8h8v8h-8v8h-8v8h-8v-8h-8v-8h-8v-8h8v-8h8z" fill="${accent}"/><path d="M24 28h4v4h-4zM36 28h4v4h-4zM26 36h12v4H26z" fill="#2d2d2d"/>`,
    robot: `<path d="M20 10h24v6H20zM18 18h28v24H18zM14 24h4v10h-4zM46 24h4v10h-4zM22 42h8v8h-8zM34 42h8v8h-8z" fill="${accent}"/><path d="M22 22h20v16H22z" fill="#edfdfd"/><path d="M24 26h4v4h-4zM36 26h4v4h-4zM26 34h12v4H26z" fill="#2d2d2d"/>`
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

function formatRank(index) {
  return ["1ST", "2ND", "3RD"][index] || `${index + 1}TH`;
}

function status(text) {
  el.statusBanner.textContent = text;
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
      image.loading = "eager";
      image.decoding = "async";
      el.qrCode.append(image);
      return true;
    } catch (_error) {
    }
  }

  if (qrApi?.toCanvas) {
    try {
      const canvas = document.createElement("canvas");
      await qrApi.toCanvas(canvas, url, { width: 220, margin: 1 });
      el.qrCode.append(canvas);
      return true;
    } catch (_error) {
    }
  }

  renderQrFallback(url);
  status("已改用備援 QR Code 服務，仍可正常掃碼加入。");
  return false;
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
  if (step === "GO!") {
    playTone(660, 0.18, "square", 0.08);
    setTimeout(() => playTone(880, 0.18, "square", 0.08), 110);
    return;
  }
  playTone(440, 0.14, "square", 0.06);
}

function playVictoryFanfare() {
  playTone(523.25, 0.12, "square", 0.08);
  setTimeout(() => playTone(659.25, 0.12, "square", 0.08), 130);
  setTimeout(() => playTone(783.99, 0.18, "square", 0.08), 260);
}

function themeForIndex(index) {
  return laneThemes[index % laneThemes.length];
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

function worldOffset(progress) {
  return Math.min(420, Math.round(progress * 4.2));
}

function cameraForProgress(progress) {
  return Math.max(0, Math.min(FINISH_DISTANCE - 24, progress - 24));
}

function viewportLeft(progress, camera) {
  return Math.max(4, Math.min(90, 10 + (progress - camera) * 2.6));
}

function runnerLeft(progress, camera) {
  return `${viewportLeft(progress, camera)}%`;
}

function isAirborne(player, now = Date.now()) {
  return (player.airborneUntil || 0) > now;
}

function sharedRunnerBottom(index) {
  return 52 + (index % 5) * 18;
}

function sharedMapDecorations(camera) {
  const offset = worldOffset(camera);
  const cloudOffset = Math.round(offset * 0.24);
  const hillOffset = Math.round(offset * 0.5);
  const treeOffset = Math.round(offset * 0.92);

  return `
    <div class="shared-backdrop">
      <div class="fantasy-layer fantasy-sky"></div>
      <div class="fantasy-layer fantasy-clouds" style="transform:translateX(-${cloudOffset}px)"></div>
      <div class="fantasy-layer fantasy-hills" style="transform:translateX(-${hillOffset}px)"></div>
      <div class="fantasy-layer fantasy-trees" style="transform:translateX(-${treeOffset}px)"></div>
      <div class="fantasy-layer fantasy-islands" style="transform:translateX(-${Math.round(hillOffset * 0.8)}px)"></div>
      <div class="forest-ground"></div>
      <div class="forest-shadow"></div>
      <div class="forest-mushroom giant"></div>
      <div class="forest-mushroom mini"></div>
      <div class="forest-crystal crystal-a"></div>
      <div class="forest-crystal crystal-b"></div>
      ${laneZones
        .map(
          (zone) => `
            <div class="forest-zone ${zone.type}" style="left:${viewportLeft(zone.position, camera)}%">${zone.icon}</div>
          `
        )
        .join("")}
      ${laneObstacles
        .map(
          (obstacle) => `<div class="forest-obstacle ${obstacle.type}" style="left:${viewportLeft(obstacle.position, camera)}%"></div>`
        )
        .join("")}
      <div class="finish-tree" style="left:${viewportLeft(FINISH_DISTANCE, camera)}%"></div>
      <div class="finish-portal" style="left:${viewportLeft(FINISH_DISTANCE, camera)}%"></div>
    </div>
  `;
}

function getPhaseLabel() {
  if (appState.gamePhase === "countdown") return "COUNTDOWN";
  if (appState.gamePhase === "racing") return "RACING";
  if (appState.gamePhase === "finished") return "FINISH";
  return "LOBBY";
}

function renderCountdownOverlay() {
  if (appState.gamePhase !== "countdown" || !appState.countdownValue) {
    el.countdownOverlay.classList.add("hidden");
    return;
  }
  el.countdownOverlay.classList.remove("hidden");
  el.countdownNumber.textContent = appState.countdownValue;
  el.countdownLabel.textContent = appState.countdownValue === "GO!" ? "RUN!" : "READY";
}

function renderHostTrack() {
  const players = [...appState.players.values()].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    return a.joinedAt - b.joinedAt;
  });

  el.playerCount.textContent = String(players.length);
  el.hudPlayers.textContent = String(players.length);
  el.hudMode.textContent = getPhaseLabel();

  if (!players.length) {
    el.track.innerHTML = `
      <div class="shared-map">
        ${sharedMapDecorations(0)}
        <div class="shared-map-header">
          <div class="shared-map-copy">
            <strong>等待玩家加入</strong>
            <span>掃描 QR Code 後，所有玩家會一起在同一張奇幻森林地圖裡開跑</span>
          </div>
        </div>
      </div>
    `;
    el.podium.innerHTML = "";
    el.raceSummary.textContent = "等待玩家加入...";
    el.startRaceButton.disabled = true;
    renderCountdownOverlay();
    return;
  }

  el.startRaceButton.disabled = players.length < 2 || appState.gamePhase === "countdown";
  const leaderProgress = players[0]?.progress || 0;
  const camera = cameraForProgress(leaderProgress);

  const runnerMarkup = players
    .map((player, index) => {
      const avatar = getAvatarById(player.avatarId);
      const effectLabel =
        player.effect === "boost"
          ? "STAR BOOST"
          : player.effect === "trap"
            ? "MUD TRAP"
            : player.effect === "crash"
              ? "OUCH!"
              : isAirborne(player)
                ? "JUMPING"
                : "RUNNING";
      const runnerClass = [
        "runner",
        player.effect === "boost" ? "is-boosting" : "",
        player.effect === "trap" ? "is-trapped" : "",
        isAirborne(player) ? "is-jumping" : ""
      ]
        .filter(Boolean)
        .join(" ");
      return `
        <div class="${runnerClass} shared-runner" style="left:${runnerLeft(player.progress, camera)}; bottom:${sharedRunnerBottom(index)}px">
          <div class="runner-avatar">${avatarSvg(avatar)}</div>
          <div class="runner-label">${escapeHtml(player.name)}</div>
          <div class="shared-runner-status">${effectLabel}</div>
          <div class="shared-runner-rank">${formatRank(index)}</div>
        </div>
      `;
    })
    .join("");

  el.track.innerHTML = `
    <div class="shared-map">
      ${sharedMapDecorations(camera)}
      <div class="shared-map-header">
        <div class="shared-map-copy">
          <strong>夢幻森林競速場</strong>
          <span>大家在同一張地圖跑跳競速，閃過障礙、踩彈簧、衝進終點傳送門</span>
        </div>
        <div class="shared-map-rank">CAM ${Math.round(camera)} / 76</div>
      </div>
      ${runnerMarkup}
    </div>
  `;

  const winners = players.slice(0, 3);
  el.podium.innerHTML = winners
    .map((player, index) => {
      const avatar = getAvatarById(player.avatarId);
      return `
        <div class="podium-card" data-rank="${index + 1}">
          <div class="avatar-badge">${avatarSvg(avatar)}</div>
          <div>
            <strong>${formatRank(index)} · ${escapeHtml(player.name)}</strong>
            <span>${Math.round(player.progress)} / ${FINISH_DISTANCE}</span>
          </div>
        </div>
      `;
    })
    .join("");

  if (appState.gamePhase === "countdown") {
    el.raceSummary.textContent = "倒數開始，準備衝刺...";
  } else if (appState.gamePhase === "finished" && appState.winnerId) {
    const winner = appState.players.get(appState.winnerId);
    el.raceSummary.textContent = `${winner?.name || "有人"} 抵達終點城堡！`;
  } else if (appState.gamePhase === "racing") {
    el.raceSummary.textContent = "比賽進行中，大家正在全力衝刺...";
  } else {
    el.raceSummary.textContent = players.length < 2 ? "至少要 2 位玩家才能開始" : "玩家已就位，按下開始比賽";
  }

  renderCountdownOverlay();
}

function renderPlayerPreview(state = appState.localPlayer) {
  if (!state) return;
  const avatar = getAvatarById(state.avatarId);
  const camera = cameraForProgress(state.progress);
  const runnerClass = [
    "runner",
    state.effect === "boost" ? "is-boosting" : "",
    state.effect === "trap" ? "is-trapped" : "",
    isAirborne(state) ? "is-jumping" : ""
  ]
    .filter(Boolean)
    .join(" ");

  el.playerLanePreview.innerHTML = `
    <div class="shared-map preview-map">
      ${sharedMapDecorations(camera)}
      <div class="${runnerClass} shared-runner preview-runner" style="left:${runnerLeft(state.progress, camera)}; bottom:60px">
        <div class="runner-avatar">${avatarSvg(avatar)}</div>
        <div class="runner-label">${escapeHtml(state.name)}</div>
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
  const payload = {
    type: "state",
    raceStarted: appState.raceStarted,
    winnerId: appState.winnerId,
    gamePhase: appState.gamePhase,
    countdownValue: appState.countdownValue,
    players: [...appState.players.values()]
  };
  sendToAll(payload);
  renderHostTrack();
}

function resetRace() {
  clearTimeout(appState.countdownTimer);
  appState.countdownTimer = null;
  appState.raceStarted = false;
  appState.winnerId = null;
  appState.gamePhase = "lobby";
  appState.countdownValue = "";
  appState.players.forEach((player) => {
    player.progress = 0;
    player.effect = "ready";
    player.lastHopAt = 0;
    player.lastJumpAt = 0;
    player.airborneUntil = 0;
  });
  broadcastState();
}

function applyZoneEffects(nextProgress) {
  const hitZone = laneZones.find((zone) => Math.abs(nextProgress - zone.position) <= 3);
  if (!hitZone) {
    return { progress: nextProgress, effect: "normal" };
  }
  if (hitZone.type === "boost") {
    return { progress: Math.min(FINISH_DISTANCE, nextProgress + BOOST_STEP), effect: "boost" };
  }
  return { progress: Math.max(0, nextProgress - 5), effect: "trap" };
}

function applyObstacleEffects(player, nextProgress, now) {
  const obstacle = laneObstacles.find((item) => item.type !== "spring" && Math.abs(nextProgress - item.position) <= 2.7);
  if (obstacle && !isAirborne(player, now)) {
    return { progress: Math.max(0, nextProgress - 6), effect: "crash" };
  }

  const spring = laneObstacles.find((item) => item.type === "spring" && Math.abs(nextProgress - item.position) <= 2.7);
  if (spring && isAirborne(player, now)) {
    player.airborneUntil = Math.max(player.airborneUntil || 0, now + 260);
    return { progress: Math.min(FINISH_DISTANCE, nextProgress + 5), effect: "boost" };
  }

  return { progress: nextProgress, effect: player.effect === "crash" ? "normal" : player.effect };
}

function handleRun(playerId) {
  if (!appState.raceStarted || appState.gamePhase !== "racing" || appState.winnerId) return;
  const player = appState.players.get(playerId);
  if (!player) return;

  const now = Date.now();
  if (now - player.lastHopAt < HOP_COOLDOWN) return;
  player.lastHopAt = now;

  const baseProgress = Math.min(FINISH_DISTANCE, player.progress + BASE_STEP);
  const obstacleAdjusted = applyObstacleEffects(player, baseProgress, now);
  const updated = applyZoneEffects(obstacleAdjusted.progress);
  player.progress = updated.progress;
  player.effect = obstacleAdjusted.effect === "crash" ? "crash" : updated.effect;

  if (player.progress >= FINISH_DISTANCE && !appState.winnerId) {
    appState.winnerId = playerId;
    appState.raceStarted = false;
    appState.gamePhase = "finished";
    appState.countdownValue = "";
    sendToAll({ type: "winner", winnerId: playerId, winnerName: player.name });
    playVictoryFanfare();
  }

  broadcastState();
}

function handleJump(playerId) {
  if (!appState.raceStarted || appState.gamePhase !== "racing" || appState.winnerId) return;
  const player = appState.players.get(playerId);
  if (!player) return;

  const now = Date.now();
  if (now - (player.lastJumpAt || 0) < JUMP_COOLDOWN) return;

  player.lastJumpAt = now;
  player.airborneUntil = now + JUMP_AIR_TIME;
  player.progress = Math.min(FINISH_DISTANCE, player.progress + 2);
  player.effect = "jump";

  const spring = laneObstacles.find((item) => item.type === "spring" && Math.abs(player.progress - item.position) <= 3.2);
  if (spring) {
    player.progress = Math.min(FINISH_DISTANCE, player.progress + 4);
    player.airborneUntil = now + JUMP_AIR_TIME + 180;
    player.effect = "boost";
  }

  if (player.progress >= FINISH_DISTANCE && !appState.winnerId) {
    appState.winnerId = playerId;
    appState.raceStarted = false;
    appState.gamePhase = "finished";
    appState.countdownValue = "";
    sendToAll({ type: "winner", winnerId: playerId, winnerName: player.name });
    playVictoryFanfare();
  }

  broadcastState();
}

function runCountdown(index = 0) {
  if (index >= COUNTDOWN_STEPS.length) {
    appState.countdownValue = "";
    appState.gamePhase = "racing";
    appState.raceStarted = true;
    broadcastState();
    status("開跑！");
    return;
  }

  appState.gamePhase = "countdown";
  appState.raceStarted = false;
  appState.countdownValue = COUNTDOWN_STEPS[index];
  playCountdownTone(COUNTDOWN_STEPS[index]);
  broadcastState();
  appState.countdownTimer = setTimeout(() => runCountdown(index + 1), COUNTDOWN_STEPS[index] === "GO!" ? 550 : 800);
}

function startCountdown() {
  clearTimeout(appState.countdownTimer);
  appState.winnerId = null;
  appState.players.forEach((player) => {
    player.progress = 0;
    player.effect = "ready";
    player.lastHopAt = 0;
    player.lastJumpAt = 0;
    player.airborneUntil = 0;
  });
  runCountdown(0);
}

function registerConnection(connection) {
  connection.on("data", (message) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "join") {
      const player = {
        id: message.player.id,
        name: message.player.name.slice(0, 16) || "Player",
        avatarId: message.player.avatarId,
        progress: 0,
        effect: "ready",
        joinedAt: Date.now(),
        lastHopAt: 0,
        lastJumpAt: 0,
        airborneUntil: 0
      };
      appState.players.set(player.id, player);
      appState.connections.set(player.id, connection);
      connection.send({
        type: "joined",
        raceStarted: appState.raceStarted,
        winnerId: appState.winnerId,
        gamePhase: appState.gamePhase,
        countdownValue: appState.countdownValue,
        player,
        players: [...appState.players.values()]
      });
      broadcastState();
      return;
    }

    if (message.type === "run") {
      handleRun(message.playerId);
    }

    if (message.type === "jump") {
      handleJump(message.playerId);
    }
  });

  connection.on("close", () => {
    const playerId = [...appState.connections.entries()].find(([, conn]) => conn === connection)?.[0];
    if (playerId) {
      appState.connections.delete(playerId);
      appState.players.delete(playerId);
      if (playerId === appState.winnerId) {
        appState.winnerId = null;
        appState.gamePhase = "lobby";
      }
      broadcastState();
    }
  });
}

function startHostMode() {
  appState.mode = "host";
  el.hostView.classList.remove("hidden");
  el.playerView.classList.add("hidden");
  status("正在建立房間...");

  const peer = new window.Peer();
  appState.peer = peer;

  peer.on("open", async (id) => {
    appState.peerId = id;
    appState.joinCode = randomRoomCode(id);
    appState.joinUrl = buildJoinUrl(id);
    el.roomCode.textContent = appState.joinCode;
    el.joinUrl.textContent = appState.joinUrl;
    status("房間建立成功，讓大家掃 QR Code 加入。");
    renderHostTrack();
    await renderQrCode(appState.joinUrl);
  });

  peer.on("connection", (connection) => {
    registerConnection(connection);
  });

  peer.on("error", (error) => {
    status(`連線發生問題：${error.type || "unknown error"}`);
  });
}

function updatePlayerStatus() {
  if (!appState.localPlayer) return;
  const winner = appState.winnerId ? appState.localPlayer.id === appState.winnerId : false;

  if (appState.gamePhase === "countdown") {
    el.controllerHint.textContent = `倒數中 ${appState.countdownValue || ""}，準備好 RUN 和 JUMP。`;
    el.boostButton.disabled = true;
    el.jumpButton.disabled = true;
  } else if (appState.gamePhase === "lobby") {
    el.controllerHint.textContent = "等待房主開始比賽。開跑後用 RUN 衝刺，用 JUMP 跳過障礙。";
    el.boostButton.disabled = true;
    el.jumpButton.disabled = true;
  } else if (winner) {
    el.controllerHint.textContent = "你是冠軍！等房主重設後可以再玩一局。";
    el.boostButton.disabled = true;
    el.jumpButton.disabled = true;
  } else if (appState.winnerId) {
    const winnerName = appState.localPlayerSnapshot.find((item) => item.id === appState.winnerId)?.name;
    el.controllerHint.textContent = `${winnerName || "有人"} 已經先到終點城堡，等房主重設下一局。`;
    el.boostButton.disabled = true;
    el.jumpButton.disabled = true;
  } else {
    el.controllerHint.textContent = "RUN 衝刺前進，JUMP 跳過木箱與尖刺，踩上彈簧會飛得更遠。";
    el.boostButton.disabled = false;
    el.jumpButton.disabled = false;
  }
}

function applyRemoteState(message) {
  appState.raceStarted = message.raceStarted;
  appState.winnerId = message.winnerId;
  appState.gamePhase = message.gamePhase || "lobby";
  appState.countdownValue = message.countdownValue || "";
  appState.localPlayerSnapshot = message.players;
  const latest = message.players.find((player) => player.id === appState.playerId);
  if (latest) {
    appState.localPlayer = latest;
    renderPlayerPreview(latest);
  }
  renderCountdownOverlay();
  updatePlayerStatus();
}

function startPlayerMode(hostId) {
  appState.mode = "player";
  el.hostView.classList.add("hidden");
  el.playerView.classList.remove("hidden");
  setupAvatarPicker();
  status("輸入名字、選頭像後，就能加入房間。");

  const peer = new window.Peer();
  appState.peer = peer;
  appState.joinCode = hostId;

  peer.on("open", () => {
    const connection = peer.connect(hostId, { reliable: true });
    appState.hostConnection = connection;

    connection.on("open", () => {
      status("已連上房主，準備加入房間。");
      el.joinButton.disabled = false;
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
        el.playerGreeting.textContent = `${message.player.name}，準備衝刺`;
        renderPlayerPreview(message.player);
        updatePlayerStatus();
        status("加入成功，等待比賽開始。");
      }

      if (message.type === "state") {
        applyRemoteState(message);
      }

      if (message.type === "winner") {
        appState.winnerId = message.winnerId;
        playVictoryFanfare();
        updatePlayerStatus();
      }
    });

    connection.on("close", () => {
      appState.joinRequested = false;
      status("與房主的連線中斷了，請重新掃碼加入。");
      el.boostButton.disabled = true;
      el.jumpButton.disabled = true;
      el.joinButton.disabled = true;
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
    startCountdown();
    status("倒數開始！");
  });

  el.resetRaceButton.addEventListener("click", () => {
    resetRace();
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
    appState.hostConnection.send({
      type: "join",
      player: {
        id: appState.playerId,
        name,
        avatarId: avatar.id
      }
    });
    status("正在送出加入請求...");
  });

  const run = () => {
    getAudioContext();
    if (!appState.hostConnection?.open || !appState.localPlayer || el.boostButton.disabled) return;
    const now = Date.now();
    if (now - appState.lastLocalHopAt < HOP_COOLDOWN) return;
    appState.lastLocalHopAt = now;
    appState.hostConnection.send({ type: "run", playerId: appState.playerId });
    playTone(520, 0.04, "square", 0.03);
  };

  const jump = () => {
    getAudioContext();
    if (!appState.hostConnection?.open || !appState.localPlayer || el.jumpButton.disabled) return;
    const now = Date.now();
    if (now - appState.lastLocalJumpAt < JUMP_COOLDOWN) return;
    appState.lastLocalJumpAt = now;
    appState.hostConnection.send({ type: "jump", playerId: appState.playerId });
    playTone(760, 0.06, "square", 0.04);
  };

  el.boostButton.addEventListener("pointerdown", run);
  el.jumpButton.addEventListener("pointerdown", jump);
}

function init() {
  wireEvents();
  renderCountdownOverlay();

  const params = new URLSearchParams(window.location.search);
  const join = params.get("join");

  if (join) {
    startPlayerMode(join);
  } else {
    startHostMode();
  }
}

init();
