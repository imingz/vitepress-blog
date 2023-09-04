---
tags: [VitePress]
---

# VitePress todo 插件

::: tip 注意
更新时间：2023/08/30

VitePress 版本: v1.0.0-rc.10
:::

## 前言

Vitepress 不原生支持 todo，详见 [vitepress/issues/1923](https://github.com/vuejs/vitepress/issues/1923)

## 解决

安装

```sh
yarn add -D markdown-it-task-lists
```

使用，修改 `.vitepress/config.ts`

```ts
import todo from "markdown-it-task-lists";
markdown: {
  config: (md) => {
    md.use(todo);
  };
}
```
