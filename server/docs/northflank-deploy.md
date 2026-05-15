# Northflank 部署指南

本文基于 **2026 年 5 月** 的 Northflank 免费方案，适用于当前仓库中的：
- `server`：NestJS + Prisma 后端
- `DATABASE_URL`：MySQL

## 推荐拓扑
- `Northflank MySQL Database`
- `Northflank Service` 部署 `server/`

这样最省心：
- 不需要把 Prisma 从 MySQL 改成 Postgres
- 数据库和服务在同一平台，维护最简单
- 免费档足够你先跑通个人项目和联调环境

## 一、准备仓库
当前仓库已经具备生产部署能力：
- 构建命令：`npm run build:prod`
- 启动命令：`npm run start:prod`
- 生产迁移命令：`npm run prisma:migrate:deploy`
- 探活地址：`/health`

## 二、创建 MySQL 数据库
1. 登录 Northflank
2. 新建 Project，例如：`yijiang-colorist`
3. 创建 Database，选择 `MySQL`
4. 等待数据库就绪
5. 在数据库详情页复制连接串

连接串通常形如：

```env
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

## 三、创建后端 Service
1. 在同一 Project 下新建 Service
2. 选择 GitHub 仓库：`youzi-ruolan/yijiang`
3. Root Directory / Working Directory 设为：`server`
4. Runtime 选择 Node.js

## 四、填写构建与启动命令

### Build Command
```bash
npm install && npm run build:prod
```

### Start Command
```bash
npm run start:prod
```

## 五、配置环境变量
至少配置这些：

```env
DATABASE_URL=mysql://...
JWT_SECRET=换成你自己的复杂字符串
NODE_ENV=production
CORS_ORIGIN=https://你的-admin-域名,https://你的小程序业务域名
```

说明：
- `PORT` 一般由 Northflank 注入，不需要手填
- `CORS_ORIGIN` 支持多个地址，英文逗号分隔
- 如果前期只给后台联调，可以先只填后台域名

## 六、首次部署后的数据库迁移
服务部署成功后，需要让数据库结构同步到线上。

推荐方式：
1. 打开 Northflank Service 控制台
2. 进入 Shell / Jobs / One-off Run
3. 在 `server` 目录执行：

```bash
npm run prisma:migrate:deploy
```

如果你要初始化一套演示数据，并且确认当前数据库是空库，再执行：

```bash
npm run prisma:seed
```

注意：
- `prisma:seed` 当前会先清空相关表，再重建数据
- 已有正式数据时，不要执行这个命令

## 七、健康检查配置
建议把 Health Check Path 设为：

```text
/health
```

成功返回示例：

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-05-15T00:00:00.000Z"
}
```

## 八、部署完成后如何联调

### 1）后台管理端
把 `admin-vue` 的接口基地址改成你的 Northflank 域名，例如：

```text
https://your-server.northflank.app
```

然后访问：
- `POST /admin/auth/login`
- `GET /admin/products`
- `GET /admin/categories`

### 2）小程序
把小程序请求基地址切到 Northflank 域名，并在微信公众平台把该域名加入：
- `request 合法域名`

示例接口：
- `GET /api/home`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:id`

## 九、我建议你上线时这样分阶段

### 第 1 阶段
- 先部署 Northflank 后端 + MySQL
- 先让 `admin-vue` 连通线上接口

### 第 2 阶段
- 小程序首页切线上 `/api/home`
- 分类和详情页切线上商品接口

### 第 3 阶段
- 再补正式登录鉴权
- 再补对象存储和图片上传

## 十、上线前检查清单
- `DATABASE_URL` 已配置
- `JWT_SECRET` 已更换
- `CORS_ORIGIN` 已填写正确
- 已执行 `npm run prisma:migrate:deploy`
- 空库场景下才执行 `npm run prisma:seed`
- `/health` 返回正常
- `admin-vue` 能登录
- 小程序已配置合法域名
