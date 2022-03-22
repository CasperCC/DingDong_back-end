'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
	/**
	 * 获取用户信息
	 * @Author Cochan
	 * @method POST
	 */
	async getUserInfo() {
		const { ctx } = this;
		const { openId, clientId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const userInfo = await ctx.service.user.getUserInfo(openId, myOpenId);
		ctx.body = userInfo;
	}

	/**
	 * 获取用户个人信息页面api
	 * @Author Cochan
	 * @method POST
	 */
	async getProfile() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const userInfo = await ctx.service.user.getUserInfo(myOpenId);
		ctx.body = userInfo;
	}

	/**
	 * 检查用户登录信息api
	 * @Author  Cochan
	 * @method  POST
	 */
	async checkUserInfo() {
		const { ctx } = this;
		const { appId, appSecret } = await ctx.service.user.getAppInfo();
		const { nickName, avatarUrl, clientId } = ctx.request.body;
		const openid = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.checkUserInfo(openid, nickName, avatarUrl, clientId);
		ctx.body = result;
	}

	/**
	 * 获取公司所有用户api
	 * @Author  Cochan
	 * @method  POST
	 */
	async getAllUsers() {
		const { ctx } = this;
		const contacts = await ctx.service.user.getAllUsers();
		ctx.body = contacts;
	}

	/**
	 * 获取通讯录api
	 * @Author Cochan
	 * @method POST
	 */
	async getContacts() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const contacts = await ctx.service.user.getContacts(openId);
		ctx.body = contacts;
	}

	/**
	 * 搜索联系人api
	 * @Author  Cochan
	 * @method  POST
	 */
	async addContacts_search() {
		const { ctx } = this;
		const { content } = ctx.request.body;
		// console.log(content);
		ctx.body = await ctx.service.user.addContacts_search(content);
	}

	/**
	 * 获取好友申请列表api
	 * @author  Cochan
	 * @method  POST
	 */
	async getNewFriends() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.getNewFriends(openId);
		ctx.body = result;
	}

	/**
	 * 获取验证消息api
	 * @Author	Cochan
	 * @method	POST
	 */
	async getVerification() {
		const { ctx } = this;
		const { clientId, oppOpenId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.getVerification(myOpenId, oppOpenId);
		ctx.body = result;
	}

	/**
	 * 验证好友关系api
	 * @Author	Cochan
	 * @method	POST
	 */
	async checkFriend() {
		const { ctx } = this;
		const { clientId, oppOpenId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.checkFriend(myOpenId, oppOpenId);
		ctx.body = result;
	}

	/**
	 * 设置对方昵称api
	 * @Author	Cochan
	 * @method	POST
	 */
	async setNickName() {
		const { ctx } = this;
		const { clientId, oppOpenId, nickName } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.setNickName(myOpenId, oppOpenId, nickName);
		ctx.body = result;
	}

	/**
	 * 回复对方验证消息api
	 * @Author	Cochan
	 * @method	POST
	 */
	async setResponse() {
		const { ctx } = this;
		const { clientId, oppOpenId, response } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.setResponse(myOpenId, oppOpenId, response);
		ctx.body = result;
	}

	/**
	 * 拉入黑名单api
	 * @Author	Cochan
	 * @method	POST
	 */
	async setBlackList() {
		const { ctx } = this;
		const { clientId, oppOpenId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.setBlackList(myOpenId, oppOpenId);
		ctx.body = result;
	}

	/**
	 * 拉出黑名单api
	 * @Author	Cochan
	 * @method	POST
	 */
	async pullOutBlackList() {
		const { ctx } = this;
		const { clientId, oppOpenId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.pullOutBlackList(myOpenId, oppOpenId);
		ctx.body = result;
	}

	/**
	 * 获取黑名单api
	 * @Author Cochan
	 * @method POST
	 */
	async getBlackList() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const blackList = await ctx.service.user.getBlackList(openId);
		ctx.body = blackList;
	}

	/**
	 * 同意好友申请api
	 * @Author	Cochan
	 * @method	POST
	 */
	async agreeApply() {
		const { ctx } = this;
		const { clientId, oppOpenId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.agreeApply(myOpenId, oppOpenId);
		ctx.body = result;
	}

	/**
	 * 发送添加好友申请api
	 * @Author	Cochan
	 * @method	POST
	 */
	async sendApply() {
		const { ctx } = this;
		const { clientId, oppOpenId, verification, nickName } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.sendApply(myOpenId, oppOpenId, verification, nickName);
		ctx.body = result;
	}

	/**
	 * 创建群聊api
	 * @Author Cochan
	 * @method POST
	 */
	async addUserToGroup() {
		const { ctx } = this;
		const { userList, clientId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.addUserToGroup(userList, myOpenId);
		ctx.body = result;
	}

	/**
	 * 查询用户所加入的群组信息
	 * @Author Cochan
	 * @method POST
	 */
	async getUserInGroups() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const groupInfo = await ctx.service.user.getUserInGroups(myOpenId);
		ctx.body = groupInfo;
	}

	/**
	 * 更改群聊名称api
	 * @Author Cochan
	 * @method POST
	 */
	async updateGroupName() {
		const { ctx } = this;
		const { groupId, name } = ctx.request.body;
		const result = await ctx.service.user.updateGroupName(groupId, name);
		ctx.body = result;
	}

	/**
	 * 上下班打卡api
	 * @Author Cochan
	 * @method POST
	 */
	async setTimeCard() {
		const { ctx } = this;
		const { clientId, locationData, time, item } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.setTimeCard(openId, locationData, time, item);
		ctx.body = result;
	}

	/**
	 * 获取打卡信息api
	 * @Author Cochan
	 * @method POST
	 */
	async getTimeCardHistory() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const history = await ctx.service.user.getTimeCardHistory(openId);
		ctx.body = history;
	}

	/**
	 * 发送加班申请api
	 * @Author Cochan
	 * @method POST
	 */
	async setOverworkApply() {
		const { ctx } = this;
		const { clientId, date, duration, reason, comment } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.setOverworkApply(openId, date, duration, reason, comment);
		ctx.body = result;
	}

	/**
	 * 获取加班申请记录api
	 * @Author Cochan
	 * @return {JSON} 加班申请记录
	 */
	async getOverworkApply() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const applyList = await ctx.service.user.getOverworkApply(openId);
		ctx.body = applyList;
	}

	/**
	 * 发送请假申请api
	 * @Author Cochan
	 * @method POST
	 */
	async setVacationApply() {
		const { ctx } = this;
		const { clientId, startTimeStamp, endTimeStamp, reason, comment } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.setVacationApply(openId, startTimeStamp, endTimeStamp, reason, comment);
		ctx.body = result;
	}

	/**
	 * 获取请假申请记录api
	 * @Author Cochan
	 * @method POST
	 */
	async getVacationApply() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const applyList = await ctx.service.user.getVacationApply(openId);
		ctx.body = applyList;
	}

	/**
	 * 发布公告api
	 * @Author Cochan
	 * @method POST
	 */
	async setNotice() {
		const { ctx } = this;
		const { clientId, title, content } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.user.setNotice(openId, title, content);
		ctx.body = result;
	}

	/**
	 * 获取公告api
	 * @Author Cochan
	 * @method POST
	 */
	async getNotice() {
		const { ctx } = this;
		const noticeList = await ctx.service.user.getNotice();
		ctx.body = noticeList;
	}

}

module.exports = UserController;
















































