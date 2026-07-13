<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    required?: boolean;
    hint?: string;
    full?: boolean;
    labelWidth?: string;
  }>(),
  {
    required: false,
    full: false,
    labelWidth: '108px',
  },
);
</script>

<template>
  <div class="admin-form-item" :class="{ 'admin-form-item--full': full }" :style="{ '--label-width': labelWidth }">
    <label v-if="label" class="admin-form-item__label">
      <span v-if="required" class="admin-form-item__required">*</span>
      <span>{{ label }}</span>
    </label>
    <div class="admin-form-item__content">
      <slot />
      <p v-if="hint" class="admin-form-item__hint">{{ hint }}</p>
    </div>
  </div>
</template>

<style scoped>
.admin-form-item {
  display: grid;
  grid-template-columns: var(--label-width) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  margin-bottom: 16px;
}

.admin-form-item--full {
  grid-column: 1 / -1;
}

.admin-form-item__label {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  padding-top: 8px;
  color: #4a5968;
  font-size: 14px;
  line-height: 1.4;
  text-align: right;
}

.admin-form-item__required {
  color: #ff4d4f;
}

.admin-form-item__content {
  min-width: 0;
}

.admin-form-item__content :deep(.el-input),
.admin-form-item__content :deep(.el-select),
.admin-form-item__content :deep(.el-input-number),
.admin-form-item__content :deep(.el-textarea) {
  width: 100%;
}

.admin-form-item__hint {
  margin: 6px 0 0;
  color: var(--admin-text-soft);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .admin-form-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .admin-form-item__label {
    justify-content: flex-start;
    padding-top: 0;
    text-align: left;
  }
}
</style>
