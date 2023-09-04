---
tags: [VitePress]
---

# VitePress 插件之 Markdown

::: tip 注意
更新时间：2023/08/11

VitePress 版本: v1.0.0-rc.4
:::

## 参考

- [官网](https://vitepress.dev/guide/markdown)
- [中文翻译](https://vitepress.yiov.top/markdown.html)

## 摘抄

和其他 md 不一样的

### 代码块中的行突出显示

**输入**

````
```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```
````

**输出**

```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

除了单行之外，还可以指定多个单行或范围：

- 行范围：`{5-8}` `{3-10}` `{10-17}`
- 多个单行：`{4,7,9}`
- 混合：`{4,7-13,16,23-27,40}`

或者，可以使用注释 `// [!code hl]` 直接在行中突出显示。

**输入**

````
```js
export default {
  data () {
    return {
      msg: 'Highlighted!' // [!code  hl]
    }
  }
}
```
````

**输出**

```js
export default {
  data() {
    return {
      msg: "Highlighted!", // [!code hl]
    };
  },
};
```

### 聚焦于代码块

在一行上添加注释 `// [!code focus]` 将聚焦它并模糊代码的其他部分。

此外，还可以使用 `// [!code focus:<lines>]` 定义要聚焦的行数。

```js
export default {
  data() {
    return {
      msg: "Focused!", // [!code focus]
    };
  },
};
```

### 代码块中的彩色差异

在一行上添加 `// [!code --]` or `// [!code ++]` 注释将创建该行的差异，同时保留代码块的颜色。

```js
export default {
  data () {
    return {
      msg: 'Removed' // [!code --]
      msg: 'Added' // [!code ++]
    }
  }
}
```

### 代码块中的错误和警告

`// [!code warning]` `// [!code error]`

```js
export default {
  data() {
    return {
      msg: "Error", // [!code error]
      msg: "Warning", // [!code warning]
    };
  },
};
```

### 行号

通过配置为每个代码块启用行号：

```js
export default defineConfig({
  markdown: {
    //这里填配置项
    lineNumbers: true,
  },
});
```

您可以在受防护的代码块中添加 `:line-numbers` \ `:no-line-numbers` 标记以覆盖配置中设置的值。

### 代码组

**输入**

````
::: code-group

```js [config.js]
/**
 * @type {import('vitepress').UserConfig}
 */
const config = {
  // ...
}

export default config
```

```ts [config.ts]
import type { UserConfig } from 'vitepress'

const config: UserConfig = {
  // ...
}

export default config
```

:::
````

**输出**

::: code-group

```js [config.js]
/**
 * @type {import('vitepress').UserConfig}
 */
const config = {
  // ...
};

export default config;
```

```ts [config.ts]
import type { UserConfig } from "vitepress";

const config: UserConfig = {
  // ...
};

export default config;
```

:::
