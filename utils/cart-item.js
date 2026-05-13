export function buildCartItemFromGoods(goods = {}) {
  const spuId = goods.spuId || goods.id || '';
  const cover = goods.thumb || goods.primaryImage || goods.cover || '';
  const price = Number(goods.price || 0);
  const originPrice = Number(goods.originPrice || goods.price || 0);
  const tags = Array.isArray(goods.tags)
    ? goods.tags.map((item) => (typeof item === 'string' ? item : item?.title || '')).filter(Boolean)
    : [];

  return {
    spuId,
    skuId: goods.skuId || `${spuId}_standard`,
    title: goods.title || '',
    thumb: cover,
    primaryImage: cover,
    price: `${price}`,
    originPrice: `${originPrice}`,
    storeId: '1000',
    storeName: '艺匠调色数字资产商店',
    specInfo: [
      {
        specTitle: '类型',
        specValue: tags[0] || '数字商品',
      },
      {
        specTitle: '版本',
        specValue: '标准版',
      },
    ],
  };
}
