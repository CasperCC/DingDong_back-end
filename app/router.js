'use strict';

/**
 * 本程序所有api路由
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, io } = app;

  /**
   * 即时通讯接口
   */
  router.post('/api/getUserInfo', controller.user.getUserInfo);
  router.post('/api/getProfile', controller.user.getProfile);
  router.post('/api/checkUserInfo', controller.user.checkUserInfo);
  router.post('/api/getContacts', controller.user.getContacts);
  router.post('/api/getAllUsers', controller.user.getAllUsers);
  router.post('/api/getNewsList', controller.message.getNewsList);
  router.post('/api/getChattingRecords', controller.message.getChattingRecords);
  router.post('/api/getChattingRecordsGroup', controller.message.getChattingRecordsGroup);
  router.post('/api/addContacts_search', controller.user.addContacts_search);
  router.post('/api/getNewFriends', controller.user.getNewFriends);
  router.post('/api/getVerification', controller.user.getVerification);
  router.post('/api/checkFriend', controller.user.checkFriend);
  router.post('/api/setNickName', controller.user.setNickName);
  router.post('/api/setResponse', controller.user.setResponse);
  router.post('/api/setBlackList', controller.user.setBlackList);
  router.post('/api/pullOutBlackList', controller.user.pullOutBlackList);
  router.post('/api/getBlackList', controller.user.getBlackList);
  router.post('/api/agreeApply', controller.user.agreeApply);
  router.post('/api/sendApply', controller.user.sendApply);
  router.post('/api/getUploadParams', controller.uploadOss.getUploadParams);
  router.post('/api/getOssUrl', controller.uploadOss.getOssUrl);
  router.post('/api/addUserToGroup', controller.user.addUserToGroup);
  router.post('/api/updateRecTime', controller.message.updateRecTime);
  router.post('/api/getUserInGroups', controller.user.getUserInGroups);
  router.post('/api/updateUnReadNum', controller.message.updateUnReadNum);
  router.post('/api/updateGroupName', controller.user.updateGroupName);

  /**
   * 企业OA接口
   */
  router.post('/api/setTimeCard', controller.user.setTimeCard);
  router.post('/api/getTimeCardHistory', controller.user.getTimeCardHistory);
  router.post('/api/setOverworkApply', controller.user.setOverworkApply);
  router.post('/api/getOverworkApply', controller.user.getOverworkApply);
  router.post('/api/setVacationApply', controller.user.setVacationApply);
  router.post('/api/getVacationApply', controller.user.getVacationApply);
  router.post('/api/setNotice', controller.user.setNotice);
  router.post('/api/getNotice', controller.user.getNotice);

  /**
   * socket.io接口
   */
  io.of('/').route('sendMsg', io.controller.message.sendMsg);
  io.of('/').route('sendMsgGroup', io.controller.message.sendMsgGroup);
  io.of('/').route('reconnection', io.controller.connection.reconnection);
  io.of('/').route('joinRoom', io.controller.connection.joinRoom);
  io.of('/').route('leaveRoom', io.controller.connection.leaveRoom);
  io.of('/').route('isRead', io.controller.message.isRead);
};
