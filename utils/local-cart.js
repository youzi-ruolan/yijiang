const CART_STORAGE_KEY = 'colorist.local.cart';

function safeGetStorage(key, fallback) {
  try {
    const value = wx.getStorageSync(key);
    return value || fallback;
  } catch (error) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.error('set storage error', error);
  }
}

export function getLocalCartList() {
  return safeGetStorage(CART_STORAGE_KEY, []);
}

export function setLocalCartList(list) {
  safeSetStorage(CART_STORAGE_KEY, list);
  return list;
}

export function getLocalCartCount() {
  return getLocalCartList().reduce((total, item) => total + (item.quantity || 0), 0);
}

export function addLocalCartItem(goods, quantity = 1) {
  const cartList = getLocalCartList();
  const currentIndex = cartList.findIndex((item) => item.spuId === goods.spuId && item.skuId === goods.skuId);

  if (currentIndex > -1) {
    cartList[currentIndex] = {
      ...cartList[currentIndex],
      quantity: cartList[currentIndex].quantity + quantity,
    };
  } else {
    cartList.unshift({
      ...goods,
      quantity,
      isSelected: 1,
      available: 1,
      putOnSale: 1,
    });
  }

  return setLocalCartList(cartList);
}

export function updateLocalCartItem(spuId, skuId, payload = {}) {
  const nextList = getLocalCartList().map((item) => {
    if (item.spuId === spuId && item.skuId === skuId) {
      return {
        ...item,
        ...payload,
      };
    }
    return item;
  });

  return setLocalCartList(nextList);
}

export function removeLocalCartItem(spuId, skuId) {
  const nextList = getLocalCartList().filter((item) => !(item.spuId === spuId && item.skuId === skuId));
  return setLocalCartList(nextList);
}

export function clearLocalCart() {
  return setLocalCartList([]);
}

export function genLocalCartGroupData() {
  const cartList = getLocalCartList();
  const selectedCartList = cartList.filter((item) => item.isSelected);
  const totalAmount = selectedCartList.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const totalOriginAmount = selectedCartList.reduce(
    (sum, item) => sum + Number(item.originPrice || item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const selectedGoodsCount = selectedCartList.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return {
    data: {
      isNotEmpty: cartList.length > 0,
      storeGoods: [
        {
          storeId: '1000',
          storeName: '艺匠调色数字资产商店',
          storeStatus: 1,
          isSelected: cartList.every((item) => item.isSelected),
          storeStockShortage: false,
          shortageGoodsList: [],
          promotionGoodsList: [
            {
              title: null,
              promotionCode: 'EMPTY_PROMOTION',
              promotionSubCode: null,
              promotionId: null,
              tagText: null,
              promotionStatus: null,
              tag: null,
              description: null,
              doorSillRemain: null,
              isNeedAddOnShop: 0,
              goodsPromotionList: cartList,
              lastJoinTime: null,
            },
          ],
          lastJoinTime: null,
          postageFreePromotionVo: {},
        },
      ],
      invalidGoodItems: [],
      isAllSelected: cartList.length > 0 && cartList.every((item) => item.isSelected),
      selectedGoodsCount,
      totalAmount: `${totalAmount}`,
      totalDiscountAmount: `${Math.max(totalOriginAmount - totalAmount, 0)}`,
    },
    code: 'Success',
    success: true,
  };
}
