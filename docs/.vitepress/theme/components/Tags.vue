<script lang="ts" setup>
import { computed } from "vue";
import { useData } from "vitepress";
import { ElTag } from "element-plus";

// 获取页面标签数据
const { frontmatter } = useData();
const tags = computed(() => {
  const { tags } = frontmatter.value;
  return tags;
});

// 有标签就显示组件
const isShow = computed(() => !!tags.value);
</script>

<template>
  <div class="tags" v-if="isShow">
    Tags:
    <el-tag
      v-for="tag in tags"
      :key="tag"
      class="tag"
      effect="plain"
      size="small"
      round>
      <a :href="`/tags?tag=${tag}`">{{ tag }}</a>
    </el-tag>
  </div>
</template>

<style lang="scss">
.tags {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: var(--vp-c-text-3);
  font-size: 14px;

  .tag {
    margin: 2px;
    color: var(--vp-c-brand-1);
  }
}
.dark {
  .tag {
    color: var(--vp-c-brand-lighter);
  }
}
</style>
