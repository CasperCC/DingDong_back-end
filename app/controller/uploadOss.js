'use strict';

const Controller = require('egg').Controller;
const OSS = require('ali-oss');

class UploadOssController extends Controller {
	/**
	 * 获取签名参数
	 * @Author Cochan
	 */
	async getUploadParams() {
		const { ctx } = this;
		const params = ctx.request.body;
  		const options = {
  			accessKeyId: '',
  			accessKeySecret: '',
  			timeOut: params.timeOut || 1, // 限制参数的生效时间(单位：小时)。
  			maxSize: params.maxSize || 10 // 限制上传文件大小(单位：MB)。
  		};
  		const uploadParams = await ctx.helper.createUploadParams(options);
  		ctx.body = uploadParams;
  	}

  	/**
  	 * 通过文件在OSS中的key获取临时链接
  	 * @Author Cochan
  	 */
  	async getOssUrl() {
  		const { ctx } = this;
  		const { objectName } = ctx.request.body;
  		const url = await ctx.service.message.getOssUrl(objectName);
  		ctx.body = url;
  	}

}

module.exports = UploadOssController;