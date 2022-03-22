'use strict';

const Controller = require('egg').Controller;
const ROOMPREFIX = 'room';

class ConnectionController extends Controller {
	/**
	 * 服务端重连事件
	 * @Author Cochan
	 */
	async reconnection() {
		const { app, ctx } = this;
		const nsp = app.io.of('/');
		const socket = ctx.socket;
		const { code } = ctx.args[0];
		const { ret, data } = await ctx.service.connection.connect(code, socket.id);
		if (ret === 0) {
			console.log('reconnect!');
		}
	}

	async joinRoom() {
		const { app, ctx } = this;
		const nsp = app.io.of('/');
		const socket = ctx.socket;
		const { roomId } = ctx.args[0];
		if (roomId) {
			socket.join(ROOMPREFIX+roomId);
			console.log(socket.id+'已加入'+ROOMPREFIX+roomId);
		}
	}

	async leaveRoom() {
		const { app, ctx } = this;
		const nsp = app.io.of('/');
		const socket = ctx.socket;
		const { roomId } = ctx.args[0];
		if (roomId) {
			socket.leave(ROOMPREFIX+roomId);
			console.log(socket.id+'已退出'+ROOMPREFIX+roomId);
		}
	}
}

module.exports = ConnectionController;