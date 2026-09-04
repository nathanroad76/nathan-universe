# 上线部署手册：GitHub + EdgeOne Pages（腾讯云）

> 目标：把本项目（Nathan's Universe · 太阳系 3D 交互网页）发布到公网。
> 方案：代码托管到 **GitHub**，用腾讯云 **EdgeOne Pages** 做静态托管 + 自动部署。
> 仓库：<https://github.com/nathanroad76/nathan-universe>（public，默认分支 `main`）
> 线上地址：<https://nathan-universe-dpo7e8ste9ut.edgeone.dev/>（EdgeOne 默认域名）
> 自定义域名：<https://nathan26.space/>（✅ 已上线，HTTPS 已签发、已强制跳转）
> 本手册由会话中逐步执行并更新；控制台按钮文案以实际界面为准。

---

## 阶段 0：部署前准备（✅ 已完成）

本项目是**纯静态站点**，无需构建：
- 页面直接加载 `js/bundle.js`（已打包的三方库 + 业务代码）与 `assets/`、`css/` 等静态资源。
- 所有资源路径均为相对路径，从仓库**根目录**部署即可。

已完成：
- [x] 本地 git 仓库初始化（分支 `main`）
- [x] `.gitignore`（排除 node_modules / 日志 / 编辑器文件）
- [x] 22 个文件已提交（含 DEPLOY.md，无 node_modules）
- [x] 资源体量约 9 MB（主要为行星贴图），满足静态托管限制

---

## 阶段 1：推送代码到 GitHub（✅ 已完成 2025 会话）

- [x] 仓库 `nathanroad76/nathan-universe` 已存在（public）
- [x] 本地身份：`git config user.name/email` = `nathanroad76`
- [x] 首次提交 `967acb3 feat: Nathan's Universe 初始版本上线`
- [x] 通过 HTTPS + Personal Access Token 推送成功（token 已写入本地 `.git/config` 的 remote URL）
- [ ] ⚠️ 后续建议：token 用完可撤销/轮换；长期可改用 gh CLI 或 SSH 密钥（见「阶段 5」）。

---

## 阶段 2：在腾讯云 EdgeOne Pages 创建项目并部署（✅ 已完成）

> ✅ 已完成：控制台已创建 EdgeOne Pages 项目并连接 GitHub `nathanroad76/nathan-universe`（main 分支），构建配置为「无构建、输出目录仓库根」，默认域名已上线。

1. 浏览器登录腾讯云控制台：<https://console.cloud.tencent.com/> → **EdgeOne** → **Pages**。
   （若未开通：按提示开通 EdgeOne 服务；Pages 首次使用需授权。）
2. **新建项目** → 选择来源 **Git/GitHub** → 按提示 **授权连接 GitHub 账号**（腾讯云 OAuth 跳转 GitHub，勾选允许访问该仓库）。
3. 选择仓库 `nathan-universe`，分支 `main`。
4. **构建配置**（本项目无需真实构建，请这样填）：
   - 框架预设 / Framework：**Static（静态）/ 无 / None**
   - 构建命令 Build command：**留空**（或填 `echo no-build`）
   - 输出目录 Output directory：**`.`**（仓库根目录；若平台要求绝对路径则填 `/`）
   - 构建产物目录若平台必填：填 `/`（产物即仓库根）
5. 点击 **部署 Deploy**。
6. 部署完成后获得**默认访问域名**（形如 `https://xxxx.pages.dev` 或平台分配域名），打开验证。

### 若 Git 集成不可用（备选）
EdgeOne Pages 通常支持直接**上传静态文件**：控制台把 `index.html + css/ + js/ + lib/ + assets/` 上传即可（等价于仓库根目录内容）。

---

## 阶段 3：上线验证清单（✅ 已通过）

部署域名：<https://nathan-universe-dpo7e8ste9ut.edgeone.dev/>

自动验证结果（2025 会话）：
- [x] 首页 HTTP 200；`<title>Nathan's Universe</title>`
- [x] 静态资源 200：`css/style.css`、`js/bundle.js`（~1.0 MB）、`lib/three.module.js`、行星贴图等
- [x] `js/bundle.js` 内含完整功能（中英双语 / 飞行器 / 像素模式 / 测验）
- [x] 自定义域名 `https://nathan26.space` HTTP 200、证书 `CN=nathan26.space`（TrustAsia）校验通过、`http` 已 302 跳转 `https`
- [ ] 浏览器人工确认：3D 渲染、点击交互、像素、测验、卫星展示等（建议实测一遍）

---

## 阶段 4：自定义域名 + HTTPS（✅ 已完成）

> 自定义域名 `nathan26.space` 已接入，DNS 解析到 EdgeOne，HTTPS 证书（免费证书，TrustAsia，RSA 2048）已部署，强制 HTTPS（302 跳转）已开启。

1. 在 EdgeOne 控制台把自有域名接入 EdgeOne 站点（DNS 解析 / CNAME）。
2. 在 Pages 项目设置中添加自定义域名，指向该域名。
3. 为域名签发 HTTPS 证书（EdgeOne 提供免费证书，自动续期）。
4. 更新 DNS 记录后等待生效（数分钟到数小时）。
5. 建议开启「强制 HTTPS」：控制台 → 站点 → HTTPS 配置 → 强制 HTTPS（HTTP 302→HTTPS），否则浏览器地址栏会显示「不安全」。

---

## 阶段 5：后续迭代上线流程

```bash
cd 太阳系前端网页
# 1) 修改源码 js/main.js / js/data.js 等
# 2) 重新打包（本环境 npm 缓存只读，需 --cache /tmp/...）
mkdir -p /tmp/esb && cd /tmp/esb && npm i esbuild --cache /tmp/esb-cache --no-audit --no-fund >/dev/null 2>&1
cd 太阳系前端网页 && /tmp/esb/node_modules/.bin/esbuild js/main.js --bundle --format=iife --platform=browser --outfile=js/bundle.js
# 3) 提交并推送 → EdgeOne Pages 自动重新部署
git add -A && git commit -m "update" && git push
```

### 验证「改动 → 自动同步到线上」（下次先做）
做完一次改动后，用以下方式确认线上已更新：
```bash
# 1. 本地改 → 重新打包 bundle.js
# 2. 推送
git add -A && git commit -m "feat: ..." && git push
# 3. 等 EdgeOne 自动部署（通常 1-3 分钟）
# 4. 对比本地与线上的 bundle.js 是否一致（哈希一致=已同步）
sha256sum js/bundle.js
curl -s "https://nathan26.space/js/bundle.js" | sha256sum
# 5. 也可搜索新增特征关键词是否出现在线上 bundle 中
curl -s "https://nathan26.space/js/bundle.js" | grep -c "新增特征关键词"
# 6. 若未同步：到 EdgeOne 控制台看「部署记录」是否触发/成功；确认 push 到了 main 分支。
```

---

## 常见问题

- **部署后样式/3D 失效**：多为「输出目录」填错。确认输出目录是仓库根（`.` 或 `/`），且 `index.html` 在根目录。
- **资源加载 404**：确认 `css/js/assets/lib` 都被推送/上传（注意上传时不要漏 `.gitignore` 不存在的目录）。
- **EdgeOne 构建失败**：本项目无构建步骤，若平台强制构建，把构建命令设为空或 `echo` 占位即可。
- **https 证书待签发**：首次部署等几分钟，或检查域名解析是否正确。
