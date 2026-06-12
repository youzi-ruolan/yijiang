<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  DataBoard,
  Goods,
  Menu,
  Picture,
  Promotion,
  Setting,
  ShoppingCart,
  Fold,
  Expand,
} from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();
const collapsed = ref(false);

const menus = [
  { path: '/dashboard', label: '项目总览', icon: DataBoard },
  { path: '/products', label: '商品管理', icon: Goods },
  { path: '/categories', label: '分类管理', icon: Menu },
  { path: '/assets', label: '文件管理', icon: Picture },
  { path: '/content', label: '首页 Banner', icon: Promotion },
  { path: '/orders', label: '订单管理', icon: ShoppingCart },
  { path: '/settings', label: '系统设置', icon: Setting },
];

const currentMeta = computed(() => route.meta as { title?: string; subtitle?: string });
const currentUser = computed(() => authStore.user);
const breadcrumbs = computed(() => {
  const crumbs = route.matched
    .filter((item) => item.meta?.title)
    .map((item) => ({
      title: item.meta.title as string,
      path: item.path,
    }));

  if (!crumbs.length) {
    return [{ title: '项目总览', path: '/dashboard' }];
  }

  return crumbs;
});

function go(path: string) {
  router.push(path);
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}

async function logout() {
  try {
    await ElMessageBox.confirm('退出后需要重新输入后台账号密码。', '退出登录？', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    });
    authStore.logout();
    adminStore.resetState();
    ElMessage.success('已退出登录');
    router.replace('/login');
  } catch {
    // cancelled
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    return;
  }

  try {
    await adminStore.bootstrap();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '后台数据加载失败');
  }
});
</script>

<template>
  <div class="layout-shell" :class="{ collapsed }">
    <aside class="sidebar">
      <div class="brand" :class="{ 'brand-collapsed': collapsed }">
        <div class="brand-mark">匠</div>
        <div v-if="!collapsed" class="brand-text">
          <div class="brand-title">艺匠调色</div>
          <div class="brand-subtitle">管理后台</div>
        </div>
      </div>

      <nav class="menu-list">
        <button
          v-for="menu in menus"
          :key="menu.path"
          class="menu-item"
          :class="{ active: route.path === menu.path }"
          :title="menu.label"
          @click="go(menu.path)"
        >
          <el-icon class="menu-icon"><component :is="menu.icon" /></el-icon>
          <span v-if="!collapsed">{{ menu.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="content">
      <header class="content-header">
        <div class="header-left">
          <div class="header-topline">
            <el-button class="collapse-trigger" text @click="toggleCollapsed">
              <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
            </el-button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-title-block">
            <h1>{{ currentMeta.title || '艺匠调色' }}</h1>
            <p>{{ currentMeta.subtitle || '艺匠调色管理后台' }}</p>
          </div>
        </div>
        <div class="user-card">
          <img :src="currentUser?.avatar" :alt="currentUser?.displayName" class="user-avatar" />
          <div v-if="!collapsed" class="user-meta">
            <div class="user-name">{{ currentUser?.displayName || 'Admin' }}</div>
            <div class="user-role">{{ currentUser?.role || '个人管理员' }}</div>
          </div>
          <el-button size="small" text type="primary" @click.stop="logout">退出</el-button>
        </div>
      </header>

      <div v-loading="adminStore.loading && !adminStore.initialized" element-loading-text="正在加载后台数据...">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.layout-shell.collapsed {
  grid-template-columns: 64px 1fr;
}

.sidebar {
  padding: 16px 12px;
  border-right: 1px solid var(--admin-line);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 20px;
  border-bottom: 1px solid var(--admin-line);
  margin-bottom: 12px;
}

.brand-collapsed {
  justify-content: center;
  padding-inline: 0;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  flex-shrink: 0;
}

.brand-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--admin-text);
}

.brand-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: var(--admin-text-soft);
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  border: 0;
  border-radius: var(--admin-radius-md);
  padding: 10px 12px;
  text-align: left;
  background: transparent;
  color: var(--admin-text-soft);
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
}

.layout-shell.collapsed .menu-item {
  justify-content: center;
  padding-inline: 0;
}

.menu-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.menu-item:hover {
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
}

.menu-item.active {
  color: var(--admin-primary);
  font-weight: 500;
  background: var(--admin-primary-soft);
}

.content {
  padding: 20px 24px;
  background: var(--admin-bg);
  min-width: 0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 16px 20px;
  border-radius: var(--admin-radius-lg);
  background: #ffffff;
  border: 1px solid var(--admin-line);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.header-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.collapse-trigger {
  padding: 6px;
}

.header-title-block h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--admin-text);
}

.header-title-block p {
  margin: 4px 0 0;
  color: var(--admin-text-soft);
  font-size: 13px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--admin-bg);
  border: 2px solid var(--admin-primary-light-7, #bae0ff);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-role {
  margin-top: 2px;
  color: var(--admin-text-soft);
  font-size: 12px;
}

@media (max-width: 920px) {
  .layout-shell,
  .layout-shell.collapsed {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--admin-line);
  }

  .brand,
  .brand-collapsed {
    justify-content: flex-start;
  }

  .menu-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .layout-shell.collapsed .menu-item {
    justify-content: flex-start;
    padding-inline: 12px;
  }

  .content-header {
    flex-direction: column;
  }
}
</style>
