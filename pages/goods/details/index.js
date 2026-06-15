import Toast from 'tdesign-miniprogram/toast/index';
import { fetchGood } from '../../../services/good/fetchGood';
import {
  getGoodsDetailsCommentList,
  getGoodsDetailsCommentsCount,
} from '../../../services/good/fetchGoodsDetailsComments';
import { cdnBase } from '../../../config/index';
import { addLocalCartItem, getLocalCartCount } from '../../../utils/local-cart';
import { getCurrentUser, promptLoginRequired } from '../../../utils/local-auth';
import { detailContentToHtml, parseDetailContentHtml } from '../../../utils/parse-detail-content';

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
    detailHtml: '',
    detailBlocks: [],
    galleryMedia: [],
    detailMedia: [],
    deliverables: [],
    usageNotice: [],
    limitBuyInfo: '',
    cartFlyVisible: false,
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

  async ensureActionLogin(content = '请先登录后再购买') {
    if (getCurrentUser()) return true;
    return promptLoginRequired({ content });
  },

  async buyItNow() {
    if (!(await this.ensureActionLogin('请先登录后再购买'))) return;
    this.showSkuSelectPopup(1);
  },

  toAddCart() {
    if (this.data.isAllSelectedSku) {
      this.addCart();
      return;
    }

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
    const index = e.currentTarget?.dataset?.index ?? 0;
    const { images = [] } = this.data.details;
    if (!images.length) return;
    wx.previewImage({
      current: images[index],
      urls: images,
    });
  },

  previewGalleryImage(e) {
    const { url } = e.currentTarget.dataset;
    const urls = (this.data.galleryMedia || [])
      .filter((item) => item.type === 'image')
      .map((item) => item.url);
    if (!url || !urls.length) return;
    wx.previewImage({
      current: url,
      urls,
    });
  },

  openExternalVideo(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({
          title: '链接已复制，请在浏览器打开',
          icon: 'none',
        });
      },
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
      this.playAddCartAnimation();
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

  playAddCartAnimation() {
    this.setData({ cartFlyVisible: false }, () => {
      this.setData({ cartFlyVisible: true });
      clearTimeout(this.cartFlyTimer);
      this.cartFlyTimer = setTimeout(() => {
        this.setData({ cartFlyVisible: false });
      }, 760);
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
      saasId: details.saasId || '',
      storeId: details.storeId || '',
      storeName: details.storeName || '',
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

  async gotoBuy() {
    if (!(await this.ensureActionLogin('请先登录后再购买'))) return;
    const { details, isAllSelectedSku, buyNum, selectItem, skuArray, selectedAttrStr } = this.data;
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
    const selectedSku = Array.isArray(selectItem) ? selectItem[0] : selectItem || skuArray[0] || {};
    const selectedSpecInfo =
      (selectedSku.specInfo || []).map((skuSpec) => {
        const spec = details.specList?.find((item) => item.specId === skuSpec.specId) || {};
        const specValue =
          skuSpec.specValue ||
          spec.specValueList?.find((item) => item.specValueId === skuSpec.specValueId)?.specValue ||
          '';

        return {
          specTitle: skuSpec.specTitle || spec.title || '',
          specValue,
        };
      }) ||
      (details.specList || []).map((item) => ({
        specTitle: item.title,
        specValue: item.specValueList?.[0]?.specValue || '',
      }));
    const selectedPrice = this.data.selectSkuSellsPrice || selectedSku.price || details.minSalePrice || 0;
    this.handlePopupHide();
    const query = {
      quantity: buyNum,
      storeId: details.storeId || '',
      storeName: details.storeName || '',
      spuId: details.spuId || this.data.spuId,
      goodsName: details.title,
      skuId: selectedSku.skuId || `${details.spuId || this.data.spuId}_default`,
      available: details.available,
      price: selectedPrice,
      specInfo: selectedSpecInfo,
      primaryImage: selectedSku.skuImage || details.primaryImage,
      thumb: selectedSku.skuImage || details.primaryImage,
      title: details.title,
      selectedAttrStr,
    };
    let urlQueryStr = obj2Params(
      {
        goodsRequestList: JSON.stringify([query]),
      },
      true,
    );
    urlQueryStr = urlQueryStr ? `?${urlQueryStr}` : '';
    const path = `/pages/order/order-confirm/index${urlQueryStr}`;
    wx.navigateTo({
      url: path,
    });
  },

  async specsConfirm() {
    const { buyType } = this.data;
    if (buyType === 1) {
      await this.gotoBuy();
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

  buildDefaultSelectedSku(specList = [], sku = {}) {
    const selectedSku = {};
    (sku.specInfo || []).forEach((item) => {
      selectedSku[item.specId] = item.specValueId;
    });

    return {
      selectedSku,
      specList: specList.map((spec) => ({
        ...spec,
        specValueList: (spec.specValueList || []).map((value) => ({
          ...value,
          isSelected: selectedSku[spec.specId] === value.specValueId,
        })),
      })),
    };
  },

  setDetailData(details) {
    const skuArray = [];
    const {
      skuList = [],
      primaryImage,
      minSalePrice,
      maxSalePrice,
      maxLinePrice,
      soldNum,
      intro,
      detailHtml = '',
      detailContent = '',
      detailMedia = [],
      galleryMedia = [],
      deliverables = [],
      usageNotice = [],
    } = details;
    const normalizedDetailHtml = detailHtml || detailContentToHtml(detailContent || details.detailContent);
    const detailBlocks = parseDetailContentHtml(normalizedDetailHtml);
    const normalizedDetailMedia = this.normalizeDetailMedia(detailMedia || []);
    const normalizedGalleryMedia = this.normalizeDetailMedia(
      galleryMedia.length ? galleryMedia : normalizedDetailMedia.length > 1 ? normalizedDetailMedia.slice(1) : [],
    );

    skuList.forEach((item) => {
      skuArray.push({
        skuId: item.skuId,
        quantity: 1,
        specInfo: item.specInfo,
        skuImage: item.skuImage,
        price: item.priceInfo?.[0]?.price || minSalePrice || 0,
      });
    });
    const defaultSku = skuArray[0] || {};
    const { specList: defaultSpecList } = this.buildDefaultSelectedSku(details.specList || [], defaultSku);
    const nextDetails = {
      ...details,
      specList: defaultSpecList,
    };

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
      details: nextDetails,
      intro: intro || nextDetails.intro || nextDetails.description || '',
      activityList: [],
      isStock: true,
      maxSalePrice: maxSalePrice ? parseInt(maxSalePrice) : 0,
      maxLinePrice: maxLinePrice ? parseInt(maxLinePrice) : 0,
      minSalePrice: minSalePrice ? parseInt(minSalePrice) : 0,
      list: [],
      skuArray,
      skuList,
      primaryImage,
      specImg: primaryImage,
      soldout: false,
      soldNum,
      isAllSelectedSku: skuArray.length > 0,
      selectedAttrStr: defaultAttrStr,
      selectItem: defaultSku.skuId ? defaultSku : null,
      selectSkuSellsPrice: defaultSku.price || minSalePrice || 0,
      detailHtml: normalizedDetailHtml,
      detailBlocks,
      galleryMedia: normalizedGalleryMedia,
      detailMedia: normalizedDetailMedia,
      deliverables,
      usageNotice,
      limitBuyInfo: details.limitInfo?.[0]?.text || '',
    });
  },

  normalizeDetailMedia(mediaList = []) {
    return mediaList
      .map((item) => {
        if (typeof item === 'string') {
          return {
            type: /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(item) ? 'video' : 'image',
            url: item,
            cover: '',
            title: '',
          };
        }

        const url = item.url || item.src || '';

        return {
          type: item.type === 'video' || /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(url) ? 'video' : 'image',
          url,
          cover: item.cover || '',
          title: item.title || '',
        };
      })
      .filter((item) => item.url);
  },

  async getDetail(spuId) {
    try {
      const details = await fetchGood(spuId);
      if (details) {
        this.setDetailData(details);
        this.refreshCartNum();
        return;
      }
    } catch (error) {
      console.error('fetch detail error:', error);
    }
    Toast({
      context: this,
      selector: '#t-toast',
      message: '商品详情加载失败',
      icon: '',
    });
  },

  async getCommentsList() {
    try {
      const code = 'Success';
      const data = await getGoodsDetailsCommentList(this.data.spuId);
      const { homePageComments } = data;
      if (code.toUpperCase() === 'SUCCESS') {
        const nextState = {
          commentsList: homePageComments.map((item) => {
            return {
              goodsSpu: item.spuId,
              userName: item.userName || '',
              commentScore: item.commentScore,
              commentContent: item.commentContent || '',
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
      const data = await getGoodsDetailsCommentsCount(this.data.spuId);
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

  onUnload() {
    clearTimeout(this.cartFlyTimer);
  },
});
