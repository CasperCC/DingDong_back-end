'use strict';

const Controller = require('egg').Controller;

class MessageController extends Controller {
	/**
	 * 获取聊天消息列表api
	 * @Author	Cochan
	 * @method	POST
	 */
	async getNewsList() {
		const { ctx } = this;
		const { clientId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const newsList = await ctx.service.message.getNewsList(openId);
		ctx.body = newsList;
	}

	/**
	 * 获取私聊聊天记录api
	 * @Author	Cochan
	 * @method	POST
	 */
	async getChattingRecords() {
		const { ctx } = this;
		const { clientId, opposite } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const chattingRecords = await ctx.service.message.getChattingRecords(openId, opposite);
		ctx.body = chattingRecords;
	}

	/**
	 * 获取群聊聊天记录api
	 * @Author	Cochan
	 * @method	POST
	 */
	async getChattingRecordsGroup() {
		const { ctx } = this;
		const { clientId, groupId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const chattingRecords = await ctx.service.message.getChattingRecordsGroup(openId, groupId);
		ctx.body = chattingRecords;
	}

	/**
	 * 更新最后接收群聊消息api
	 * @Author	Cochan
	 * @method	POST
	 */
	async updateRecTime() {
		const { ctx } = this;
		const { clientId, groupId } = ctx.request.body;
		const openId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.message.updateRecTime(openId, groupId);
		ctx.body = result;
	}

	/**
	 * 更新最后接收群聊消息api
	 * @Author	Cochan
	 * @method	POST
	 */
	async updateUnReadNum() {
		const { ctx } = this;
		const { clientId, oppOpenId } = ctx.request.body;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await ctx.service.message.updateUnReadNum(myOpenId, oppOpenId);
		ctx.body = result;
	}
}

module.exports = MessageController;