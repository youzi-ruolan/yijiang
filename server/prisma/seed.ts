import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const { HOME_MOCK } = require('../../pages/home/mock.js');

async function main() {
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

  console.log('Seed completed: 艺匠调色全新 mock 数据已写入数据库（订单数据保留真实记录，不再写入演示订单）。');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
