---
tags: [VitePress]
---

# VitePress 解析展示 LaTeX 数学公式

::: tip 注意
更新时间：2023/08/30

VitePress 版本: v1.0.0-rc.10
:::

VitePress 默认的 markdown 解析器 markdown-it 不支持 LaTeX 数学公式的解析展示，需要安装扩展插件，此处使用 markdown-it-katex

:::info 官网
[markdown-it-katex](https://github.com/waylonflinn/markdown-it-katex)
:::

## 安装

```sh
yarn add markdown-it-katex -D
```

## 配置

修改 `.vitepress/config.ts` 配置文件

```ts
import katex from "markdown-it-katex";

export default {
  head: [
    // katex 样式
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css",
        crossorigin: "",
      },
    ],
  ],
  markdown: {
    config: (md) => {
      md.use(katex);
    },
  },
};
```

## 常见错误

> [Vue warn]: Failed to resolve component: math
> If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.

:::details 参考
[vitepress 解析展示 LaTeX 数学公式](https://blog.csdn.net/woaidouya123/article/details/127275642)
:::

由于 vitepress 编译生成静态 html 文件时，无法识别插件生成的特殊标签，故需在编译时进行处理，将特殊标签标记为自定义标签，防止编译报错。

浏览器报错已经告诉了解决方案，就是设置 `compilerOptions.isCustomElement`

### 解决

修改 `.vitepress/config.ts` 配置文件

```ts
export default defineConfig({
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag),
      },
    },
  },
});

const customElements = [
  "math",
  "maction",
  "maligngroup",
  "malignmark",
  "menclose",
  "merror",
  "mfenced",
  "mfrac",
  "mi",
  "mlongdiv",
  "mmultiscripts",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mroot",
  "mrow",
  "ms",
  "mscarries",
  "mscarry",
  "mscarries",
  "msgroup",
  "mstack",
  "mlongdiv",
  "msline",
  "mstack",
  "mspace",
  "msqrt",
  "msrow",
  "mstack",
  "mstack",
  "mstyle",
  "msub",
  "msup",
  "msubsup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "semantics",
  "math",
  "mi",
  "mn",
  "mo",
  "ms",
  "mspace",
  "mtext",
  "menclose",
  "merror",
  "mfenced",
  "mfrac",
  "mpadded",
  "mphantom",
  "mroot",
  "mrow",
  "msqrt",
  "mstyle",
  "mmultiscripts",
  "mover",
  "mprescripts",
  "msub",
  "msubsup",
  "msup",
  "munder",
  "munderover",
  "none",
  "maligngroup",
  "malignmark",
  "mtable",
  "mtd",
  "mtr",
  "mlongdiv",
  "mscarries",
  "mscarry",
  "msgroup",
  "msline",
  "msrow",
  "mstack",
  "maction",
  "semantics",
  "annotation",
  "annotation-xml",
];
```

## 例子

### 行内 `$`

**输入**

```
$\sqrt{3x-1}+(1+x)^2$
```

**输出**

$\sqrt{3x-1}+(1+x)^2$

### 块 `$$`

**输入**

```
$$
\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}
$$
```

**输出**

$$
\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}
$$
