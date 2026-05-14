import { fetchUserCenter } from '../../services/usercenter/fetchUsercenter';
import Toast from 'tdesign-miniprogram/toast/index';
import { ensureWechatLogin, getCurrentUser } from '../../utils/local-auth';

const menuData = [
  [
    {
      title: '收货地址',
      tit: '',
      url: '',
      type: 'address',
    },
  ],
  [
    {
      title: '帮助中心',
      tit: '',
      url: '',
      type: 'help-center',
    },
    {
      title: '客服热线',
      tit: '',
      url: '',
      type: 'service',
      icon: 'service',
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
    title: '待评价',
    iconName: 'comment',
    orderNum: 0,
    tabType: 60,
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
    fetchUserCenter().then(({ countsData, orderTagInfos: orderInfo, customerServiceInfo }) => {
      const currentUser = getCurrentUser();
      const nextMenuData = menuData.map((group) =>
        group.map((item) => ({
          ...item,
          tit: '',
        })),
      );

      if (currentUser && nextMenuData[0]) {
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
        ...(currentUser ? orderInfo[index] : {}),
        orderNum: currentUser ? orderInfo[index]?.orderNum || 0 : 0,
      }));
      this.setData({
        userInfo: currentUser || getDefaultData().userInfo,
        menuData: nextMenuData,
        orderTagInfos: info,
        customerServiceInfo,
        currAuthStep: currentUser ? 3 : 1,
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
      case 'service': {
        this.openMakePhone();
        break;
      }
      case 'help-center': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了帮助中心',
          icon: '',
          duration: 1000,
        });
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
      if (!(await this.ensureLogin())) return;
      wx.navigateTo({ url: '/pages/order/after-service-list/index' });
    } else {
      const url = `/pages/order/order-list/index?status=${status}`;
      if (!(await this.ensureLogin())) return;
      wx.navigateTo({ url });
    }
  },

  async jumpAllOrder() {
    if (!(await this.ensureLogin())) return;
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
      const authed = await this.ensureLogin();
      if (authed) {
        wx.navigateTo({ url: '/pages/user/person-info/index' });
      }
    }
  },

  async ensureLogin() {
    if (getCurrentUser()) return true;
    const authed = await ensureWechatLogin({
      content: '这里需要微信授权登录后才能继续使用。',
    });

    if (authed) {
      this.init();
      return true;
    }

    Toast({
      context: this,
      selector: '#t-toast',
      message: '登录后才能继续',
      icon: '',
    });
    return false;
  },

  getVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    const { version, envVersion = __wxConfig } = versionInfo.miniProgram;
    this.setData({
      versionNo: envVersion === 'release' ? version : envVersion,
    });
  },
});
