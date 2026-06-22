/* eslint-disable no-param-reassign */
import {
  deleteDeliveryAddress,
  fetchDeliveryAddressList,
  saveDeliveryAddress,
} from '../../../../services/address/fetchAddress';
import Toast from 'tdesign-miniprogram/toast/index';
import { resolveAddress, rejectAddress } from '../../../../services/address/list';
import { getAddressPromise } from '../../../../services/address/edit';
import { ensureWechatLoginWithGuide } from '../../../../utils/local-auth';

function leaveCurrentPage() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack({ delta: 1 });
    return;
  }

  wx.switchTab({ url: '/pages/usercenter/index' });
}

Page({
  data: {
    addressList: [],
    isOrderSure: false,
  },

  /** 选择模式 */
  selectMode: false,
  /** 是否已经选择地址，不置为true的话页面离开时会触发取消选择行为 */
  hasSelect: false,

  async onLoad(query) {
    const { selectMode = '', isOrderSure = '', id = '' } = query;
    this.setData({
      isOrderSure: !!isOrderSure,
      id,
    });
    this.selectMode = !!selectMode;

    const loginResult = await ensureWechatLoginWithGuide({
      content: '管理收货地址需要先完成微信授权登录。',
    });
    if (!loginResult.authed) {
      if (this.selectMode) {
        rejectAddress();
        this.hasSelect = true;
      }
      leaveCurrentPage();
      return;
    }

    if (loginResult.guided) return;

    this.init();
  },

  init() {
    this.getAddressList();
  },
  onUnload() {
    if (this.selectMode && !this.hasSelect) {
      rejectAddress();
    }
  },
  getAddressList() {
    const { id } = this.data;
    return fetchDeliveryAddressList()
      .then((addressList) => {
        addressList.forEach((address) => {
          if (address.addressId === id || address.id === id) {
            address.checked = true;
          }
        });
        this.setData({ addressList });
      })
      .catch((error) => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: error?.message || '获取地址失败',
          icon: '',
          duration: 1200,
        });
      });
  },
  async importWechatAddressHandle({ detail }) {
    try {
      const savedAddress = await saveDeliveryAddress(detail);
      if (this.selectMode) {
        this.hasSelect = true;
        resolveAddress(savedAddress);
        wx.navigateBack({ delta: 1 });
        return;
      }
      await this.getAddressList();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '微信地址已同步',
        theme: 'success',
        duration: 1000,
      });
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error?.message || '保存地址失败',
        icon: '',
        duration: 1200,
      });
    }
  },
  async deleteAddressHandle({ detail }) {
    const addressId = detail?.addressId || detail?.id;
    if (!addressId) return;

    try {
      await deleteDeliveryAddress(addressId);
      await this.getAddressList();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '地址删除成功',
        theme: 'success',
        duration: 1000,
      });
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error?.message || '地址删除失败',
        icon: '',
        duration: 1200,
      });
    }
  },
  editAddressHandle({ detail }) {
    this.waitForNewAddress();

    const id = detail?.addressId || detail?.id;
    wx.navigateTo({ url: `/pages/user/address/edit/index?id=${id}` });
  },
  selectHandle({ detail }) {
    if (this.selectMode) {
      this.hasSelect = true;
      resolveAddress(detail);
      wx.navigateBack({ delta: 1 });
    } else {
      this.editAddressHandle({ detail });
    }
  },
  createHandle() {
    this.waitForNewAddress();
    wx.navigateTo({ url: '/pages/user/address/edit/index' });
  },

  waitForNewAddress() {
    getAddressPromise()
      .then(async () => {
        await this.getAddressList();
      })
      .catch((e) => {
        if (e.message !== 'cancel') {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '地址编辑发生错误',
            icon: '',
            duration: 1000,
          });
        }
      });
  },
});
