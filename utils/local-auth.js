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

function createSessionFromProfile(userInfo = {}) {
  const now = Date.now();
  return {
    token: `wechat-local-token-${now}`,
    userInfo: {
      uid: `wechat-${now}`,
      nickName: userInfo.nickName || '微信用户',
      avatarUrl: userInfo.avatarUrl || DEFAULT_AVATAR,
      gender: Number(userInfo.gender || 0),
      phoneNumber: '',
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function getCurrentUser() {
  return readSession()?.userInfo || null;
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}

export function authorizeWechatUser() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于展示头像昵称、管理订单和提交商品评价',
      success(res) {
        const session = createSessionFromProfile(res.userInfo);
        writeSession(session);
        resolve(session.userInfo);
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
