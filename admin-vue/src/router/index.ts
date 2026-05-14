import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          title: '项目总览',
          subtitle: '查看艺匠调色商品、内容和订单模块的整体概况',
          requiresAuth: true,
        },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/views/ProductsView.vue'),
        meta: {
          title: '商品管理',
          subtitle: '维护首页商品、封面图、价格和分类数据',
          requiresAuth: true,
        },
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('@/views/CategoriesView.vue'),
        meta: {
          title: '分类管理',
          subtitle: '让首页分类 Tab、分类页和后台运营分类保持一致',
          requiresAuth: true,
        },
      },
      {
        path: 'content',
        name: 'content',
        component: () => import('@/views/ContentView.vue'),
        meta: {
          title: '首页 Banner',
          subtitle: '维护小程序首页轮播 Banner 内容',
          requiresAuth: true,
        },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/OrdersView.vue'),
        meta: {
          title: '订单管理',
          subtitle: '查看近期订单状态，并维护订单基础记录',
          requiresAuth: true,
        },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: {
          title: '系统设置',
          subtitle: '管理品牌配置和首页主文案展示',
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/layouts/BlankLayout.vue'),
    meta: {
      public: true,
    },
    children: [
      {
        path: '',
        component: () => import('@/views/LoginView.vue'),
        meta: {
          title: '登录',
          subtitle: '请输入个人后台账号密码',
          public: true,
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
        meta: {
          title: '页面不存在',
          subtitle: '当前地址没有对应页面',
          requiresAuth: true,
        },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.public && authStore.isAuthenticated) {
    return '/dashboard';
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    };
  }

  return true;
});

router.afterEach((to) => {
  const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : '艺匠调色';
  document.title = `${pageTitle} - 艺匠调色`;
});
