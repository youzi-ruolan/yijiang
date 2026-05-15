import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getOrders(status?: string) {
    const orders = await this.prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ createdAt: 'desc' }],
    });

    return orders.map((item) => this.formatPublicOrder(item));
  }

  async getOrdersCount() {
    const orders = await this.prisma.order.findMany({
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
    const userAddressReq =
      rawUserAddressReq ??
      ({
        id: 'digital-delivery',
        name: '数字订单',
        phoneNumber: '',
        provinceName: '',
        cityName: '',
        districtName: '',
        detailAddress: '数字商品无需物流配送，下单后自动交付',
        receiverAddress: '数字商品无需物流配送',
      } as Record<string, unknown>);
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

  async getOrderDetail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    return order ? this.formatOrderDetail(order) : null;
  }

  async createOrder(payload: Record<string, unknown>) {
    const goodsRequestList = Array.isArray(payload.goodsRequestList) ? payload.goodsRequestList : [];
    const totalAmount = Number(payload.totalAmount || 0);
    const userName = `${payload.userName || '艺匠调色用户'}`.trim() || '艺匠调色用户';
    const orderNo = this.generateOrderNo();
    const items = goodsRequestList.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

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
        customer: userName,
        amount: totalAmount,
        status: '待交付',
        items,
        itemsDetail: itemsDetail as Prisma.InputJsonValue,
        orderCreatedAt: this.formatDateTime(new Date()),
      },
    });

    return {
      data: {
        isSuccess: true,
        tradeNo: order.id,
        payInfo: '{}',
        code: null,
        transactionId: `YJ-${Date.now()}`,
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
    originalPrice: number;
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
      originalPrice: product.price,
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
    const proPrice = Math.round((product.price + 40) * 100);
    const linePrice = Math.round(product.price * 100);

    return {
      saasId: '88888888',
      storeId: '1000',
      spuId: product.id,
      title: product.title,
      intro: product.description,
      primaryImage: product.cover,
      images: [product.cover, ...gallery],
      available: 1,
      minSalePrice: standardPrice,
      minLinePrice: linePrice,
      maxSalePrice: proPrice,
      maxLinePrice: linePrice,
      soldNum: product.sales,
      isPutOnSale: 1,
      specList: [
        {
          specId: 'format',
          title: '格式',
          specValueList: [
            {
              specValueId: 'format-default',
              specValue: tags[0] || '数字商品',
              image: '',
            },
          ],
        },
        {
          specId: 'edition',
          title: '版本',
          specValueList: [
            {
              specValueId: 'edition-standard',
              specValue: '标准版',
              image: '',
            },
            {
              specValueId: 'edition-pro',
              specValue: '专业版',
              image: '',
            },
          ],
        },
      ],
      skuList: [
        {
          skuId: `${product.id}_standard`,
          skuImage: product.cover,
          specInfo: [
            {
              specId: 'format',
              specValueId: 'format-default',
              specValue: tags[0] || '数字商品',
            },
            {
              specId: 'edition',
              specValueId: 'edition-standard',
              specValue: '标准版',
            },
          ],
          priceInfo: [
            { priceType: 1, price: `${standardPrice}` },
            { priceType: 2, price: `${linePrice}` },
          ],
        },
        {
          skuId: `${product.id}_pro`,
          skuImage: product.cover,
          specInfo: [
            {
              specId: 'format',
              specValueId: 'format-default',
              specValue: tags[0] || '数字商品',
            },
            {
              specId: 'edition',
              specValueId: 'edition-pro',
              specValue: '专业版',
            },
          ],
          priceInfo: [
            { priceType: 1, price: `${proPrice}` },
            { priceType: 2, price: `${linePrice}` },
          ],
        },
      ],
      spuTagList: tags.slice(0, 2).map((item, index) => ({
        id: `${product.id}_tag_${index}`,
        title: item,
        image: null,
      })),
      limitInfo: [{ text: '数字商品，购买后永久可用' }],
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
        buttonVOs: [],
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
}
