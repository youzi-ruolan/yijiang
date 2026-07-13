<script setup lang="ts">
withDefaults(
  defineProps<{
    columns?: 1 | 2;
  }>(),
  {
    columns: 2,
  },
);
</script>

<template>
  <div class="admin-form-row" :class="`admin-form-row--${columns}`">
    <slot />
  </div>
</template>

<style scoped>
.admin-form-row {
  display: grid;
  gap: 0 20px;
  margin-bottom: 0;
}

.admin-form-row--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-form-row--1 {
  grid-template-columns: minmax(0, 1fr);
}

.admin-form-row :deep(.admin-form-item) {
  margin-bottom: 16px;
}

@media (max-width: 720px) {
  .admin-form-row--2 {
    grid-template-columns: 1fr;
  }
}
</style>
