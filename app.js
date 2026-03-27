const FINISH_DISTANCE = 100;
const BOOST_STEP = 6;
const BASE_STEP = 3;
const HOP_COOLDOWN = 140;

const avatarDefinitions = [
  { id: "sunny", name: "Sunny Fox", colors: ["#ff9668", "#ffd368", "#7f4c2d"], icon: "fox" },
  { id: "mint", name: "Mint Bunny", colors: ["#8de5c1", "#d3fff1", "#2a6d5a"], icon: "bunny" },
  { id: "berry", name: "Berry Cat", colors: ["#ff88a7", "#ffd6e1", "#77324d"], icon: "cat" },
  { id: "sky", name: "Sky Bear", colors: ["#7ebcff", "#dcefff", "#2b4670"], icon: "bear" },
  { id: "peach", name: "Peach Hero", colors: ["#ffc38c", "#fff0d8", "#7d5136"], icon: "hero" },
  { id: "lime", name: "Lime Dino", colors: ["#a4e96d", "#ebffd8", "#3b6f1d"], icon: "dino" },
  { id: "violet", name: "Violet Star", colors: ["#be97ff", "#f1e4ff", "#52388c"], icon: "star" },
  { id: "cocoa", name: "Cocoa Pup", colors: ["#bc8d62", "#f2dec6", "#5a3d28"], icon: "pup" },
  { id: "coral", name: "Coral Chick", colors: ["#ff7d74", "#ffe1cb", "#7c342f"], icon: "chick" },
  { id: "ocean", name: "Ocean Whale", colors: ["#6cd8ff", "#def7ff", "#1d5d78"], icon: "whale" }
];

const laneZones = [
  { position: 24, type: "boost", icon: "⭐" },
  { position: 42, type: "trap", icon: "🟤" },
  { position: 61, type: "boost", icon: "⭐" },
  { position: 79, type: "trap", icon: "🟤" }
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
  joinUrl: ""
};

const el = {
  hostView: document.querySelector("#hostView"),
  playerView: document.querySelector("#playerView"),
  statusBanner: document.querySelector("#statusBanner"),
  qrCode: document.querySelector("#qrCode"),
  roomCode: document.querySelector("#roomCode"),
  joinUrl: document.querySelector("#joinUrl"),
  playerCount: document.querySelector("#playerCount"),
  track: document.querySelector("#track"),
  podium: document.querySelector("#podium"),
  raceSummary: document.querySelector("#raceSummary"),
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
  controllerHint: document.querySelector("#controllerHint")
};

function iconMarkup(icon, accent) {
  const paths = {
    fox: `<path d="M14 24L22 8l10 9 10-9 8 16-5 5v15H19V29z" fill="${accent}" opacity=".22"/><circle cx="24" cy="28" r="11" fill="${accent}"/><circle cx="40" cy="28" r="11" fill="${accent}"/><circle cx="32" cy="34" r="16" fill="#fff4df"/><circle cx="26" cy="34" r="3" fill="#2d2d2d"/><circle cx="38" cy="34" r="3" fill="#2d2d2d"/><path d="M29 42c2 2 4 2 6 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    bunny: `<ellipse cx="24" cy="18" rx="8" ry="14" fill="${accent}"/><ellipse cx="40" cy="18" rx="8" ry="14" fill="${accent}"/><circle cx="32" cy="36" r="18" fill="#fffaf2"/><circle cx="25" cy="35" r="3" fill="#2d2d2d"/><circle cx="39" cy="35" r="3" fill="#2d2d2d"/><path d="M31 38h2v6h-2z" fill="${accent}"/><path d="M28 43c3 2 5 2 8 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    cat: `<path d="M20 20l8-10 4 8 4-8 8 10v10H20z" fill="${accent}"/><circle cx="32" cy="37" r="18" fill="#fff4fb"/><circle cx="25" cy="36" r="3" fill="#2d2d2d"/><circle cx="39" cy="36" r="3" fill="#2d2d2d"/><path d="M32 38l-3 4h6z" fill="${accent}"/><path d="M24 43c5 2 11 2 16 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    bear: `<circle cx="21" cy="23" r="8" fill="${accent}"/><circle cx="43" cy="23" r="8" fill="${accent}"/><circle cx="32" cy="36" r="18" fill="#fffefc"/><circle cx="25" cy="35" r="3" fill="#2d2d2d"/><circle cx="39" cy="35" r="3" fill="#2d2d2d"/><ellipse cx="32" cy="41" rx="6" ry="4.5" fill="${accent}"/><path d="M29 42c2 1 4 1 6 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    hero: `<circle cx="32" cy="20" r="12" fill="${accent}"/><path d="M16 26h32l-4 24H20z" fill="${accent}" opacity=".28"/><circle cx="32" cy="32" r="16" fill="#fff7ef"/><circle cx="26" cy="31" r="3" fill="#2d2d2d"/><circle cx="38" cy="31" r="3" fill="#2d2d2d"/><path d="M28 39c3 3 5 3 8 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    dino: `<path d="M20 24c0-8 6-14 14-14h8l6 8-4 10v16H20z" fill="${accent}"/><circle cx="31" cy="34" r="16" fill="#f5ffed"/><circle cx="27" cy="33" r="3" fill="#2d2d2d"/><circle cx="38" cy="33" r="3" fill="#2d2d2d"/><path d="M28 40c2 2 6 2 8 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    star: `<path d="M32 10l6 13 14 2-10 10 3 14-13-7-13 7 3-14-10-10 14-2z" fill="${accent}"/><circle cx="26" cy="30" r="3" fill="#2d2d2d"/><circle cx="38" cy="30" r="3" fill="#2d2d2d"/><path d="M27 37c3 2 7 2 10 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    pup: `<path d="M18 18l10 6 8-6 10 6v10H18z" fill="${accent}"/><circle cx="32" cy="36" r="18" fill="#fff7f0"/><circle cx="25" cy="35" r="3" fill="#2d2d2d"/><circle cx="39" cy="35" r="3" fill="#2d2d2d"/><ellipse cx="32" cy="40" rx="5" ry="4" fill="${accent}"/><path d="M27 44c4 2 6 2 10 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    chick: `<circle cx="32" cy="33" r="18" fill="${accent}"/><path d="M18 24l8-8 6 7 6-7 8 8" fill="${accent}"/><circle cx="26" cy="31" r="3" fill="#2d2d2d"/><circle cx="38" cy="31" r="3" fill="#2d2d2d"/><path d="M32 37l-5 4h10z" fill="#ff9348"/><path d="M27 42c3 2 7 2 10 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`,
    whale: `<path d="M14 34c0-10 8-18 18-18h12c6 0 12 5 12 11v16H32c-10 0-18-8-18-18z" fill="${accent}"/><circle cx="26" cy="31" r="3" fill="#2d2d2d"/><circle cx="38" cy="31" r="3" fill="#2d2d2d"/><path d="M28 39c3 2 5 2 8 0" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/>`
  };

  return paths[icon];
}

function avatarSvg(avatar) {
  const [primary, secondary, accent] = avatar.colors;
  return `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${avatar.name}">
      <defs>
        <linearGradient id="bg-${avatar.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#bg-${avatar.id})" />
      ${iconMarkup(avatar.icon, accent)}
    </svg>
  `;
}

function getAvatarById(id) {
  return avatarDefinitions.find((avatar) => avatar.id === id) || avatarDefinitions[0];
}

function formatRank(index) {
  return ["1st", "2nd", "3rd"][index] || `${index + 1}th`;
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

function buildJoinUrl(hostId) {
  const url = new URL(window.location.href);
  url.searchParams.set("join", hostId);
  return url.toString();
}

function randomRoomCode(peerId) {
  return peerId.slice(-6).toUpperCase();
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

  const selectedAvatar = getAvatarById(appState.selectedAvatarId);
  el.selectedAvatarName.textContent = selectedAvatar.name;

  el.avatarPicker.querySelectorAll("[data-avatar]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedAvatarId = button.dataset.avatar;
      setupAvatarPicker();
    });
  });
}

function renderHostTrack() {
  const players = [...appState.players.values()].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    return a.joinedAt - b.joinedAt;
  });

  el.playerCount.textContent = String(players.length);

  if (!players.length) {
    el.track.innerHTML = `
      <div class="lane">
        <div class="lane-header">
          <div class="lane-meta">
            <strong>等待玩家加入</strong>
            <span>掃描 QR Code 後就會出現在這裡</span>
          </div>
        </div>
      </div>
    `;
    el.podium.innerHTML = "";
    el.raceSummary.textContent = "等待玩家加入...";
    el.startRaceButton.disabled = true;
    return;
  }

  el.startRaceButton.disabled = players.length < 2;

  const laneMarkup = players
    .map((player, index) => {
      const avatar = getAvatarById(player.avatarId);
      const left = `${Math.min(90, 5 + player.progress * 0.85)}%`;
      const effectLabel = player.effect === "boost" ? "星星加速中" : player.effect === "trap" ? "泥巴中" : "穩定衝刺";
      return `
        <div class="lane">
          <div class="lane-header">
            <div class="lane-player">
              <div class="avatar-badge">${avatarSvg(avatar)}</div>
              <div class="lane-meta">
                <strong>${escapeHtml(player.name)}</strong>
                <span>${effectLabel} · 進度 ${Math.round(player.progress)} / ${FINISH_DISTANCE}</span>
              </div>
            </div>
            <div class="lane-rank">${formatRank(index)}</div>
          </div>
          <div class="track-strip">
            ${laneZones
              .map(
                (zone) => `
                <div class="zone ${zone.type}" style="left:${zone.position}%">${zone.icon}</div>
              `
              )
              .join("")}
            <div class="finish-line"></div>
            <div class="runner" style="left:${left}">
              <div class="runner-avatar">${avatarSvg(avatar)}</div>
              <div class="runner-label">${escapeHtml(player.name)}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  el.track.innerHTML = laneMarkup;

  const winners = players.slice(0, 3);
  el.podium.innerHTML = winners
    .map((player, index) => {
      const avatar = getAvatarById(player.avatarId);
      return `
        <div class="podium-card">
          <div class="avatar-badge">${avatarSvg(avatar)}</div>
          <div>
            <strong>${formatRank(index)} · ${escapeHtml(player.name)}</strong>
            <span>${Math.round(player.progress)} / ${FINISH_DISTANCE}</span>
          </div>
        </div>
      `;
    })
    .join("");

  if (!appState.raceStarted) {
    el.raceSummary.textContent = players.length < 2 ? "至少要 2 位玩家才能開始" : "玩家已就位，按下開始比賽";
  } else if (appState.winnerId) {
    const winner = appState.players.get(appState.winnerId);
    el.raceSummary.textContent = `${winner?.name || "有人"} 奪下冠軍了！`;
  } else {
    el.raceSummary.textContent = "比賽進行中，大家正在狂按衝刺...";
  }
}

function renderPlayerPreview(state = appState.localPlayer) {
  if (!state) return;
  const avatar = getAvatarById(state.avatarId);
  const left = `${Math.min(90, 5 + state.progress * 0.85)}%`;
  el.playerLanePreview.innerHTML = `
    <div class="track-strip">
      ${laneZones
        .map(
          (zone) => `
          <div class="zone ${zone.type}" style="left:${zone.position}%">${zone.icon}</div>
        `
        )
        .join("")}
      <div class="finish-line"></div>
      <div class="runner" style="left:${left}">
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
    players: [...appState.players.values()]
  };
  sendToAll(payload);
  renderHostTrack();
}

function resetRace() {
  appState.raceStarted = false;
  appState.winnerId = null;
  appState.players.forEach((player) => {
    player.progress = 0;
    player.effect = "ready";
    player.lastHopAt = 0;
  });
  broadcastState();
}

function applyZoneEffects(nextProgress) {
  const hitZone = laneZones.find((zone) => Math.abs(nextProgress - zone.position) <= 2.8);
  if (!hitZone) {
    return { progress: nextProgress, effect: "normal" };
  }
  if (hitZone.type === "boost") {
    return { progress: Math.min(FINISH_DISTANCE, nextProgress + BOOST_STEP), effect: "boost" };
  }
  return { progress: Math.max(0, nextProgress - 4), effect: "trap" };
}

function handleHop(playerId) {
  if (!appState.raceStarted || appState.winnerId) return;
  const player = appState.players.get(playerId);
  if (!player) return;

  const now = Date.now();
  if (now - player.lastHopAt < HOP_COOLDOWN) return;
  player.lastHopAt = now;

  const baseProgress = Math.min(FINISH_DISTANCE, player.progress + BASE_STEP);
  const updated = applyZoneEffects(baseProgress);
  player.progress = updated.progress;
  player.effect = updated.effect;

  if (player.progress >= FINISH_DISTANCE && !appState.winnerId) {
    appState.winnerId = playerId;
    appState.raceStarted = false;
    sendToAll({ type: "winner", winnerId: playerId, winnerName: player.name });
  }

  broadcastState();
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
        lastHopAt: 0
      };
      appState.players.set(player.id, player);
      appState.connections.set(player.id, connection);
      connection.send({
        type: "joined",
        raceStarted: appState.raceStarted,
        winnerId: appState.winnerId,
        player,
        players: [...appState.players.values()]
      });
      broadcastState();
      return;
    }

    if (message.type === "hop") {
      handleHop(message.playerId);
    }
  });

  connection.on("close", () => {
    const playerId = [...appState.connections.entries()].find(([, conn]) => conn === connection)?.[0];
    if (playerId) {
      appState.connections.delete(playerId);
      appState.players.delete(playerId);
      if (playerId === appState.winnerId) {
        appState.winnerId = null;
      }
      renderHostTrack();
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
    status("房間建立成功，讓大家掃 QR Code 加入吧。");
    renderHostTrack();

    el.qrCode.innerHTML = "";
    const canvas = document.createElement("canvas");
    el.qrCode.append(canvas);
    try {
      await window.QRCode.toCanvas(canvas, appState.joinUrl, { width: 220, margin: 1 });
    } catch (error) {
      el.qrCode.textContent = "QR Code 產生失敗";
      status(`QR Code 建立失敗：${error?.message || "unknown error"}`);
    }
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
  if (!appState.raceStarted && !appState.winnerId) {
    el.controllerHint.textContent = "等待房主開始比賽，開始後狂按按鈕，讓角色一路跳到終點。";
    el.boostButton.disabled = true;
  } else if (winner) {
    el.controllerHint.textContent = "你是冠軍！可以等房主重設再玩一局。";
    el.boostButton.disabled = true;
  } else if (appState.winnerId) {
    const winnerName = appState.localPlayerSnapshot?.find?.((item) => item.id === appState.winnerId)?.name;
    el.controllerHint.textContent = `${winnerName || "有人"} 已經先到終點，等房主重設下一局。`;
    el.boostButton.disabled = true;
  } else {
    el.controllerHint.textContent = "現在就狂按衝刺，踩到星星會大加速，踩進泥巴會慢下來。";
    el.boostButton.disabled = false;
  }
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
        appState.localPlayer = message.player;
        appState.localPlayerSnapshot = message.players;
        el.joinPanel.classList.add("hidden");
        el.controllerPanel.classList.remove("hidden");
        el.playerGreeting.textContent = `${message.player.name}，準備衝刺`;
        renderPlayerPreview(message.player);
        updatePlayerStatus();
        status("加入成功，等待比賽開始。");
      }

      if (message.type === "state") {
        appState.raceStarted = message.raceStarted;
        appState.winnerId = message.winnerId;
        appState.localPlayerSnapshot = message.players;
        const latest = message.players.find((player) => player.id === appState.playerId);
        if (latest) {
          appState.localPlayer = latest;
          renderPlayerPreview(latest);
        }
        updatePlayerStatus();
      }

      if (message.type === "winner") {
        appState.winnerId = message.winnerId;
        updatePlayerStatus();
      }
    });

    connection.on("close", () => {
      status("與房主的連線中斷了，請重新掃碼加入。");
      el.boostButton.disabled = true;
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
    if (appState.players.size < 2) {
      status("至少要 2 位玩家才能開始。");
      return;
    }
    appState.raceStarted = true;
    appState.winnerId = null;
    appState.players.forEach((player) => {
      player.progress = 0;
      player.effect = "normal";
      player.lastHopAt = 0;
    });
    broadcastState();
    status("比賽開始！");
  });

  el.resetRaceButton.addEventListener("click", () => {
    resetRace();
    status("本局已重設，玩家可以準備下一場。");
  });

  el.joinButton.disabled = true;
  el.joinButton.addEventListener("click", () => {
    const name = el.playerName.value.trim() || "Player";
    const avatar = getAvatarById(appState.selectedAvatarId);
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

  const hop = () => {
    if (!appState.hostConnection?.open || !appState.localPlayer || el.boostButton.disabled) return;
    appState.hostConnection.send({ type: "hop", playerId: appState.playerId });
  };

  el.boostButton.addEventListener("pointerdown", hop);
  el.boostButton.addEventListener("click", hop);
}

function init() {
  wireEvents();
  const params = new URLSearchParams(window.location.search);
  const join = params.get("join");

  if (join) {
    startPlayerMode(join);
  } else {
    startHostMode();
  }
}

init();
