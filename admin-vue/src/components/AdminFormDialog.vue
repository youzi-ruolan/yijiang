<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    width?: string | number;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    top?: string;
    showConfirm?: boolean;
  }>(),
  {
    width: '860px',
    confirmText: '确定',
    cancelText: '取消',
    loading: false,
    top: '6vh',
    showConfirm: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function close() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :width="width"
    :top="top"
    class="admin-form-dialog"
    destroy-on-close
    :show-close="false"
    append-to-body
    @close="close"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="admin-form-dialog__header">
        <span class="admin-form-dialog__title">{{ title }}</span>
        <button type="button" class="admin-form-dialog__close" aria-label="关闭" @click="close">×</button>
      </div>
    </template>

    <div class="admin-form-dialog__body">
      <slot />
    </div>

    <template #footer>
      <slot name="footer">
        <div class="admin-form-dialog__footer">
          <el-button size="default" @click="close">{{ cancelText }}</el-button>
          <el-button
            v-if="showConfirm"
            type="primary"
            size="default"
            :loading="loading"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </el-button>
        </div>
      </slot>
    </template>
  </el-dialog>
</template>

<style scoped>
.admin-form-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  margin: 0;
  padding: 0 18px;
  box-sizing: border-box;
  background: linear-gradient(90deg, #1677ff 0%, #1890ff 100%);
  color: #fff;
}

.admin-form-dialog__title {
  font-size: 16px;
  font-weight: 600;
}

.admin-form-dialog__close {
  appearance: none;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.admin-form-dialog__close:hover {
  color: #fff;
}

.admin-form-dialog__body {
  padding: 0;
}

.admin-form-dialog__footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
