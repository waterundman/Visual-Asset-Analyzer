# Visual Asset Analyzer: 迭代文档 (Iteration Plan)

## 1. 现状分析 (Current State Analysis)
当前版本的应用已具备核心功能：支持图片上传（点击或拖拽）、基于 Gemini 3.1 Pro 模型生成涵盖五个维度的深度图像长文本标注，并提供了复制功能。整体 UI 基于 Tailwind CSS 与 Shadcn 组件，风格现代且整洁。

**存在的局限性与改进空间：**
1. **渲染格式限制**：AI 生成的文本通常包含 Markdown 语法（如加粗的 `**维度名称**`），而当前版本是用普通文本渲染的，导致视觉层次感较差。
2. **缺乏个性化配置**：所有的系统预设（输出语言为中文，详细程度为长文本）被硬编码。用户可能希望生成英文的标注，或者只想要一段简练的描述。
3. **UX 交互细节可优化**：在拖拽图片进入上传区域时，没有明显的视觉反馈提示用户“已进入有效释放区域”。

## 2. 迭代目标 (Iteration Goals)
本次迭代旨在进一步提升工具的专业度、灵活性与用户体验。

### Phase 1: Markdown 与排版升级
- **引入 `react-markdown`**：解析并渲染 AI 侧返回的 Markdown 文本结构（加粗、列表等），使得这五个维度的分析更易读。
- **自定义 Markdown 样式**：结合 Tailwind 的 Typography 插件规范，应用清晰的标题层次和正文间距。

### Phase 2: 动态提示词与用户自选配置 (Configuration Panel)
- 提供 **语言选项 (Language Option)**：允许用户选择生成的中/英文标注（Chinese / English）。
- 提供 **详细度选项 (Detail Level)**：允许用户选择“详尽模式 (Detailed)”（200-500字）或“简练模式 (Concise)”（约100-200字）。
- 相应的重构 `App.tsx` 中的提示词生成逻辑，使其变为动态接收参数的函数。

### Phase 3: 交互与打磨 (UI/UX Polish)
- **拖拽状态高亮**：为上传区域添加 `isDragging` 状态变量，当文件拖至该区域上方时，边框颜色和背景色将产生明显变化，增强反馈。
- **清空图片功能**：加入移除当前所选图片的按钮，方便用户取消或重置状态。

## 3. 执行步骤 (Action Items)
1. 使用工具包安装 `react-markdown` 依赖。
2. 修改 `/src/App.tsx`，将现有的硬编码 `PROMPT` 转为动态函数。
3. 在左侧面板中新增一些简洁的 Select 或 Button-Group 用以选择语言与颗粒度。
4. 在拖放容器上绑定 `onDragEnter`, `onDragLeave` 控制拖拽高亮状态。
5. 将结果展示区域包裹在 `react-markdown` 中进行渲染。
6. 最后进行代码 Linting 和构建验证。
