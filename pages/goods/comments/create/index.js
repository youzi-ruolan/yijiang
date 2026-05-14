// import { getCommentDetail } from '../../../../services/good/comments/fetchCommentDetail';
import Toast from 'tdesign-miniprogram/toast/index';
import { addLocalComment } from '../../../../utils/local-comments';
Page({
  data: {
    serviceRateValue: 5,
    goodRateValue: 5,
    conveyRateValue: 5,
    isAnonymous: false,
    uploadFiles: [],
    gridConfig: {
      width: 218,
      height: 218,
      column: 3,
    },
    isAllowedSubmit: false,
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
    });
  },

  onRateChange(e) {
    const { value } = e?.detail;
    const item = e?.currentTarget?.dataset?.item;
    this.setData({ [item]: value }, () => {
      this.updateButtonStatus();
    });
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

  updateButtonStatus() {
    const { serviceRateValue, goodRateValue, conveyRateValue, isAllowedSubmit } = this.data;
    const { textAreaValue } = this;
    const temp = Boolean(
      serviceRateValue && goodRateValue && conveyRateValue && textAreaValue && textAreaValue.length >= 5,
    );
    if (temp !== isAllowedSubmit) this.setData({ isAllowedSubmit: temp });
  },

  onSubmitBtnClick() {
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
    if (!isAllowedSubmit) return;
    addLocalComment({
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
    Toast({
      context: this,
      selector: '#t-toast',
      message: '评价提交成功',
      icon: 'check-circle',
    });
    setTimeout(() => {
      wx.navigateBack();
    }, 700);
  },
});
