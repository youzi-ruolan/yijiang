import { config } from '../../config/index';
import { apiRequest } from '../_utils/request';
import { getCurrentUser } from '../../utils/local-auth';

function getCurrentUid() {
  const currentUser = getCurrentUser();
  if (!currentUser?.uid) {
    throw new Error('请先登录');
  }

  return currentUser.uid;
}

function normalizeAddress(address = {}) {
  if (!address) return null;

  return {
    ...address,
    id: address.id || address.addressId,
    addressId: address.addressId || address.id,
    phone: address.phone || address.phoneNumber || '',
    phoneNumber: address.phoneNumber || address.phone || '',
    address:
      address.address ||
      `${address.provinceName || ''}${address.cityName || ''}${address.districtName || ''}${address.detailAddress || ''}`,
    tag: address.tag !== undefined ? address.tag : address.addressTag || '',
    addressTag: address.addressTag !== undefined ? address.addressTag : address.tag || '',
    isDefault: Number(address.isDefault || 0),
  };
}

function getMockAddressList(len = 10) {
  const { genAddressList } = require('../../model/address');
  return genAddressList(len).map((address) =>
    normalizeAddress({
      ...address,
      phoneNumber: address.phone,
      tag: address.addressTag,
    }),
  );
}

export function fetchDeliveryAddress(id = '') {
  if (config.enableBackendApi) {
    const uid = getCurrentUid();
    return apiRequest({
      url: `/api/addresses/${encodeURIComponent(id)}?uid=${encodeURIComponent(uid)}`,
    }).then(normalizeAddress);
  }

  if (config.useMock) {
    const { delay } = require('../_utils/delay');
    const { genAddress } = require('../../model/address');
    return delay().then(() => normalizeAddress(genAddress(id)));
  }

  return Promise.resolve(null);
}

export function fetchDeliveryAddressList(len = 10) {
  if (config.enableBackendApi) {
    const uid = getCurrentUid();
    return apiRequest({
      url: `/api/addresses?uid=${encodeURIComponent(uid)}`,
    }).then((list = []) => list.map(normalizeAddress));
  }

  if (config.useMock) {
    const { delay } = require('../_utils/delay');
    return delay().then(() => getMockAddressList(len));
  }

  return Promise.resolve([]);
}

export function fetchDefaultDeliveryAddress() {
  if (config.enableBackendApi) {
    const uid = getCurrentUid();
    return apiRequest({
      url: `/api/addresses/default?uid=${encodeURIComponent(uid)}`,
    }).then(normalizeAddress);
  }

  if (config.useMock) {
    return Promise.resolve(getMockAddressList(1)[0] || null);
  }

  return Promise.resolve(null);
}

export function createDeliveryAddress(payload) {
  if (config.enableBackendApi) {
    const uid = getCurrentUid();
    return apiRequest({
      url: '/api/addresses',
      method: 'POST',
      data: {
        ...payload,
        uid,
      },
    }).then(normalizeAddress);
  }

  return Promise.resolve(normalizeAddress(payload));
}

export function updateDeliveryAddress(addressId, payload) {
  if (config.enableBackendApi) {
    const uid = getCurrentUid();
    return apiRequest({
      url: `/api/addresses/${encodeURIComponent(addressId)}`,
      method: 'PUT',
      data: {
        ...payload,
        uid,
      },
    }).then(normalizeAddress);
  }

  return Promise.resolve(normalizeAddress({ ...payload, id: addressId, addressId }));
}

export function saveDeliveryAddress(payload) {
  const addressId = payload?.addressId || payload?.id;
  if (addressId) {
    return updateDeliveryAddress(addressId, payload);
  }

  return createDeliveryAddress(payload);
}

export function deleteDeliveryAddress(addressId) {
  if (config.enableBackendApi) {
    const uid = getCurrentUid();
    return apiRequest({
      url: `/api/addresses/${encodeURIComponent(addressId)}?uid=${encodeURIComponent(uid)}`,
      method: 'DELETE',
    });
  }

  return Promise.resolve({ success: true });
}
