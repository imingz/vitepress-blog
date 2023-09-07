<template>
  <div @click="openShare">
    <Share class="share" />
  </div>
  <el-dialog
    v-model="dialogVisible"
    title="分享链接"
    width="30%"
    draggable
    close-on-press-escape>
    <span>{{ sUrl }}</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button color="var(--vp-c-tip-3)" @click="dialogVisible = false">
          关闭
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRoute } from "vitepress";
import { ElButton, ElDialog, ElNotification } from "element-plus";
import axios from "axios";
import Share from "./svg/Share.vue";

const protocol = "https://"; // window.location.protocol + "//";
const host = "imingz.fun"; //window.location.host;
const route = useRoute();

const url = computed(() => {
  const { path } = route;
  return protocol + host + path;
});

const dialogVisible = ref(false);
const sUrl = ref("");

const openShare = async () => {
  await axios
    .get("https://a.imingz.fun/shortLink?url=" + url.value, { timeout: 5000 })
    .then((response) => {
      sUrl.value = response.data;
      copyToClipboard(sUrl.value);
    })
    .catch((error) => {
      if (error.code === "ECONNABORTED") {
        ElNotification({
          message: "请求超时",
          type: "error",
        });
      } else {
        console.error("请求发生错误:", error);
        ElNotification({
          message: "请求发生错误",
          type: "error",
        });
      }
    });
};

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard
    .writeText(text)
    .then(() => {
      ElNotification({
        message: "链接已复制到剪贴板",
        type: "success",
      });
    })
    .catch(() => {
      ElNotification({
        message: "复制链接到剪贴板失败，请手动复制。",
        type: "warning",
      });
      dialogVisible.value = true;
    });
}
</script>

<style lang="scss">
.share {
  width: 1.3em;
  height: 1.3em;
  margin-left: 1em;
  @media (max-width: 767px) {
    margin: 0;
  }
  &:hover {
    color: var(--vp-c-brand-1);
  }
}
.dark {
  .share {
    &:hover {
      color: var(--vp-c-brand-lighter);
    }
  }
}
</style>
