import { HOME_MOCK } from '../pages/home/mock';

function buildSpecList(tags = []) {
  return [
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
  ];
}

function buildSkuList(product) {
  const basePrice = Math.round(product.price * 100);
  const proPrice = Math.round((product.price + 40) * 100);

  return [
    {
      skuId: `${product.id}_standard`,
      skuImage: product.cover,
      specInfo: [
        {
          specId: 'format',
          specValueId: 'format-default',
          specValue: product.tags[0] || '数字商品',
        },
        {
          specId: 'edition',
          specValueId: 'edition-standard',
          specValue: '标准版',
        },
      ],
      priceInfo: [
        { priceType: 1, price: `${basePrice}` },
        { priceType: 2, price: `${basePrice}` },
      ],
    },
    {
      skuId: `${product.id}_pro`,
      skuImage: product.cover,
      specInfo: [
        {
          specId: 'format',
          specValueId: 'format-default',
          specValue: product.tags[0] || '数字商品',
        },
        {
          specId: 'edition',
          specValueId: 'edition-pro',
          specValue: '专业版',
        },
      ],
      priceInfo: [
        { priceType: 1, price: `${proPrice}` },
        { priceType: 2, price: `${basePrice}` },
      ],
    },
  ];
}

function buildDesc(product) {
  return [product.cover, ...(product.gallery || []), product.cover];
}

export function getHomeGoodsList() {
  return HOME_MOCK.products;
}

export function getHomeGoodById(spuId) {
  const product = HOME_MOCK.products.find((item) => item.id === spuId);
  if (!product) {
    return null;
  }

  const skuList = buildSkuList(product);
  const images = [product.cover, ...(product.gallery || []), product.cover];

  return {
    saasId: '88888888',
    storeId: '1000',
    spuId: product.id,
    title: product.title,
    intro: product.description,
    primaryImage: product.cover,
    images,
    available: 1,
    minSalePrice: Math.round(product.price * 100),
    minLinePrice: Math.round(product.price * 100),
    maxSalePrice: Math.round((product.price + 40) * 100),
    maxLinePrice: Math.round(product.price * 100),
    soldNum: product.sales,
    isPutOnSale: 1,
    specList: buildSpecList(product.tags),
    skuList,
    spuTagList: (product.tags || []).slice(0, 2).map((item, index) => ({
      id: `${product.id}_tag_${index}`,
      title: item,
      image: null,
    })),
    limitInfo: [{ text: '数字商品，购买后永久可用' }],
    desc: buildDesc(product),
    etitle: '',
    detailContent: product.detailContent || [],
    deliverables: product.deliverables || [],
    usageNotice: product.usageNotice || [],
  };
}
