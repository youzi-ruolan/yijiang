import {
  clearSearchHistory,
  deleteSearchHistoryItem,
  getSearchHistory,
  getSearchPopular,
  saveSearchHistory,
} from '../../../services/good/fetchSearchHistory';

Page({
  data: {
    historyWords: [],
    popularWords: [],
    searchValue: '',
    dialog: {
      title: '确认删除当前历史记录',
      showCancelButton: true,
      message: '',
    },
    dialogShow: false,
  },

  deleteType: 0,
  deleteIndex: '',

  onShow() {
    this.queryHistory();
    this.queryPopular();
  },

  async queryHistory() {
    try {
      const data = await getSearchHistory();
      const code = 'Success';
      if (String(code).toUpperCase() === 'SUCCESS') {
        const { historyWords = [] } = data;
        this.setData({
          historyWords,
        });
      }
    } catch (error) {
      console.error(error);
    }
  },

  async queryPopular() {
    try {
      const data = await getSearchPopular();
      const code = 'Success';
      if (String(code).toUpperCase() === 'SUCCESS') {
        const { popularWords = [] } = data;
        this.setData({
          popularWords,
        });
      }
    } catch (error) {
      console.error(error);
    }
  },

  confirm() {
    const { deleteType, deleteIndex } = this;
    if (deleteType === 0) {
      this.setData({
        historyWords: deleteSearchHistoryItem(deleteIndex),
        dialogShow: false,
      });
    } else {
      this.setData({ historyWords: clearSearchHistory(), dialogShow: false });
    }
  },

  close() {
    this.setData({ dialogShow: false });
  },

  handleClearHistory() {
    const { dialog } = this.data;
    this.deleteType = 1;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除所有历史记录',
      },
      dialogShow: true,
    });
  },

  deleteCurr(e) {
    const { index } = e.currentTarget.dataset;
    const { dialog } = this.data;
    this.deleteIndex = index;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除当前历史记录',
        deleteType: 0,
      },
      dialogShow: true,
    });
  },

  handleHistoryTap(e) {
    const { historyWords } = this.data;
    const { dataset } = e.currentTarget;
    const _searchValue = historyWords[dataset.index || 0] || '';
    if (_searchValue) {
      saveSearchHistory(_searchValue);
      wx.navigateTo({
        url: `/pages/goods/result/index?searchValue=${_searchValue}`,
      });
    }
  },

  handlePopularTap(e) {
    const { popularWords } = this.data;
    const { dataset } = e.currentTarget;
    const searchValue = popularWords[dataset.index || 0] || '';
    if (!searchValue) {
      return;
    }

    saveSearchHistory(searchValue);
    wx.navigateTo({
      url: `/pages/goods/result/index?searchValue=${searchValue}`,
    });
  },

  handleSubmit(e) {
    const { value } = e.detail.value;
    if (value.length === 0) return;
    saveSearchHistory(value);
    wx.navigateTo({
      url: `/pages/goods/result/index?searchValue=${value}`,
    });
  },
});
