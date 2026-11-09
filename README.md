# 动效档案 · UIAnimation-Prompt

Flutter 动效提示词 + 可交互网页预览资料库。原生 HTML / CSS / JavaScript，无后端、无构建、无第三方运行依赖。

## 打开网站

下载仓库后直接双击 `index.html`。也可以在仓库根目录启动静态服务器：

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

随后访问 `http://localhost:4173`。运行不需要 Node.js；下面的开发校验才需要 Node.js 18+。

## 使用

- 左侧选择位置，顶部搜索关键词或多选类型。不同维度取交集，同一维度多选取并集；关键词按空格拆分，均须匹配。
- 搜索覆盖标题、摘要、提示词正文、位置及类型中文名称。无结果时可一键清空筛选。
- 卡片进入详情；点击详情标签跳转筛选；返回资料库保留之前条件。Hash 地址可刷新和分享。
- 手机预览内的按钮触发交互；外侧可重播、4 倍慢放、模拟慢网络、减少动态效果。修改动效/加载设置会重置预览，取消旧异步任务。
- 慢网只是延长模拟加载时间，不拦截真实请求；慢放控制动效，不等同于网络延迟。
- 深浅色默认跟随系统，手动选择后保存在本地；减少动态效果默认跟随系统，也可在预览手动调整。
- “复制提示词”只复制当前原文；“连同依赖模块一起复制”先递归展开依赖、去重，再按依赖在前的顺序拼接。若浏览器拒绝自动复制，页面会选中文本供手动复制，含依赖版本会打开可选中文本框。

### 原文与依赖

`sources/flutter-prompts.md` 是用户提供的原始文档。第一版 8 条 `prompt` 与其中对应的 `text` 代码块正文逐字一致（不含围栏），不纠正原文错字、不更改标点或换行。摘要与分类是独立元数据。

- A 通用规则：无依赖。
- B 菜单、C 广告、D 列表、E 抽屉、F 转场：依赖 A。
- 完整首页：原文已经内含通用规则，无需附加模块。
- 完整列表页：按原文引用依赖 A、B、D；拼接时 A 只出现一次。

网页仅模拟动效观感，不是 Flutter 实现。系统返回/预测性返回、实际广告 SDK、真机性能与无障碍 API 兼容性须在 Flutter 项目中另行验证。广告全部为无外链的测试示意，不接入广告平台。

### 扩充内容与来源

资料库共 32 个效果：8 条用户原文 + 24 条根据 Flutter / Material 官方文档整理编写的提示词。整理内容不是官方原文，也没有声称经过 Flutter 编译运行。详情页会显示内容来源、具体参考链接与可观察的预览验收要点。

| 组别 | 新增效果 |
| --- | --- |
| 弹窗与浮层（5） | 居中对话框、底部弹层、二次确认、提示条与撤销、工具提示 |
| 导航与标签（5） | Tab 内容切换、Tab 指示器、底部导航、步骤切换、分段选择 |
| 内容与列表（5） | 折叠面板、拖动排序、滑动删除与撤销、图片占位过渡、搜索建议 |
| 控件反馈（5） | 按钮加载与结果、收藏反馈、开关切换、表单校验、进度与完成 |
| 详情与滚动（4） | 共享元素、滚动收缩标题栏、返回顶部、图片切换 |

位置分类从 8 个扩为 13 个，新增按钮/开关、表单/搜索、图片/媒体、提示/反馈、滚动区域。效果类型从 8 个扩为 16 个，新增浮层开合、选中/指示器、拖动/排序、点击反馈、输入/校验、进度/完成、共享元素、滚动联动。原分类 ID 保持不变。

测试分层：脚本检查数据、依赖、检索和原文保真；提示词人工/交叉审查检查具体性、取消和无障碍要求；浏览器逐条操作对照验收要点。网页模拟能验证观感与状态顺序，不能证明某个 Flutter 项目的代码、原生手势或生命周期正确。

## 新增一个效果：两步

1. 在 `demos/` 新增独立 HTML。复制最接近的现有预览，修改文件内的 `api.mount(function () { ... })` 场景；保留底部兼容加载器，共享部件无需改动。
2. 在 `data/effects.js` 数组末尾增加一条记录：

```js
{
  id: 'my-new-effect',
  title: '新效果',
  positions: ['detail'],
  types: ['state-change'],
  summary: '一句话描述使用场景。',
  prompt: '可直接复制的完整提示词原文',
  dependsOn: ['module-a-rules'],
  demo: 'demos/my-new-effect.html',
  updatedAt: '2026-11-09'
}
```

`id` 必须唯一、使用小写英文/数字/连字符，`demo` 使用仓库相对路径。`positions`、`types` 可多选；`dependsOn` 使用效果 ID，不得循环。`prompt` 可使用 `\n` 换行，注意转义引号；页面渲染后的字符串即复制原文。

可选来源字段：用户原文标记 `authorship: 'original'`；整理内容标记 `authorship: 'curated'` 并提供 `references: [{title, url}]`（官方 HTTPS 链接）和 `acceptance: ['可在预览观察的检查项', ...]`（至少 3 条）。未标记时显示“自定义提示词”，不会冒充原文。整理模块建议依赖 `module-a-rules`，并明确取消、减少动态效果和网页/Flutter 的验证边界。

无需注册路由或修改首页 HTML。新增条目自动进入卡片、搜索和筛选；卡片装饰图形自动分配。

### 自定义预览模板

复制 `demos/general-rules.html`，保留底部的资源兼容加载器与 `#demo` 容器，只替换 `mountScene` 函数内的 `api.mount(...)` 内容，例如：

```js
api.mount(api => {
  const demo = document.querySelector('#demo');
  demo.innerHTML = '<button>点击预览</button>';
  const button = demo.querySelector('button');
  api.listen(button, 'click', () => {
    api.stop(button);
    api.animate(button, [
      { opacity: 0.3, transform: 'translateY(' + api.distance + ')' },
      { opacity: 1, transform: 'translateY(0px)' }
    ], '--motion-fast');
  });
});
```

使用 `api.listen`、`api.later`、`api.animate` 管理监听、定时任务与动画，重播时自动清理；用 `api.loadTime` 模拟加载。异步连续步骤必须检查动画返回值，`false` 表示已取消。`api.resize` 处理高度过渡及视口上方高度变化的滚动补偿。时长、曲线、位移必须复用 `motion-tokens.css`，不要散落硬编码参数。

预览通过 iframe 的 `sandbox="allow-scripts"` 隔离。由于隔离帧和本地文件可能使用不透明来源，消息不按 origin 白名单验证，而按 `event.source` 和消息字段校验；请勿加入任意外部 URL 或第三方脚本加载接口。

Chrome 会阻止隔离的 `file://` iframe 加载本地外部资源，因此双击模式由预览内联加载器向当前父窗口请求仓库自带的共享资源缓存，再在隔离帧内初始化；不放宽 sandbox 权限。HTTP 模式直接加载原始共享文件。新增预览复制现有文件即可，**不需要生成缓存**；仅在修改共享 CSS、动效参数、runtime 或 components 后运行 `node scripts/build-preview-assets.mjs` 同步 `data/preview-assets.js`，校验脚本会检查缓存是否过期。

## 新增位置或类型：一处配置

在 `data/taxonomy.js` 的 `positions` 或 `types` 数组增加 `{ id: 'stable-id', label: '中文名称' }`，然后在效果记录引用 ID。导航、计数、搜索、标签均自动生成，无需改页面代码。ID 应保持稳定；零条目的分类仍可选择。

## 部署到 GitHub Pages

将变更合入默认分支后，在仓库 **Settings → Pages → Build and deployment** 选择 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存即可。无需打包、无需后端。全部资源用相对路径，兼容项目子路径；页面路由使用 Hash，不依赖 404 重写。

## 开发校验

```sh
node tests/validate-data.mjs
node tests/motion-runtime.mjs
node tests/progress-status.mjs
find data scripts demos/shared -name '*.js' -exec node --check {} \;
git diff --check
```

数据校验覆盖首批 8 条原文一致性、必填字段、分类 ID、预览和资源文件存在性、依赖顺序/去重/循环、搜索与组合筛选，以及新增分类和条目的兼容性。没有 TypeScript，无需类型编译；没有 pre-commit 配置或第三方 lint 工具。浏览器交互、剪贴板权限、响应式和视觉观感需要另行浏览器验证，不能仅凭脚本校验声明通过。

## 全部项目文件

```text
.gitignore                       本地环境、编辑器及系统文件忽略规则
index.html                       资料库页面外壳
README.md                        本文
assets/favicon.svg               本地站点图标
data/taxonomy.js                 位置、类型配置
data/effects.js                  所有效果记录与原文
data/preview-assets.js           双击模式的共享资源缓存（自动生成）
sources/flutter-prompts.md       提供的 Markdown 原件
styles/app.css                   资料库界面、主题、响应式
styles/motion-tokens.css         所有预览共用动效参数
scripts/library.js               纯检索与依赖拼接逻辑
scripts/build-preview-assets.mjs 修改共享资源后更新双击兼容缓存
scripts/app.js                   视图、路由、筛选、复制与预览控制
demos/shared/demo.css            预览中的手机界面与基础部件样式
demos/shared/runtime.js          统一控制、任务清理与消息校验
demos/shared/components.js       可复用演示部件，不注册具体场景
demos/general-rules.html         A 通用规则场景
demos/menu-skeleton.html         B 菜单骨架场景
demos/home-ad.html               C 广告场景
demos/list-motion.html           D 列表场景
demos/drawer.html                E 抽屉场景
demos/page-transition.html       F 转场场景
demos/complete-home.html         完整首页场景
demos/complete-list.html         完整列表页场景
demos/dialog-focus.html          居中对话框与焦点
demos/bottom-sheet.html          底部弹层与拖动
demos/confirm-dialog.html        二次确认
demos/snackbar-undo.html         提示条与撤销
demos/tooltip-reveal.html        工具提示
demos/tabs-crossfade.html        Tab 内容切换
demos/tab-indicator.html         Tab 指示器
demos/bottom-navigation.html     底部导航
demos/stepper-progress.html      步骤切换
demos/segmented-control.html     分段选择
demos/accordion.html             折叠面板
demos/reorder-list.html          拖动排序
demos/swipe-dismiss.html         滑动删除与撤销
demos/image-placeholder.html     图片占位过渡
demos/search-suggestions.html    搜索建议
demos/async-button.html          按钮加载与结果
demos/favorite-toggle.html       收藏反馈
demos/switch-toggle.html         开关切换
demos/form-validation.html       表单校验
demos/progress-status.html       进度与完成
demos/shared-element.html        共享元素
demos/collapsing-header.html     滚动收缩标题栏
demos/back-to-top.html           返回顶部
demos/image-gallery.html         图片切换
tests/validate-data.mjs          无第三方依赖的数据与逻辑校验
tests/motion-runtime.mjs         高度动画阅读锚点及打断/反向回归校验
tests/progress-status.mjs        进度满值、迟到采样、重置与防重回归校验
```
