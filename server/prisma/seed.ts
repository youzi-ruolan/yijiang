import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const { HOME_MOCK } = require('../../pages/home/mock.js');

const DEFAULT_ORDERS = [
  {
    id: 'YJ20260513001',
    customer: '青岚影像工作室',
    amount: 38800,
    status: '待交付',
    items: 3,
    createdAt: '2026-05-13 10:20',
    itemsDetail: ['人像肤色控制 LUT 套装 Pro', '轻奢商业广告主视觉包', '客户交付流程清单包'],
  },
  {
    id: 'YJ20260512008',
    customer: '拾光婚礼影像',
    amount: 16900,
    status: '已完成',
    items: 2,
    createdAt: '2026-05-12 18:42',
    itemsDetail: ['婚礼纪实柔光调色包', '纪录片自然校正基础包'],
  },
  {
    id: 'YJ20260512003',
    customer: '木白品牌视觉',
    amount: 24900,
    status: '待处理',
    items: 1,
    createdAt: '2026-05-12 11:08',
    itemsDetail: ['DaVinci 节点工程母版'],
  },
  {
    id: 'YJ20260511006',
    customer: '澄片纪录工作组',
    amount: 45800,
    status: '已付款',
    items: 4,
    createdAt: '2026-05-11 16:36',
    itemsDetail: ['纪录片自然校正基础包', '新闻快剪统一风格包', '独立短片低饱和风格预设', '客户交付流程清单包'],
  },
];

async function main() {
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.article.deleteMany();
  await prisma.inspiration.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.category.deleteMany();

  await prisma.appSetting.upsert({
    where: { id: 'default' },
    update: {
      appName: HOME_MOCK.app.name,
      appSlogan: HOME_MOCK.app.slogan,
      headlineTitle: HOME_MOCK.headline.title,
      headlineSubtitle: HOME_MOCK.headline.subtitle,
    },
    create: {
      id: 'default',
      appName: HOME_MOCK.app.name,
      appSlogan: HOME_MOCK.app.slogan,
      headlineTitle: HOME_MOCK.headline.title,
      headlineSubtitle: HOME_MOCK.headline.subtitle,
    },
  });

  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {
      password: 'colorist123',
      displayName: '艺匠调色管理员',
      role: '个人管理员',
      avatar: 'https://placehold.co/320x320/EADFD2/7A5C45.png?text=YJ',
    },
    create: {
      username: 'admin',
      password: 'colorist123',
      displayName: '艺匠调色管理员',
      role: '个人管理员',
      avatar: 'https://placehold.co/320x320/EADFD2/7A5C45.png?text=YJ',
    },
  });

  for (const [index, item] of HOME_MOCK.categories.entries()) {
    await prisma.category.create({
      data: {
        id: item.id,
        name: item.name,
        filterKey: item.filterKey,
        target: item.target,
        sort: index,
        status: 'ACTIVE',
      },
    });
  }

  for (const [index, item] of HOME_MOCK.banners.entries()) {
    await prisma.banner.create({
      data: {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description ?? '',
        image: item.image,
        buttonText: item.buttonText ?? '',
        badge: item.badge ?? '',
        sort: index,
        status: 'ACTIVE',
      },
    });
  }

  for (const [index, item] of HOME_MOCK.inspirations.entries()) {
    await prisma.inspiration.create({
      data: {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        badge: item.badge ?? '',
        cover: item.cover,
        sort: index,
        status: 'ACTIVE',
      },
    });
  }

  for (const [index, item] of HOME_MOCK.articles.entries()) {
    await prisma.article.create({
      data: {
        id: item.id,
        title: item.title,
        cover: item.cover,
        views: item.views,
        author: item.author,
        publishTime: item.publishTime,
        sort: index,
        status: 'ACTIVE',
      },
    });
  }

  for (const [index, item] of HOME_MOCK.products.entries()) {
    await prisma.product.create({
      data: {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        sales: item.sales,
        cover: item.cover,
        tags: item.tags as Prisma.InputJsonValue,
        gallery: (item.gallery ?? []) as Prisma.InputJsonValue,
        detailContent: (item.detailContent ?? []) as Prisma.InputJsonValue,
        deliverables: (item.deliverables ?? []) as Prisma.InputJsonValue,
        usageNotice: (item.usageNotice ?? []) as Prisma.InputJsonValue,
        category: item.category,
        isNew: item.isNew ?? false,
        isHot: item.isHot ?? false,
        sort: index,
        status: 'ACTIVE',
      },
    });
  }

  for (const item of DEFAULT_ORDERS) {
    await prisma.order.create({
      data: {
        id: item.id,
        customer: item.customer,
        amount: item.amount,
        status: item.status,
        items: item.items,
        itemsDetail: item.itemsDetail as Prisma.InputJsonValue,
        orderCreatedAt: item.createdAt,
      },
    });
  }

  console.log('Seed completed: 艺匠调色全新 mock 数据已写入数据库。');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
