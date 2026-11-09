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

## 新增一个效果：两步

1. 在 `demos/` 新增独立 HTML。可复制最接近的现有预览，修改文件内的 `api.mount(function () { ... })` 场景；共享部件无需改动。完全自定义时只保留公共 CSS、`runtime.js` 和一个 `#demo` 容器，并调用 `MotionDemo.mount`。
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

无需注册路由或修改首页 HTML。新增条目自动进入卡片、搜索和筛选；卡片装饰图形自动分配。

### 自定义预览最小模板

```html
<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="../styles/motion-tokens.css">
<link rel="stylesheet" href="shared/demo.css">
<script defer src="shared/runtime.js"></script>
<main id="demo"></main>
<script>
window.addEventListener('DOMContentLoaded', () => {
  MotionDemo.mount(api => {
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
});
</script>
</html>
```

使用 `api.listen`、`api.later`、`api.animate` 管理监听、定时任务与动画，重播时自动清理；用 `api.loadTime` 模拟加载。异步连续步骤必须检查动画返回值，`false` 表示已取消。`api.resize` 处理高度过渡及视口上方高度变化的滚动补偿。时长、曲线、位移必须复用 `motion-tokens.css`，不要散落硬编码参数。

预览通过 iframe 的 `sandbox="allow-scripts"` 隔离，只接受当前父窗口的固定结构消息。由于隔离帧和本地文件可能使用不透明来源，消息不按 origin 白名单验证，而按 `event.source` 和消息字段校验；请勿加入任意脚本执行或任意 URL 加载接口。

## 新增位置或类型：一处配置

在 `data/taxonomy.js` 的 `positions` 或 `types` 数组增加 `{ id: 'stable-id', label: '中文名称' }`，然后在效果记录引用 ID。导航、计数、搜索、标签均自动生成，无需改页面代码。ID 应保持稳定；零条目的分类仍可选择。

## 部署到 GitHub Pages

将变更合入默认分支后，在仓库 **Settings → Pages → Build and deployment** 选择 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存即可。无需打包、无需后端。全部资源用相对路径，兼容项目子路径；页面路由使用 Hash，不依赖 404 重写。

## 开发校验

```sh
node tests/validate-data.mjs
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
sources/flutter-prompts.md       提供的 Markdown 原件
styles/app.css                   资料库界面、主题、响应式
styles/motion-tokens.css         所有预览共用动效参数
scripts/library.js               纯检索与依赖拼接逻辑
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
tests/validate-data.mjs          无第三方依赖的数据与逻辑校验
```
