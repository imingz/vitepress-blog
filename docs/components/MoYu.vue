<script setup lang="ts">
import { ref, onMounted, Ref } from "vue";
import service from "./utils/request";
import { ElNotification } from "element-plus";

interface Payday {
  发薪时间: number;
  距离天数: number;
}

interface Holiday {
  节日名称: string;
  距离天数: number;
}

interface MoYu {
  单休: number;
  双休: number;
  发薪日: Payday[];
  节假日: Holiday[];
}

const moyu: Ref<MoYu> = ref({
  单休: 0,
  双休: 0,
  发薪日: [],
  节假日: [],
});

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const week = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
][today.getDay()];

const todayText = `今天是 ${year} 年 ${month} 月 ${day} 日，${week}`;

onMounted(() => {
  service
    .get("/moyu")
    .then((response) => {
      moyu.value = response.data;
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
  <div class="moyu-page">
    <div class="moyu-hello">
      <el-card>
        <p>{{ todayText }}</p>
        <p>早安，摸鱼人！</p>
        <p>工作再忙一定不要忘记休息哦！</p>
        <p>
          起身去茶水间，去厕所走走，钱是老板的但命是自己的，祝愿摸鱼人愉快的渡过每一天…
        </p>
      </el-card>
    </div>
    <div class="moyu-holiday">
      <el-card>
        <template #header>
          <div>
            <span> 距离节假日 🏖</span>
          </div>
        </template>
        <p>
          【周六（双休）】：{{
            moyu.双休 ? `${moyu.双休}天 ` : "好好享受假期吧！"
          }}
        </p>
        <p>
          【周日（单休）】：{{
            moyu.单休 ? `${moyu.单休}天 ` : "好好享受假期吧！"
          }}
        </p>
        <p v-for="i in moyu.节假日" :key="i.节日名称">
          【{{ i.节日名称 }}】：{{ i.距离天数 }}天
        </p>
      </el-card>
    </div>
    <div class="moyu-salary">
      <el-card>
        <template #header>
          <div>
            <span> 距离发薪日💰</span>
          </div>
        </template>
        <p v-for="i in moyu.发薪日" :key="i.发薪时间">
          【{{ i.发薪时间 }}号】：{{ i.距离天数 }}天
        </p>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.moyu-page {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: auto;
  grid-column-gap: 14px;
  grid-row-gap: 14px;
}

.moyu-hello {
  grid-area: 1 / 1 / 2 / 3;
}
.moyu-holiday {
  grid-area: 2 / 1 / 4 / 2;

  @media (max-width: 414px) {
    grid-area: 2 / 1 / 3 / 3;
  }
}
.moyu-salary {
  grid-area: 2 / 2 / 4 / 3;

  @media (max-width: 414px) {
    grid-area: 3 / 1 / 3 / 3;
  }
}
</style>
