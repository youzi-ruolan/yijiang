import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

export function updatePersonProfile(payload = {}) {
  const currentUser = getCurrentUser();
  if (!currentUser?.uid) {
    return Promise.reject(new Error('请先登录'));
  }

  return apiRequest({
    url: '/api/person/profile',
    method: 'POST',
    data: {
      uid: currentUser.uid,
      ...payload,
    },
  });
}
