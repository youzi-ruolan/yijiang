import Toast from 'tdesign-miniprogram/toast/index';
import { fetchGood } from '../../../services/good/fetchGood';
import { fetchActivityList } from '../../../services/activity/fetchActivityList';
import {
  getGoodsDetailsCommentList,
  getGoodsDetailsCommentsCount,
} from '../../../services/good/fetchGoodsDetailsComments';
import { cdnBase } from '../../../config/index';
import { getHomeGoodById } from '../../../utils/home-goods';
import { addLocalCartItem, getLocalCartCount } from '../../../utils/local-cart';

const imgPrefix = `${cdnBase}/`;

const recLeftImg = `${imgPrefix}common/rec-left.png`;
const recRightImg = `${imgPrefix}common/rec-right.png`;
const obj2Params = (obj = {}, encode = false) => {
  const result = [];
  Object.keys(obj).forEach((key) => result.push(`${key}=${encode ? encodeURIComponent(obj[key]) : obj[key]}`));

  return result.join('&');
};

Page({
  data: {
    commentsList: [],
    commentsStatistics: {
      badCount: 0,
      commentCount: 0,
      goodCount: 0,
      goodRate: 0,
      hasImageCount: 0,
      middleCount: 0,
    },
    isShowPromotionPop: false,
    activityList: [],
    recLeftImg,
    recRightImg,
    details: {},
    goodsTabArray: [
      {
        name: '课程',
        value: '', // 空字符串代表置顶
      },
      {
        name: '详情',
        value: 'goods-page',
      },
    ],
    storeLogo: `${imgPrefix}common/store-logo.png`,
    storeName: '艺匠调色数字资产商店',
    jumpArray: [
      {
        title: '全部商品',
        url: '/pages/home/home',
        iconName: 'home',
      },
      {
        title: '待购',
        url: '/pages/cart/index',
        iconName: 'cart',
        showCartNum: true,
      },
    ],
    isStock: true,
    cartNum: 0,
    soldout: false,
    buttonType: 1,
    buyNum: 1,
    selectedAttrStr: '',
    skuArray: [],
    primaryImage: '',
    specImg: '',
    isSpuSelectPopupShow: false,
    isAllSelectedSku: false,
    buyType: 0,
    outOperateStatus: false, // 是否外层加入购物车
    operateType: 0,
    selectSkuSellsPrice: 0,
    maxLinePrice: 0,
    minSalePrice: 0,
    maxSalePrice: 0,
    list: [],
    spuId: '',
    navigation: { type: 'fraction' },
    current: 0,
    autoplay: true,
    duration: 500,
    interval: 5000,
    soldNum: 0, // 已售数量
    intro: '',
    detailContent: [],
    deliverables: [],
    usageNotice: [],
  },

  handlePopupHide() {
    this.setData({
      isSpuSelectPopupShow: false,
    });
  },

  showSkuSelectPopup(type) {
    this.setData({
      buyType: type || 0,
      outOperateStatus: type >= 1,
      isSpuSelectPopupShow: true,
    });
  },

  buyItNow() {
    this.showSkuSelectPopup(1);
  },

  toAddCart() {
    this.showSkuSelectPopup(2);
  },

  toNav(e) {
    const { url } = e.detail;
    wx.switchTab({
      url: url,
    });
  },

  onShow() {
    this.refreshCartNum();
  },

  showCurImg(e) {
    const index = e.detail?.index ?? e.currentTarget?.dataset?.index ?? 0;
    const { images } = this.data.details;
    wx.previewImage({
      current: images[index],
      urls: images, // 需要预览的图片http链接列表
    });
  },

  handleSwiperChange(e) {
    this.setData({
      current: e.detail.current || 0,
    });
  },

  onPageScroll({ scrollTop }) {
    const goodsTab = this.selectComponent('#goodsTab');
    goodsTab && goodsTab.onScroll(scrollTop);
  },

  chooseSpecItem(e) {
    const { specList } = this.data.details;
    const { selectedSku, isAllSelectedSku } = e.detail;
    if (!isAllSelectedSku) {
      this.setData({
        selectSkuSellsPrice: 0,
      });
    }
    this.setData({
      isAllSelectedSku,
    });
    this.getSkuItem(specList, selectedSku);
  },

  getSkuItem(specList, selectedSku) {
    const { skuArray, primaryImage } = this.data;
    const selectedSkuValues = this.getSelectedSkuValues(specList, selectedSku);
    let selectedAttrStr = ` 件  `;
    selectedSkuValues.forEach((item) => {
      selectedAttrStr += `，${item.specValue}  `;
    });
    // eslint-disable-next-line array-callback-return
    const skuItems = skuArray.filter((item) => {
      let status = true;
      (item.specInfo || []).forEach((subItem) => {
        if (!selectedSku[subItem.specId] || selectedSku[subItem.specId] !== subItem.specValueId) {
          status = false;
        }
      });
      if (status) return item;
    });
    const skuItem = skuItems[0] || null;
    this.selectSpecsName(selectedSkuValues.length > 0 ? selectedAttrStr : '');
    if (skuItem) {
      this.setData({
        selectItem: skuItem,
        selectSkuSellsPrice: skuItem.price || 0,
      });
    } else {
      this.setData({
        selectItem: null,
        selectSkuSellsPrice: 0,
      });
    }
    this.setData({
      specImg: skuItem && skuItem.skuImage ? skuItem.skuImage : primaryImage,
    });
  },

  // 获取已选择的sku名称
  getSelectedSkuValues(skuTree, selectedSku) {
    const normalizedTree = this.normalizeSkuTree(skuTree);
    return Object.keys(selectedSku).reduce((selectedValues, skuKeyStr) => {
      const skuValues = normalizedTree[skuKeyStr];
      const skuValueId = selectedSku[skuKeyStr];
      if (skuValueId !== '') {
        const skuValue = skuValues.filter((value) => {
          return value.specValueId === skuValueId;
        })[0];
        skuValue && selectedValues.push(skuValue);
      }
      return selectedValues;
    }, []);
  },

  normalizeSkuTree(skuTree) {
    const normalizedTree = {};
    skuTree.forEach((treeItem) => {
      normalizedTree[treeItem.specId] = treeItem.specValueList;
    });
    return normalizedTree;
  },

  selectSpecsName(selectSpecsName) {
    if (selectSpecsName) {
      this.setData({
        selectedAttrStr: selectSpecsName,
      });
    } else {
      this.setData({
        selectedAttrStr: '',
      });
    }
  },

  addCart() {
    const { isAllSelectedSku } = this.data;
    if (isAllSelectedSku) {
      const cartItem = this.buildCartItem();
      addLocalCartItem(cartItem, this.data.buyNum);
      this.refreshCartNum();
      this.handlePopupHide();
      const tabBar = this.getTabBar && this.getTabBar();
      if (tabBar && tabBar.updateCartCount) {
        tabBar.updateCartCount();
      }
    }
    Toast({
      context: this,
      selector: '#t-toast',
      message: isAllSelectedSku ? '已加入购物车' : '请选择规格',
      icon: '',
      duration: 1000,
    });
  },

  buildCartItem() {
    const { details, selectItem, buyNum } = this.data;
    const skuData = Array.isArray(selectItem) ? selectItem[0] : selectItem;
    const fallbackSku = this.data.skuArray[0] || {};
    const currentSku = skuData || fallbackSku;
    const price = this.data.selectSkuSellsPrice || details.minSalePrice || 0;
    const specInfo = (currentSku.specInfo || []).map((item) => ({
      specTitle: item.specTitle || details.specList?.find((spec) => spec.specId === item.specId)?.title || '',
      specValue:
        item.specValue ||
        details.specList
          ?.find((spec) => spec.specId === item.specId)
          ?.specValueList?.find((specValue) => specValue.specValueId === item.specValueId)?.specValue ||
        '',
    }));

    return {
      uid: `${details.spuId}_${currentSku.skuId || 'default'}`,
      saasId: details.saasId || '88888888',
      storeId: details.storeId || '1000',
      storeName: '艺匠调色数字资产商店',
      spuId: details.spuId,
      skuId: currentSku.skuId || `${details.spuId}_default`,
      title: details.title,
      thumb: details.primaryImage,
      primaryImage: details.primaryImage,
      quantity: buyNum || 1,
      price: `${price}`,
      originPrice: `${details.maxLinePrice || details.minLinePrice || price}`,
      specInfo,
      joinCartTime: new Date().toISOString(),
    };
  },

  refreshCartNum() {
    this.setData({
      cartNum: getLocalCartCount(),
    });
  },

  gotoBuy(type) {
    const { isAllSelectedSku, buyNum } = this.data;
    if (!isAllSelectedSku) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择规格',
        icon: '',
        duration: 1000,
      });
      return;
    }
    this.handlePopupHide();
    const query = {
      quantity: buyNum,
      storeId: '1',
      spuId: this.data.spuId,
      goodsName: this.data.details.title,
      skuId: type === 1 ? this.data.skuList[0].skuId : this.data.selectItem.skuId,
      available: this.data.details.available,
      price: this.data.details.minSalePrice,
      specInfo: this.data.details.specList?.map((item) => ({
        specTitle: item.title,
        specValue: item.specValueList[0].specValue,
      })),
      primaryImage: this.data.details.primaryImage,
      spuId: this.data.details.spuId,
      thumb: this.data.details.primaryImage,
      title: this.data.details.title,
    };
    let urlQueryStr = obj2Params({
      goodsRequestList: JSON.stringify([query]),
    });
    urlQueryStr = urlQueryStr ? `?${urlQueryStr}` : '';
    const path = `/pages/order/order-confirm/index${urlQueryStr}`;
    wx.navigateTo({
      url: path,
    });
  },

  specsConfirm() {
    const { buyType } = this.data;
    if (buyType === 1) {
      this.gotoBuy();
    } else {
      this.addCart();
    }
    // this.handlePopupHide();
  },

  changeNum(e) {
    this.setData({
      buyNum: e.detail.buyNum,
    });
  },

  closePromotionPopup() {
    this.setData({
      isShowPromotionPop: false,
    });
  },

  promotionChange(e) {
    const { index } = e.detail;
    wx.navigateTo({
      url: `/pages/promotion/promotion-detail/index?promotion_id=${index}`,
    });
  },

  showPromotionPopup() {
    this.setData({
      isShowPromotionPop: true,
    });
  },

  setDetailData(details, activityList = []) {
    const skuArray = [];
    const {
      skuList = [],
      primaryImage,
      minSalePrice,
      maxSalePrice,
      maxLinePrice,
      soldNum,
      intro,
      detailContent = [],
      deliverables = [],
      usageNotice = [],
    } = details;

    skuList.forEach((item) => {
      skuArray.push({
        skuId: item.skuId,
        quantity: 1,
        specInfo: item.specInfo,
        price: item.priceInfo?.[0]?.price || minSalePrice || 0,
      });
    });

    const promotionArray = [];
    activityList.forEach((item) => {
      promotionArray.push({
        tag: item.promotionSubCode === 'MYJ' ? '满减' : '满折',
        label: '满100元减99.9元',
      });
    });

    const defaultSpecInfo =
      skuList?.[0]?.specInfo?.reduce((result, item) => {
        const specTitle = details.specList?.find((spec) => spec.specId === item.specId)?.title || '';
        const specValue =
          item.specValue ||
          details.specList
            ?.find((spec) => spec.specId === item.specId)
            ?.specValueList?.find((specValueItem) => specValueItem.specValueId === item.specValueId)?.specValue ||
          '';

        result.push({
          specTitle,
          specValue,
        });
        return result;
      }, []) || [];

    const defaultAttrStr =
      defaultSpecInfo.length > 0 ? `件，${defaultSpecInfo.map((item) => item.specValue).join('，')}` : '';

    this.setData({
      details,
      intro: intro || details.intro || details.description || '',
      activityList,
      isStock: true,
      maxSalePrice: maxSalePrice ? parseInt(maxSalePrice) : 0,
      maxLinePrice: maxLinePrice ? parseInt(maxLinePrice) : 0,
      minSalePrice: minSalePrice ? parseInt(minSalePrice) : 0,
      list: promotionArray,
      skuArray,
      skuList,
      primaryImage,
      specImg: primaryImage,
      soldout: false,
      soldNum,
      isAllSelectedSku: true,
      selectedAttrStr: defaultAttrStr,
      selectItem: skuArray[0] || null,
      selectSkuSellsPrice: skuArray[0]?.price || minSalePrice || 0,
      detailContent,
      deliverables,
      usageNotice,
    });
  },

  async getDetail(spuId) {
    try {
      const [details, activityList] = await Promise.all([fetchGood(spuId), fetchActivityList()]);
      if (details) {
        this.setDetailData(details, activityList || []);
        this.refreshCartNum();
        return;
      }
    } catch (error) {
      console.error('fetch detail error:', error);
    }

    const localGood = getHomeGoodById(spuId);
    if (localGood) {
      this.setDetailData(localGood, []);
      this.refreshCartNum();
    }
  },

  async getCommentsList() {
    try {
      const code = 'Success';
      const data = await getGoodsDetailsCommentList();
      const { homePageComments } = data;
      if (code.toUpperCase() === 'SUCCESS') {
        const nextState = {
          commentsList: homePageComments.map((item) => {
            return {
              goodsSpu: item.spuId,
              userName: item.userName || '',
              commentScore: item.commentScore,
              commentContent: item.commentContent || '用户未填写评价',
              userHeadUrl: item.isAnonymity ? this.anonymityAvatar : item.userHeadUrl || this.anonymityAvatar,
            };
          }),
        };
        this.setData(nextState);
      }
    } catch (error) {
      console.error('comments error:', error);
    }
  },

  onShareAppMessage() {
    // 自定义的返回信息
    const { selectedAttrStr } = this.data;
    let shareSubTitle = '';
    if (selectedAttrStr.indexOf('件') > -1) {
      const count = selectedAttrStr.indexOf('件');
      shareSubTitle = selectedAttrStr.slice(count + 1, selectedAttrStr.length);
    }
    const customInfo = {
      imageUrl: this.data.details.primaryImage,
      title: this.data.details.title + shareSubTitle,
      path: `/pages/goods/details/index?spuId=${this.data.spuId}`,
    };
    return customInfo;
  },

  /** 获取评价统计 */
  async getCommentsStatistics() {
    try {
      const code = 'Success';
      const data = await getGoodsDetailsCommentsCount();
      if (code.toUpperCase() === 'SUCCESS') {
        const { badCount, commentCount, goodCount, goodRate, hasImageCount, middleCount } = data;
        const nextState = {
          commentsStatistics: {
            badCount: parseInt(`${badCount}`),
            commentCount: parseInt(`${commentCount}`),
            goodCount: parseInt(`${goodCount}`),
            /** 后端返回百分比后数据但没有限制位数 */
            goodRate: Math.floor(goodRate * 10) / 10,
            hasImageCount: parseInt(`${hasImageCount}`),
            middleCount: parseInt(`${middleCount}`),
          },
        };
        this.setData(nextState);
      }
    } catch (error) {
      console.error('comments statiistics error:', error);
    }
  },

  /** 跳转到评价列表 */
  navToCommentsListPage() {
    wx.navigateTo({
      url: `/pages/goods/comments/index?spuId=${this.data.spuId}`,
    });
  },

  onLoad(query) {
    const { spuId } = query;
    this.setData({
      spuId: spuId,
    });
    this.refreshCartNum();
    this.getDetail(spuId);
    this.getCommentsList(spuId);
    this.getCommentsStatistics(spuId);
  },
});
