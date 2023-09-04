<template>
    <div>
        {{ hitokoto }}
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
const url = "https://v1.hitokoto.cn/?encode=text"
const hitokoto = ref("")

onMounted(() => {
    axios.get(url).then((response) => {
        hitokoto.value = response.data
    })
})

</script>

<style scoped></style>