import { apiRequest } from '../services/_utils/request';

const AUTH_SESSION_KEY = 'yijiang_auth_session';
const DEFAULT_AVATAR =
  'https://tdesign.gtimg.com/miniprogram/template/retail/usercenter/icon-user-center-avatar@2x.png';

function readSession() {
  try {
    return wx.getStorageSync(AUTH_SESSION_KEY) || null;
  } catch (error) {
    return null;
  }
}

function writeSession(session) {
  wx.setStorageSync(AUTH_SESSION_KEY, session);
}

export function getCurrentUser() {
  return readSession()?.userInfo || null;
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}

export function authorizeWechatUser() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        const { code } = loginRes;
        if (!code) {
          reject(new Error('未获取到微信登录凭证'));
          return;
        }

        wx.getUserProfile({
          desc: '用于展示头像昵称、管理订单和提交商品评价',
          async success(res) {
            try {
              const session = await apiRequest({
                url: '/api/auth/login',
                method: 'POST',
                data: {
                  code,
                  userInfo: res.userInfo,
                },
              });
              const nextSession = {
                token: session?.token || '',
                userInfo: {
                  uid: session?.userInfo?.uid || `wechat-${Date.now()}`,
                  openId: session?.userInfo?.openId || '',
                  nickName: session?.userInfo?.nickName || res.userInfo.nickName || '微信用户',
                  avatarUrl: session?.userInfo?.avatarUrl || res.userInfo.avatarUrl || DEFAULT_AVATAR,
                  gender: Number(session?.userInfo?.gender ?? res.userInfo.gender ?? 0),
                  phoneNumber: session?.userInfo?.phoneNumber || '',
                  createdAt: Number(session?.userInfo?.createdAt || Date.now()),
                  updatedAt: Number(session?.userInfo?.updatedAt || Date.now()),
                },
              };
              writeSession(nextSession);
              resolve(nextSession.userInfo);
            } catch (error) {
              reject(error);
            }
          },
          fail(error) {
            reject(error);
          },
        });
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

export function ensureWechatLogin(options = {}) {
  if (getCurrentUser()) {
    return Promise.resolve(true);
  }

  const { title = '需要登录', content = '该功能需要微信授权登录后才能继续使用。', confirmText = '去登录' } = options;

  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText,
      confirmColor: '#FA550F',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) {
          resolve(false);
          return;
        }

        try {
          await authorizeWechatUser();
          resolve(true);
        } catch (error) {
          wx.showToast({
            title: '授权登录未完成',
            icon: 'none',
          });
          resolve(false);
        }
      },
      fail: () => resolve(false),
    });
  });
}

export function updateCurrentUser(patch) {
  const session = readSession();
  if (!session?.userInfo) {
    throw new Error('请先登录');
  }

  const nextUserInfo = {
    ...session.userInfo,
    ...patch,
    updatedAt: Date.now(),
  };

  writeSession({
    ...session,
    userInfo: nextUserInfo,
  });

  return nextUserInfo;
}

export function logoutLocalUser() {
  wx.removeStorageSync(AUTH_SESSION_KEY);
}
