'use strict';
const ROOMPREFIX = 'room';

module.exports = () => {
	return async(ctx, next) => {
		const {app, socket, logger} = ctx;
		const id = socket.id;
		const nsp = app.io.of('/');
		const { appId, appSecret } = await ctx.service.user.getAppInfo();
		const { code } = socket.handshake.query;

		// 开始运行程序，进行连接操作
		const { ret, data } = await ctx.service.connection.connect(code, id);
		if (ret === 0) {
			console.log('connected! '+id);
		}

		await next();
		
		// 运行结束，断开连接操作
		await ctx.service.user.disConnection(data, id);
		
		console.log('disconnected! '+id);
	}
}