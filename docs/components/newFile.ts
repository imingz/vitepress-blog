import { onMounted } from "vue";
import { flatList, relList } from "./Logs.vue";

// 在组件挂载后
onMounted(() => {
  // 根据最后更新时间对列表进行排序
  let newList;
  newList = flatList.sort(
    (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
  );
  relList.value = newList;
});
