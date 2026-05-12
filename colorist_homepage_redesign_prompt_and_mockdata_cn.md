# 调色师首页改造 Prompt + 完整 Mock 数据

## 一、项目定位

你是一名资深 iOS / Web3 / 数字商品平台 UI 设计师 + 前端工程师。

现在需要基于一个已有的开源商城模板，对其进行视觉与内容改造。

目标风格：

- 电影感
- 高级调色师品牌气质
- 极简暗色系
- Apple 风格留白
- 专业影视行业审美
- 高级 LUT / ACES / HDR / AI 调色工具平台

用户身份：

- 调色师
- 影视后期从业者
- 独立导演
- 摄影师
- 视频创作者
- 达芬奇 Resolve 用户
- 商业广告团队

核心目标：

- 提升高级感
- 提升影视行业专业感
- 提升数字商品购买转化
- 突出“调色资产商城”定位

---

# 二、首页改造 Prompt（给 AI / Cursor / Lovable / Devin / Claude Code 使用）

## UI 风格 Prompt

请将当前商城模板改造成一个「电影调色师数字资产平台」。

整体视觉参考：

- Apple Store
- Blackmagic Design
- Frame.io
- Dehancer
- Kodak Film LUT 风格
- CinePrint16
- A24 电影视觉
- Blade Runner 2049 色彩气质

设计要求：

### 全局风格

- 使用大面积留白
- 卡片圆角 20\~28px
- 深灰 + 黑色 + 柔和高亮色
- 使用电影感图片
- 阴影非常柔和
- 不要廉价电商风
- 禁止使用高饱和渐变
- 使用真实电影截图风格
- 字体风格偏苹果系
- 整体要有高级科技感

### 首页结构

顶部区域：

- 顶部标题「全部商品」
- 左侧搜索框
- 右侧菜单按钮
- 极简图标风格

Banner 区域：

- 使用电影调色场景动态图
- 中间悬浮购物车玻璃拟态按钮
- Banner 支持自动轮播
- 增加景深模糊
- 加入电影颗粒感

分类 Tab：

- 精选推荐
- HDR
- LUT
- ACES
- AI
- 文章
- 插件
- 课程
- 电影胶片
- PowerGrade

商品卡片：

- 双列瀑布流布局
- 图片占比大
- 卡片边缘柔和
- 使用电影封面风格
- 标题限制两行
- 增加作者信息
- 增加销量信息
- 增加评分
- 增加标签
- 增加「NEW」徽章
- 增加收藏按钮
- 价格使用高级红色
- 原价使用浅灰删除线

底部导航：

- 首页
- 灵感
- 商店
- 购物车
- 我的

### 动效要求

- 页面滚动带轻微视差
- Banner 自动缓慢缩放
- 卡片 hover 微缩放
- Tab 切换有滑动动画
- 页面进入有淡入动画
- Skeleton Loading
- 图片懒加载

### 技术要求

- React + Tailwind
- 支持暗黑模式
- 响应式布局
- 适配 iPhone 15 Pro
- 使用 Framer Motion
- 使用 Zustand 管理状态
- 商品数据 mock 化
- 使用 TypeScript

### 视觉关键词

cinematic
film look
premium
minimal
luxury
dark ui
movie color grading
professional
apple style
modern glassmorphism
soft shadow
editorial design

---

# 三、完整首页 Mock 数据

## 首页 JSON 数据

```json
{
  "app": {
    "name": "CineGrade",
    "slogan": "Professional Color Grading Assets",
    "version": "2.1.0"
  },
  "theme": {
    "primary": "#FF453A",
    "background": "#0B0B0D",
    "card": "#16171B",
    "textPrimary": "#FFFFFF",
    "textSecondary": "#A1A1AA",
    "border": "#2A2A30"
  },
  "banners": [
    {
      "id": "banner_001",
      "title": "Blade Runner LUT Collection",
      "subtitle": "Cyberpunk cinematic grading toolkit",
      "image": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4",
      "buttonText": "立即查看",
      "link": "/product/blade-runner-lut",
      "badge": "NEW"
    },
    {
      "id": "banner_002",
      "title": "Hollywood HDR Masterclass",
      "subtitle": "ACES + Dolby Vision Workflow",
      "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
      "buttonText": "开始学习",
      "link": "/course/hdr-masterclass",
      "badge": "HOT"
    },
    {
      "id": "banner_003",
      "title": "AI Color Matching Engine",
      "subtitle": "Train your own cinematic look",
      "image": "https://images.unsplash.com/photo-1485846234645-a62644f84728",
      "buttonText": "体验 AI",
      "link": "/ai/color-engine",
      "badge": "AI"
    }
  ],
  "categories": [
    {
      "id": "cat_001",
      "name": "精选推荐",
      "icon": "sparkles"
    },
    {
      "id": "cat_002",
      "name": "HDR",
      "icon": "sun"
    },
    {
      "id": "cat_003",
      "name": "LUT",
      "icon": "palette"
    },
    {
      "id": "cat_004",
      "name": "ACES",
      "icon": "layers"
    },
    {
      "id": "cat_005",
      "name": "AI",
      "icon": "cpu"
    },
    {
      "id": "cat_006",
      "name": "文章",
      "icon": "file-text"
    },
    {
      "id": "cat_007",
      "name": "插件",
      "icon": "puzzle"
    },
    {
      "id": "cat_008",
      "name": "课程",
      "icon": "play-circle"
    },
    {
      "id": "cat_009",
      "name": "胶片",
      "icon": "film"
    },
    {
      "id": "cat_010",
      "name": "PowerGrade",
      "icon": "grid"
    }
  ],
  "products": [
    {
      "id": "product_001",
      "title": "Cinematic Orange Teal LUT Pack",
      "description": "电影级橙青调色 LUT，适用于商业广告与短片",
      "price": 128,
      "originalPrice": 228,
      "currency": "CNY",
      "rating": 4.9,
      "sales": 3280,
      "favorites": 1209,
      "cover": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
      "author": {
        "name": "Chen Color",
        "avatar": "https://i.pravatar.cc/100?img=1"
      },
      "tags": ["LUT", "电影感", "商业广告"],
      "isNew": true,
      "isHot": true,
      "stock": 999,
      "category": "LUT"
    },
    {
      "id": "product_002",
      "title": "Blade Runner 2049 HDR Workflow",
      "description": "HDR 电影工业级调色流程完整教学",
      "price": 108,
      "originalPrice": 399,
      "currency": "CNY",
      "rating": 5.0,
      "sales": 5690,
      "favorites": 2400,
      "cover": "https://images.unsplash.com/photo-1485846234645-a62644f84728",
      "author": {
        "name": "HDR Studio",
        "avatar": "https://i.pravatar.cc/100?img=2"
      },
      "tags": ["HDR", "ACES", "达芬奇"],
      "isNew": false,
      "isHot": true,
      "stock": 999,
      "category": "HDR"
    },
    {
      "id": "product_003",
      "title": "Kodak 2383 Film Emulation",
      "description": "还原 Kodak 电影胶片质感",
      "price": 88,
      "originalPrice": 168,
      "currency": "CNY",
      "rating": 4.8,
      "sales": 1932,
      "favorites": 886,
      "cover": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1",
      "author": {
        "name": "FilmConvert Lab",
        "avatar": "https://i.pravatar.cc/100?img=3"
      },
      "tags": ["胶片", "Kodak", "Film Look"],
      "isNew": true,
      "isHot": false,
      "stock": 999,
      "category": "胶片"
    },
    {
      "id": "product_004",
      "title": "Netflix Approved ACES Pipeline",
      "description": "Netflix 认证影视工业流程",
      "price": 299,
      "originalPrice": 699,
      "currency": "CNY",
      "rating": 5.0,
      "sales": 920,
      "favorites": 502,
      "cover": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4",
      "author": {
        "name": "ACES Academy",
        "avatar": "https://i.pravatar.cc/100?img=4"
      },
      "tags": ["ACES", "Netflix", "Workflow"],
      "isNew": false,
      "isHot": true,
      "stock": 999,
      "category": "ACES"
    },
    {
      "id": "product_005",
      "title": "AI Auto Color Match Plugin",
      "description": "AI 智能匹配电影色彩风格",
      "price": 168,
      "originalPrice": 299,
      "currency": "CNY",
      "rating": 4.7,
      "sales": 2010,
      "favorites": 1400,
      "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      "author": {
        "name": "NeuralGrade",
        "avatar": "https://i.pravatar.cc/100?img=5"
      },
      "tags": ["AI", "Plugin", "DaVinci"],
      "isNew": true,
      "isHot": true,
      "stock": 999,
      "category": "AI"
    },
    {
      "id": "product_006",
      "title": "Commercial Beauty LUT Collection",
      "description": "高级美妆广告调色方案",
      "price": 148,
      "originalPrice": 268,
      "currency": "CNY",
      "rating": 4.9,
      "sales": 4200,
      "favorites": 2200,
      "cover": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "author": {
        "name": "Beauty Grade",
        "avatar": "https://i.pravatar.cc/100?img=6"
      },
      "tags": ["Beauty", "Commercial", "LUT"],
      "isNew": false,
      "isHot": true,
      "stock": 999,
      "category": "LUT"
    }
  ],
  "articles": [
    {
      "id": "article_001",
      "title": "HDR 与 SDR 调色核心区别",
      "cover": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4",
      "views": 9200,
      "author": "Chen Color",
      "publishTime": "2026-05-01"
    },
    {
      "id": "article_002",
      "title": "ACES 工作流完整指南",
      "cover": "https://images.unsplash.com/photo-1485846234645-a62644f84728",
      "views": 6800,
      "author": "ACES Academy",
      "publishTime": "2026-04-20"
    }
  ],
  "navigation": [
    {
      "id": "nav_001",
      "name": "首页",
      "icon": "home",
      "active": true
    },
    {
      "id": "nav_002",
      "name": "灵感",
      "icon": "compass",
      "active": false
    },
    {
      "id": "nav_003",
      "name": "商店",
      "icon": "shopping-bag",
      "active": false
    },
    {
      "id": "nav_004",
      "name": "购物车",
      "icon": "shopping-cart",
      "active": false
    },
    {
      "id": "nav_005",
      "name": "我的",
      "icon": "user",
      "active": false
    }
  ]
}
```

---

# 四、推荐首页模块

## 推荐新增模块

### 1. 今日灵感 Inspiration Today

- 电影截图
- 色彩分析
- LUT 拆解
- 色彩板展示

### 2. 热门电影 LUT

- Joker
- Dune
- Blade Runner
- The Batman
- Mad Max

### 3. AI 调色实验室

- 上传视频自动分析
- AI Match Reference
- AI Film Emulation

### 4. 调色师排行榜

- 热门创作者
- 销量排行
- 收藏排行

### 5. 调色流程专区

- ACES
- HDR
- Dolby Vision
- Rec709
- Film Print

---

# 五、推荐技术栈

## UI

- shadcn/ui
- lucide-react
- radix-ui

## 动效

- GSAP
- Framer Motion
- Lenis Smooth Scroll

## 图片处理

- Cloudinary
- Imgix

## 视频播放器

- video.js
- plyr.js

---

# 六、首页高级视觉建议

## 色彩建议

主背景：

- \#0B0B0D
- \#111111

卡片：

- \#17181C

文字：

- \#FFFFFF
- \#A1A1AA

强调色：

- \#FF453A
- \#FF6B57

电影蓝：

- \#3A7DFF

HDR 高亮：

- \#D6F5FF

---

# 七、首页交互建议

## Banner

- 自动轮播
- 轻微缩放
- 动态颗粒
- 视频背景

## 商品卡片

- hover 上浮
- 图片慢速缩放
- 收藏按钮浮现
- 标签动态切换

## 页面滚动

- Sticky 分类栏
- iOS 弹性滚动
- 页面渐入

---

# 八、推荐图片关键词（用于 Midjourney / SDXL）

## Banner 图关键词

cinematic movie still,
professional color grading,
film look,
moody lighting,
cinematic composition,
A24 aesthetic,
kodak film,
teal and orange,
soft contrast,
grain texture,
high-end commercial,
cyberpunk cinematic,
HDR lighting,
premium movie frame

---

# 九、推荐首页文案

## 顶部文案

「为电影而生的调色资产平台」

## Banner 文案

「让每一帧都拥有电影感」

## 副标题

HDR · ACES · LUT · AI Color Pipeline

---

# 十、推荐未来扩展功能

- 在线 LUT 预览
- 视频实时调色
- AI 自动匹配参考片
- 调色节点分享
- PowerGrade 社区
- 调色师认证体系
- 在线课程系统
- HDR 云渲染
- DaVinci Resolve 插件
- LUT NFT Marketplace
