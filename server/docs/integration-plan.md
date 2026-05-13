# 艺匠调色接口联调方案

## 一、功能模块拆分

### 1. 小程序端
- 首页：Banner、分类、商品流、灵感内容、文章内容
- 商品详情：封面、轮播、规格、详情、交付内容、使用说明
- 购物车：本地加购、数量更新、价格汇总
- 订单确认：从购物车或立即购买生成订单

### 2. 后台管理端
- 登录鉴权
- 仪表盘概览
- 应用设置
- 分类管理
- 商品管理
- Banner 管理
- 灵感内容管理
- 文章管理
- 订单管理

## 二、推荐接口映射

### 管理端接口
- `POST /admin/auth/login`
- `GET /admin/dashboard/overview`
- `GET /admin/settings`
- `PUT /admin/settings`
- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`
- `GET /admin/products`
- `GET /admin/products/:id`
- `POST /admin/products`
- `PUT /admin/products/:id`
- `DELETE /admin/products/:id`
- `GET /admin/content/banners`
- `POST /admin/content/banners`
- `PUT /admin/content/banners/:id`
- `DELETE /admin/content/banners/:id`
- `GET /admin/content/inspirations`
- `POST /admin/content/inspirations`
- `PUT /admin/content/inspirations/:id`
- `DELETE /admin/content/inspirations/:id`
- `GET /admin/content/articles`
- `POST /admin/content/articles`
- `PUT /admin/content/articles/:id`
- `DELETE /admin/content/articles/:id`
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PUT /admin/orders/:id`

### 小程序接口
- `GET /api/home`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`
- `GET /api/orders/:id`

## 三、推荐联调顺序

### 第 1 阶段：后台先接真接口
- 登录页接 `POST /admin/auth/login`
- 设置页接 `GET/PUT /admin/settings`
- 分类、商品、内容页全部替换掉本地 Pinia 持久化逻辑

### 第 2 阶段：小程序首页切真数据
- `pages/home/mock.js` 只保留兜底数据
- 首页初始化改调 `GET /api/home`
- 分类切换时调 `GET /api/products?category=xxx`

### 第 3 阶段：商品详情与订单
- 商品详情调 `GET /api/products/:id`
- 加入购物车继续保留本地实时更新
- 下单时调 `POST /api/orders`
- 后台订单页读取真实订单数据

## 四、接口实现建议

### 1. 登录鉴权
- 个人使用场景下先用 JWT 即可
- 登录成功返回 `token + userInfo`
- 后台请求头统一带 `Authorization: Bearer <token>`

### 2. 数据库表建议
- `admin_users`
- `app_settings`
- `categories`
- `products`
- `banners`
- `inspirations`
- `articles`
- `orders`

### 3. 图片资源建议
- 当前阶段先存完整外链 URL
- 后续再补上传模块，对接对象存储

## 五、与现有前端的衔接建议

### admin-vue
- 保留当前页面结构
- 仅替换 store 的数据来源
- 把新增、编辑、删除动作改成接口调用

### 小程序
- 保留当前 UI 和本地购物车交互
- 首页与详情页逐步从 mock 切到接口
- 这样风险最小，改动也最平滑

## 六、上线前最低配置
- 1 台 2 核 4G 云服务器
- MySQL 8
- Node.js 20 LTS
- Nginx 反向代理
- PM2 守护 `NestJS`

## 七、下一步最值得做的事
- 补 `seed` 初始化脚本
- 给后台接入真实接口仓库
- 给小程序接入 `/api/home` 与 `/api/products/:id`
