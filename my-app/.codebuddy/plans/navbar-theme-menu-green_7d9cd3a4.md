---
name: navbar-theme-menu-green
overview: 把导航栏原来的「日/夜」二态切换按钮改成菜单式主题选择器，点击原按钮弹出菜单，可在奶白、护眼豆沙绿(#C7EDCC)、夜间三种背景主题间切换，并保持刷新后持久化与首屏不闪烁。
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: Geist
    heading:
      size: 14px
      weight: 600
    subheading:
      size: 13px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#C7EDCC"
      - "#FAF7F0"
    background:
      - "#FAF7F0"
      - "#C7EDCC"
      - "#18181B"
      - "#FFFFFF"
    text:
      - "#1F2A24"
      - "#E4E4E7"
    functional:
      - "#000000"
      - "#FFFFFF"
todos:
  - id: add-green-theme
    content: 在 globals.css 新增 .theme-green 护眼豆沙绿主题变量（#C7EDCC）
    status: completed
  - id: theme-menu-component
    content: 将 ThemeToggle 重构为 ThemeMenu 下拉菜单，含三态切换、色块选项与外部点击/Esc 关闭
    status: completed
  - id: wire-navbar-layout
    content: 更新 Navbar 引用 ThemeMenu，并改造 layout.tsx 防闪烁脚本支持三种主题、清理无用 import
    status: completed
    dependencies:
      - theme-menu-component
  - id: verify-ui
    content: 用 [mcp:Playwright MCP Server] 验证菜单交互、三主题切换与刷新持久化
    status: completed
    dependencies:
      - add-green-theme
      - theme-menu-component
      - wire-navbar-layout
---

## 产品概述

在导航栏的主题控件中新增第三种背景配色「护眼豆沙绿」，并将原先的日/夜二态切换按钮改造成下拉菜单：点击按钮弹出颜色选项，供用户选择整站背景配色。

## 核心功能

- 导航栏主题按钮点击后弹出菜单，菜单内含三个背景配色选项：奶白、护眼绿（#C7EDCC）、夜间
- 选择任一选项，整站背景色与文字色即时切换，并持久化保存，刷新浏览器后仍保持所选配色
- 每个选项显示对应色块与名称，当前生效项有勾选标识；按钮图标随当前主题变化（奶白=太阳、护眼绿=叶片、夜间=月亮）
- 菜单支持点击空白处或按 Esc 关闭；选择后自动关闭
- 首屏加载不闪烁：进入页面时在渲染前即应用已保存的配色
- 原有奶白、夜间两套配色完整保留，新增绿色为独立第三套浅色主题

## 技术选型

- 沿用现有技术栈：Next.js 16.2.10 + React 19 + Tailwind CSS 4
- 主题控件为客户端组件（保留 `"use client"`）
- 不引入任何新依赖、不使用组件库，沿用项目现有的 Tailwind + CSS 变量方案

## 实现方案

主题机制保持现有约定：在 `<html>` 上挂 class，由 `globals.css` 的 CSS 变量 `--background / --foreground` 承载配色，全站 `bg-background / text-foreground` 自动跟随。

三态设计：

- `light`（奶白）：`<html>` 无主题类，走 `:root` 默认变量
- `green`（护眼绿）：新增独立浅色主题类 `.theme-green`
- `dark`（夜间）：沿用 `.dark`

关键决策：**绿色主题必须是独立的浅色类（`.theme-green`），且绝不能叠加 `.dark`**。因为全站大量 Tailwind `dark:` 变体由 `@custom-variant dark (&:where(.dark, .dark *))` 驱动，一旦绿色主题带上 `.dark`，夜间样式会被误激活。同理，绿色主题下代码高亮（由 `.dark .shiki` 控制）自动回落浅色主题，无需改动。

组件改造：将 `components/ThemeToggle.tsx` 重命名为 `components/ThemeMenu.tsx`，由「二态切换按钮」重构为「下拉菜单」：

- 用 `useState` 管理 `theme: "light" | "green" | "dark"` 与 `open: boolean`
- `useEffect` 在挂载后从 `<html>` 的 class 同步当前主题，避免 SSR 水合不一致（保持现有「默认渲染太阳图标」的模式）
- 切换函数统一先移除 `dark`、`theme-green` 两个类，再按目标主题添加其一，并写入 `localStorage`（键仍为 `"theme"`，值新增 `"green"`，兼容旧值 `"light" / "dark" / null`）
- 打开状态时监听 `document` 的 `mousedown` 与 `keydown(Escape)`，点击容器外部或按 Esc 关闭；用 `useRef` 持有容器，事件在卸载/关闭时正确清理
- 无障碍：按钮 `aria-haspopup="menu"` + `aria-expanded`；菜单 `role="menu"`，每项 `role="menuitemradio"` + `aria-checked`；选项用原生 `<button>`，天然支持键盘

防闪烁：`app/layout.tsx` 的 `<head>` 内联 `themeScript` 由两分支扩展为三分支（读到 `dark` 加 `.dark`；读到 `green` 加 `.theme-green`；无值且系统偏好深色时加 `.dark`），保持同步执行。同时移除 `layout.tsx` 中未使用的 `ThemeToggle` import（死代码，且重命名后会失效）。

性能与可靠性：

- 纯 class 切换，无额外网络请求与重渲染成本；避免在渲染期读取 `localStorage`
- 事件监听仅在菜单打开时挂载，关闭即清理，防止内存泄漏
- 三态读写集中在一个 `applyTheme` 函数，读写路径唯一，避免状态不一致

## 实施注意

- 不得修改 `.dark` 类名（全站 `dark:` 变体依赖它）
- `globals.css` 中 `.theme-green` 需定义在 `:root`、`.dark` 同级位置，确保优先级正确
- 保持既有视觉风格（圆角、细边框、轻阴影、跟随主题的背景），不引入新的设计语言
- 属静态导出项目（`output: "export"`），本改动为纯客户端交互，不影响构建与路由

## 目录结构

```
my-app/
├── app/
│   ├── globals.css        # [MODIFY] 新增 .theme-green 护眼豆沙绿主题变量（--background/--foreground）
│   └── layout.tsx         # [MODIFY] themeScript 扩展为三分支；移除未使用的 ThemeToggle import
├── components/
│   ├── ThemeMenu.tsx      # [NEW] 由 ThemeToggle 重构的下拉菜单组件（三态选择、色块选项、外点/Esc 关闭）
│   ├── ThemeToggle.tsx    # [DELETE] 被 ThemeMenu 取代（行为由二态切换变为菜单）
│   └── Navbar.tsx         # [MODIFY] 引用改为 ThemeMenu
```

## 关键代码结构

```css
/* globals.css —— 新增独立浅色主题（不含 .dark，避免误触发 dark: 变体） */
.theme-green {
  --background: #c7edcc; /* 护眼豆沙绿 */
  --foreground: #1f2a24; /* 沿用浅色主题的墨绿近黑，保证对比度 */
}
```

```ts
type Theme = "light" | "green" | "dark";

/** 统一应用主题：先清空主题类，再按目标添加，避免残留 */
function applyTheme(t: Theme, root: HTMLElement = document.documentElement) {
  root.classList.remove("dark", "theme-green");
  if (t === "dark") root.classList.add("dark");
  else if (t === "green") root.classList.add("theme-green");
}
```

## Agent Extensions

### MCP

- **Playwright MCP Server**
- Purpose: 在浏览器中打开本地站点，验证主题菜单的打开/关闭、三种配色切换以及刷新后配色保持；确认首屏无闪烁。
- Expected outcome: 截图与交互记录证明菜单可正常弹出、点击「护眼绿」后整站背景正确变为 #C7EDCC、切回奶白/夜间正常，刷新后仍保持所选配色，且菜单外点与 Esc 可关闭。