// 修改自：https://github.com/chenbimo/yicode/blob/master/helpers/yidocs-auto/index.js
import fg from "fast-glob";
import { orderBy, cloneDeep } from "lodash-es";
import { existsSync, readFileSync, readdirSync } from "fs";
import matter from "gray-matter";

/**
 * 一维数组生成无限级树结构
 * @param {Array} arrays - 传入的一维数组
 * @param {String} id - 唯一标识字段
 * @param {String} pid - 父级标识字段
 * @param {String} children - 子级标识字段
 * @returns {Array} 返回一个无限级数组结构
 * @summary 应用场景：用于生成无限级菜单结构
 */
function array2Tree(arrays, id = "id", pid = "pid", children = "children") {
  // id 对象，用于通过映射 ID 取得对应的对象数据
  let idObject = {};
  arrays.forEach((item) => {
    idObject[item.id] = item;
  });

  // 无限级树结构
  let treeData = [];

  arrays.forEach((item) => {
    // 父级对象数据
    let pData = idObject[item[pid]];

    if (pData) {
      if (!pData[children]) {
        pData[children] = [];
      }
      pData[children].push(item);
    } else {
      if (!item[children]) {
        item[children] = [];
      }
      treeData.push(item);
    }
  });
  return treeData;
}

// 自动生成侧边栏
function autoSideBar(rootDir: string, dirPath: string) {
  let files = fg.sync(`${rootDir}${dirPath}/**/*.md`, { onlyFiles: true });
  let obj = {};
  files.forEach((file) => {
    let fileEnd = file.replace(`${rootDir}${dirPath}`, "");
    let fileArrs = fileEnd.split("/");

    // 过滤掉
    fileArrs.forEach((name, index) => {
      // 路径前缀
      let selfPath = fileArrs.slice(0, index + 1).join("/");
      let parentPath = fileArrs.slice(0, index).join("/");
      let param = {
        id: selfPath,
        pid: parentPath,
        text: "" + name.replace(/\d+-/gi, "").replace(".md", ""),
        link: "",
        tags: [],
      };
      if (name.endsWith(".md")) {
        param.link = `${dirPath}${selfPath}`;

        if (index === 0) {
          obj[dirPath] = {
            id: dirPath,
            pid: "",
            text: dirPath
              .split("/")
              .filter((name) => name)[1]
              .replace(/\d+-/gi, "")
              .replace(".md", ""),
            collapsed: false,
          };
          param.pid = dirPath;
        }
      }

      const file = `${rootDir}${dirPath}${selfPath}`;

      if (file.endsWith(".md")) {
        const { data } = matter(readFileSync(file, "utf-8"));
        param.tags = data.tags;
      }

      obj[selfPath] = param;
    });
  });

  let treeSideBar = orderBy(
    array2Tree(Object.values(obj), "id", "pid", "items"),
    (item) => {
      return Number(item.id.split("-")[0]);
    }
  );
  treeSideBar.forEach((item) => {
    if (item.collapsed !== false) item.collapsed = true;

    item.items = orderBy(cloneDeep(item.items), (item) => {
      let nameSp = item.id.split("/");

      // 使用最后一个文件名称进行排序
      let lastName = nameSp?.[1] || nameSp?.[0];
      return Number(lastName.split("-")[0]);
    });
  });

  return treeSideBar;
}

// 设置侧边栏
function setSideBar(rootDir: string) {
  let files = fg.sync(`${rootDir}/**/[0-9]+-*.md`, {
    onlyFiles: true,
    ignore: [`${rootDir}/public/**/*`],
  });
  let obj = {};
  files.sort().forEach((file) => {
    // 构建动态正则表达式，替换掉路径中的 rootDir 部分
    const regex = new RegExp(`^${rootDir}`, "gi");
    file = file.replace(regex, "");
    let fileSplit = file.split("/").filter((name) => name);

    if (fileSplit.length < 3 && fileSplit.length > 4) {
      console.log(`${file} 请按照 分类-[项目]-目录-文章 的方式组织文件`);
      return false;
    }
    let dirPath = `/${fileSplit[0]}/${fileSplit[1]}/`;

    if (obj[dirPath] === undefined) {
      obj[dirPath] = autoSideBar(rootDir, dirPath);
    }
  });
  return obj;
}

/**
 * 设置导航栏
 * @param rootDir 根目录路径
 * @returns 导航栏数组
 */
function setNavBar(rootDir: string) {
  // 使用 fg.sync 查找匹配的文件
  const files = fg.sync(`${rootDir}/**/1-*.md`, {
    onlyFiles: true,
    ignore: [`${rootDir}/public/**/*`],
  });

  // 对文件列表进行排序
  const filesSort = files.sort();

  // 创建 Map 和用于存储导航栏名称的对象
  const obj = new Map();
  const navNameObject = {};

  // 遍历文件列表
  filesSort.forEach((file) => {
    // 构建动态正则表达式，替换掉路径中的 rootDir 部分
    const regex = new RegExp(`^${rootDir}`, "gi");
    file = file.replace(regex, "");
    // 将文件路径拆分为数组，并过滤掉空字符串项
    const fileSplit = file.split("/").filter((name) => name);

    // 提取导航栏名称和链接名称
    const navName = fileSplit[0].replace(/^\d+-/, "");
    const linkName = fileSplit[1].replace(/^\d+-/, "");

    // 若文件路径拆分后长度小于等于 2，则跳过
    if (fileSplit.length <= 2) return;

    // 如果 Map 中没有导航栏名称，则添加新项
    if (!obj.has(navName)) {
      navNameObject[navName] = [linkName];
      obj.set(navName, {
        text: navName.replace(/^\d+-/, ""),
        items: [
          {
            text: linkName,
            link: file.replace(".md", ""),
          },
        ],
      });
    } else {
      // 如果 Map 中已经存在导航栏名称，则更新对应项
      if (!navNameObject[navName].includes(linkName)) {
        navNameObject[navName].push(linkName);
        const item = obj.get(navName);
        item.items.push({
          text: linkName,
          link: file.replace(".md", ""),
        });
        obj.set(navName, item);
      }
    }
  });

  // 返回 Map 的值数组，作为导航栏数组
  return [...obj.values()];
}

// 自动生成
function generateAutoBar(rootDir: string) {
  const navBar = setNavBar(rootDir);
  const sideBar = setSideBar(rootDir);

  return {
    navBar,
    sideBar,
  };
}

export { generateAutoBar };
