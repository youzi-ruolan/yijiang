import Toast from 'tdesign-miniprogram/toast/index';
import { ensureWechatLoginWithGuide, getCurrentUser } from '../../../../utils/local-auth';
import { submitComment } from '../../../../services/comments/submitComment';

const RATE_TEXTS = ['点击评分', '很差', '一般', '还行', '满意', '超赞'];

Page({
  data: {
    serviceRateValue: 0,
    goodRateValue: 0,
    conveyRateValue: 0,
    goodRateText: RATE_TEXTS[0],
    serviceRateText: RATE_TEXTS[0],
    conveyRateText: RATE_TEXTS[0],
    rateAnimating: '',
    isAnonymous: false,
    uploadFiles: [],
    gridConfig: {
      width: 218,
      height: 218,
      column: 3,
    },
    isAllowedSubmit: false,
    submitTip: '请先为商品、物流和服务打分，并填写至少 5 个字',
    imgUrl: '',
    title: '',
    goodsDetail: '',
    spuId: '',
    skuId: '',
    orderNo: '',
    commentText: '',
    imageProps: {
      mode: 'aspectFit',
    },
  },

  onLoad(options) {
    this.setData({
      imgUrl: decodeURIComponent(options.imgUrl || ''),
      title: decodeURIComponent(options.title || ''),
      goodsDetail: decodeURIComponent(options.specs || ''),
      spuId: options.spuId || '',
      skuId: options.skuId || '',
      orderNo: options.orderNo || '',
      goodRateValue: 0,
      serviceRateValue: 0,
      conveyRateValue: 0,
      goodRateText: RATE_TEXTS[0],
      serviceRateText: RATE_TEXTS[0],
      conveyRateText: RATE_TEXTS[0],
    });
    this.textAreaValue = '';
    this.updateButtonStatus();
  },

  onRateChange(e) {
    const value = Number(e?.detail?.value || 0);
    const item = e?.currentTarget?.dataset?.item;
    if (!item) return;

    const textKey = item.replace('Value', 'Text');
    this.setData(
      {
        [item]: value,
        [textKey]: RATE_TEXTS[value] || RATE_TEXTS[0],
        rateAnimating: item,
      },
      () => {
        this.updateButtonStatus();
      },
    );

    try {
      wx.vibrateShort({ type: 'light' });
    } catch (error) {
      // ignore haptic failures on unsupported devices
    }

    clearTimeout(this.rateAnimTimer);
    this.rateAnimTimer = setTimeout(() => {
      if (this.data.rateAnimating === item) {
        this.setData({ rateAnimating: '' });
      }
    }, 280);
  },

  onAnonymousChange(e) {
    const status = !!e?.detail?.checked;
    this.setData({ isAnonymous: status });
  },

  handleSuccess(e) {
    const { files } = e.detail;

    this.setData({
      uploadFiles: files,
    });
  },

  handleRemove(e) {
    const { index } = e.detail;
    const { uploadFiles } = this.data;
    uploadFiles.splice(index, 1);
    this.setData({
      uploadFiles,
    });
  },

  onTextAreaChange(e) {
    const value = `${e?.detail?.value || ''}`.trim();
    this.textAreaValue = value;
    this.setData({ commentText: value });
    this.updateButtonStatus();
  },

  buildSubmitTip() {
    const { serviceRateValue, goodRateValue, conveyRateValue } = this.data;
    const { textAreaValue } = this;
    const missing = [];
    if (!goodRateValue) missing.push('商品');
    if (!conveyRateValue) missing.push('物流');
    if (!serviceRateValue) missing.push('服务');
    if (missing.length) {
      return `请为${missing.join('、')}打分`;
    }
    if (!textAreaValue || textAreaValue.length < 5) {
      return '请填写至少 5 个字的评价内容';
    }
    return '';
  },

  updateButtonStatus() {
    const { serviceRateValue, goodRateValue, conveyRateValue, isAllowedSubmit } = this.data;
    const { textAreaValue } = this;
    const temp = Boolean(
      serviceRateValue > 0 && goodRateValue > 0 && conveyRateValue > 0 && textAreaValue && textAreaValue.length >= 5,
    );
    const submitTip = this.buildSubmitTip();
    if (temp !== isAllowedSubmit || submitTip !== this.data.submitTip) {
      this.setData({ isAllowedSubmit: temp, submitTip });
    }
  },

  async onSubmitBtnClick() {
    const {
      isAllowedSubmit,
      spuId,
      skuId,
      goodsDetail,
      goodRateValue,
      serviceRateValue,
      conveyRateValue,
      isAnonymous,
      uploadFiles,
      orderNo,
    } = this.data;
    if (!isAllowedSubmit) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: this.data.submitTip || '请完善评价后再提交',
        icon: '',
      });
      return;
    }
    if (!getCurrentUser()) {
      const loginResult = await ensureWechatLoginWithGuide({
        content: '提交商品评价需要先完成登录。',
      });

      if (!loginResult.authed) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '登录后才能评价',
          icon: '',
        });
        return;
      }

      if (loginResult.guided) return;
    }

    try {
      await submitComment({
        spuId,
        skuId,
        orderNo,
        specInfo: goodsDetail,
        goodsDetailInfo: goodsDetail,
        commentScore: goodRateValue,
        serviceScore: serviceRateValue,
        conveyScore: conveyRateValue,
        commentContent: this.textAreaValue,
        uploadFiles,
        isAnonymity: isAnonymous,
      });
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || '评价提交失败',
        icon: '',
      });
      return;
    }
    Toast({
      context: this,
      selector: '#t-toast',
      message: '评价提交成功',
      icon: 'check-circle',
    });
    setTimeout(() => {
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        prevPage.data.backRefresh = true;
      }
      wx.navigateBack();
    }, 700);
  },
});
