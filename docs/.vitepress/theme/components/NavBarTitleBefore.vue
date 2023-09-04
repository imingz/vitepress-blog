<template></template>

<script setup lang="ts">
import { inject, ref, onMounted, Ref } from "vue";
import axios from "axios";
import { ElNotification } from "element-plus";
import ChatDotRound from "./svg/ChatDotRound.vue";

// 随机句子
const url = "https://v1.hitokoto.cn/";

export interface Hitokoto {
  id: number;
  uuid: string;
  hitokoto: string;
  type: string;
  from: string;
  from_who?: string;
  creator: string;
  creator_uid: number;
  reviewer: number;
  commit_from: string;
  created_at: string;
  length: number;
}

const hitokoto: Ref<Hitokoto | null> = ref(null);

const text = ref("");

const getTitle = (newValue: Hitokoto) => {
  text.value = "📔《" + newValue?.from + "》";
  if (newValue?.from_who != null) {
    text.value = text.value + "\n ✍️ " + newValue?.from_who;
  }
};

onMounted(async () => {
  await axios.get(url).then((response) => {
    hitokoto.value = response.data;
  });

  getTitle(hitokoto.value!);

  ElNotification({
    // icon: ChatDotRound,
    title: text.value,
    message: hitokoto.value?.hitokoto,
    offset: 100,
    // duration: 3333,
  });
});

// 百度网页分析
const DEV = inject("DEV") as Ref<boolean>;

var _hmt = _hmt || [];

const visitorAnalytics = () => {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?442f2aacc945fba2a6de01afd93727a7";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode?.insertBefore(hm, s);
};

// vercel 网页分析
import { inject as vercelAnalytics } from "@vercel/analytics";

onMounted(() => {
  if (!DEV) {
    visitorAnalytics();
    vercelAnalytics();
  }
});
</script>

<style scoped></style>
