<template></template>

<script setup lang="ts">
import { inject, ref, onMounted, Ref } from "vue";
import axios from "axios";
import { ElNotification } from "element-plus";

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

// vercel 网页分析
import { inject as vercelAnalytics } from "@vercel/analytics";

const DEV = inject("DEV") as Ref<boolean>;

onMounted(() => {
  if (!DEV) {
    vercelAnalytics();
  }
});
</script>

<style scoped></style>
