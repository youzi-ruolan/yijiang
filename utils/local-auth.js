import { apiRequest } from '../services/_utils/request';

const AUTH_SESSION_KEY = 'yijiang_auth_session';
const PROFILE_GUIDE_KEY = 'yijiang_profile_guide';
const LOCAL_AVATAR_KEY = 'yijiang_local_avatar_map';
const DEFAULT_AVATAR =
  'https://tdesign.gtimg.com/miniprogram/template/retail/usercenter/icon-user-center-avatar@2x.png';

function isGenericNickName(nickName = '') {
  const value = `${nickName}`.trim();
  return !value || value === '微信用户';
}

function isGenericAvatar(avatarUrl = '') {
  const value = `${avatarUrl}`.trim();
  return !value || value === DEFAULT_AVATAR;
}

function pickBetterProfileValue(serverValue, localValue, isInvalid) {
  const local = `${localValue || ''}`.trim();
  const server = `${serverValue || ''}`.trim();
  if (local && !isInvalid(local)) return local;
  if (server && !isInvalid(server)) return server;
  return local || server;
}

function readSession() {
  try {
    return wx.getStorageSync(AUTH_SESSION_KEY) || null;
  } catch (error) {
    return null;
  }
}

function writeSession(session) {
  const nextSession = {
    ...session,
    userInfo: applyLocalAvatar(session?.userInfo),
  };
  wx.setStorageSync(AUTH_SESSION_KEY, nextSession);
}

function readLocalAvatarState() {
  try {
    return wx.getStorageSync(LOCAL_AVATAR_KEY) || {};
  } catch (error) {
    return {};
  }
}

function writeLocalAvatarState(state) {
  wx.setStorageSync(LOCAL_AVATAR_KEY, state);
}

function isTemporaryAvatarUrl(avatarUrl = '') {
  const value = `${avatarUrl}`.trim();
  return Boolean(
    value &&
      (value.startsWith('wxfile://') ||
        value.startsWith('http://tmp/') ||
        value.startsWith('https://tmp/') ||
        value.includes('/tmp/')),
  );
}

function getLocalAvatar(uid) {
  if (!uid) return '';
  const state = readLocalAvatarState();
  return state[uid] || '';
}

function setLocalAvatar(uid, avatarUrl) {
  if (!uid || !avatarUrl) return;
  const state = readLocalAvatarState();
  state[uid] = avatarUrl;
  writeLocalAvatarState(state);
}

function applyLocalAvatar(userInfo) {
  if (!userInfo?.uid) return userInfo || null;
  const localAvatar = getLocalAvatar(userInfo.uid);
  if (!localAvatar) return userInfo;

  return {
    ...userInfo,
    avatarUrl: localAvatar,
  };
}

function resolveWechatProfile(sessionUserInfo = {}, wxUserInfo = {}) {
  const wxNickName = `${wxUserInfo.nickName || ''}`.trim();
  const wxAvatarUrl = `${wxUserInfo.avatarUrl || ''}`.trim();
  const sessionNickName = `${sessionUserInfo.nickName || ''}`.trim();
  const sessionAvatarUrl = `${sessionUserInfo.avatarUrl || ''}`.trim();

  return {
    nickName: wxNickName || sessionNickName || '微信用户',
    avatarUrl: wxAvatarUrl || sessionAvatarUrl || DEFAULT_AVATAR,
  };
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
  return applyLocalAvatar(readSession()?.userInfo) || null;
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}

export function promptLoginRequired(options = {}) {
  const { content = '请先登录后再继续操作', confirmText = '去登录', cancelText = '取消' } = options;

  if (getCurrentUser()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    wx.showModal({
      title: '请先登录',
      content,
      confirmText,
      cancelText,
      success(res) {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/usercenter/index',
          });
        }
        resolve(false);
      },
      fail() {
        wx.showToast({
          title: content,
          icon: 'none',
        });
        resolve(false);
      },
    });
  });
}

export function isWechatProfileComplete(user = getCurrentUser()) {
  if (!user) return false;
  return !isGenericNickName(user.nickName) && !isGenericAvatar(user.avatarUrl);
}

export function mergeWechatProfile(serverUser = {}, localUser = {}) {
  return {
    nickName: pickBetterProfileValue(serverUser.nickName, localUser.nickName, isGenericNickName),
    avatarUrl: pickBetterProfileValue(serverUser.avatarUrl, localUser.avatarUrl, isGenericAvatar),
    phoneNumber: serverUser.phoneNumber || localUser.phoneNumber || '',
    gender: serverUser.gender ?? localUser.gender ?? 0,
  };
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
              const wechatProfile = resolveWechatProfile(session?.userInfo, res.userInfo);
              const nextSession = {
                token: session?.token || '',
                userInfo: {
                  uid: session?.userInfo?.uid || `wechat-${Date.now()}`,
                  openId: session?.userInfo?.openId || '',
                  nickName: wechatProfile.nickName,
                  avatarUrl: wechatProfile.avatarUrl,
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

export function authorizeWechatUserByPhone({ phoneCode = '', nickName = '', avatarUrl = '' } = {}) {
  if (!phoneCode) {
    return Promise.reject(new Error('未获取到手机号授权凭证'));
  }

  return new Promise((resolve, reject) => {
    wx.login({
      async success(loginRes) {
        const { code } = loginRes;
        if (!code) {
          reject(new Error('未获取到微信登录凭证'));
          return;
        }

        try {
          const session = await apiRequest({
            url: '/api/auth/phone-login',
            method: 'POST',
            data: {
              code,
              phoneCode,
              userInfo: {
                nickName,
                avatarUrl,
              },
            },
          });
          const wechatProfile = resolveWechatProfile(session?.userInfo, {
            nickName,
            avatarUrl,
          });
          const nextSession = {
            token: session?.token || '',
            userInfo: {
              uid: session?.userInfo?.uid || `wechat-${Date.now()}`,
              openId: session?.userInfo?.openId || '',
              nickName: wechatProfile.nickName,
              avatarUrl: wechatProfile.avatarUrl,
              gender: Number(session?.userInfo?.gender || 0),
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
          reject(error);
        }
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

  if (nextUserInfo.uid && nextUserInfo.avatarUrl) {
    if (isTemporaryAvatarUrl(nextUserInfo.avatarUrl)) {
      const localAvatar = getLocalAvatar(nextUserInfo.uid);
      if (localAvatar) {
        nextUserInfo.avatarUrl = localAvatar;
      }
    } else if (nextUserInfo.avatarUrl !== DEFAULT_AVATAR) {
      setLocalAvatar(nextUserInfo.uid, nextUserInfo.avatarUrl);
    }
  }

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

export function saveLocalAvatarToSession(tempAvatarUrl) {
  const currentUser = getCurrentUser();
  if (!currentUser?.uid) {
    return Promise.reject(new Error('请先登录'));
  }

  if (!tempAvatarUrl) {
    return Promise.reject(new Error('未获取到头像文件'));
  }

  return new Promise((resolve) => {
    wx.saveFile({
      tempFilePath: tempAvatarUrl,
      success: ({ savedFilePath }) => {
        setLocalAvatar(currentUser.uid, savedFilePath);
        const nextUser = updateCurrentUser({ avatarUrl: savedFilePath });
        resolve(nextUser);
      },
      fail: (error) => {
        console.log('[auth] saveLocalAvatarToSession:saveFileFail', error);
        setLocalAvatar(currentUser.uid, tempAvatarUrl);
        const nextUser = updateCurrentUser({ avatarUrl: tempAvatarUrl });
        resolve(nextUser);
      },
    });
  });
}
