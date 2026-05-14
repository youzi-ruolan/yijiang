import { getCurrentUser } from './local-auth';

const LOCAL_COMMENTS_KEY = 'yijiang_local_comments';
const DEFAULT_AVATAR = 'https://tdesign.gtimg.com/miniprogram/template/retail/avatar/avatar1.png';

function readAllComments() {
  try {
    return wx.getStorageSync(LOCAL_COMMENTS_KEY) || [];
  } catch (error) {
    return [];
  }
}

function writeAllComments(comments) {
  try {
    wx.setStorageSync(LOCAL_COMMENTS_KEY, comments);
  } catch (error) {
    // Storage failure should not block the submit flow.
  }
}

function getCommentLevel(score) {
  if (score >= 4) return 3;
  if (score === 3) return 2;
  return 1;
}

function normalizeResources(files = []) {
  return files
    .map((file) => {
      const src = file.url || file.path || file.tempFilePath || file.thumb || '';
      if (!src) return null;
      const type = file.type === 'video' || file.mediaType === 'video' ? 'video' : 'image';
      return {
        src,
        type,
        coverSrc: file.coverSrc || file.thumb || src,
      };
    })
    .filter(Boolean);
}

export function addLocalComment(payload) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('请先登录后再评价');
  }

  const now = Date.now();
  const score = Number(payload.commentScore || 5);
  const comment = {
    id: `local-comment-${now}`,
    spuId: `${payload.spuId || ''}`,
    skuId: `${payload.skuId || ''}`,
    specInfo: payload.specInfo || '',
    goodsDetailInfo: payload.goodsDetailInfo || payload.specInfo || '',
    commentContent: `${payload.commentContent || ''}`.trim(),
    commentResources: normalizeResources(payload.uploadFiles),
    commentScore: score,
    commentLevel: getCommentLevel(score),
    uid: currentUser.uid,
    userName: payload.isAnonymity ? '匿名用户' : currentUser.nickName || '我',
    userHeadUrl: currentUser.avatarUrl || DEFAULT_AVATAR,
    isAnonymity: Boolean(payload.isAnonymity),
    commentTime: `${now}`,
    isAutoComment: false,
    sellerReply: '',
    isLocal: true,
    orderNo: payload.orderNo || '',
    serviceScore: Number(payload.serviceScore || 5),
    conveyScore: Number(payload.conveyScore || 5),
  };

  const comments = readAllComments();
  writeAllComments([comment, ...comments]);
  return comment;
}

export function getLocalComments(spuId) {
  const targetSpuId = `${spuId || ''}`;
  return readAllComments().filter((comment) => !targetSpuId || `${comment.spuId}` === targetSpuId);
}

export function mergeCommentPage(params, baseResult) {
  const query = params?.queryParameter || {};
  const currentUser = getCurrentUser();
  const pageNum = Number(params?.pageNum || 1);
  const pageSize = Number(params?.pageSize || 10);
  const localComments = getLocalComments(query.spuId).filter((comment) => {
    if (query.hasImage && !comment.commentResources?.length) return false;
    if (query.onlyMine && (!currentUser || comment.uid !== currentUser.uid)) return false;
    if (query.commentLevel && comment.commentLevel !== Number(query.commentLevel)) return false;
    return true;
  });
  const baseList = Array.isArray(baseResult?.pageList) ? baseResult.pageList : [];
  const mergedList = [...localComments, ...baseList];
  const start = (pageNum - 1) * pageSize;
  const pageList = mergedList.slice(start, start + pageSize);

  return {
    ...baseResult,
    pageNum,
    pageSize,
    totalCount: `${mergedList.length}`,
    pageList,
  };
}

export function mergeCommentCount(spuId, baseCount) {
  const localComments = getLocalComments(spuId);
  const currentUser = getCurrentUser();
  const base = {
    commentCount: Number(baseCount?.commentCount || 0),
    badCount: Number(baseCount?.badCount || 0),
    middleCount: Number(baseCount?.middleCount || 0),
    goodCount: Number(baseCount?.goodCount || 0),
    hasImageCount: Number(baseCount?.hasImageCount || 0),
  };

  localComments.forEach((comment) => {
    base.commentCount += 1;
    if (comment.commentLevel === 3) base.goodCount += 1;
    if (comment.commentLevel === 2) base.middleCount += 1;
    if (comment.commentLevel === 1) base.badCount += 1;
    if (comment.commentResources?.length) base.hasImageCount += 1;
  });

  const goodRate = base.commentCount ? Math.round((base.goodCount / base.commentCount) * 1000) / 10 : 0;

  return {
    commentCount: `${base.commentCount}`,
    badCount: `${base.badCount}`,
    middleCount: `${base.middleCount}`,
    goodCount: `${base.goodCount}`,
    hasImageCount: `${base.hasImageCount}`,
    goodRate,
    uidCount: `${currentUser ? localComments.filter((comment) => comment.uid === currentUser.uid).length : 0}`,
  };
}

export function mergeHomeComments(spuId, baseResult) {
  const localComments = getLocalComments(spuId);
  const baseList = Array.isArray(baseResult?.homePageComments) ? baseResult.homePageComments : [];
  return {
    ...baseResult,
    homePageComments: [...localComments, ...baseList].slice(0, 2),
  };
}
