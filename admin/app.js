import { HOME_MOCK } from '../pages/home/mock.js';

const STORAGE_KEY = 'colorist.admin.dataset.v1';

const MODULES = [
  {
    name: '首页运营',
    desc: '管理 Banner、灵感位、文章课程、全部商品展示与首页视觉素材。',
  },
  {
    name: '商品体系',
    desc: '包含商品详情、规格选择、加入购物车、本地购物车联动与详情展示。',
  },
  {
    name: '分类体系',
    desc: '分类 Tab 与首页分类数据同源，支持按内容类型和商品分类运营。',
  },
  {
    name: '交易链路',
    desc: '购物车、订单确认、订单详情、支付流与售后流程已具备完整骨架。',
  },
  {
    name: '用户中心',
    desc: '包含个人中心、地址管理、订单入口与客服/帮助类入口。',
  },
  {
    name: '运营配置',
    desc: '可维护站点品牌信息、首页主标题、副标题以及商品运营数据。',
  },
];

const DEFAULT_ORDERS = [
  {
    id: 'CG20260513001',
    customer: 'Zoe Studio',
    amount: 23600,
    status: '待处理',
    items: 2,
    createdAt: '2026-05-13 10:20',
  },
  {
    id: 'CG20260512008',
    customer: 'Nori Films',
    amount: 12800,
    status: '已完成',
    items: 1,
    createdAt: '2026-05-12 18:42',
  },
  {
    id: 'CG20260512003',
    customer: 'Moonlight Lab',
    amount: 44700,
    status: '待发货',
    items: 3,
    createdAt: '2026-05-12 11:08',
  },
];

const pageTitleMap = {
  dashboard: {
    title: '项目总览',
    subtitle: '基于小程序现有业务模块生成的运营后台骨架',
  },
  products: {
    title: '商品管理',
    subtitle: '维护首页商品、封面图、定价和分类信息',
  },
  categories: {
    title: '分类管理',
    subtitle: '让首页分类 Tab 和后台运营分类保持一致',
  },
  content: {
    title: '内容运营',
    subtitle: '集中管理 Banner、灵感位和文章内容',
  },
  orders: {
    title: '订单管理',
    subtitle: '展示交易概况与近期订单状态',
  },
  settings: {
    title: '系统设置',
    subtitle: '管理品牌配置与后台导出能力',
  },
};

const state = {
  currentView: 'dashboard',
  editingProductId: null,
  categoryFilter: 'all',
  dataset: loadDataset(),
};

const elements = {
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  views: [...document.querySelectorAll('.view')],
  navItems: [...document.querySelectorAll('.nav-item')],
  metricsGrid: document.getElementById('metrics-grid'),
  moduleList: document.getElementById('module-list'),
  resourceSummary: document.getElementById('resource-summary'),
  productTableBody: document.getElementById('product-table-body'),
  productCategoryFilter: document.getElementById('product-category-filter'),
  addProductBtn: document.getElementById('add-product-btn'),
  categoryGrid: document.getElementById('category-grid'),
  bannerList: document.getElementById('banner-list'),
  inspirationList: document.getElementById('inspiration-list'),
  articleList: document.getElementById('article-list'),
  orderStats: document.getElementById('order-stats'),
  orderList: document.getElementById('order-list'),
  productDialog: document.getElementById('product-dialog'),
  productDialogTitle: document.getElementById('product-dialog-title'),
  productForm: document.getElementById('product-form'),
  copyJsonBtn: document.getElementById('copy-json-btn'),
  downloadJsonBtn: document.getElementById('download-json-btn'),
  resetBtn: document.getElementById('reset-btn'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  appName: document.getElementById('setting-app-name'),
  appSlogan: document.getElementById('setting-app-slogan'),
  headlineTitle: document.getElementById('setting-headline-title'),
  headlineSubtitle: document.getElementById('setting-headline-subtitle'),
};

init();

function init() {
  bindEvents();
  hydrateSettings();
  render();
}

function bindEvents() {
  elements.navItems.forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  elements.productCategoryFilter.addEventListener('change', (event) => {
    state.categoryFilter = event.target.value;
    renderProducts();
  });

  elements.addProductBtn.addEventListener('click', () => openProductDialog());

  elements.productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    saveProduct(new FormData(elements.productForm));
  });

  elements.copyJsonBtn.addEventListener('click', copyDataset);
  elements.downloadJsonBtn.addEventListener('click', downloadDataset);
  elements.resetBtn.addEventListener('click', resetDataset);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
}

function loadDataset() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return createDefaultDataset();
}

function createDefaultDataset() {
  return {
    app: { ...HOME_MOCK.app },
    headline: { ...HOME_MOCK.headline },
    banners: HOME_MOCK.banners.map((item) => ({ ...item })),
    categories: HOME_MOCK.categories.map((item) => ({ ...item })),
    inspirations: HOME_MOCK.inspirations.map((item) => ({ ...item })),
    articles: HOME_MOCK.articles.map((item) => ({ ...item })),
    products: HOME_MOCK.products.map((item) => ({
      ...item,
      tags: [...(item.tags || [])],
      gallery: [...(item.gallery || [])],
      author: { ...(item.author || {}) },
    })),
    orders: DEFAULT_ORDERS.map((item) => ({ ...item })),
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.dataset));
}

function switchView(view) {
  state.currentView = view;
  elements.navItems.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  elements.views.forEach((section) => {
    section.classList.toggle('active', section.id === `view-${view}`);
  });
  const meta = pageTitleMap[view];
  elements.pageTitle.textContent = meta.title;
  elements.pageSubtitle.textContent = meta.subtitle;
}

function render() {
  renderMetrics();
  renderModules();
  renderResources();
  renderCategoryFilter();
  renderProducts();
  renderCategories();
  renderContent();
  renderOrders();
  hydrateSettings();
}

function renderMetrics() {
  const metrics = [
    ['商品总数', state.dataset.products.length],
    ['首页分类', state.dataset.categories.length],
    ['运营内容', state.dataset.inspirations.length + state.dataset.articles.length],
    ['最近订单', state.dataset.orders.length],
  ];

  elements.metricsGrid.innerHTML = metrics
    .map(
      ([label, value]) => `
        <article class="metric-card">
          <div class="metric-label">${label}</div>
          <div class="metric-value">${value}</div>
        </article>
      `,
    )
    .join('');
}

function renderModules() {
  elements.moduleList.innerHTML = MODULES.map(
    (module) => `
      <article class="module-card">
        <div class="module-title">${module.name}</div>
        <div class="module-desc">${module.desc}</div>
      </article>
    `,
  ).join('');
}

function renderResources() {
  const items = [
    ['Banner 位', state.dataset.banners.length],
    ['灵感卡片', state.dataset.inspirations.length],
    ['文章课程', state.dataset.articles.length],
    ['首页商品', state.dataset.products.length],
  ];

  elements.resourceSummary.innerHTML = items
    .map(
      ([label, value]) => `
        <article class="resource-card">
          <div>
            <div class="module-title">${label}</div>
            <div class="resource-meta">当前后台可直接维护该模块的 mock 展示数据</div>
          </div>
          <div class="resource-value">${value}</div>
        </article>
      `,
    )
    .join('');
}

function renderCategoryFilter() {
  const options = [
    { label: '全部分类', value: 'all' },
    ...state.dataset.categories
      .filter((item) => item.target === 'productSection')
      .map((item) => ({ label: item.name, value: item.filterKey || 'all' })),
  ];

  elements.productCategoryFilter.innerHTML = options
    .map(
      (item) =>
        `<option value="${item.value}" ${state.categoryFilter === item.value ? 'selected' : ''}>${item.label}</option>`,
    )
    .join('');
}

function getFilteredProducts() {
  if (state.categoryFilter === 'all') {
    return state.dataset.products;
  }
  return state.dataset.products.filter((item) => item.category === state.categoryFilter);
}

function renderProducts() {
  const products = getFilteredProducts();
  if (!products.length) {
    elements.productTableBody.innerHTML = `<tr><td colspan="6"><div class="empty">当前分类下暂无商品</div></td></tr>`;
    return;
  }

  elements.productTableBody.innerHTML = products
    .map(
      (product) => `
        <tr>
          <td><img class="thumb" src="${product.cover}" alt="${product.title}" /></td>
          <td>
            <div class="module-title">${product.title}</div>
            <div class="resource-meta">${product.description}</div>
          </td>
          <td>${product.category}</td>
          <td>¥${product.price} / ¥${product.originalPrice}</td>
          <td><div class="tag-list">${(product.tags || [])
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join('')}</div></td>
          <td>
            <div class="row-actions">
              <button class="link-btn" data-action="edit-product" data-id="${product.id}">编辑</button>
              <button class="danger-btn" data-action="delete-product" data-id="${product.id}">删除</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join('');

  elements.productTableBody.querySelectorAll('[data-action="edit-product"]').forEach((button) => {
    button.addEventListener('click', () => openProductDialog(button.dataset.id));
  });

  elements.productTableBody.querySelectorAll('[data-action="delete-product"]').forEach((button) => {
    button.addEventListener('click', () => deleteProduct(button.dataset.id));
  });
}

function renderCategories() {
  elements.categoryGrid.innerHTML = state.dataset.categories
    .map((category) => {
      const preview = findCategoryPreview(category);
      return `
        <article class="category-card">
          <img class="category-cover" src="${preview}" alt="${category.name}" />
          <div class="category-chip">${category.name}</div>
          <div class="category-title">${category.id}</div>
          <div class="category-meta">filterKey: ${category.filterKey} · target: ${category.target}</div>
        </article>
      `;
    })
    .join('');
}

function renderContent() {
  elements.bannerList.innerHTML = renderContentCards(state.dataset.banners, 'image');
  elements.inspirationList.innerHTML = renderContentCards(state.dataset.inspirations, 'cover');
  elements.articleList.innerHTML = state.dataset.articles
    .map(
      (article) => `
        <article class="content-card">
          <img src="${article.cover}" alt="${article.title}" />
          <div>
            <div class="content-title">${article.title}</div>
            <div class="content-meta">${article.author} · ${article.publishTime} · ${article.views} 阅读</div>
          </div>
        </article>
      `,
    )
    .join('');
}

function renderContentCards(list, imageKey) {
  return list
    .map(
      (item) => `
        <article class="content-card">
          <img src="${item[imageKey]}" alt="${item.title}" />
          <div>
            <div class="content-title">${item.title}</div>
            <div class="content-meta">${item.subtitle || item.description || item.badge || ''}</div>
          </div>
        </article>
      `,
    )
    .join('');
}

function renderOrders() {
  const total = state.dataset.orders.reduce((sum, item) => sum + item.amount, 0) / 100;
  const pending = state.dataset.orders.filter((item) => item.status === '待处理').length;
  const paid = state.dataset.orders.filter((item) => item.status === '已完成').length;

  elements.orderStats.innerHTML = [
    ['订单总数', state.dataset.orders.length],
    ['待处理订单', pending],
    ['已完成订单', paid],
    ['累计成交额', `¥${total.toFixed(2)}`],
    ['平均客单价', `¥${(total / Math.max(state.dataset.orders.length, 1)).toFixed(2)}`],
    ['数字商品件数', state.dataset.orders.reduce((sum, item) => sum + item.items, 0)],
  ]
    .map(
      ([label, value]) => `
        <article class="order-card">
          <div>
            <div class="metric-label">${label}</div>
            <div class="metric-value">${value}</div>
          </div>
        </article>
      `,
    )
    .join('');

  elements.orderList.innerHTML = state.dataset.orders
    .map(
      (order) => `
        <article class="order-item">
          <div>
            <div class="order-title">${order.id}</div>
            <div class="order-meta">${order.customer} · ${order.createdAt} · ${order.items} 件商品</div>
          </div>
          <div>
            <div class="module-title">¥${(order.amount / 100).toFixed(2)}</div>
            <div class="order-status">${order.status}</div>
          </div>
        </article>
      `,
    )
    .join('');
}

function hydrateSettings() {
  elements.appName.value = state.dataset.app.name;
  elements.appSlogan.value = state.dataset.app.slogan;
  elements.headlineTitle.value = state.dataset.headline.title;
  elements.headlineSubtitle.value = state.dataset.headline.subtitle;
}

function saveSettings() {
  state.dataset.app.name = elements.appName.value.trim();
  state.dataset.app.slogan = elements.appSlogan.value.trim();
  state.dataset.headline.title = elements.headlineTitle.value.trim();
  state.dataset.headline.subtitle = elements.headlineSubtitle.value.trim();
  persist();
  renderMetrics();
  alert('站点设置已保存到本地后台数据。');
}

function openProductDialog(productId = null) {
  state.editingProductId = productId;
  const categorySelect = elements.productForm.elements.category;
  categorySelect.innerHTML = state.dataset.categories
    .filter((item) => item.target === 'productSection')
    .map((item) => `<option value="${item.filterKey || 'all'}">${item.name}</option>`)
    .join('');

  if (!productId) {
    elements.productDialogTitle.textContent = '新增商品';
    elements.productForm.reset();
    categorySelect.value =
      state.dataset.categories.find((item) => item.target === 'productSection')?.filterKey || 'all';
  } else {
    const product = state.dataset.products.find((item) => item.id === productId);
    if (!product) return;
    elements.productDialogTitle.textContent = '编辑商品';
    fillProductForm(product);
  }

  elements.productDialog.showModal();
}

function fillProductForm(product) {
  const form = elements.productForm.elements;
  form.title.value = product.title;
  form.description.value = product.description;
  form.price.value = product.price;
  form.originalPrice.value = product.originalPrice;
  form.category.value = product.category;
  form.rating.value = product.rating;
  form.sales.value = product.sales;
  form.favorites.value = product.favorites;
  form.cover.value = product.cover;
  form.tags.value = (product.tags || []).join(', ');
  form.authorName.value = product.author?.name || '';
  form.accent.value = product.accent || '';
  form.format.value = product.format || '';
}

function saveProduct(formData) {
  const payload = {
    title: `${formData.get('title')}`.trim(),
    description: `${formData.get('description')}`.trim(),
    price: Number(formData.get('price')),
    originalPrice: Number(formData.get('originalPrice')),
    category: `${formData.get('category')}`.trim(),
    rating: Number(formData.get('rating')),
    sales: Number(formData.get('sales')),
    favorites: Number(formData.get('favorites')),
    cover: `${formData.get('cover')}`.trim(),
    tags: `${formData.get('tags')}`
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    author: {
      name: `${formData.get('authorName')}`.trim(),
      avatar: 'https://i.pravatar.cc/100?img=1',
    },
    accent: `${formData.get('accent')}`.trim(),
    format: `${formData.get('format')}`.trim(),
  };

  if (state.editingProductId) {
    state.dataset.products = state.dataset.products.map((item) =>
      item.id === state.editingProductId
        ? {
            ...item,
            ...payload,
            gallery: [payload.cover, payload.cover],
          }
        : item,
    );
  } else {
    const nextId = `product_${String(Date.now()).slice(-6)}`;
    state.dataset.products.unshift({
      id: nextId,
      ...payload,
      gallery: [payload.cover, payload.cover],
      isNew: true,
      isHot: false,
    });
  }

  persist();
  renderMetrics();
  renderCategoryFilter();
  renderProducts();
  elements.productDialog.close();
}

function deleteProduct(productId) {
  const product = state.dataset.products.find((item) => item.id === productId);
  if (!product) return;
  if (!window.confirm(`确认删除商品「${product.title}」吗？`)) {
    return;
  }
  state.dataset.products = state.dataset.products.filter((item) => item.id !== productId);
  persist();
  renderMetrics();
  renderProducts();
}

function findCategoryPreview(category) {
  if (category.target === 'inspirationSection') {
    return state.dataset.inspirations[0]?.cover || '';
  }
  if (category.target === 'articleSection') {
    return state.dataset.articles[0]?.cover || '';
  }
  if (category.filterKey && category.filterKey !== 'all') {
    return (
      state.dataset.products.find((item) => item.category === category.filterKey)?.cover ||
      state.dataset.products[0]?.cover ||
      ''
    );
  }
  return state.dataset.products[0]?.cover || '';
}

async function copyDataset() {
  await navigator.clipboard.writeText(JSON.stringify(state.dataset, null, 2));
  alert('当前后台数据已复制到剪贴板。');
}

function downloadDataset() {
  const blob = new Blob([JSON.stringify(state.dataset, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'colorist-admin-data.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function resetDataset() {
  if (!window.confirm('确认重置后台数据吗？这会清空当前浏览器里的运营改动。')) {
    return;
  }
  state.dataset = createDefaultDataset();
  state.categoryFilter = 'all';
  persist();
  render();
  switchView(state.currentView);
}
