import { fetchPerson } from '../../../services/usercenter/fetchPerson';
import { updatePersonProfile } from '../../../services/usercenter/updatePerson';
import { phoneEncryption } from '../../../utils/util';
import Toast from 'tdesign-miniprogram/toast/index';
import Dialog from 'tdesign-miniprogram/dialog/index';
import { getCurrentUser, logoutLocalUser, updateCurrentUser } from '../../../utils/local-auth';

Page({
  data: {
    personInfo: {
      avatarUrl: '',
      nickName: '',
      gender: 0,
      phoneNumber: '',
    },
    showUnbindConfirm: false,
    pickerOptions: [
      {
        name: '男',
        code: '1',
      },
      {
        name: '女',
        code: '2',
      },
    ],
    typeVisible: false,
    genderMap: ['', '男', '女'],
  },
  onLoad() {
    this.init();
  },
  init() {
    this.fetchData();
  },
  fetchData() {
    fetchPerson().then((personInfo) => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        wx.switchTab({ url: '/pages/usercenter/index' });
        return;
      }
      const nextPersonInfo = {
        ...personInfo,
        ...currentUser,
      };
      this.setData({
        personInfo: nextPersonInfo,
        'personInfo.phoneNumber': phoneEncryption(nextPersonInfo.phoneNumber),
      });
    });
  },
  onClickCell({ currentTarget }) {
    const { dataset } = currentTarget;
    const { nickName } = this.data.personInfo;

    switch (dataset.type) {
      case 'gender':
        this.setData({
          typeVisible: true,
        });
        break;
      case 'name':
        wx.navigateTo({
          url: `/pages/user/name-edit/index?name=${nickName}`,
        });
        break;
      default: {
        break;
      }
    }
  },
  onClose() {
    this.setData({
      typeVisible: false,
    });
  },
  onConfirm(e) {
    const { value } = e.detail;
    this.setData(
      {
        typeVisible: false,
        'personInfo.gender': value,
      },
      () => {
        this.saveProfilePatch({ gender: Number(value) }, '设置成功');
      },
    );
  },
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    if (!avatarUrl) return;

    try {
      await this.saveProfilePatch({ avatarUrl }, '微信头像已更新');
    } catch (error) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || error.errMsg || '修改头像出错了',
        theme: 'error',
      });
    }
  },
  async saveProfilePatch(patch, successMessage = '保存成功') {
    const savedProfile = await updatePersonProfile(patch);
    const nextUser = updateCurrentUser(savedProfile);
    this.setData({
      personInfo: {
        ...this.data.personInfo,
        ...nextUser,
      },
    });
    Toast({
      context: this,
      selector: '#t-toast',
      message: successMessage,
      theme: 'success',
    });
    return nextUser;
  },

  openUnbindConfirm() {
    Dialog.confirm({
      title: '切换账号',
      content: '退出当前账号后，可重新登录或注册新账号。',
      confirmBtn: '退出登录',
      cancelBtn: '取消',
    }).then(() => {
      logoutLocalUser();
      wx.switchTab({ url: '/pages/usercenter/index' });
    });
  },
});
