# Nathan's Universe · 太阳系动态交互 3D 探索网页

基于 **Three.js r160** 的太阳系 3D 交互网页。支持中英双语、天体/卫星信息面板、随机测验、像素方块模式，以及飞行器（旅行者1号、2号）轨迹模拟。

---

## 一、当前功能（截至本轮）

1. **3D 动态太阳系**
   - 太阳（含光晕 + 光源）、八大行星、5 颗矮行星（冥王星 + 谷神星/妊神星/鸟神星/阋神星）、小行星带、柯伊伯带。
   - 公转 + 自转动画；土星带光环；两条星带为粒子环 + 边界轨道。
   - 星空背景、行星轨道线、3D 悬浮标签。

2. **信息面板**（点击星球/星带或底部导航条查看）
   - 星球：年龄、直径、卫星数量、类型、气态/岩石、主要元素成分、自转/公转周期、重力（地球=1）。
   - 星带：介绍（四则）、天体数量、主要天体基本信息。

3. **中英双语切换**（顶栏「EN / 中文」按钮，即时切换无需刷新）
   - 界面文字、天体数据、测验、飞行器面板全部双语。
   - 语言偏好尚未持久化（默认中文）。

4. **小测验**（顶栏「测验」按钮）
   - 题库 **23 题**，每次随机抽 5 题、选项顺序随机打乱。
   - 答对随机给鼓励评价 + 图标，答错给提示 + 解析；提交后按总分给总评语。

5. **飞行器模块——旅行者1号、旅行者2号**
   - 程序化 3D 模型（金色/蓝色抛物面天线、主体、磁强计伸杆、3 台 RTG）。
   - 基本信息面板：国别、重量、尺寸、发射时间、状态、能源、任务目标、飞行时间线。
   - 飞行轨迹模拟（含日期标记与实时年份标签）：旅行者1号飞掠木星(1979)、土星(1980)后进入星际空间(2012)；旅行者2号飞掠木星、土星、天王星(1986)、海王星(1989)后进入星际空间(2018)。
   - **默认隐藏**：底部导航条分两行（上行天体、下行飞行器），点击对应飞行器才显示其模型与轨迹；点其它天体或关闭面板即隐藏。

6. **卫星展示**：点击行星/矮行星，在其周围显示重要卫星（小圆球 + 名称标签 + 轨道线，绕行星公转）；切换行星自动隐藏上一颗的卫星。

7. **像素模式**（顶栏「像素」按钮）：太阳和行星/矮行星变成方块（体素风格），再点一次恢复球体。

---

## 二、目录结构

```
太阳系前端网页/
├── index.html             # 页面入口（加载 js/bundle.js，含语言切换/测验/错误兜底）
├── css/style.css          # 全部样式（含测验、飞行器、时间线）
├── js/
│   ├── bundle.js          # ★ 打包产物（单文件 IIFE，页面实际加载它）
│   ├── main.js            # 源码：场景、动画、交互、测验、飞行器、i18n 逻辑
│   └── data.js            # 源码：全部数据（天体/星带/题目/飞行器，中英双语）
├── lib/
│   ├── three.module.js    # Three.js r160（ESM）
│   ├── OrbitControls.js   # 轨道控制器（已改为相对导入）
│   └── CSS2DRenderer.js   # 3D 标签渲染（已改为相对导入）
└── assets/textures/       # 行星贴图（Solar System Scope，CC BY 4.0）
```

> ⚠️ **重要**：页面加载的是打包后的 `js/bundle.js`。任何对 `js/main.js` / `js/data.js` 的修改，都必须**重新打包**后才生效。

### 重新打包命令

```bash
cd 太阳系前端网页
# esbuild 需先可用（可临时安装到 /tmp；本环境 npm 缓存为只读，需指定 --cache）
mkdir -p /tmp/esb && cd /tmp/esb && npm i esbuild --cache /tmp/esb-cache --no-audit --no-fund >/dev/null 2>&1
cd 太阳系前端网页
/tmp/esb/node_modules/.bin/esbuild js/main.js --bundle --format=iife --platform=browser --outfile=js/bundle.js
```

> 本环境的 npm 默认缓存目录为只读（`/home/natha/.npm`），所以安装 esbuild 必须用 `--cache /tmp/...`（且 `/tmp` 在两次 shell 调用之间不持久，需在同一条命令里完成安装+打包）。

---

## 三、如何运行

需通过本地 HTTP 服务器打开（避免 file:// 下的资源加载问题）：

```bash
cd 太阳系前端网页
python3 -m http.server 8000     # 浏览器访问 http://localhost:8000
```

> 当前预览服务器已在此环境以 `python3 -m http.server 8000` 后台运行中。
>
> 🌐 **已上线**：默认域名 <https://nathan-universe-dpo7e8ste9ut.edgeone.dev/>，自定义域名 <https://nathan26.space/>（HTTPS 已开）。
> 部署方案：GitHub + 腾讯云 EdgeOne Pages，改动推送后自动部署。详细步骤与「改动如何同步到线上」见 [DEPLOY.md](DEPLOY.md)。

---

## 四、数据约定（后续加内容时遵循）

所有文本字段均提供中文（默认）+ 英文（`_en` 后缀）两个版本。

- **天体（SUN / PLANETS / PLUTO / DWARF_PLANETS）**：`type_en`、`desc_en`、`age_en`、`composition_en`、`rotationPeriod_en`、`revolutionPeriod_en`、太阳另有 `satellitesNote_en`。渲染参数（color/texture/radius/orbitRadius/orbitPeriod/rotationSpeed/tilt/ring）不变；`texture: null` 的天体用 `makeProceduralTexture(color)` 生成斑驳纹理。
- **卫星（MOONS）**：按天体 id 索引，每项 `{name, en, radius, distance, color, speed}`（radius/distance 为视觉比例，speed 为视觉公转角速度）。
- **星带（BELTS）**：`location_en`、`intro_en`、`introItems_en`（数组，`{title,text}`）、`count_en`、`mainBodies_en`（数组，`{name,diameter,type,desc}`）。
- **测验（QUIZ）**：每题 `question_en`、`options_en`（与 `options` 等长）、`explain_en`；`answer` 是正确选项下标，两种语言共用同一下标。
- **飞行器（VOYAGER1）**：`timeline` 中每项 `{date, date_en, year, event, event_en, x, y, z}`，其中 `x/y/z` 为 3D 场景轨迹坐标（视觉比例），`year` 用于飞行中年份插值。
- **界面文案**：在 `main.js` 的 `UI = { zh: {...}, en: {...} }` 中维护；`L(zh,en)` 取当前语言值，`T(key)` 取界面文案。

**添加新飞行器**：在 `data.js` 新增数据对象，并在 `main.js` 的 `spacecraftList` 数组里加入即可（`createSpacecraft` 会按 `timeline` 的 x/y/z 生成轨迹，年份插值 `yearAt` 按各自时间线通用计算；当前 3D 模型统一使用 `createVoyagerModel`，后续可为不同飞行器做不同模型）。
**添加矮行星**：加入 `DWARF_PLANETS` 数组并在 `MOONS` 里补卫星即可（`bodies` 会自动并入渲染）。

---

## 五、已知限制 / 待办

**已知限制**
- 飞行器轨迹是**静态代表性路径**（按场景压缩比例绘制），未与实时公转的行星位置动态对齐；飞行速度与真实时间不成比例（为视觉演示简化）。
- 旅行者1号仅飞掠木星、土星（天王星/海王星是旅行者2号去的），时间线已如实反映。
- 行星轨道半径与体积为**压缩比例**（真实比例下内行星会小到不可见）。
- 本环境无 headless 浏览器，未能自动化验证 WebGL 渲染；目前以「语法检查 + 资源 200 + 用户实测」验证。
- 语言选择未持久化（刷新后回到中文）；`index.html` 内兜底错误脚本在极端加载失败时仍显示中文。

**后续计划（可继续）**
1. 增加其它飞行器：卡西尼号、新视野号、帕克太阳探测器、朱诺号等（每种可配独立 3D 模型）。
2. 飞行器轨迹改为跟随行星真实公转的动态弹道。
3. 语言选择持久化（localStorage）。
4. 测验扩展：限时模式、错题汇总、题量/难度可调。
5. 视觉增强：Bloom 后处理、音效、行星大气/云层、真实 NASA 纹理。

---

## 六、技术说明

- 贴图来源：[Solar System Scope](https://www.solarsystemscope.com/textures/)（CC BY 4.0）。
- 天体数据（年龄、直径、卫星数、周期、重力等）为公开科学资料整理值。
- 打包产物为单文件 IIFE（无 ES Module / import map 依赖），兼容性最好。
