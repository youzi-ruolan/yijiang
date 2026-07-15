import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

function isGenericNickName(nickName = '') {
  const value = `${nickName}`.trim();
  return !value || value === '微信用户';
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

function resolveCommentProfile(user = {}) {
  const nickName = `${user.nickName || ''}`.trim();
  const avatarUrl = `${user.avatarUrl || ''}`.trim();

  return {
    userName: isGenericNickName(nickName) ? '微信用户' : nickName,
    userHeadUrl: !avatarUrl || isTemporaryAvatarUrl(avatarUrl) ? '' : avatarUrl,
  };
}

export function submitComment(payload = {}) {
  const currentUser = getCurrentUser();
  if (!currentUser?.uid) {
    return Promise.reject(new Error('请先登录后再评价'));
  }

  const isAnonymity = Boolean(payload.isAnonymity);
  const profile = resolveCommentProfile(currentUser);

  return apiRequest({
    url: '/api/comments',
    method: 'POST',
    data: {
      ...payload,
      uid: currentUser.uid,
      isAnonymity,
      userName: isAnonymity ? '匿名用户' : profile.userName,
      userHeadUrl: isAnonymity ? '' : profile.userHeadUrl,
    },
  });
}
