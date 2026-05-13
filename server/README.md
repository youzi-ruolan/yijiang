# 艺匠调色后端服务

## 技术栈
- NestJS
- Prisma
- MySQL
- TypeScript

## 为什么这是当前更优方案
- 约 `8000` 用户规模下，`NestJS + Prisma + MySQL` 足够轻量，部署和维护压力更小
- 和现有 `admin-vue`、小程序、前端 TypeScript 生态一致，协作成本更低
- Prisma 的模型定义、迁移、类型推导都更适合你这个项目持续迭代

## 核心职责
- 为 `admin-vue` 提供后台管理接口
- 为小程序提供聚合消费接口

## 模块
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
- `POST /admin/orders`
- `PUT /admin/orders/:id`
- `DELETE /admin/orders/:id`
- `GET /api/home`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:id`

## 当前数据边界
- 后台管理端统一走 `/admin/*`
- 小程序消费端统一走 `/api/*`
- `GET /api/home` 返回首页聚合数据
- `GET /api/products/:id` 已按当前商品详情页需要补齐规格、SKU、详情段落等字段

## 建议的接口对接顺序
1. 先接 `admin-vue` 的登录、设置、分类、商品、内容管理
2. 再把小程序首页从 `mock` 切到 `/api/home`
3. 最后把商品详情、购物车下单、订单列表切到真实接口

## admin-vue 对接建议
- 把 `D:\new-data\tdesign-miniprogram-starter-retail\admin-vue\src\stores\admin.ts` 的本地 `localStorage` 数据源替换成接口仓
- 推荐新增 `admin-vue/src/api/` 目录，按模块拆分 `auth.ts`、`settings.ts`、`categories.ts`、`products.ts`、`content.ts`、`orders.ts`
- 登录成功后只保存 `token` 和当前用户信息，业务数据全部改为页面请求

## 小程序对接建议
- 首页：`D:\new-data\tdesign-miniprogram-starter-retail\pages\home\mock.js` -> `/api/home`
- 分类 Tab：复用 `/api/categories` 与 `/api/products?category=xxx`
- 商品详情：`D:\new-data\tdesign-miniprogram-starter-retail\utils\home-goods.js` 的本地适配可逐步下线，直接请求 `/api/products/:id`
- 购物车：本地购物车逻辑可以先保留，后续需要多端同步时再补 `cart`/`order` 接口

## 推荐的接口规范
- 管理端统一返回：`{ code, message, data }`
- 列表接口统一返回：`{ list, total }`
- 状态值统一使用：`ACTIVE | INACTIVE`
- 图片字段统一存完整 URL，避免小程序和后台各自拼接

## 启动
1. 复制 `.env.example` 为 `.env`
2. 配置 MySQL `DATABASE_URL`
3. 安装依赖：`npm install`
4. 生成 Prisma Client：`npm run prisma:generate`
5. 执行迁移：`npm run prisma:migrate`
6. 启动开发服务：`npm run dev`

## 下一步建议
- 补一个 `prisma/seed.ts`，把首页 mock 数据初始化进 MySQL
- 给 `admin-vue` 增加统一请求封装、登录拦截和错误提示
- 给小程序补一层 `services/` 请求封装，方便从 mock 平滑切换到线上接口
