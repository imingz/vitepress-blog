<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import { ElNotification } from "element-plus";
import axios from "axios";

const lines = reactive({ data: [] });

onMounted(() => {
  axios
    .get("https://a.imingz.fun/moyu", { timeout: 5000 })
    .then((response) => {
      lines.data = response.data.split("\n");
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
});
</script>

<template>
  <div>
    <p v-for="line in lines.data" :key="line">{{ line }}</p>
  </div>
</template>

<style lang="scss"></style>
