'use strict';

const Controller = require('egg').Controller;
const ROOMPREFIX = 'room';

class MessageController extends Controller {
	/**
	 * 发送消息api
	 * @Author Cochan
	 */
	async sendMsg() {
		const { ctx, app } = this;
		const nsp = app.io.of('/');
		const { msg, target, type } = ctx.args[0];
		const clientId = ctx.id;
		if (!target) return;
		const message = ctx.helper.parseMsg('private chat', msg, {clientId, target}, type);
		const socketId = await ctx.service.user.getSocketId(target);
		const content = type === 1 ? msg : await ctx.service.message.getOssUrl(msg);
		const oppOpenId = await ctx.service.user.getOpenId(clientId);
		const msgId = await ctx.service.message.sendMsg(message);
		if (socketId) {
			nsp.sockets[socketId].emit('receiveMsg', {
				speaker: 'opposite',
				oppOpenId: oppOpenId,
				contentType: type,
				content: content,
				msgId: msgId
			});
		}
	}

	/**
	 * 发送消息_群聊api
	 * @Author Cochan
	 */
	async sendMsgGroup() {
		const { ctx, app } = this;
		const nsp = app.io.of('/');
		const { msg, target, type } = ctx.args[0];
		const clientId = ctx.id;
		const openId = await ctx.service.user.getOpenId(clientId);
		const { avatarUrl, wx_name } = await ctx.service.user.getUserInfo(openId);
		const content = type === 1 ? msg : await ctx.service.message.getOssUrl(msg);
		if (target) {
			nsp.to(ROOMPREFIX+target).emit('receiveMsgGroup', {
				contentType: type,
				content: content,
				avatarUrl: avatarUrl,
				wx_name: wx_name,
				clientId: clientId
			});
		}
		const message = ctx.helper.parseMsg('group chat', msg, {clientId, target}, type);
		const result = await ctx.service.message.sendMsgGroup(message);
	}

	/**
	 * 单条消息已读
	 * @Author Cochan
	 * @return {Boolean} [description]
	 */
	async isRead() {
		const { ctx, app } = this;
		const nsp = app.io.of('/');
		const { msgId } = ctx.args[0];
		const clientId = ctx.id;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		await ctx.service.message.isRead(myOpenId, msgId);
	}

}

module.exports = MessageController;