import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

export function submitComment(payload = {}) {
  const currentUser = getCurrentUser();
  if (!currentUser?.uid) {
    return Promise.reject(new Error('请先登录后再评价'));
  }

  return apiRequest({
    url: '/api/comments',
    method: 'POST',
    data: {
      uid: currentUser.uid,
      userName: currentUser.nickName || '微信用户',
      userHeadUrl: currentUser.avatarUrl || '',
      ...payload,
    },
  });
}
