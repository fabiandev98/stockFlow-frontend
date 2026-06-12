<script setup lang="ts">
import { computed } from "vue";

interface Props {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: "left" | "center" | "right";
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
  align: "left",
});

const tag = computed<string>(() => `h${props.level}`);

const baseClasses =
  "font-semibold text-gray-900 dark:text-gray-100 tracking-tight";

const sizeClasses = computed<string>(() => {
  switch (props.level) {
    case 1:
      return "text-4xl md:text-5xl";
    case 2:
      return "text-3xl md:text-4xl";
    case 3:
      return "text-2xl md:text-3xl";
    case 4:
      return "text-xl md:text-2xl";
    case 5:
      return "text-lg md:text-xl";
    default:
      return "text-base md:text-lg";
  }
});

const alignmentClass = computed<string>(() => {
  switch (props.align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
});
</script>

<template>
  <component :is="tag" :class="[baseClasses, sizeClasses, alignmentClass]">
    <slot />
  </component>
</template>
