# Birthday Battle Arena

一個生日派對用的多人手機控制亂鬥遊戲。

房主用電腦、電視或投影開啟主畫面，玩家掃 QR Code 加入，手機會變成控制器。遊戲採用「host-authoritative」房間狀態，玩家手機只送出簡短 input event，房主端負責模擬戰鬥、同步狀態與判定勝負。

## Production Upgrade

- 主舞台改為 Canvas 渲染，減少大量 DOM churn，較適合 30 到 50 人觀戰與同場角色顯示。
- 首屏重新設計，QR Code、Room Code、人數、主持操作按鈕都集中在最重要區域。
- 新增玩家 Lobby grid，每位玩家顯示名字、角色、狀態與房主移除按鈕。
- 新增 Battle Feed、Round Timer、Alive Count、Winner 結算卡與 Play Again CTA。
- 手機控制器改成 thumb-friendly layout，支援大按鍵、pressed state、震動回饋、攻擊命中確認與淘汰狀態。
- 加入 max players、sound toggle、清除離線玩家、手動切換房間狀態等主持工具。
- 網路訊息改成 compact event：`join`、`input`、`heartbeat`、`state`、`hit-confirm`、`winner`。
- 補上可選 WebSocket room server，作為未來更穩定 50 人房間的升級路徑。
- Canvas 會依裝置像素比例自動調整 backing store，保持大螢幕與手機預覽清晰。
- WebSocket transport 支援 host-to-player direct feedback，命中、被擊中、淘汰、踢出玩家都能回送到指定手機。

## Static GitHub Pages Deployment

目前前端仍可直接部署在 GitHub Pages，不需要 build step。

需要放在 repository root 的檔案：

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

部署步驟：

1. 到 GitHub repository 的 `Settings` -> `Pages`。
2. Source 選 `Deploy from a branch`。
3. Branch 選 `main`，folder 選 `/ (root)`。
4. 等 GitHub Pages 發佈完成。

## Local Preview

因為使用 ES module，建議用本機靜態 server 開：

```bash
python3 -m http.server 8080
```

然後開啟：

```text
http://localhost:8080
```

## Optional WebSocket Server

GitHub Pages 版本預設使用 PeerJS，零後端即可玩。若活動現場需要更穩定的大房間、私有 relay 或未來改成完整 server-authoritative simulation，可以使用 `server/`。

```bash
cd server
npm install
npm start
```

預設：

- Port: `8787`
- Max players: `50`

啟用 server transport 的方式：

```text
http://localhost:8080/?server=ws://localhost:8787
```

房主用這個網址開房後，畫面會產生含有 `server` 與 `room` 參數的 QR Code。玩家掃碼後會走 WebSocket room server，而不是 PeerJS。

更多說明在 `server/README.md`。

## Current Architecture

- `index.html`: frontend client markup for host screen, lobby, canvas arena, and mobile controller.
- `styles.css`: frontend visual system, RWD, host dashboard, mobile controller ergonomics.
- `app.js`: frontend game constants, PeerJS/WebSocket transport, host-authoritative simulation, Canvas renderer, lobby/HUD/controller state.
- `server/`: optional Node.js WebSocket room server.

## Notes

- 靜態版本的多人連線仍受 PeerJS 公用 broker、現場 Wi-Fi 與瀏覽器限制影響。
- Canvas 主舞台與 compact network messages 已經朝 50 人房間優化，但大型現場活動建議使用可控網路與可選 WebSocket server。
- 音效由 Web Audio API 產生，瀏覽器通常需要使用者互動後才會播放。
