# 偏爱

## 启动

1. 将 `.env.example` 复制为 `.env`。
2. 在 `.env` 中填写 `TMDB_READ_TOKEN` 或 `TMDB_API_KEY`。
3. 右键 `start.ps1`，选择“使用 PowerShell 运行”。
4. 浏览器打开 `http://127.0.0.1:4173`。

凭证仅由 `server.js` 在服务端读取，不会进入页面、浏览器存储或前端请求。
启动脚本会自动检测 `127.0.0.1:7890` 的本地代理，方便在规则模式下访问 TMDB。
