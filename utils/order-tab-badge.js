const STORAGE_KEY = 'yijiang_order_tab_ack';

/** 已付款、已评价仅展示列表，不显示数量气泡 */
const NO_BADGE_TABS = new Set([10, 42, -1]);

/** 待付款、待评价可显示未读数量气泡 */
const BADGE_TABS = new Set([5, 41]);

export function getAcknowledgedCounts() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || {};
  } catch (error) {
    return {};
  }
}

export function acknowledgeOrderTab(tabType, currentCount) {
  const ack = getAcknowledgedCounts();
  ack[String(tabType)] = Number(currentCount) || 0;
  wx.setStorageSync(STORAGE_KEY, ack);
}

export function getOrderTabBadgeCount(tabType, currentCount) {
  const type = Number(tabType);
  const count = Number(currentCount) || 0;
  if (NO_BADGE_TABS.has(type) || !BADGE_TABS.has(type)) {
    return 0;
  }
  const acknowledged = Number(getAcknowledgedCounts()[String(type)] || 0);
  return Math.max(0, count - acknowledged);
}

export function applyOrderTabBadges(tabCounts = []) {
  return tabCounts.map((item) => {
    const rawCount = Number(item.orderNum) || 0;
    return {
      ...item,
      rawCount,
      badgeCount: getOrderTabBadgeCount(item.tabType, rawCount),
    };
  });
}
