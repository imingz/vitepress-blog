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
import service from "./utils/request";
import { copyToClipboard } from "./utils/util";

const { isDark } = useData();

const form = reactive({
  oUrl: "",
  sUrl: "",
});

const shortURL = () => {
  service
    .get("/shorturl?url=" + form.oUrl)
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
