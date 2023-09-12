<script lang="ts" setup>
import { reactive } from "vue";
import { useData } from "vitepress";
import {
  ElInput,
  ElForm,
  ElFormItem,
  ElButton,
  ElNotification,
} from "element-plus";
import axios from "axios";

const { isDark } = useData();

const form = reactive({
  oUrl: "",
  sUrl: "",
});

const shortURL = () => {
  axios
    .get("https://a.imingz.fun/shortLink?url=" + form.oUrl, { timeout: 5000 })
    .then((response) => {
      form.sUrl = response.data;
      copyToClipboard(response.data);
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

const copyToClipboard = (text: string): Promise<void> => {
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
    });
};
</script>

<template>
  <div>
    <el-form :model="form" label-width="120px">
      <el-form-item label="源网址: ">
        <el-input v-model="form.oUrl" placeholder="源网址" />
      </el-form-item>
      <el-form-item>
        <el-button
          plain
          round
          color="var(--vp-c-brand-1)"
          :dark="isDark"
          @click="shortURL">
          生成
        </el-button>
        <el-button
          plain
          round
          color="var(--vp-c-brand-1)"
          :dark="isDark"
          @click="copyToClipboard(form.sUrl)">
          复制
        </el-button>
      </el-form-item>
      <el-form-item label="短网址:">
        {{ form.sUrl }}
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss"></style>
