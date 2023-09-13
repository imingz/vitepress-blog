<script lang="ts" setup>
import { ref, Ref, watch, onMounted } from "vue";
import { ElTable, ElTableColumn, ElDatePicker } from "element-plus";
import { getFlatList } from "./utils/common";

// 获取扁平化的列表
const flatList = getFlatList();

const relList: Ref<{ link: string; text: string; lastUpdated: string }[]> = ref(
  []
);

const getReadableTime = (date: Date) => {
  return date.getTime()
    ? `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
    : "";
};

// 在组件挂载后
onMounted(() => {
  // 根据最后更新时间对列表进行排序
  relList.value = flatList
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
    .map((item) => ({
      link: item.link,
      text: item.text,
      lastUpdated: getReadableTime(item.lastUpdated),
    }));
});

// 初始化选中的标签和可选的标签选项
const dateValue = ref("");

// 监听选中的标签，根据选中的日期范围更新相关文章列表
watch(dateValue, (newVal, oldVal) => {
  let res = [];

  // 如果没有选中日期范围，则显示所有文章
  if (!newVal) {
    res = flatList;
  } else {
    // 如果选中了日期范围，则根据日期范围过滤文章
    const start = new Date(newVal[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(newVal[1]);
    end.setHours(23, 59, 59, 999);
    res = flatList.filter(
      (item) => item.lastUpdated >= start && item.lastUpdated <= end
    );
  }

  // 根据最后更新时间对列表进行排序
  relList.value = res
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
    .map((item) => ({
      link: item.link,
      text: item.text,
      lastUpdated: getReadableTime(item.lastUpdated),
    }));
});

const shortcuts = [
  {
    text: "🐼 今天",
    value: () => {
      const end = new Date();
      const start = new Date();
      return [start, end];
    },
  },
  {
    text: "过去一周",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: "过去一月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      return [start, end];
    },
  },
  {
    text: "过去三月",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return [start, end];
    },
  },
  {
    text: "过去半年",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      return [start, end];
    },
  },
  {
    text: "过去一年",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      return [start, end];
    },
  },
];
</script>

<template>
  <div class="log-page">
    日期筛选：从
    <el-date-picker
      v-model="dateValue"
      type="daterange"
      unlink-panels
      range-separator="到"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      :shortcuts="shortcuts"
      size="large" />
    <el-table :data="relList" stripe style="width: 100%">
      <el-table-column prop="lastUpdated" label="更新时间" sortable />
      <el-table-column prop="text" label="标题" sortable />
      <el-table-column prop="link" label="链接">
        <template #default="{ row }">
          <a :href="row.link" class="tag-link">{{
            row.link
              .replace(/[0-9]+-/g, "")
              .replace("/", "")
              .split("/")
              .reverse()
              .slice(1)
              .join(" <-- ")
          }}</a>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss">
.log-page {
  @media (min-width: 414px) {
    width: 60%;
    margin: 0 auto;
  }
  .tag-link {
    color: var(--vp-c-brand-1);
  }
}
.dark {
  .tag-link {
    color: var(--vp-c-brand-lighter);
  }
}
</style>
