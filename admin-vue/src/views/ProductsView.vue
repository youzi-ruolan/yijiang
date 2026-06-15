<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import MpRichEditor from '@/components/MpRichEditor.vue';
import ProductBannerFields from '@/components/ProductBannerFields.vue';
import ProductMediaFields from '@/components/ProductMediaFields.vue';
import { useAdminStore } from '@/stores/admin';
import { galleryTextToLines } from '@/utils/asset';
import type { ProductItem } from '@/types';

const adminStore = useAdminStore();

const categoryFilter = ref('all');
const dialogVisible = ref(false);
const editingId = ref('');

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
});

const categoryOptions = computed(() =>
  adminStore.productCategories.map((item) => ({
    label: item.name,
    value: item.filterKey,
  })),
);

const products = computed(() =>
  categoryFilter.value === 'all'
    ? adminStore.dataset.products
    : adminStore.dataset.products.filter((item) => item.category === categoryFilter.value),
);

const categoryNameMap = computed(() =>
  Object.fromEntries(adminStore.productCategories.map((item) => [item.filterKey, item.name])),
);

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
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(product: ProductItem) {
  editingId.value = product.id;
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
  dialogVisible.value = true;
}

async function saveProduct() {
  if (!form.category || form.category === 'all') {
    ElMessage.warning('请选择商品分类');
    return;
  }

  if (!form.cover.trim()) {
    ElMessage.warning('请选择商品封面图');
    return;
  }

  const product: ProductItem = {
    id: editingId.value || `product_${Date.now()}`,
    title: form.title.trim(),
    description: form.description.trim(),
    price: Number(form.price),
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
    isNew: editingId.value ? undefined : true,
    isHot: false,
  };

  try {
    await adminStore.upsertProduct(product);
    dialogVisible.value = false;
    ElMessage.success(editingId.value ? '商品已更新' : '商品已新增');
  } catch (error) {
    const message = error instanceof Error ? error.message : '商品保存失败';
    if (message.includes('bannerImages') || message.includes('detailContent must be an array')) {
      ElMessage.error('服务端版本过旧：请部署最新 server 代码并执行 prisma migrate deploy 后再保存');
      return;
    }
    ElMessage.error(message);
  }
}

async function removeProduct(product: ProductItem) {
  try {
    await ElMessageBox.confirm(`确认删除「${product.title}」吗？`, '确认删除商品？', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await adminStore.removeProduct(product.id);
    ElMessage.success('商品已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : '商品删除失败');
    }
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <div class="toolbar-pills">
        <span class="toolbar-chip">共 {{ products.length }} 个商品</span>
        <span v-if="adminStore.dataset.assets.length" class="toolbar-chip">
          资源库 {{ adminStore.dataset.assets.length }} 个文件可用
        </span>
      </div>
      <el-select v-model="categoryFilter" class="toolbar-select" placeholder="全部分类">
        <el-option label="全部分类" value="all" />
        <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button type="primary" @click="openCreate">新增商品</el-button>
    </div>

    <el-card class="admin-card table-card" shadow="never">
      <el-table :data="products" row-key="id" stripe style="width: 100%">
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <img :src="row.cover" :alt="row.title" class="admin-thumb" />
          </template>
        </el-table-column>
        <el-table-column label="名称" min-width="240">
          <template #default="{ row }">
            <div class="table-title">{{ row.title }}</div>
            <div class="table-desc">{{ row.description }}</div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <span class="admin-chip">{{ categoryNameMap[row.category] || row.category }}</span>
          </template>
        </el-table-column>
        <el-table-column label="轮播" width="80">
          <template #default="{ row }">
            <span class="gallery-count">{{ (row.bannerImages || []).length || (row.gallery || []).length }} 张</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span class="price-current">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="140">
          <template #default="{ row }">
            <div class="admin-tag-list">
              <span v-for="tag in row.tags" :key="tag" class="admin-chip">{{ tag }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="removeProduct(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商品' : '新增商品'"
      width="900px"
      top="4vh"
      destroy-on-close
    >
      <div class="form-grid">
        <div class="field field-full">
          <span>商品名称</span>
          <el-input v-model="form.title" placeholder="请输入商品名称" />
        </div>
        <div class="field field-full">
          <span>商品简介</span>
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品简介" />
        </div>
        <div class="field">
          <span>售价</span>
          <el-input-number v-model="form.price" :min="0" controls-position="right" style="width: 100%" />
        </div>
        <div class="field">
          <span>分类</span>
          <el-select v-model="form.category" placeholder="请选择商品分类" style="width: 100%">
            <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="field">
          <span>销量</span>
          <el-input-number v-model="form.sales" :min="0" controls-position="right" style="width: 100%" />
        </div>
        <div class="field field-full">
          <span>标签</span>
          <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
        </div>

        <ProductMediaFields v-model:cover="form.cover" v-model:gallery="form.gallery" />
        <ProductBannerFields v-model:banner-images="form.bannerImages" />

        <div class="field field-full">
          <span>详情正文</span>
          <MpRichEditor v-model="form.detailContent" />
        </div>
        <div class="field field-full">
          <span>交付内容</span>
          <el-input v-model="form.deliverables" type="textarea" :rows="3" placeholder="每行一条交付内容" />
        </div>
        <div class="field field-full">
          <span>使用说明</span>
          <el-input v-model="form.usageNotice" type="textarea" :rows="3" placeholder="每行一条使用说明" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-title {
  font-weight: 500;
  font-size: 14px;
}

.table-desc {
  margin-top: 4px;
  color: var(--admin-text-soft);
  font-size: 12px;
  line-height: 1.5;
}

.price-current {
  font-weight: 600;
  color: var(--admin-primary);
}

.gallery-count {
  font-size: 13px;
  color: var(--admin-text-soft);
}
</style>
