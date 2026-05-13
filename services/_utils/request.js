import { apiBaseUrl } from '../../config/index';

export function apiRequest({ url, method = 'GET', data, header = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${url}`,
      method,
      data,
      header,
      success(res) {
        const { statusCode, data: responseData } = res;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData);
          return;
        }

        reject(
          new Error(
            responseData?.message || responseData?.error || `请求失败(${statusCode})`,
          ),
        );
      },
      fail(error) {
        reject(error);
      },
    });
  });
}
