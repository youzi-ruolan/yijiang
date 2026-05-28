import { BadGatewayException, BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createDecipheriv, createSign, createVerify, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {}

  async login(payload: Record<string, unknown>) {
    const code = `${payload.code || ''}`.trim();
    if (!code) {
      throw new BadRequestException('缺少微信登录 code');
    }

    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      throw new BadRequestException('服务端未配置微信小程序登录参数');
    }

    const session = await this.fetchWechatSession(appId, appSecret, code);
    const rawUserInfo = payload.userInfo && typeof payload.userInfo === 'object' ? payload.userInfo : {};
    const userInfo = rawUserInfo as Record<string, unknown>;

    const user = await this.prisma.miniProgramUser.upsert({
      where: { openid: session.openid },
      update: {
        unionId: session.unionid || null,
        nickName: `${userInfo.nickName || '微信用户'}`.trim() || '微信用户',
        avatarUrl: userInfo.avatarUrl ? `${userInfo.avatarUrl}` : null,
        gender: Number(userInfo.gender || 0),
      },
      create: {
        openid: session.openid,
        unionId: session.unionid || null,
        nickName: `${userInfo.nickName || '微信用户'}`.trim() || '微信用户',
        avatarUrl: userInfo.avatarUrl ? `${userInfo.avatarUrl}` : null,
        gender: Number(userInfo.gender || 0),
      },
    });

    return {
      token: `wechat-${user.id}-${Date.now()}`,
      userInfo: {
        uid: user.id,
        openId: user.openid,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl || '',
        gender: user.gender,
        phoneNumber: user.phoneNumber || '',
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
      },
    };
  }

  async getHome() {
    const [settings, banners, categories, inspirations, articles, products] = await Promise.all([
      this.prisma.appSetting.findUnique({ where: { id: 'default' } }),
      this.prisma.banner.findMany({ where: { status: 'ACTIVE' }, orderBy: { sort: 'asc' } }),
      this.prisma.category.findMany({ where: { status: 'ACTIVE' }, orderBy: { sort: 'asc' } }),
      this.prisma.inspiration.findMany({ where: { status: 'ACTIVE' }, orderBy: { sort: 'asc' } }),
      this.prisma.article.findMany({ where: { status: 'ACTIVE' }, orderBy: { sort: 'asc' } }),
      this.prisma.product.findMany({ where: { status: 'ACTIVE' }, orderBy: { sort: 'asc' } }),
    ]);

    return {
      app: settings,
      headline: settings
        ? {
            title: settings.headlineTitle,
            subtitle: settings.headlineSubtitle,
          }
        : null,
      banners,
      categories: categories.map((item) => this.formatCategory(item)),
      inspirations,
      articles,
      products: products.map((item) => this.formatProductCard(item)),
    };
  }

  async getUserCenter(uid?: string) {
    const customerServiceInfo = {
      servicePhone: '4006336868',
      serviceTimeDuration: '周一至周日 09:00-21:00',
    };

    const countsData = [
      {
        num: 0,
        name: '收货地址',
        type: 'address',
      },
    ];

    const [user, orders, addressCount] = await Promise.all([
      uid ? this.prisma.miniProgramUser.findUnique({ where: { id: uid } }) : Promise.resolve(null),
      this.prisma.order.findMany({
        where: uid ? { userId: uid } : undefined,
        orderBy: [{ createdAt: 'desc' }],
      }),
      uid ? this.prisma.userAddress.count({ where: { userId: uid } }) : Promise.resolve(0),
    ]);

    countsData[0].num = addressCount;

    const orderTagInfos = [
      { orderNum: orders.filter((item) => item.status === '待处理').length, tabType: 5 },
      { orderNum: orders.filter((item) => ['已付款', '待交付'].includes(item.status)).length, tabType: 10 },
      { orderNum: orders.filter((item) => item.status === '待收货').length, tabType: 40 },
      { orderNum: 0, tabType: 60 },
      { orderNum: 0, tabType: 0 },
    ];

    return {
      userInfo: user
        ? {
            uid: user.id,
            nickName: user.nickName,
            avatarUrl: user.avatarUrl || '',
            gender: user.gender,
            phoneNumber: user.phoneNumber || '',
          }
        : null,
      countsData,
      orderTagInfos,
      customerServiceInfo,
    };
  }

  async getPerson(uid?: string) {
    if (!uid) {
      throw new BadRequestException('缺少用户标识');
    }

    const user = await this.prisma.miniProgramUser.findUnique({
      where: { id: uid },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    return {
      uid: user.id,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl || '',
      gender: user.gender,
      phoneNumber: user.phoneNumber || '',
      address: {
        provinceName: '',
        provinceCode: '',
        cityName: '',
        cityCode: '',
      },
    };
  }

  async updatePersonProfile(payload: Record<string, unknown>) {
    const uid = `${payload.uid || ''}`.trim();
    if (!uid) {
      throw new BadRequestException('缺少用户标识');
    }

    const currentUser = await this.prisma.miniProgramUser.findUnique({
      where: { id: uid },
    });

    if (!currentUser) {
      throw new BadRequestException('用户不存在');
    }

    const nickName = `${payload.nickName || ''}`.trim();
    const avatarUrl = `${payload.avatarUrl || ''}`.trim();
    const phoneNumber = `${payload.phoneNumber || ''}`.trim();
    const gender = Number(payload.gender);

    const nextUser = await this.prisma.miniProgramUser.update({
      where: { id: uid },
      data: {
        ...(nickName ? { nickName } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
        ...(Number.isFinite(gender) ? { gender } : {}),
      },
    });

    return {
      uid: nextUser.id,
      nickName: nextUser.nickName,
      avatarUrl: nextUser.avatarUrl || '',
      gender: nextUser.gender,
      phoneNumber: nextUser.phoneNumber || '',
      createdAt: nextUser.createdAt.getTime(),
      updatedAt: nextUser.updatedAt.getTime(),
    };
  }

  async getAddresses(uid?: string) {
    const userId = await this.ensureUserId(uid);
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    return addresses.map((item) => this.formatUserAddress(item));
  }

  async getDefaultAddress(uid?: string) {
    const userId = await this.ensureUserId(uid);
    const address = await this.prisma.userAddress.findFirst({
      where: { userId, isDefault: true },
      orderBy: [{ updatedAt: 'desc' }],
    });

    return address ? this.formatUserAddress(address) : null;
  }

  async getAddressDetail(id: string, uid?: string) {
    const userId = await this.ensureUserId(uid);
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new BadRequestException('收货地址不存在');
    }

    return this.formatUserAddress(address);
  }

  async createAddress(payload: Record<string, unknown>) {
    const input = await this.buildAddressInput(payload);
    const existedDefaultCount = await this.prisma.userAddress.count({
      where: { userId: input.userId, isDefault: true },
    });
    const shouldDefault = input.isDefault || existedDefaultCount === 0;

    const createdAddress = await this.prisma.$transaction(async (tx) => {
      if (shouldDefault) {
        await tx.userAddress.updateMany({
          where: { userId: input.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.create({
        data: {
          ...input,
          isDefault: shouldDefault,
        },
      });
    });

    return this.formatUserAddress(createdAddress);
  }

  async updateAddress(id: string, payload: Record<string, unknown>) {
    const input = await this.buildAddressInput(payload);
    const currentAddress = await this.prisma.userAddress.findFirst({
      where: { id, userId: input.userId },
    });

    if (!currentAddress) {
      throw new BadRequestException('收货地址不存在');
    }

    const nextDefault = input.isDefault || currentAddress.isDefault;

    const updatedAddress = await this.prisma.$transaction(async (tx) => {
      if (nextDefault) {
        await tx.userAddress.updateMany({
          where: { userId: input.userId, NOT: { id } },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.update({
        where: { id },
        data: {
          ...input,
          isDefault: nextDefault,
        },
      });
    });

    return this.formatUserAddress(updatedAddress);
  }

  async deleteAddress(id: string, uid?: string) {
    const userId = await this.ensureUserId(uid);
    const currentAddress = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!currentAddress) {
      throw new BadRequestException('收货地址不存在');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({
        where: { id },
      });

      if (currentAddress.isDefault) {
        const fallbackAddress = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: [{ updatedAt: 'desc' }],
        });

        if (fallbackAddress) {
          await tx.userAddress.update({
            where: { id: fallbackAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return {
      success: true,
    };
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sort: 'asc' },
    });

    return categories.map((item) => this.formatCategory(item));
  }

  async getProducts(category?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        ...(category && category !== 'all' ? { category } : {}),
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    return products.map((item) => this.formatProductCard(item));
  }

  async getProductDetail(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    return product ? this.formatProductDetail(product) : null;
  }

  async getOrders(status?: string, uid?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(uid ? { userId: uid } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return orders.map((item) => this.formatPublicOrder(item));
  }

  async getOrdersCount(uid?: string) {
    const orders = await this.prisma.order.findMany({
      where: uid ? { userId: uid } : undefined,
      select: { status: true },
    });

    const statusMap = [
      { tabType: -1, matcher: () => true },
      { tabType: 5, matcher: (status: string) => status === '待处理' },
      { tabType: 10, matcher: (status: string) => ['已付款', '待交付'].includes(status) },
      { tabType: 40, matcher: (status: string) => status === '待收货' },
      { tabType: 50, matcher: (status: string) => status === '已完成' },
    ];

    return statusMap.map((item) => ({
      tabType: item.tabType,
      orderNum: item.tabType === -1 ? orders.length : orders.filter((order) => item.matcher(order.status)).length,
    }));
  }

  async getOrderSettle(payload: Record<string, unknown>) {
    const goodsRequestList = Array.isArray(payload.goodsRequestList) ? payload.goodsRequestList : [];
    const storeInfoList = Array.isArray(payload.storeInfoList) ? payload.storeInfoList : [];
    const rawUserAddressReq =
      payload.userAddressReq && typeof payload.userAddressReq === 'object' ? payload.userAddressReq : null;
    const userAddressReq = rawUserAddressReq ?? null;
    const skuDetailVos = goodsRequestList.map((item) => {
      const quantity = Number(item.quantity || 1);
      const settlePrice = Number(item.price || 0);
      const originPrice = Number(item.originPrice || item.price || 0);
      return {
        storeId: `${item.storeId || '1000'}`,
        spuId: `${item.spuId || ''}`,
        skuId: `${item.skuId || ''}`,
        goodsName: `${item.goodsName || item.title || '商品'}`,
        image: `${item.primaryImage || item.thumb || ''}`,
        reminderStock: 999,
        quantity,
        payPrice: `${settlePrice}`,
        totalSkuPrice: `${settlePrice * quantity}`,
        discountSettlePrice: `${settlePrice * quantity}`,
        realSettlePrice: `${settlePrice * quantity}`,
        settlePrice: `${settlePrice}`,
        oriPrice: `${originPrice}`,
        tagPrice: null,
        tagText: null,
        skuSpecLst: Array.isArray(item.specInfo) ? item.specInfo : [],
        promotionIds: null,
        weight: 0,
        unit: 'SET',
        volume: null,
        masterGoodsType: 0,
        viceGoodsType: 0,
        roomId: item.roomId || null,
        egoodsName: null,
      };
    });

    const totalSalePrice = skuDetailVos.reduce(
      (sum, item) => sum + Number(item.settlePrice || 0) * Number(item.quantity || 0),
      0,
    );
    const totalGoodsCount = skuDetailVos.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalPromotionAmount = 0;

    return {
      data: {
        settleType: 1,
        userAddress: userAddressReq,
        totalGoodsCount,
        packageCount: 1,
        totalAmount: `${totalSalePrice}`,
        totalPayAmount: `${totalSalePrice - totalPromotionAmount}`,
        totalDiscountAmount: '0',
        totalPromotionAmount: `${totalPromotionAmount}`,
        totalCouponAmount: '0',
        totalSalePrice: `${totalSalePrice}`,
        totalGoodsAmount: `${totalSalePrice}`,
        totalDeliveryFee: '0',
        invoiceRequest: null,
        skuImages: null,
        deliveryFeeList: null,
        storeGoodsList: [
          {
            storeId: `${storeInfoList[0]?.storeId || '1000'}`,
            storeName: `${storeInfoList[0]?.storeName || '艺匠调色数字资产商店'}`,
            remark: storeInfoList[0]?.remark || null,
            goodsCount: totalGoodsCount,
            deliveryFee: '0',
            deliveryWords: null,
            storeTotalAmount: `${totalSalePrice}`,
            storeTotalPayAmount: `${totalSalePrice}`,
            storeTotalDiscountAmount: '0',
            storeTotalCouponAmount: '0',
            skuDetailVos,
            couponList: [],
          },
        ],
        inValidGoodsList: null,
        outOfStockGoodsList: null,
        limitGoodsList: null,
        abnormalDeliveryGoodsList: null,
        invoiceSupport: 1,
      },
      code: 'Success',
      msg: null,
      success: true,
    };
  }

  async getOrderDetail(id: string, uid?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (uid && order?.userId && order.userId !== uid) {
      throw new BadRequestException('订单不存在');
    }

    if (!order) {
      return null;
    }

    const comments = await this.prisma.productComment.findMany({
      where: {
        orderNo: order.id,
        ...(uid ? { userId: uid } : {}),
      },
      select: { skuId: true, userId: true },
    });
    const commentedSkuSet = new Set(comments.map((comment) => `${comment.skuId}`));
    const itemsDetail = this.getOrderItems(order.itemsDetail).map((item) => ({
      ...item,
      commented: commentedSkuSet.has(`${item.skuId || ''}`),
    }));

    return this.formatOrderDetail({
      ...order,
      itemsDetail,
    });
  }

  async createComment(payload: Record<string, unknown>) {
    const userId = await this.ensureUserId(`${payload.uid || payload.userId || ''}`.trim());
    const orderNo = `${payload.orderNo || ''}`.trim();
    const spuId = `${payload.spuId || ''}`.trim();
    const skuId = `${payload.skuId || ''}`.trim();
    const commentContent = `${payload.commentContent || ''}`.trim();
    const commentScore = this.clampScore(payload.commentScore);

    if (!orderNo || !spuId || !skuId) {
      throw new BadRequestException('评价缺少订单或商品信息');
    }
    if (commentContent.length < 5) {
      throw new BadRequestException('评价内容至少 5 个字');
    }

    const [user, order] = await Promise.all([
      this.prisma.miniProgramUser.findUnique({ where: { id: userId } }),
      this.prisma.order.findUnique({ where: { id: orderNo } }),
    ]);

    if (!user) {
      throw new BadRequestException('用户不存在');
    }
    if (!order || order.userId !== userId) {
      throw new BadRequestException('订单不存在');
    }
    if (order.status === '待处理') {
      throw new BadRequestException('订单支付完成后才能评价');
    }

    const orderItems = this.getOrderItems(order.itemsDetail);
    const matchedItem = orderItems.find((item) => `${item.skuId || ''}` === skuId && `${item.spuId || ''}` === spuId);
    if (!matchedItem) {
      throw new BadRequestException('订单中未找到该商品');
    }

    const isAnonymity = Boolean(payload.isAnonymity);
    const comment = await this.prisma.productComment
      .create({
        data: {
          orderNo,
          spuId,
          skuId,
          userId,
          userName: isAnonymity ? '匿名用户' : `${payload.userName || user.nickName || '微信用户'}`,
          userHeadUrl: isAnonymity ? null : `${payload.userHeadUrl || user.avatarUrl || ''}` || null,
          isAnonymity,
          commentContent,
          commentResources: this.toPrismaJson(this.normalizeCommentResources(payload.commentResources || payload.uploadFiles)),
          commentScore,
          commentLevel: this.getCommentLevel(commentScore),
          serviceScore: this.clampScore(payload.serviceScore),
          conveyScore: this.clampScore(payload.conveyScore),
          goodsDetailInfo:
            `${payload.goodsDetailInfo || payload.specInfo || this.formatItemSpecifications(matchedItem) || ''}`.trim() ||
            null,
        },
      })
      .catch((error: { code?: string }) => {
        if (error.code === 'P2002') {
          throw new BadRequestException('该商品已经评价过了');
        }
        throw error;
      });

    return {
      data: this.formatComment(comment),
      code: 'Success',
      msg: null,
      success: true,
    };
  }

  async getComments(payload: Record<string, unknown>) {
    const queryParameter =
      payload.queryParameter && typeof payload.queryParameter === 'object'
        ? (payload.queryParameter as Record<string, unknown>)
        : {};
    const pageNum = Math.max(1, Number(payload.pageNum || 1));
    const pageSize = Math.max(1, Math.min(50, Number(payload.pageSize || 10)));
    const spuId = `${queryParameter.spuId || ''}`.trim();
    const where: Prisma.ProductCommentWhereInput = {
      ...(spuId ? { spuId } : {}),
      ...(queryParameter.commentLevel ? { commentLevel: Number(queryParameter.commentLevel) } : {}),
      ...(queryParameter.hasImage ? { NOT: { commentResources: { equals: [] } } } : {}),
      ...(queryParameter.onlyMine && queryParameter.uid ? { userId: `${queryParameter.uid}` } : {}),
    };

    const [totalCount, comments] = await Promise.all([
      this.prisma.productComment.count({ where }),
      this.prisma.productComment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      pageNum,
      pageSize,
      totalCount: `${totalCount}`,
      pageList: comments.map((comment) => this.formatComment(comment)),
    };
  }

  async getCommentsCount(payload: Record<string, unknown>) {
    const spuId = `${payload.spuId || ''}`.trim();
    return this.buildCommentsCount(spuId, `${payload.uid || ''}`.trim());
  }

  async getProductCommentsSummary(spuId: string) {
    return this.buildCommentsCount(spuId);
  }

  async getProductHomeComments(spuId: string) {
    const comments = await this.prisma.productComment.findMany({
      where: { spuId },
      orderBy: [{ createdAt: 'desc' }],
      take: 2,
    });

    return {
      homePageComments: comments.map((comment) => this.formatComment(comment)),
    };
  }

  async createOrder(payload: Record<string, unknown>) {
    const goodsRequestList = Array.isArray(payload.goodsRequestList) ? payload.goodsRequestList : [];
    const totalAmount = Number(payload.totalAmount || 0);
    const userName = `${payload.userName || '艺匠调色用户'}`.trim() || '艺匠调色用户';
    const userId = `${payload.uid || ''}`.trim() || null;
    const orderNo = this.generateOrderNo();
    const items = goodsRequestList.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    await this.ensureWechatPayReady(userId);

    const itemsDetail = goodsRequestList.map((item) => ({
      spuId: `${item.spuId || ''}`,
      skuId: `${item.skuId || ''}`,
      goodsName: `${item.goodsName || item.title || '商品'}`,
      goodsPictureUrl: `${item.primaryImage || item.thumb || ''}`,
      buyQuantity: Number(item.quantity || 1),
      actualPrice: Number(item.price || 0),
      tagPrice: Number(item.price || 0),
      specifications: Array.isArray(item.specInfo)
        ? item.specInfo.map((spec: { specValue?: unknown }) => ({
            specValue: `${spec.specValue || ''}`,
          }))
        : [],
      tagText: '',
      buttonVOs: [],
      storeId: `${item.storeId || '1000'}`,
      storeName: `${item.storeName || '艺匠调色数字资产商店'}`,
    }));

    const order = await this.prisma.order.create({
      data: {
        id: orderNo,
        userId,
        customer: userName,
        amount: totalAmount,
        status: '待处理',
        items,
        itemsDetail: itemsDetail as Prisma.InputJsonValue,
        orderCreatedAt: this.formatDateTime(new Date()),
      },
    });
    const payInfo = await this.createWechatJsapiPayInfo({
      orderNo: order.id,
      amount: order.amount,
      userId,
      description: `${itemsDetail[0]?.goodsName || '艺匠调色商品'}`.slice(0, 127),
    });

    return {
      data: {
        isSuccess: true,
        tradeNo: order.id,
        payInfo: JSON.stringify(payInfo),
        code: null,
        transactionId: '',
        msg: null,
        interactId: `${Date.now()}`,
        channel: 'wechat',
        limitGoodsList: null,
      },
      code: 'Success',
      msg: null,
      success: true,
    };
  }

  async handleWechatPayNotify(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
    rawBody?: Buffer,
  ) {
    const rawBodyText = rawBody?.toString('utf8') || JSON.stringify(payload);
    this.verifyWechatNotifySignature(headers, rawBodyText);

    const resource = payload.resource && typeof payload.resource === 'object' ? payload.resource : null;
    if (!resource) {
      throw new BadRequestException('微信支付通知缺少 resource');
    }

    const notifyData = this.decryptWechatNotifyResource(resource as Record<string, unknown>) as Record<string, unknown>;
    const orderNo = `${notifyData.out_trade_no || ''}`.trim();
    if (!orderNo) {
      throw new BadRequestException('微信支付通知缺少订单号');
    }

    if (notifyData.trade_state === 'SUCCESS') {
      await this.prisma.order.update({
        where: { id: orderNo },
        data: { status: '待交付' },
      });
    }

    return {
      code: 'SUCCESS',
      message: '成功',
    };
  }

  private formatCategory(category: {
    id: string;
    name: string;
    filterKey: string;
    target: string;
    sort: number;
    status: string;
  }) {
    return {
      id: category.id,
      name: category.name,
      filterKey: category.filterKey,
      target: category.target,
      sort: category.sort,
      status: category.status,
    };
  }

  private formatProductCard(product: {
    id: string;
    title: string;
    description: string;
    price: number;
    sales: number;
    cover: string;
    tags: unknown;
    gallery: unknown;
    detailContent: unknown;
    deliverables: unknown;
    usageNotice: unknown;
    category: string;
    isNew: boolean;
    isHot: boolean;
    sort: number;
    status: string;
  }) {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      sales: product.sales,
      cover: product.cover,
      tags: this.toStringArray(product.tags),
      gallery: this.toStringArray(product.gallery),
      detailContent: this.toStringArray(product.detailContent),
      deliverables: this.toStringArray(product.deliverables),
      usageNotice: this.toStringArray(product.usageNotice),
      category: product.category,
      isNew: product.isNew,
      isHot: product.isHot,
      sort: product.sort,
      status: product.status,
    };
  }

  private formatProductDetail(product: Parameters<PublicService['formatProductCard']>[0]) {
    const productCard = this.formatProductCard(product);
    const tags = productCard.tags;
    const gallery = productCard.gallery;
    const standardPrice = Math.round(product.price * 100);
    const linePrice = Math.round(product.price * 100);
    const specList = tags.length
      ? [
          {
            specId: 'category',
            title: '类型',
            specValueList: tags.map((tag, index) => ({
              specValueId: `category-${index}`,
              specValue: tag,
              image: '',
            })),
          },
        ]
      : [];
    const specInfo = specList.length
      ? [
          {
            specId: specList[0].specId,
            specValueId: specList[0].specValueList[0].specValueId,
            specValue: specList[0].specValueList[0].specValue,
          },
        ]
      : [];

    return {
      saasId: '',
      storeId: '',
      storeName: '',
      spuId: product.id,
      title: product.title,
      intro: product.description,
      primaryImage: product.cover,
      images: [product.cover, ...gallery],
      available: 1,
      minSalePrice: standardPrice,
      minLinePrice: linePrice,
      maxSalePrice: standardPrice,
      maxLinePrice: linePrice,
      soldNum: product.sales,
      isPutOnSale: 1,
      specList,
      skuList: [
        {
          skuId: `${product.id}_default`,
          skuImage: product.cover,
          specInfo,
          priceInfo: [
            { priceType: 1, price: `${standardPrice}` },
            { priceType: 2, price: `${linePrice}` },
          ],
        },
      ],
      spuTagList: tags.slice(0, 2).map((item, index) => ({
        id: `${product.id}_tag_${index}`,
        title: item,
        image: null,
      })),
      limitInfo: productCard.usageNotice[0] ? [{ text: productCard.usageNotice[0] }] : [],
      desc: [product.cover, ...gallery],
      etitle: '',
      detailContent: productCard.detailContent,
      deliverables: productCard.deliverables,
      usageNotice: productCard.usageNotice,
    };
  }

  private formatPublicOrder(order: {
    id: string;
    customer: string;
    amount: number;
    status: string;
    items: number;
    itemsDetail: unknown;
    orderCreatedAt: string;
  }) {
    return {
      id: order.id,
      orderNo: order.id,
      parentOrderNo: order.id,
      customer: order.customer,
      status: order.status,
      amount: order.amount,
      items: order.items,
      createTime: new Date(order.orderCreatedAt.replace(/-/g, '/')).getTime() || Date.now(),
      orderCreatedAt: order.orderCreatedAt,
      itemsDetail: Array.isArray(order.itemsDetail) ? order.itemsDetail : [],
    };
  }

  private formatOrderDetail(order: {
    id: string;
    userId?: string | null;
    customer: string;
    amount: number;
    status: string;
    items: number;
    itemsDetail: unknown;
    orderCreatedAt: string;
  }) {
    const statusCode = this.mapOrderStatusCode(order.status);
    const itemsDetail = Array.isArray(order.itemsDetail) ? order.itemsDetail : [];

    return {
      orderId: order.id,
      orderNo: order.id,
      parentOrderNo: order.id,
      storeId: '1000',
      storeName: '艺匠调色数字资产商店',
      orderStatus: statusCode,
      orderStatusName: order.status,
      orderSubStatus: 0,
      paymentAmount: order.amount,
      goodsAmountApp: order.amount,
      totalAmount: order.amount,
      createTime: new Date(order.orderCreatedAt.replace(/-/g, '/')).getTime() || Date.now(),
      logisticsVO: {
        logisticsNo: '',
        receiverCity: '',
        receiverCountry: '',
        receiverArea: '',
        receiverAddress: '数字商品无需物流配送',
        receiverName: order.customer,
        receiverPhone: '',
        logisticsCompanyName: '数字交付',
        logisticsCompanyTel: '',
      },
      orderItemVOs: itemsDetail.map((item, index) => ({
        id: `${order.id}_${index}`,
        goodsPictureUrl: `${item.goodsPictureUrl || ''}`,
        goodsName: `${item.goodsName || '商品'}`,
        skuId: `${item.skuId || ''}`,
        spuId: `${item.spuId || ''}`,
        specifications: Array.isArray(item.specifications) ? item.specifications : [],
        tagPrice: Number(item.tagPrice || item.actualPrice || 0),
        actualPrice: Number(item.actualPrice || item.tagPrice || 0),
        buyQuantity: Number(item.buyQuantity || 1),
        tagText: `${item.tagText || ''}`,
        buttonVOs: this.getOrderItemButtons(order, item),
      })),
      buttonVOs: [],
      groupInfoVo: null,
      freightFee: 0,
      paymentVO: {
        paySuccessTime: statusCode >= 10 ? Date.now() : null,
      },
      invoiceStatus: 3,
      invoiceDesc: '数字商品默认不开票',
      invoiceVO: null,
      trajectoryVos: [],
    };
  }

  private async ensureUserId(uid?: string) {
    const userId = `${uid || ''}`.trim();
    if (!userId) {
      throw new BadRequestException('缺少用户标识');
    }

    const user = await this.prisma.miniProgramUser.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    return user.id;
  }

  private async buildAddressInput(payload: Record<string, unknown>) {
    const userId = await this.ensureUserId(`${payload.uid || payload.userId || ''}`.trim());
    const name = `${payload.name || ''}`.trim();
    const phone = `${payload.phone || payload.phoneNumber || ''}`.trim();
    const provinceName = `${payload.provinceName || ''}`.trim();
    const provinceCode = `${payload.provinceCode || ''}`.trim();
    const cityName = `${payload.cityName || ''}`.trim();
    const cityCode = `${payload.cityCode || ''}`.trim();
    const districtName = `${payload.districtName || payload.countyName || ''}`.trim();
    const districtCode = `${payload.districtCode || ''}`.trim();
    const detailAddress = `${payload.detailAddress || ''}`.trim();

    if (!name || !phone || !provinceName || !provinceCode || !cityName || !cityCode || !districtName || !detailAddress) {
      throw new BadRequestException('收货地址信息不完整');
    }

    return {
      userId,
      name,
      phone,
      countryName: `${payload.countryName || '中国'}`.trim() || '中国',
      countryCode: `${payload.countryCode || 'chn'}`.trim() || 'chn',
      provinceName,
      provinceCode,
      cityName,
      cityCode,
      districtName,
      districtCode,
      detailAddress,
      addressTag: `${payload.addressTag || ''}`.trim() || null,
      latitude: payload.latitude === null || payload.latitude === undefined ? null : Number(payload.latitude),
      longitude: payload.longitude === null || payload.longitude === undefined ? null : Number(payload.longitude),
      isDefault: Boolean(payload.isDefault),
    };
  }

  private formatUserAddress(address: {
    id: string;
    userId: string;
    name: string;
    phone: string;
    countryName: string;
    countryCode: string;
    provinceName: string;
    provinceCode: string;
    cityName: string;
    cityCode: string;
    districtName: string;
    districtCode: string;
    detailAddress: string;
    addressTag: string | null;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
  }) {
    return {
      id: address.id,
      addressId: address.id,
      uid: address.userId,
      name: address.name,
      phone: address.phone,
      phoneNumber: address.phone,
      countryName: address.countryName,
      countryCode: address.countryCode,
      provinceName: address.provinceName,
      provinceCode: address.provinceCode,
      cityName: address.cityName,
      cityCode: address.cityCode,
      districtName: address.districtName,
      districtCode: address.districtCode,
      detailAddress: address.detailAddress,
      addressTag: address.addressTag || '',
      tag: address.addressTag || '',
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault ? 1 : 0,
      address: `${address.provinceName}${address.cityName}${address.districtName}${address.detailAddress}`,
    };
  }

  private mapOrderStatusCode(status: string) {
    if (status === '待处理') return 5;
    if (status === '已付款' || status === '待交付') return 10;
    if (status === '待收货') return 40;
    if (status === '已完成') return 50;
    return 80;
  }

  private generateOrderNo() {
    const now = new Date();
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `YJ${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(
      now.getMinutes(),
    )}${pad(now.getSeconds())}`;
  }

  private formatDateTime(date: Date) {
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
      date.getMinutes(),
    )}`;
  }

  private toStringArray(value: unknown) {
    return Array.isArray(value) ? value.map((item) => `${item}`) : [];
  }

  private toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value == null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
  }

  private async buildCommentsCount(spuId: string, uid = '') {
    const where = spuId ? { spuId } : {};
    const [commentCount, goodCount, middleCount, badCount, hasImageCount, uidCount] = await Promise.all([
      this.prisma.productComment.count({ where }),
      this.prisma.productComment.count({ where: { ...where, commentLevel: 3 } }),
      this.prisma.productComment.count({ where: { ...where, commentLevel: 2 } }),
      this.prisma.productComment.count({ where: { ...where, commentLevel: 1 } }),
      this.prisma.productComment.count({ where: { ...where, NOT: { commentResources: { equals: [] } } } }),
      uid ? this.prisma.productComment.count({ where: { ...where, userId: uid } }) : Promise.resolve(0),
    ]);
    const goodRate = commentCount ? Math.round((goodCount / commentCount) * 1000) / 10 : 0;

    return {
      commentCount: `${commentCount}`,
      badCount: `${badCount}`,
      middleCount: `${middleCount}`,
      goodCount: `${goodCount}`,
      hasImageCount: `${hasImageCount}`,
      goodRate,
      uidCount: `${uidCount}`,
    };
  }

  private formatComment(comment: {
    id: string;
    spuId: string;
    skuId: string;
    userId: string;
    userName: string;
    userHeadUrl: string | null;
    isAnonymity: boolean;
    commentContent: string;
    commentResources: unknown;
    commentScore: number;
    commentLevel: number;
    serviceScore: number;
    conveyScore: number;
    goodsDetailInfo: string | null;
    sellerReply: string | null;
    orderNo: string;
    createdAt: Date;
  }) {
    const isAnonymity = Boolean(comment.isAnonymity);
    return {
      id: comment.id,
      spuId: comment.spuId,
      skuId: comment.skuId,
      specInfo: comment.goodsDetailInfo || '',
      goodsDetailInfo: comment.goodsDetailInfo || '',
      commentContent: comment.commentContent,
      commentResources: Array.isArray(comment.commentResources) ? comment.commentResources : [],
      commentScore: comment.commentScore,
      commentLevel: comment.commentLevel,
      uid: comment.userId,
      userName: isAnonymity ? '匿名用户' : comment.userName,
      userHeadUrl: isAnonymity
        ? 'https://tdesign.gtimg.com/miniprogram/template/retail/avatar/avatar1.png'
        : comment.userHeadUrl || 'https://tdesign.gtimg.com/miniprogram/template/retail/avatar/avatar1.png',
      isAnonymity,
      commentTime: `${comment.createdAt.getTime()}`,
      isAutoComment: false,
      sellerReply: comment.sellerReply || '',
      orderNo: comment.orderNo,
      serviceScore: comment.serviceScore,
      conveyScore: comment.conveyScore,
    };
  }

  private normalizeCommentResources(value: unknown) {
    const resources = Array.isArray(value) ? value : [];
    return resources
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const resource = item as Record<string, unknown>;
        const src = `${resource.src || resource.url || resource.path || resource.tempFilePath || resource.thumb || ''}`;
        if (!src) return null;
        const type = resource.type === 'video' || resource.mediaType === 'video' ? 'video' : 'image';
        return {
          src,
          type,
          coverSrc: `${resource.coverSrc || resource.thumb || src}`,
        };
      })
      .filter(Boolean);
  }

  private clampScore(value: unknown) {
    const score = Math.round(Number(value || 5));
    return Math.max(1, Math.min(5, Number.isFinite(score) ? score : 5));
  }

  private getCommentLevel(score: number) {
    if (score >= 4) return 3;
    if (score === 3) return 2;
    return 1;
  }

  private getOrderItems(itemsDetail: unknown) {
    return Array.isArray(itemsDetail) ? (itemsDetail as Array<Record<string, unknown>>) : [];
  }

  private formatItemSpecifications(item: Record<string, unknown>) {
    const specifications = Array.isArray(item.specifications) ? item.specifications : [];
    return specifications
      .map((spec) => (spec && typeof spec === 'object' ? `${(spec as Record<string, unknown>).specValue || ''}` : ''))
      .filter(Boolean)
      .join(' ');
  }

  private getOrderItemButtons(order: { status: string }, item: Record<string, unknown>) {
    if (order.status === '待处理') {
      return [];
    }
    if (item.commented) {
      return [];
    }
    return [
      {
        name: '评价',
        type: 6,
        primary: true,
      },
    ];
  }

  private async createWechatJsapiPayInfo(params: {
    orderNo: string;
    amount: number;
    userId: string | null;
    description: string;
  }) {
    const appid = this.requireConfig('WECHAT_APP_ID');
    const mchid = this.requireConfig('WECHAT_PAY_MCH_ID');
    const notifyUrl = this.requireConfig('WECHAT_PAY_NOTIFY_URL');
    const merchantSerialNo = this.requireConfig('WECHAT_PAY_MERCHANT_SERIAL_NO');
    const privateKey = this.formatPrivateKey(this.requireConfig('WECHAT_PAY_PRIVATE_KEY'));

    if (!params.userId) {
      throw new BadRequestException('缺少用户标识，无法发起微信支付');
    }

    const user = await this.prisma.miniProgramUser.findUnique({
      where: { id: params.userId },
      select: { openid: true },
    });

    if (!user?.openid) {
      throw new BadRequestException('当前用户未绑定微信 openid，无法发起微信支付');
    }

    const body = {
      appid,
      mchid,
      description: params.description,
      out_trade_no: params.orderNo,
      notify_url: notifyUrl,
      amount: {
        total: Math.round(params.amount),
        currency: 'CNY',
      },
      payer: {
        openid: user.openid,
      },
    };

    const nonceStr = this.randomString();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = '/v3/pay/transactions/jsapi';
    const bodyText = JSON.stringify(body);
    const authorization = this.buildWechatPayAuthorization({
      method: 'POST',
      path,
      timestamp,
      nonceStr,
      body: bodyText,
      mchid,
      merchantSerialNo,
      privateKey,
    });

    const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: bodyText,
    });
    const result = (await response.json()) as { prepay_id?: string; message?: string; code?: string };

    if (!response.ok || !result.prepay_id) {
      throw new BadGatewayException(result.message || result.code || '微信支付下单失败');
    }

    const packageValue = `prepay_id=${result.prepay_id}`;
    const payNonceStr = this.randomString();
    const payTimeStamp = Math.floor(Date.now() / 1000).toString();
    const paySign = this.signWechatMessage(`${appid}\n${payTimeStamp}\n${payNonceStr}\n${packageValue}\n`, privateKey);

    return {
      timeStamp: payTimeStamp,
      nonceStr: payNonceStr,
      package: packageValue,
      signType: 'RSA',
      paySign,
    };
  }

  private async ensureWechatPayReady(userId: string | null) {
    this.requireConfig('WECHAT_APP_ID');
    this.requireConfig('WECHAT_PAY_MCH_ID');
    this.requireConfig('WECHAT_PAY_NOTIFY_URL');
    this.requireConfig('WECHAT_PAY_MERCHANT_SERIAL_NO');
    this.requireConfig('WECHAT_PAY_PRIVATE_KEY');
    this.requireConfig('WECHAT_PAY_API_V3_KEY');

    if (!userId) {
      throw new BadRequestException('缺少用户标识，无法发起微信支付');
    }

    const user = await this.prisma.miniProgramUser.findUnique({
      where: { id: userId },
      select: { openid: true },
    });

    if (!user?.openid) {
      throw new BadRequestException('当前用户未绑定微信 openid，无法发起微信支付');
    }
  }

  private buildWechatPayAuthorization(params: {
    method: string;
    path: string;
    timestamp: string;
    nonceStr: string;
    body: string;
    mchid: string;
    merchantSerialNo: string;
    privateKey: string;
  }) {
    const message = `${params.method}\n${params.path}\n${params.timestamp}\n${params.nonceStr}\n${params.body}\n`;
    const signature = this.signWechatMessage(message, params.privateKey);

    return [
      'WECHATPAY2-SHA256-RSA2048',
      `mchid="${params.mchid}"`,
      `nonce_str="${params.nonceStr}"`,
      `signature="${signature}"`,
      `timestamp="${params.timestamp}"`,
      `serial_no="${params.merchantSerialNo}"`,
    ].join(',');
  }

  private verifyWechatNotifySignature(headers: Record<string, string | string[] | undefined>, rawBodyText: string) {
    const publicKey = this.requireConfig('WECHAT_PAY_PLATFORM_PUBLIC_KEY');

    const timestamp = this.getHeader(headers, 'wechatpay-timestamp');
    const nonce = this.getHeader(headers, 'wechatpay-nonce');
    const signature = this.getHeader(headers, 'wechatpay-signature');
    if (!timestamp || !nonce || !signature) {
      throw new BadRequestException('微信支付通知签名头不完整');
    }

    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${timestamp}\n${nonce}\n${rawBodyText}\n`);
    verifier.end();
    const isValid = verifier.verify(this.formatPublicKey(publicKey), signature, 'base64');
    if (!isValid) {
      throw new BadRequestException('微信支付通知签名验证失败');
    }
  }

  private decryptWechatNotifyResource(resource: Record<string, unknown>) {
    const apiV3Key = this.requireConfig('WECHAT_PAY_API_V3_KEY');
    const ciphertext = `${resource.ciphertext || ''}`;
    const nonce = `${resource.nonce || ''}`;
    const associatedData = `${resource.associated_data || ''}`;
    if (!ciphertext || !nonce) {
      throw new BadRequestException('微信支付通知密文参数不完整');
    }

    const cipherBuffer = Buffer.from(ciphertext, 'base64');
    const authTag = cipherBuffer.subarray(cipherBuffer.length - 16);
    const encrypted = cipherBuffer.subarray(0, cipherBuffer.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(apiV3Key), Buffer.from(nonce));
    decipher.setAAD(Buffer.from(associatedData));
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

    return JSON.parse(decrypted) as unknown;
  }

  private signWechatMessage(message: string, privateKey: string) {
    const signer = createSign('RSA-SHA256');
    signer.update(message);
    signer.end();
    return signer.sign(privateKey, 'base64');
  }

  private randomString() {
    return randomBytes(16).toString('hex');
  }

  private getHeader(headers: Record<string, string | string[] | undefined>, name: string) {
    const value = headers[name] || headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }

  private requireConfig(name: string) {
    const value = this.configService.get<string>(name);
    if (!value) {
      throw new BadRequestException(`服务端未配置 ${name}`);
    }
    return value;
  }

  private formatPrivateKey(value: string) {
    const normalized = value.includes('BEGIN') ? value : Buffer.from(value, 'base64').toString('utf8');
    return normalized.replace(/\\n/g, '\n');
  }

  private formatPublicKey(value: string) {
    const normalized = value.includes('BEGIN') ? value : Buffer.from(value, 'base64').toString('utf8');
    return normalized.replace(/\\n/g, '\n');
  }

  private async fetchWechatSession(appId: string, appSecret: string, code: string) {
    const url =
      `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}` +
      `&secret=${encodeURIComponent(appSecret)}` +
      `&js_code=${encodeURIComponent(code)}` +
      '&grant_type=authorization_code';

    const response = await fetch(url);
    if (!response.ok) {
      throw new BadGatewayException('微信登录服务请求失败');
    }

    const payload = (await response.json()) as {
      openid?: string;
      unionid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (payload.errcode || !payload.openid) {
      throw new UnauthorizedException(payload.errmsg || '微信登录失败');
    }

    return {
      openid: payload.openid,
      unionid: payload.unionid,
    };
  }
}
