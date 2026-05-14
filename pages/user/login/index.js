import Toast from 'tdesign-miniprogram/toast/index';
import { loginLocalUser, registerLocalUser } from '../../../utils/local-auth';
import { phoneRegCheck } from '../../../utils/util';

Page({
  data: {
    mode: 'login',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    nickName: '',
    redirect: '',
    loading: false,
  },

  onLoad(options) {
    this.setData({
      redirect: decodeURIComponent(options.redirect || ''),
    });
  },

  switchMode(event) {
    const { mode } = event.currentTarget.dataset;
    this.setData({
      mode,
      password: '',
      confirmPassword: '',
      loading: false,
    });
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({
      [field]: event.detail.value,
    });
  },

  validateForm() {
    const { mode, phoneNumber, password, confirmPassword, nickName } = this.data;
    const phone = `${phoneNumber}`.trim();

    if (!phoneRegCheck(phone)) {
      return '请输入正确的手机号';
    }
    if (`${password}`.length < 6) {
      return '密码至少 6 位';
    }
    if (mode === 'register') {
      if (!`${nickName}`.trim()) {
        return '请输入昵称';
      }
      if (password !== confirmPassword) {
        return '两次输入的密码不一致';
      }
    }
    return '';
  },

  submit() {
    const message = this.validateForm();
    if (message) {
      Toast({
        context: this,
        selector: '#t-toast',
        message,
        icon: '',
      });
      return;
    }

    const { mode, phoneNumber, password, nickName, redirect } = this.data;
    this.setData({ loading: true });

    try {
      if (mode === 'register') {
        registerLocalUser({ phoneNumber, password, nickName });
      } else {
        loginLocalUser({ phoneNumber, password });
      }

      Toast({
        context: this,
        selector: '#t-toast',
        message: mode === 'register' ? '注册成功' : '登录成功',
        icon: 'check-circle',
      });

      setTimeout(() => {
        if (redirect) {
          wx.redirectTo({ url: redirect });
          return;
        }
        wx.switchTab({ url: '/pages/usercenter/index' });
      }, 500);
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || '操作失败，请稍后重试',
        icon: '',
      });
      this.setData({ loading: false });
    }
  },
});
