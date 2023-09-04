import { useData } from "vitepress";

// 生成扁平列表
export const getFlatList = () => {
  const { theme } = useData();
  const { sidebar } = theme.value;
  const list: listItem[] = [];
  Object.keys(sidebar).forEach((dir) => {
    for (const child of sidebar[dir]) {
      child.items.forEach((item: listItem) => {
        list.push({
          link: item.link.replace(/\.md$/, ""),
          text: item.text,
          tags: item.tags,
        });
      });
    }
  });
  return list;
};

// 获取 url 参数
export const getUrlParam = (name: string) => {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.search);
  const tag = params.get(name);
  return tag;
};
