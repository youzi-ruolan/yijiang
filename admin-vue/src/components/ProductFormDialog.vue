<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import AdminFormDialog from '@/components/AdminFormDialog.vue';
import AdminFormItem from '@/components/AdminFormItem.vue';
import AdminFormRow from '@/components/AdminFormRow.vue';
import AdminFormSection from '@/components/AdminFormSection.vue';
import MpRichEditor from '@/components/MpRichEditor.vue';
import ProductBannerFields from '@/components/ProductBannerFields.vue';
import ProductMediaFields from '@/components/ProductMediaFields.vue';
import { useAdminStore } from '@/stores/admin';
import { galleryTextToLines } from '@/utils/asset';
import type { ProductItem } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  product?: ProductItem | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [product: ProductItem, isEdit: boolean];
  validateError: [message: string];
}>();

const adminStore = useAdminStore();

const form = reactive({
  title: '',
  description: '',
  price: 0,
  category: '',
  sales: 0,
  cover: '',
  tags: '',
  bannerImages: [] as string[],
  gallery: '',
  detailContent: '',
  deliverables: '',
  usageNotice: '',
  isVirtual: false,
});

const isEdit = computed(() => Boolean(props.product?.id));

const dialogTitle = computed(() => (isEdit.value ? '编辑商品' : '新增商品'));

const categoryOptions = computed(() =>
  adminStore.productCategories.map((item) => ({
    label: item.name,
    value: item.filterKey,
  })),
);

function normalizePriceYuan(price: number) {
  return Math.round(Number(price) * 100) / 100;
}

function resetForm() {
  form.title = '';
  form.description = '';
  form.price = 0;
  form.category = '';
  form.sales = 0;
  form.cover = '';
  form.tags = '';
  form.bannerImages = [];
  form.gallery = '';
  form.detailContent = '';
  form.deliverables = '';
  form.usageNotice = '';
  form.isVirtual = false;
}

function fillForm(product: ProductItem) {
  form.title = product.title;
  form.description = product.description;
  form.price = product.price;
  form.category = product.category;
  form.sales = product.sales;
  form.cover = product.cover;
  form.tags = (product.tags || []).join(', ');
  form.bannerImages = [...(product.bannerImages || [])];
  form.gallery = (product.gallery || []).join('\n');
  form.detailContent = product.detailContent || '';
  form.deliverables = (product.deliverables || []).join('\n');
  form.usageNotice = (product.usageNotice || []).join('\n');
  form.isVirtual = Boolean(product.isVirtual);
}

watch(
  () => [props.modelValue, props.product] as const,
  ([visible, product]) => {
    if (!visible) return;
    if (product?.id) {
      fillForm(product);
      return;
    }
    resetForm();
  },
  { immediate: true },
);

function close() {
  emit('update:modelValue', false);
}

function buildProductPayload(): ProductItem | null {
  if (!form.title.trim()) {
    emit('validateError', '请填写商品名称');
    return null;
  }

  if (!form.category || form.category === 'all') {
    emit('validateError', '请选择商品分类');
    return null;
  }

  if (!form.cover.trim()) {
    emit('validateError', '请选择商品封面图');
    return null;
  }

  return {
    id: props.product?.id || `product_${Date.now()}`,
    title: form.title.trim(),
    description: form.description.trim(),
    price: normalizePriceYuan(form.price),
    sales: Number(form.sales),
    cover: form.cover.trim(),
    tags: form.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    category: form.category,
    bannerImages: form.bannerImages.filter(Boolean),
    gallery: galleryTextToLines(form.gallery),
    detailContent: form.detailContent.trim(),
    deliverables: form.deliverables
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    usageNotice: form.usageNotice
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    isVirtual: form.isVirtual,
    isNew: isEdit.value ? undefined : true,
    isHot: false,
  };
}

function handleConfirm() {
  const payload = buildProductPayload();
  if (!payload) return;
  emit('saved', payload, isEdit.value);
}
</script>

<template>
  <AdminFormDialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="900px"
    confirm-text="保存"
    cancel-text="取消"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="handleConfirm"
    @cancel="close"
  >
    <AdminFormItem label="商品名称" required>
      <el-input v-model="form.title" placeholder="请输入商品名称" maxlength="80" show-word-limit />
    </AdminFormItem>

    <AdminFormItem label="商品简介">
      <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品简介" maxlength="200" show-word-limit />
    </AdminFormItem>

    <AdminFormRow>
      <AdminFormItem label="售价" required>
        <el-input-number
          v-model="form.price"
          :min="0"
          :step="0.1"
          :precision="2"
          controls-position="right"
        />
      </AdminFormItem>
      <AdminFormItem label="分类" required>
        <el-select v-model="form.category" placeholder="请选择商品分类">
          <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </AdminFormItem>
    </AdminFormRow>

    <AdminFormRow>
      <AdminFormItem label="销量">
        <el-input-number v-model="form.sales" :min="0" controls-position="right" />
      </AdminFormItem>
      <AdminFormItem label="虚拟商品" hint="虚拟商品下单无需收货地址，付款后直接完成">
        <el-switch v-model="form.isVirtual" inline-prompt active-text="是" inactive-text="否" />
      </AdminFormItem>
    </AdminFormRow>

    <AdminFormItem label="标签">
      <el-input v-model="form.tags" placeholder="多个标签用逗号分隔，如：LUT, 人像" />
    </AdminFormItem>

    <AdminFormSection title="商品媒体" desc="封面、详情图集与顶部轮播图">
      <ProductMediaFields v-model:cover="form.cover" v-model:gallery="form.gallery" />
      <ProductBannerFields v-model:banner-images="form.bannerImages" />
    </AdminFormSection>

    <AdminFormItem label="详情正文" full label-width="108px">
      <MpRichEditor v-model="form.detailContent" />
    </AdminFormItem>

    <AdminFormItem label="交付内容">
      <el-input v-model="form.deliverables" type="textarea" :rows="3" placeholder="每行一条交付内容" />
    </AdminFormItem>

    <AdminFormItem label="使用说明">
      <el-input v-model="form.usageNotice" type="textarea" :rows="3" placeholder="每行一条使用说明" />
    </AdminFormItem>
  </AdminFormDialog>
</template>

<style scoped>
:deep(.product-media),
:deep(.product-banner) {
  gap: 14px;
}

:deep(.field-label-row > span),
:deep(.field > span) {
  color: #4a5968;
  font-size: 13px;
  font-weight: 500;
}
</style>
