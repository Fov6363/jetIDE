# 🚀 JetIDE

> ⚡ 一款轻量、高性能、支持 AI 辅助的现代代码编辑器。

JetIDE 专为开发者打造，追求极速启动、极简体验与智能编码辅助。适用于日常开发、学习和轻量项目编辑。

---

## ✨ 特性亮点

- 🧠 **AI 助手集成**：原生支持 OpenAI GPT 接口，提供智能代码建议、注释、重构等功能。
- ⚡ **极速体验**：基于 Vite + Electron，启动速度快，响应流畅。
- 🧩 **文件树浏览**：可打开本地文件夹，浏览与编辑文件结构。
- 🧑‍💻 **内置 Monaco 编辑器**：VS Code 同源编辑体验，键位、语法高亮全支持。
- 🪶 **超轻量架构**：不绑定大型 IDE 插件系统，保持最小可用、可控、可拓展。

---

## 🧰 技术栈

| 技术        | 说明                             |
| ----------- | -------------------------------- |
| Electron    | 桌面端跨平台运行时环境           |
| React       | 前端 UI 框架                     |
| TypeScript  | 强类型支持，提高开发效率         |
| Vite        | 极速构建工具，秒级热更新         |
| TailwindCSS | 原子化 CSS 快速构建界面          |
| Monaco      | 微软开源编辑器内核（同 VS Code） |
| Zustand     | 状态管理工具（轻量无依赖）       |
| OpenAI API  | 智能提示、辅助编程接口           |

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/jetide.git
cd jetide
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 3. 开发运行

```bash
# 启动开发环境
npm run dev

# 或
yarn dev
```

### 4. 打包构建

```bash
# 构建生产版本
npm run build

# 打包成可执行文件
npm run package
```

---

## 💡 使用指南

### 基础功能

1. **打开文件夹**：点击左上角文件夹图标，选择要编辑的项目目录
2. **文件浏览**：在左侧文件树中浏览和管理文件
3. **代码编辑**：在中央编辑器区域进行代码编写
4. **多标签页**：支持同时打开多个文件，标签页切换

### AI 助手功能

1. **智能补全**：输入代码时自动触发 AI 建议
2. **代码解释**：选中代码片段，右键选择"AI 解释"
3. **代码重构**：选中代码，使用 AI 助手进行优化重构
4. **生成注释**：为函数和类自动生成文档注释

### 快捷键

| 功能        | 快捷键                 |
| ----------- | ---------------------- |
| 打开文件夹  | `Cmd/Ctrl + O`         |
| 新建文件    | `Cmd/Ctrl + N`         |
| 保存文件    | `Cmd/Ctrl + S`         |
| 查找替换    | `Cmd/Ctrl + F`         |
| 全局搜索    | `Cmd/Ctrl + Shift + F` |
| 命令面板    | `Cmd/Ctrl + Shift + P` |
| AI 助手面板 | `Cmd/Ctrl + I`         |

---

## ⚙️ 配置

### AI 配置

1. 在设置中配置 OpenAI API Key
2. 选择合适的模型（GPT-3.5 或 GPT-4）
3. 调整温度参数和最大令牌数

### 编辑器配置

- 主题设置：支持亮色/暗色主题切换
- 字体配置：可自定义字体家族和大小
- 缩进设置：支持空格/Tab 切换，可调节缩进大小

---

## 🔧 开发指南

### 项目结构

```
jetide/
├── src/
│   ├── main/          # Electron 主进程
│   ├── renderer/      # React 渲染进程
│   └── shared/        # 共享类型和工具
├── public/            # 静态资源
├── dist/              # 构建输出
└── package.json       # 项目配置
```

### 开发环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 (或 yarn >= 1.22.0)

### 调试

```bash
# 开启开发者工具
npm run dev:debug

# 主进程调试
npm run debug:main

# 渲染进程调试
npm run debug:renderer
```

---

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 和 Prettier 规范
- 提交前运行测试：`npm run test`
- 确保代码通过类型检查：`npm run type-check`

---

## 📝 更新日志

### v0.1.0 (2024-01-XX)

- ✨ 初始版本发布
- 🧠 集成 OpenAI AI 助手
- 🧩 实现文件树浏览
- 🧑‍💻 集成 Monaco 编辑器
- ⚡ 基于 Vite + Electron 架构

---

## 🐛 问题反馈

如果您遇到任何问题，请通过以下方式反馈：

- [GitHub Issues](https://github.com/your-username/jetide/issues)
- 邮箱：your-email@example.com

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看 LICENSE 文件了解详情。

---

## 🌟 致谢

感谢以下开源项目为 JetIDE 提供支持：

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 强大的代码编辑器
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 现代前端构建工具
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

<div align="center">

**[⬆ 回到顶部](#-jetide)**

Made with ❤️ by JetIDE Team

</div>
