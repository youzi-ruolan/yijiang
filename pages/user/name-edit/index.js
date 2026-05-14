import Toast from 'tdesign-miniprogram/toast/index';
import { updateCurrentUser } from '../../../utils/local-auth';

Page({
  data: {
    nameValue: '',
  },
  onLoad(options) {
    const { name } = options;
    this.setData({
      nameValue: name,
    });
  },
  onSubmit() {
    try {
      updateCurrentUser({ nickName: this.data.nameValue.trim() });
      Toast({
        context: this,
        selector: '#t-toast',
        message: '昵称已保存',
        theme: 'success',
      });
      setTimeout(() => {
        wx.navigateBack({ backRefresh: true });
      }, 500);
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || '保存失败',
        theme: 'error',
      });
    }
  },
  clearContent() {
    this.setData({
      nameValue: '',
    });
  },
});
