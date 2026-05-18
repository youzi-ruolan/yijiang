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
  wx.showToast({
    title: '新登录逻辑',
    icon: 'none',
    duration: 1500,
  });
  console.log('[auth] authorizeWechatUser:start');
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善会员资料与订单服务',
      success(res) {
        console.log('[auth] wx.getUserProfile:success', res);
        wx.login({
          async success(loginRes) {
            console.log('[auth] wx.login:success', loginRes);
            const { code } = loginRes;
            if (!code) {
              console.log('[auth] wx.login:no-code', loginRes);
              reject(new Error('未获取到微信登录凭证'));
              return;
            }

            try {
              console.log('[auth] request:/api/auth/login', {
                code,
                userInfo: res.userInfo,
              });
              const session = await apiRequest({
                url: '/api/auth/login',
                method: 'POST',
                data: {
                  code,
                  userInfo: res.userInfo,
                },
              });
              console.log('[auth] /api/auth/login:success', session);
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
              console.log('[auth] /api/auth/login:fail', error);
              reject(error);
            }
          },
          fail(error) {
            console.log('[auth] wx.login:fail', error);
            reject(error);
          },
        });
      },
      fail(error) {
        console.log('[auth] wx.getUserProfile:fail', error);
        reject(error);
      },
    });
  });
}

export function ensureWechatLogin(options = {}) {
  if (getCurrentUser()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    authorizeWechatUser()
      .then(() => resolve(true))
      .catch((error) => {
        console.log('[auth] ensureWechatLogin:fail', error, options);
        wx.showToast({
          title: error?.message || error?.errMsg || '授权登录未完成',
          icon: 'none',
        });
        resolve(false);
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
