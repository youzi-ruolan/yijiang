Component({
  externalClasses: ['wr-class'],
  options: {
    multipleSlots: true,
  },
  properties: {
    goodsDetailInfo: {
      type: String,
      value: '',
    },
    sellerReply: {
      type: String,
      value: '',
    },
    userHeadUrl: {
      type: String,
      value: '',
    },
    userName: {
      type: String,
      value: '',
    },
    isAnonymity: {
      type: Boolean,
      value: false,
    },
    commentContent: {
      type: String,
      value: '',
    },
    commentScore: {
      type: Number,
      value: 0,
    },
    commentTime: {
      type: String,
      value: '',
    },
    commentResources: {
      type: Array,
      value: [],
    },
  },

  data: {
    showMoreStatus: false,
    showContent: false,
    hideText: false,
    eleHeight: null,
    overText: false,
    isDisabled: true,
    startColors: ['#FFC51C', '#DDDDDD'],
    displayName: '',
    displayAvatar:
      'https://tdesign.gtimg.com/miniprogram/template/retail/avatar/avatar1.png',
  },

  observers: {
    'userName, userHeadUrl, isAnonymity': function (userName, userHeadUrl, isAnonymity) {
      const defaultAvatar =
        'https://tdesign.gtimg.com/miniprogram/template/retail/avatar/avatar1.png';
      const name = `${userName || ''}`.trim();
      const avatar = `${userHeadUrl || ''}`.trim();
      this.setData({
        displayName: isAnonymity ? '匿名用户' : name || '微信用户',
        displayAvatar: isAnonymity || !avatar ? defaultAvatar : avatar,
      });
    },
  },
  methods: {},
});
