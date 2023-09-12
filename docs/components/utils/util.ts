import { ElNotification } from "element-plus";

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    ElNotification({
      message: "链接已复制到剪贴板",
      type: "success",
    });
  } catch {
    ElNotification({
      message: "复制链接到剪贴板失败，请手动复制。",
      type: "warning",
    });
  }
};
