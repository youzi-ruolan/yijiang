import { fetchUserCenter } from '../../services/usercenter/fetchUsercenter';
import { updatePersonProfile } from '../../services/usercenter/updatePerson';
import Toast from 'tdesign-miniprogram/toast/index';
import { phoneEncryption } from '../../utils/util';
import {
  authorizeWechatUserByPhone,
  ensureWechatLoginWithGuide,
  getCurrentUser,
  isWechatProfileComplete,
  mergeWechatProfile,
  saveLocalAvatarToSession,
  updateCurrentUser,
} from '../../utils/local-auth';
import {
  acknowledgeOrderTab,
  applyOrderTabBadges,
} from '../../utils/order-tab-badge';

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
    title: '已付款',
    iconName: 'paid',
    orderNum: 0,
    tabType: 10,
    status: 1,
  },
  {
    title: '待评价',
    iconName: 'comment',
    orderNum: 0,
    tabType: 41,
    status: 1,
  },
  {
    title: '已评价',
    iconName: 'star',
    orderNum: 0,
    tabType: 42,
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
  showProfileSetup: false,
  profileDraft: {
    avatarUrl: '',
    nickName: '',
  },
});

Page({
  data: getDefaultData(),

  onLoad() {},

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
        updateCurrentUser(mergeWechatProfile(serverUserInfo, currentUser));
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

      const taggedCounts = applyOrderTabBadges(orderInfo);
      const info = orderTagInfos.map((v) => {
        const tabCount = taggedCounts.find((item) => item.tabType === v.tabType);
        return {
          ...v,
          rawCount: tabCount?.rawCount || 0,
          orderNum: tabCount?.badgeCount || 0,
        };
      });

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
    const { tabType, rawCount, orderNum } = e.detail;

    if (tabType === 0) {
      const loginResult = await this.ensureLogin();
      if (!loginResult.authed || loginResult.guided) return;
      wx.navigateTo({ url: '/pages/order/after-service-list/index' });
      return;
    }

    const loginResult = await this.ensureLogin();
    if (!loginResult.authed || loginResult.guided) return;

    acknowledgeOrderTab(tabType, rawCount ?? orderNum);
    this.setData({
      orderTagInfos: this.data.orderTagInfos.map((item) =>
        item.tabType === tabType ? { ...item, orderNum: 0 } : item,
      ),
    });

    wx.navigateTo({ url: `/pages/order/order-list/index?status=${tabType}` });
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

  authorizeWechatProfile() {
    const user = getCurrentUser();
    if (!user) return;

    this.setData({
      showProfileSetup: true,
      profileDraft: {
        avatarUrl: user.avatarUrl || '',
        nickName: user.nickName && user.nickName !== '微信用户' ? user.nickName : '',
      },
    });
  },

  closeProfileSetup(e) {
    if (e?.detail?.visible) return;
    this.setData({ showProfileSetup: false });
  },

  async onProfileChooseAvatar(e) {
    const { avatarUrl } = e.detail || {};
    if (!avatarUrl) return;

    try {
      const nextUser = await saveLocalAvatarToSession(avatarUrl);
      this.setData({
        'profileDraft.avatarUrl': nextUser.avatarUrl,
        'userInfo.avatarUrl': nextUser.avatarUrl,
      });
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error?.message || '头像选择失败',
        icon: '',
      });
    }
  },

  onProfileNicknameInput(e) {
    this.setData({
      'profileDraft.nickName': e.detail.value,
    });
  },

  async onSaveProfileSetup() {
    const nickName = `${this.data.profileDraft.nickName || ''}`.trim();
    const avatarUrl = `${this.data.profileDraft.avatarUrl || getCurrentUser()?.avatarUrl || ''}`.trim();

    if (!avatarUrl) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先选择微信头像',
        icon: '',
      });
      return;
    }

    if (!nickName || nickName === '微信用户') {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请填写微信昵称',
        icon: '',
      });
      return;
    }

    try {
      const savedProfile = await updatePersonProfile({
        nickName,
        avatarUrl,
      });
      const nextUser = updateCurrentUser({
        nickName: savedProfile.nickName || nickName,
        avatarUrl: savedProfile.avatarUrl || avatarUrl,
        gender: savedProfile.gender,
      });

      this.setData({
        showProfileSetup: false,
        profileIncomplete: false,
        userInfo: {
          ...nextUser,
          phoneNumber: phoneEncryption(nextUser.phoneNumber || ''),
        },
      });

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
        message: error?.message || '资料保存失败',
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
      content: '选择微信头像并填写昵称，将在个人中心展示',
      confirmText: '去完善',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          this.authorizeWechatProfile();
        }
      },
    });
  },
});
