import { fetchUserCenter } from '../../services/usercenter/fetchUsercenter';
import { updatePersonProfile } from '../../services/usercenter/updatePerson';
import Toast from 'tdesign-miniprogram/toast/index';
import { phoneEncryption } from '../../utils/util';
import {
  authorizeWechatUserByPhone,
  ensureWechatLoginWithGuide,
  getCurrentUser,
  isWechatProfileComplete,
  updateCurrentUser,
} from '../../utils/local-auth';

const menuData = [
  [
    {
      title: '收货地址',
      tit: '',
      url: '',
      type: 'address',
    },
  ],
];

const orderTagInfos = [
  {
    title: '待付款',
    iconName: 'wallet',
    orderNum: 0,
    tabType: 5,
    status: 1,
  },
  {
    title: '待发货',
    iconName: 'deliver',
    orderNum: 0,
    tabType: 10,
    status: 1,
  },
  {
    title: '待收货',
    iconName: 'package',
    orderNum: 0,
    tabType: 40,
    status: 1,
  },
  {
    title: '退款/售后',
    iconName: 'exchang',
    orderNum: 0,
    tabType: 0,
    status: 1,
  },
];

const getDefaultData = () => ({
  showMakePhone: false,
  userInfo: {
    avatarUrl: '',
    nickName: '',
    phoneNumber: '',
  },
  menuData,
  orderTagInfos,
  customerServiceInfo: {},
  currAuthStep: 1,
  showKefu: true,
  versionNo: '',
  showLoginAuth: false,
  loginAuthLoading: false,
  profileIncomplete: false,
});

Page({
  data: getDefaultData(),

  onLoad() {
    this.getVersionInfo();
  },

  onShow() {
    this.getTabBar().init();
    this.init();
  },
  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.fetUseriInfoHandle();
  },

  fetUseriInfoHandle() {
    fetchUserCenter().then(({ userInfo: serverUserInfo, countsData, orderTagInfos: orderInfo, customerServiceInfo }) => {
      const currentUser = getCurrentUser();
      if (currentUser && serverUserInfo) {
        updateCurrentUser({
          nickName: serverUserInfo.nickName || currentUser.nickName,
          avatarUrl: serverUserInfo.avatarUrl || currentUser.avatarUrl,
          phoneNumber: serverUserInfo.phoneNumber || currentUser.phoneNumber,
          gender: serverUserInfo.gender ?? currentUser.gender,
        });
      }

      const mergedUser = getCurrentUser();
      const nextMenuData = menuData.map((group) =>
        group.map((item) => ({
          ...item,
          tit: '',
        })),
      );

      if (mergedUser && nextMenuData[0]) {
        nextMenuData[0].forEach((v) => {
          countsData.forEach((counts) => {
            if (counts.type === v.type) {
              // eslint-disable-next-line no-param-reassign
              v.tit = counts.num;
            }
          });
        });
      }

      const info = orderTagInfos.map((v, index) => ({
        ...v,
        ...(mergedUser ? orderInfo[index] : {}),
        orderNum: mergedUser ? orderInfo[index]?.orderNum || 0 : 0,
      }));

      const displayUserInfo = mergedUser
        ? {
            ...mergedUser,
            phoneNumber: phoneEncryption(mergedUser.phoneNumber || ''),
          }
        : getDefaultData().userInfo;

      this.setData({
        userInfo: displayUserInfo,
        menuData: nextMenuData,
        orderTagInfos: info,
        customerServiceInfo,
        currAuthStep: mergedUser ? 3 : 1,
        profileIncomplete: mergedUser ? !isWechatProfileComplete(mergedUser) : false,
      });
      wx.stopPullDownRefresh();
    });
  },

  async onClickCell({ currentTarget }) {
    const { type } = currentTarget.dataset;

    switch (type) {
      case 'address': {
        if (!(await this.ensureLogin())) return;
        wx.navigateTo({ url: '/pages/user/address/list/index' });
        break;
      }
      default: {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未知跳转',
          icon: '',
          duration: 1000,
        });
        break;
      }
    }
  },

  async jumpNav(e) {
    const status = e.detail.tabType;

    if (status === 0) {
      const loginResult = await this.ensureLogin();
      if (!loginResult.authed || loginResult.guided) return;
      wx.navigateTo({ url: '/pages/order/after-service-list/index' });
    } else {
      const url = `/pages/order/order-list/index?status=${status}`;
      const loginResult = await this.ensureLogin();
      if (!loginResult.authed || loginResult.guided) return;
      wx.navigateTo({ url });
    }
  },

  async jumpAllOrder() {
    const loginResult = await this.ensureLogin();
    if (!loginResult.authed || loginResult.guided) return;
    wx.navigateTo({ url: '/pages/order/order-list/index' });
  },

  openMakePhone() {
    this.setData({ showMakePhone: true });
  },

  closeMakePhone() {
    this.setData({ showMakePhone: false });
  },

  call() {
    wx.makePhoneCall({
      phoneNumber: this.data.customerServiceInfo.servicePhone,
    });
  },

  async gotoUserEditPage() {
    if (getCurrentUser()) {
      wx.navigateTo({ url: '/pages/user/person-info/index' });
    } else {
      await this.loginByAvatar();
    }
  },

  async loginByAvatar() {
    if (getCurrentUser()) {
      wx.navigateTo({ url: '/pages/user/person-info/index' });
      return;
    }

    this.openLoginAuth();
  },

  openLoginAuth() {
    this.setData({
      showLoginAuth: true,
      loginAuthLoading: false,
    });
  },

  closeLoginAuth() {
    if (this.data.loginAuthLoading) return;
    this.setData({ showLoginAuth: false });
  },

  async onLoginGetPhoneNumber(e) {
    if (this.data.loginAuthLoading) return;
    const { code, errMsg } = e.detail || {};
    if (!code) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: errMsg && errMsg.includes('deny') ? '已取消手机号授权' : '未获取到手机号授权',
        icon: '',
      });
      return;
    }

    try {
      this.setData({ loginAuthLoading: true });
      await authorizeWechatUserByPhone({
        phoneCode: code,
      });
      this.setData({
        showLoginAuth: false,
        loginAuthLoading: false,
      });
      this.init();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '登录成功',
        theme: 'success',
      });
      this.promptProfileAuthorization();
    } catch (error) {
      this.setData({ loginAuthLoading: false });
      Toast({
        context: this,
        selector: '#t-toast',
        message: error?.message || error?.errMsg || '授权登录未完成',
        icon: '',
      });
    }
  },

  async ensureLogin() {
    if (getCurrentUser()) {
      return {
        authed: true,
        guided: false,
      };
    }
    const loginResult = await ensureWechatLoginWithGuide({
      content: '这里需要微信授权登录后才能继续使用。',
    });

    if (loginResult.authed) {
      this.init();
      return loginResult;
    }

    Toast({
      context: this,
      selector: '#t-toast',
      message: '登录后才能继续',
      icon: '',
    });
    return {
      authed: false,
      guided: false,
    };
  },

  async authorizeWechatProfile() {
    try {
      const profileRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于展示个人头像和昵称',
          success: resolve,
          fail: reject,
        });
      });

      const savedProfile = await updatePersonProfile({
        nickName: profileRes.userInfo.nickName,
        avatarUrl: profileRes.userInfo.avatarUrl,
        gender: profileRes.userInfo.gender,
      });

      updateCurrentUser({
        nickName: savedProfile.nickName || profileRes.userInfo.nickName,
        avatarUrl: savedProfile.avatarUrl || profileRes.userInfo.avatarUrl,
        gender: savedProfile.gender ?? profileRes.userInfo.gender,
      });
      this.init();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '资料已更新',
        theme: 'success',
      });
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error?.errMsg || error?.message || '授权未完成',
        icon: '',
      });
    }
  },

  promptProfileAuthorization() {
    const user = getCurrentUser();
    if (!user || isWechatProfileComplete(user)) {
      return;
    }

    wx.showModal({
      title: '完善资料',
      content: '授权后可展示您的微信头像和昵称',
      confirmText: '去授权',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          this.authorizeWechatProfile();
        }
      },
    });
  },

  getVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    const { version, envVersion = __wxConfig } = versionInfo.miniProgram;
    this.setData({
      versionNo: envVersion === 'release' ? version : envVersion,
    });
  },
});
