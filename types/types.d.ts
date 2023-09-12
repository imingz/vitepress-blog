// 声明
declare type Sidebar = SidebarItem[] | SidebarMulti;

declare interface SidebarMulti {
  [path: string]: SidebarItem[];
}

declare type SidebarItem = {
  /**
   * The text label of the item.
   */
  text?: string;

  /**
   * The link of the item.
   */
  link?: string;

  /**
   * The children of the item.
   */
  items?: SidebarItem[];

  /**
   * If not specified, group is not collapsible.
   *
   * If `true`, group is collapsible and collapsed by default
   *
   * If `false`, group is collapsible but expanded by default
   */
  collapsed?: boolean;
};

declare type listItem = {
  link: string; // 链接
  text: string; // 标题
  tags?: string[]; // 标签
  lastUpdated?: Date;
};
