import { apiRequest } from '../services/_utils/request';

const AUTH_SESSION_KEY = 'yijiang_auth_session';
const PROFILE_GUIDE_KEY = 'yijiang_profile_guide';
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

function readProfileGuideState() {
  try {
    return wx.getStorageSync(PROFILE_GUIDE_KEY) || {};
  } catch (error) {
    return {};
  }
}

function writeProfileGuideState(state) {
  wx.setStorageSync(PROFILE_GUIDE_KEY, state);
}

function markPendingProfileGuide(uid) {
  if (!uid) return;
  const state = readProfileGuideState();
  state[uid] = true;
  writeProfileGuideState(state);
}

function consumePendingProfileGuide(uid) {
  if (!uid) return false;
  const state = readProfileGuideState();
  const pending = Boolean(state[uid]);
  if (pending) {
    delete state[uid];
    writeProfileGuideState(state);
  }
  return pending;
}

function clearPendingProfileGuide(uid) {
  if (!uid) return;
  const state = readProfileGuideState();
  if (state[uid]) {
    delete state[uid];
    writeProfileGuideState(state);
  }
}

export function getCurrentUser() {
  return readSession()?.userInfo || null;
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}

export function isWechatProfileComplete(user = getCurrentUser()) {
  if (!user) return false;
  const nickName = `${user.nickName || ''}`.trim();
  const avatarUrl = `${user.avatarUrl || ''}`.trim();

  return Boolean(nickName && nickName !== '微信用户' && avatarUrl && avatarUrl !== DEFAULT_AVATAR);
}

export function authorizeWechatUser() {
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
              if (!isWechatProfileComplete(nextSession.userInfo)) {
                markPendingProfileGuide(nextSession.userInfo.uid);
              }
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

export async function maybeGuideWechatProfileCompletion() {
  const currentUser = getCurrentUser();
  if (!currentUser?.uid) {
    return false;
  }

  if (!consumePendingProfileGuide(currentUser.uid)) {
    return false;
  }

  if (isWechatProfileComplete(currentUser)) {
    return false;
  }

  const pages = getCurrentPages();
  const currentRoute = pages[pages.length - 1]?.route || '';
  if (currentRoute === 'pages/user/person-info/index') {
    return false;
  }

  await new Promise((resolve, reject) => {
    wx.navigateTo({
      url: '/pages/user/person-info/index?from=first-login',
      success: resolve,
      fail: reject,
    });
  });

  return true;
}

export async function ensureWechatLoginWithGuide(options = {}) {
  const currentUser = getCurrentUser();
  if (currentUser) {
    return {
      authed: true,
      guided: false,
    };
  }

  const authed = await ensureWechatLogin(options);
  if (!authed) {
    return {
      authed: false,
      guided: false,
    };
  }

  const guided = await maybeGuideWechatProfileCompletion().catch((error) => {
    console.log('[auth] maybeGuideWechatProfileCompletion:fail', error);
    return false;
  });

  return {
    authed: true,
    guided,
  };
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

  if (isWechatProfileComplete(nextUserInfo)) {
    clearPendingProfileGuide(nextUserInfo.uid);
  }

  return nextUserInfo;
}

export function logoutLocalUser() {
  wx.removeStorageSync(AUTH_SESSION_KEY);
}
