'use strict';

const Service = require('egg').Service;

class ConnectionService extends Service {
	/**
	 * socket.io连接事件触发操作
	 * @Author Cochan
	 * @param  {string} code 微信小程序code
	 * @param  {string} id   socketid
	 * @return {JSON}   状态码
	 */
	async connect(code, id) {
		const { app, ctx } = this;
		const { appId, appSecret } = await ctx.service.user.getAppInfo();

		const { data: {openid} } = await ctx.curl('https://api.weixin.qq.com/sns/jscode2session', {
			method: 'GET',
			dataType: 'json',
			data: {
				appid: appId,
				secret: appSecret,
				js_code: code,
				grant_type: 'authorization_code'
			}
		});

		if (openid !== undefined) {
			await ctx.service.user.connection(openid, id);
			return ctx.response.success_return(openid);
		} else {
			return ctx.response.paramMiss();
		}
	}
}

module.exports = ConnectionService;