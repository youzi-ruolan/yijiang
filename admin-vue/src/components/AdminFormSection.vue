<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    desc?: string;
  }>(),
  {},
);
</script>

<template>
  <section class="admin-form-section">
    <div v-if="title || desc" class="admin-form-section__head">
      <div v-if="title" class="admin-form-section__title">{{ title }}</div>
      <div v-if="desc" class="admin-form-section__desc">{{ desc }}</div>
    </div>
    <div class="admin-form-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.admin-form-section {
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  background: #fbfdff;
}

.admin-form-section__head {
  margin-bottom: 12px;
}

.admin-form-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
}

.admin-form-section__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--admin-text-soft);
  line-height: 1.5;
}

.admin-form-section__body {
  min-width: 0;
}
</style>
