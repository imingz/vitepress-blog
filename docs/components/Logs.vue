<script lang="ts" setup>
import { useData } from "vitepress";

const { page } = useData();
const { lastUpdated } = page.value;
</script>

<template>
  <div>{{ page.lastUpdated }}</div>
</template>

<style lang="scss"></style>
