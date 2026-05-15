# 艺匠调色后端服务

## 技术栈
- NestJS
- Prisma
- MySQL
- TypeScript

## 核心职责
- 为 `admin-vue` 提供后台管理接口
- 为小程序提供聚合消费接口
- 为 Northflank 等平台提供可直接部署的生产服务

## 接口模块
- `GET /health`
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

## 环境变量
- `DATABASE_URL`：MySQL 连接串
- `JWT_SECRET`：登录与鉴权相关密钥
- `NODE_ENV`：推荐生产环境设为 `production`
- `PORT`：服务监听端口，Northflank 会自动注入
- `CORS_ORIGIN`：允许跨域来源，多个地址用英文逗号分隔

参考文件：`D:\new-data\tdesign-miniprogram-starter-retail\server\.env.example`

## 本地开发
1. 复制 `.env.example` 为 `.env`
2. 安装依赖：`npm install`
3. 生成 Prisma Client：`npm run prisma:generate`
4. 执行迁移：`npm run prisma:migrate`
5. 启动开发服务：`npm run dev`

## 生产部署脚本
- 构建：`npm run build:prod`
- 启动：`npm run start:prod`
- 生产迁移：`npm run prisma:migrate:deploy`

## 重要说明
- `prisma migrate dev` 只适合本地开发，不要在生产环境执行
- `prisma/seed.ts` 当前会清空并重建业务数据，只适合空库初始化或测试环境
- 生产环境如需初始化演示数据，请先确认数据库为空，再手动执行 `npm run prisma:seed`

## Northflank 推荐
- 免费档优先用 `1 个 MySQL Database + 1 个 Service`
- Service 的工作目录设为 `server`
- 健康检查地址使用 `/health`

完整步骤见：
`D:\new-data\tdesign-miniprogram-starter-retail\server\docs\northflank-deploy.md`
