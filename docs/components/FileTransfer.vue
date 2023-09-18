<script lang="ts" setup>
import { ElButton } from "element-plus";
</script>

<template>
  <div class="filetransfer-page">
    <el-button plain text>
      <a href="http://a.imingz.fun:8888/file" download>下载</a>
    </el-button>
  </div>
</template>

<style lang="scss">
.filetransfer-page {
  @media (min-width: 414px) {
    width: 60%;
    margin: 0 auto;
  }
}
.dark {
}
</style>
