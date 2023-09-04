<script lang="ts" setup>
import { ref, Ref, watch, onMounted } from "vue";
import { ElTable, ElTableColumn, ElSelect, ElOption } from "element-plus";
import { getFlatList, getUrlParam } from "../../utils/common";

// 获取文章列表和标签列表
const list = getFlatList();
const tags = list.flatMap((item) => item.tags || []);

// 初始化选中的标签和可选的标签选项
const tagsValue: Ref<string[]> = ref([]);
const uniqueTag = Array.from(new Set(tags));
const options = uniqueTag.map((tag) => ({ value: tag }));

// 初始化相关文章列表
const relList: Ref<listItem[]> = ref([]);

// 在组件挂载后，根据 URL 参数来显示相关文章
onMounted(() => {
  const tag = getUrlParam("tag");
  if (tag) {
    tagsValue.value = [tag];
    relList.value = list.filter((item) => item.tags && item.tags.includes(tag));
  } else {
    relList.value = list;
  }
});

// 监听选中的标签，根据选中的标签来更新相关文章列表
watch(tagsValue, (newVal, oldVal) => {
  let li = list;
  for (const tag of newVal) {
    li = li.filter((item) => item.tags && item.tags.includes(tag));
  }
  relList.value = li;
});
</script>

<template>
  <div class="tag-page">
    <!-- 标签选择器 -->
    <el-select
      v-model="tagsValue"
      multiple
      filterable
      style="width: 100%"
      placeholder="选择想要筛选的标签">
      <el-option
        v-for="item in options"
        :key="item.value"
        :value="item.value" />
    </el-select>

    <!-- 相关文章列表 -->
    <el-table :data="relList" stripe style="width: 100%">
      <el-table-column prop="text" label="标题" sortable width="180" />
      <el-table-column prop="link" label="链接" width="180">
        <template #default="{ row }">
          <a :href="row.link" class="tag-link">{{
            row.link.replace(/[0-9]+-/g, "")
          }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="tags" label="标签" sortable width="180" />
    </el-table>
  </div>
</template>

<style lang="scss">
.tag-page {
  width: 60%;
  margin: 50px auto;
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
