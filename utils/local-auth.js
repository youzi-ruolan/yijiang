const AUTH_SESSION_KEY = 'yijiang_auth_session';
const AUTH_USERS_KEY = 'yijiang_auth_users';
const DEFAULT_AVATAR =
  'https://tdesign.gtimg.com/miniprogram/template/retail/usercenter/icon-user-center-avatar@2x.png';

function readUsers() {
  try {
    return wx.getStorageSync(AUTH_USERS_KEY) || [];
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  wx.setStorageSync(AUTH_USERS_KEY, users);
}

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

function createUser(payload) {
  const phoneNumber = `${payload.phoneNumber || ''}`.trim();
  const nickName = `${payload.nickName || ''}`.trim() || `艺匠用户${phoneNumber.slice(-4)}`;
  const now = Date.now();

  return {
    uid: `user-${phoneNumber}`,
    phoneNumber,
    password: `${payload.password || ''}`,
    nickName,
    avatarUrl: payload.avatarUrl || DEFAULT_AVATAR,
    gender: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function toSession(user) {
  const { password, ...safeUser } = user;
  return {
    token: `local-token-${Date.now()}`,
    userInfo: safeUser,
  };
}

export function getCurrentUser() {
  return readSession()?.userInfo || null;
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}

export function registerLocalUser(payload) {
  const users = readUsers();
  const phoneNumber = `${payload.phoneNumber || ''}`.trim();
  const exists = users.some((user) => user.phoneNumber === phoneNumber);

  if (exists) {
    throw new Error('该手机号已注册，请直接登录');
  }

  const user = createUser(payload);
  users.unshift(user);
  writeUsers(users);

  const session = toSession(user);
  writeSession(session);
  return session.userInfo;
}

export function loginLocalUser(payload) {
  const phoneNumber = `${payload.phoneNumber || ''}`.trim();
  const password = `${payload.password || ''}`;
  const user = readUsers().find((item) => item.phoneNumber === phoneNumber && item.password === password);

  if (!user) {
    throw new Error('手机号或密码不正确');
  }

  const session = toSession(user);
  writeSession(session);
  return session.userInfo;
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
  const users = readUsers().map((user) => {
    if (user.uid !== nextUserInfo.uid) return user;
    return {
      ...user,
      ...patch,
      updatedAt: nextUserInfo.updatedAt,
    };
  });

  writeUsers(users);
  writeSession({
    ...session,
    userInfo: nextUserInfo,
  });

  return nextUserInfo;
}

export function logoutLocalUser() {
  wx.removeStorageSync(AUTH_SESSION_KEY);
}

export function getLoginPageUrl(redirectUrl = '') {
  const query = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
  return `/pages/user/login/index${query}`;
}
