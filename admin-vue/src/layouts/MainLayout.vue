<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import {
  AppIcon,
  CartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DashboardIcon,
  LayersIcon,
  SettingIcon,
  ShopIcon,
} from 'tdesign-icons-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();
const collapsed = ref(false);

const menus = [
  { path: '/dashboard', label: '项目总览', icon: DashboardIcon },
  { path: '/products', label: '商品管理', icon: ShopIcon },
  { path: '/categories', label: '分类管理', icon: LayersIcon },
  { path: '/content', label: '内容运营', icon: AppIcon },
  { path: '/orders', label: '订单管理', icon: CartIcon },
  { path: '/settings', label: '系统设置', icon: SettingIcon },
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

function logout() {
  const dialog = DialogPlugin({
    header: '退出登录？',
    body: '退出后需要重新输入后台账号密码。',
    confirmBtn: '退出',
    cancelBtn: '取消',
    onConfirm: () => {
      authStore.logout();
      adminStore.resetState();
      MessagePlugin.success('已退出登录');
      router.replace('/login');
      dialog.hide();
    },
    onClose: () => dialog.hide(),
  });
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    return;
  }

  try {
    await adminStore.bootstrap();
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : '后台数据加载失败');
  }
});
</script>

<template>
  <div class="layout-shell" :class="{ collapsed }">
    <aside class="sidebar">
      <div class="brand" :class="{ 'brand-collapsed': collapsed }">
        <div class="brand-mark">匠</div>
        <div v-if="!collapsed">
          <div class="brand-title">艺匠调色</div>
          <div class="brand-subtitle">艺匠调色管理后台</div>
        </div>
      </div>

      <div v-if="!collapsed" class="sidebar-group-label">后台导航</div>

      <nav class="menu-list">
        <button
          v-for="menu in menus"
          :key="menu.path"
          class="menu-item"
          :class="{ active: route.path === menu.path }"
          :title="menu.label"
          @click="go(menu.path)"
        >
          <component :is="menu.icon" class="menu-icon" />
          <span v-if="!collapsed">{{ menu.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="content">
      <header class="content-header">
        <div class="header-left">
          <div class="header-topline">
            <t-button class="collapse-trigger" theme="default" variant="text" shape="square" @click="toggleCollapsed">
              <template #icon>
                <component :is="collapsed ? ChevronRightIcon : ChevronLeftIcon" />
              </template>
            </t-button>
            <t-breadcrumb class="page-breadcrumb">
              <t-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                {{ item.title }}
              </t-breadcrumb-item>
            </t-breadcrumb>
          </div>
          <div>
            <h1>{{ currentMeta.title || '艺匠调色' }}</h1>
            <p>{{ currentMeta.subtitle || '艺匠调色管理后台' }}</p>
          </div>
        </div>
        <div class="user-card">
          <img :src="currentUser?.avatar" :alt="currentUser?.displayName" class="user-avatar" />
          <div class="user-meta">
            <div class="user-name">{{ currentUser?.displayName || 'Admin' }}</div>
            <div class="user-role">{{ currentUser?.role || '个人管理员' }}</div>
          </div>
          <t-button size="small" theme="default" variant="text" @click.stop="logout">退出</t-button>
        </div>
      </header>

      <t-loading :loading="adminStore.loading && !adminStore.initialized" text="正在加载后台数据...">
        <router-view />
      </t-loading>
    </main>
  </div>
</template>

<style scoped>
.layout-shell {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}

.layout-shell.collapsed {
  grid-template-columns: 96px 1fr;
}

.sidebar {
  padding: 20px 18px;
  border-right: 1px solid rgba(239, 228, 218, 0.75);
  background:
    linear-gradient(180deg, rgba(255, 250, 246, 0.98) 0%, rgba(250, 244, 238, 0.94) 100%);
  backdrop-filter: blur(16px);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 12px 22px;
}

.brand-collapsed {
  justify-content: center;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff8a7a 0%, #ff5c51 100%);
  box-shadow: 0 14px 30px rgba(255, 92, 81, 0.28);
  flex-shrink: 0;
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--admin-text-soft);
}

.sidebar-group-label {
  padding: 0 12px 12px;
  color: var(--admin-text-soft);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  border: 0;
  border-radius: 18px;
  padding: 15px 16px;
  text-align: left;
  background: rgba(255, 255, 255, 0.34);
  color: var(--admin-text-soft);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid transparent;
}

.layout-shell.collapsed .menu-item {
  justify-content: center;
  padding-inline: 0;
}

.menu-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.76);
  border-color: rgba(239, 228, 218, 0.82);
}

.menu-item.active {
  color: var(--admin-primary);
  font-weight: 600;
  background: #fff;
  border-color: rgba(255, 226, 219, 0.95);
  box-shadow: 0 12px 28px rgba(110, 80, 55, 0.09);
}

.content {
  padding: 24px 28px 28px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 18px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(239, 228, 218, 0.68);
  box-shadow: var(--admin-shadow-soft);
  backdrop-filter: blur(12px);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-topline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.collapse-trigger {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(239, 228, 218, 0.82);
  box-shadow: var(--admin-shadow-soft);
}

.page-breadcrumb {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(239, 228, 218, 0.72);
}

.content-header h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: -0.02em;
}

.content-header p {
  margin: 8px 0 0;
  color: var(--admin-text-soft);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(239, 228, 218, 0.8);
  box-shadow: var(--admin-shadow-soft);
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  object-fit: cover;
  background: var(--admin-bg);
}

.user-meta {
  min-width: 92px;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
}

.user-role {
  margin-top: 4px;
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
    border-bottom: 1px solid rgba(239, 228, 218, 0.75);
  }

  .sidebar-group-label {
    display: none;
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
    padding-inline: 16px;
  }

  .content-header {
    flex-direction: column;
  }
}
</style>
