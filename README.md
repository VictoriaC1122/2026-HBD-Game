# Birthday Dash

一個可以直接部署到 GitHub Pages 的多人生日派對競速遊戲。

## 玩法

- 主持人在電腦或平板開啟首頁，畫面會自動建立房間與 QR Code。
- 玩家用手機掃描 QR Code 後，輸入名字、選擇預設頭像並加入。
- 房主按下開始比賽後，大家在手機上狂按「點我衝刺」讓角色一路往終點旗前進。
- 踩到星星加速格會多往前衝，踩到泥巴格會被拖慢。
- 第一個到達終點的玩家獲勝。

## 部署到 GitHub Pages

1. 在 GitHub 建立一個新的 repository。
2. 把這個資料夾內的 `index.html`、`styles.css`、`app.js`、`README.md` 上傳到 repository 根目錄。
3. 到 GitHub repository 的 `Settings` -> `Pages`。
4. 在 `Build and deployment` 裡把 source 設成 `Deploy from a branch`。
5. 選擇你的分支，例如 `main`，資料夾選 `/ (root)`。
6. 儲存後等待 GitHub Pages 發佈完成。

## 注意事項

- 這個版本是純前端靜態網站，適合直接放在 GitHub Pages。
- 即時多人連線使用 [PeerJS](https://peerjs.com/) 公用 broker 做瀏覽器之間的連線協調，所以不需要自己架後端。
- 建議使用最新版的 Chrome 或 Safari 開啟。
- 如果現場網路較差，手機連線品質可能會受影響。
