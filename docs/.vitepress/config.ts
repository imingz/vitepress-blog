import { defineConfig } from "vitepress";
import katex from "markdown-it-katex";
import footnote_plugin from "markdown-it-footnote";
import todo from "markdown-it-task-lists";
import customAttrs from "markdown-it-custom-attrs";
import { generateAutoBar } from "./util/autobar";

let { sideBar, navBar } = generateAutoBar("docs");

// 本地搜索
const localSearchOptions = {
  locales: {
    root: {
      translations: {
        button: {
          buttonText: "搜索文档",
          buttonAriaLabel: "搜索文档",
        },
        modal: {
          displayDetails: "显示详情?",
          resetButtonTitle: "清除查询条件",
          backButtonTitle: "返回",
          noResultsText: "无法找到相关结果",
          footer: {
            selectText: "选择",
            navigateText: "切换",
            closeText: "关闭",
          },
        },
      },
    },
  },
};

// algolia 搜索
const algoliaSearchOptions = {
  appId: process.env.ALGOLIA_APP_ID!,
  apiKey: process.env.ALGOLIA_APP_KEY!,
  indexName: "imingz",
  locales: {
    root: {
      placeholder: "搜索文档",
      translations: {
        button: {
          buttonText: "搜索文档",
          buttonAriaLabel: "搜索文档",
        },
        modal: {
          searchBox: {
            resetButtonTitle: "清除查询条件",
            resetButtonAriaLabel: "清除查询条件",
            cancelButtonText: "取消",
            cancelButtonAriaLabel: "取消",
          },
          startScreen: {
            recentSearchesTitle: "搜索历史",
            noRecentSearchesText: "没有搜索历史",
            saveRecentSearchButtonTitle: "保存至搜索历史",
            removeRecentSearchButtonTitle: "从搜索历史中移除",
            favoriteSearchesTitle: "收藏",
            removeFavoriteSearchButtonTitle: "从收藏中移除",
          },
          errorScreen: {
            titleText: "无法获取结果",
            helpText: "你可能需要检查你的网络连接",
          },
          footer: {
            selectText: "选择",
            navigateText: "切换",
            closeText: "关闭",
            searchByText: "搜索提供者",
          },
          noResultsScreen: {
            noResultsText: "无法找到相关结果",
            suggestedQueryText: "你可以尝试查询",
            reportMissingResultsText: "你认为该查询应该有结果？",
            reportMissingResultsLinkText: "点击反馈",
          },
        },
      },
    },
  },
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // 忽略死链
  ignoreDeadLinks: [
    // ignore all localhost links
    /^https?:\/\/localhost/,
  ],
  title: "imingz",
  // 多语言
  locales: { root: { label: "简体中文", lang: "zh_CN" } },
  description: "A VitePress Site",
  // cleanUrls: true,
  head: [
    // fav图标
    ["link", { rel: "icon", href: "/favicon.ico" }],
    // katex 样式
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css",
        crossorigin: "anonymous",
      },
    ],
    // 图片放大预览
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.css",
      },
    ],
    [
      "script",
      {
        src: "https://cdn.jsdelivr.net/npm/@fancyapps/ui@4.0/dist/fancybox.umd.js",
      },
    ],
    // algolia 加速
    // [
    //   "link",
    //   {
    //     rel: "preconnect",
    //     href: `https://${process.env.ALGOLIA_APP_ID}-dsn.algolia.net`,
    //     crossorigin: "",
    //   },
    // ],
  ],
  // 上次更新时间
  lastUpdated: true,
  markdown: {
    // 行号显示
    lineNumbers: true,
    config: (md) => {
      // LaTex 解析
      md.use(katex);
      // 脚注
      md.use(footnote_plugin);
      // 插件todo
      md.use(todo);
      // 图片放缩
      md.use(customAttrs, "image", {
        "data-fancybox": "gallery",
      });
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      ...navBar,
      // {
      //   text: "标签搜索",
      //   link: "/tags",
      // },
      {
        text: "日志与搜索",
        link: "/logs",
      },
    ],

    sidebar: sideBar,

    socialLinks: [{ icon: "github", link: "https://github.com/imingz" }],

    // 页脚
    footer: {
      // message: "Released under the MIT License.",
      // TODO: 完善备案号
      copyright: "Copyright © 2023-present imingz",
    },

    // 侧边栏文字更改(移动端)
    sidebarMenuLabel: "目录",

    // 返回顶部文字修改
    returnToTopLabel: "返回顶部",

    // 手机端深浅模式文字修改
    darkModeSwitchLabel: "主题",

    // 大纲显示2-3级标题
    outline: [2, 3],

    // 大纲顶部标题
    outlineTitle: "当前页大纲",

    // 编辑本页
    editLink: {
      pattern: "https://github.com/imingz/vitepress-blog/tree/main/docs/:path",
      text: "在 GitHub 编辑本页",
    },

    //上次更新时间
    lastUpdatedText: "上次更新时间",

    // 自定义上下页名
    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    // 搜索
    search: {
      provider: "local",
      options: localSearchOptions,
    },
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag),
      },
    },
  },
  vite: {
    // envDir: "",
  },
});

const customElements = [
  // katex 标签
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
