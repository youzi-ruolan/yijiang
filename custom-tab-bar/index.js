import TabMenu from './data';
import { getLocalCartCount } from '../utils/local-cart';

Component({
  data: {
    active: 0,
    list: TabMenu,
  },

  methods: {
    onChange(event) {
      const active = event.detail.value;
      if (active === this.data.active) return;

      this.setData({ active });
      const tab = this.data.list[active];
      if (!tab) return;
      const url = tab.url.startsWith('/') ? tab.url : `/${tab.url}`;

      wx.switchTab({
        url,
        fail: () => {
          this.init();
        },
      });
    },

    init() {
      const page = getCurrentPages().pop();
      const route = page ? page.route.split('?')[0] : '';
      const active = this.data.list.findIndex(
        (item) => (item.url.startsWith('/') ? item.url.substr(1) : item.url) === `${route}`,
      );
      if (active !== this.data.active) {
        this.setData({ active });
      }
      this.updateCartCount();
    },

    updateCartCount() {
      const count = getLocalCartCount();
      const cartIndex = this.data.list.findIndex((item) => item.url === 'pages/cart/index');
      if (cartIndex < 0 || this.data.list[cartIndex].count === count) return;

      const nextList = this.data.list.map((item) => {
        if (item.url === 'pages/cart/index') {
          return {
            ...item,
            count,
          };
        }
        return item;
      });
      this.setData({
        list: nextList,
      });
    },
  },
});
