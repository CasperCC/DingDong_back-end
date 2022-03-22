'use strict';

const Service = require('egg').Service;
const OSS = require('ali-oss');

class MessageService extends Service {
	/**
	 * 发送私聊消息
	 * @Author Cochan
	 * @param  {string} message 
	 * @return {JSON}   状态码
	 */
	async sendMsg(message) {
		const { app, ctx } = this;
		const { meta: { created, clientId, target }, data: { msg, type } } = message;
		const openId = await app.redis.get('heartbeat').get(clientId);
		if (!clientId) {
			return ctx.response.db_error();
		}
		var insertSendResult;
		// 开启mysql事务
		const conn = await app.mysql.beginTransaction();
		try {
			// 插入到发送消息表中
			insertSendResult = await conn.insert('send_msg', {
				from_id: openId,
				to_id: target,
				content: msg,
				status: 1,
				type: type,
				created: created
			});
			// 默认插入到未读消息表中
			await conn.insert('rec_msg', {
				msg_id: insertSendResult.insertId,
				to_id: target,
				status: 0,
				created: created
			});
			await conn.commit();

		} catch(err) {
			await conn.rollback();
			throw err;
			return ctx.response.db_error();
		}

		// 插入到最新消息中作为缓存
		await app.redis.get('newsList').hmset(openId, target, insertSendResult.insertId);
		await app.redis.get('newsList').hmset(target, openId, insertSendResult.insertId);

		return insertSendResult.insertId;
	}

	/**
	 * 群聊中发送消息
	 * @Author Cochan
	 * @return {JSON} 状态码
	 */
	async sendMsgGroup(message) {
		const { app, ctx } = this;
		const { meta: { created, clientId, target }, data: { msg, type } } = message;
		const myOpenId = await ctx.service.user.getOpenId(clientId);
		const result = await app.mysql.insert('send_msg', {
			from_id: myOpenId,
			group_id: target,
			content: msg,
			status: 1,
			type: type,
			created: created
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 更新最后接收消息的时间
	 * @Author Cochan
	 * @param  {string} openId  微信openid
	 * @param  {string} groupId 群id
	 * @return {json}			状态码
	 */
	async updateRecTime(openId, groupId) {
		const { app, ctx } = this;
		const result = await app.mysql.update('group_user', {
			rec_time: ctx.helper.getNow()
		}, {
			where: {
				group_id: groupId,
				uid: openId
			}
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 获取用户未读消息数
	 * @Author Cochan
	 * @param  {[type]} from_id 消息发送方
	 * @param  {[type]} to_id   消息接收方
	 * @return {JSON}	键名为count(*)的JSON数组
	 */
	async getUnReadNum(from_id, to_id) {
		const { app } = this;
		const sql = `SELECT COUNT(*) AS num FROM send_msg a JOIN rec_msg b ON a.id = b.msg_id WHERE (a.from_id = ? AND b.to_id = ? AND b.status = 0)`;
		const unReadNum = await app.mysql.query(sql, [from_id, to_id]);
		return unReadNum[0].num;
	}

	/**
	 * 获取聊天记录
	 * @Author Cochan
	 * @param  {string} myOpenId	自己的openId
	 * @param  {string} oppOpenId	对方的openId
	 * @return {JSON}	聊天记录列表
	 */
	async getChattingRecords(myOpenId, oppOpenId) {
		const { app, ctx } = this;
		const sql = `SELECT a.id, a.from_id, a.content, a.to_id, a.type, a.created FROM send_msg a JOIN rec_msg b ON a.id = b.msg_id WHERE (a.from_id = ? AND b.to_id = ?) AND a.status = 1 OR (a.from_id = ? AND b.to_id = ?) ORDER BY a.created ASC`;
		const list = await app.mysql.query(sql, [myOpenId, oppOpenId, oppOpenId, myOpenId]);

		var chattingRecordsList = ctx.helper.JsonConstructor(list.length);
		for (var i = 0; i < list.length; i++) {
			if (i) {
				if (list[i].created - list[i-1].created < 300) {
					chattingRecordsList[i].time = null;
				} else {
					chattingRecordsList[i].time = ctx.helper.timeStampToDate(list[i].created, 'chattingRecords');
				}
			} else {
				chattingRecordsList[i].time = ctx.helper.timeStampToDate(list[i].created, 'chattingRecords');
			}
			chattingRecordsList[i].contentType = list[i].type;
			chattingRecordsList[i].speaker = list[i].from_id === myOpenId ? 'me' : 'opposite';
			chattingRecordsList[i].content = list[i].type === 1 ? list[i].content : await this.getOssUrl(list[i].content);
		}

		return chattingRecordsList;
	}

	async getChattingRecordsGroup(openId, groupId) {
		const { app, ctx } = this;
		const sql = `SELECT t1.from_id, t1.content, t1.type, t1.created, t2.wx_name, t2.avatarUrl FROM send_msg AS t1 LEFT JOIN users AS t2 ON t1.from_id = t2.wx_openid WHERE t1.group_id = ? AND t1.status = 1 AND t2.status = 1`;
		const list = await app.mysql.query(sql, [groupId]);
		for (let i = 0; i < list.length; i++) {
			if (i) {
				if (list[i].created - list[i-1].created < 300) {
					list[i].time = null;
				} else {
					list[i].time = ctx.helper.timeStampToDate(list[i].created, 'chattingRecords');
				}
			} else {
				list[i].time = ctx.helper.timeStampToDate(list[i].created, 'chattingRecords');
			}
			list[i].group = true;
			list[i].contentType = list[i].type;
			list[i].speaker = list[i].from_id === openId ? 'me' : 'opposite';
			list[i].content = list[i].type === 1 ? list[i].content : await this.getOssUrl(list[i].content);
		}
		return list;
	}

	/**
	 * 更新未读消息数
	 * @Author Cochan
	 * @param  {string} myOpenId	自己的openId
	 * @param  {string} oppOpenId	对方的openId
	 * @return {JSON}	状态码
	 */
	async updateUnReadNum(myOpenId, oppOpenId) {
		const { app, ctx } = this;
		const sql = `SELECT t1.id FROM send_msg AS t1 RIGHT JOIN rec_msg AS t2 ON t1.id = t2.msg_id WHERE t1.from_id = ? AND t1.to_id = ? AND t2.status = 0`;
		const res = await app.mysql.query(sql, [oppOpenId, myOpenId]);
		// 开启mysql事务
		const conn = await app.mysql.beginTransaction();
		try {
			for (var i = 0; i < res.length; i++) {
				await conn.update('rec_msg', {
					status: 1
				}, {
					where: {
						msg_id: res[i].id
					}
				});
			}
			await conn.commit();
			return ctx.response.success_return();
		} catch(err) {
			await conn.rollback();	// 事务回滚
			throw err;
			return ctx.response.db_error();
		}
		
	}

	/**
	 * 单条消息已读
	 * @Author Cochan
	 * @param  {string}	myOpenId
	 * @param  {int}	msgId 		消息id
	 * @return {JSON}				状态码
	 */
	async isRead(myOpenId, msgId) {
		const { app, ctx } = this;
		const result = await app.mysql.update('rec_msg', {
			status: 1
		}, {
			where: {
				msg_id: msgId,
				to_id: myOpenId
			}
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 获取消息列表
	 * @Author Cochan
	 * @param  {[type]} openId 自己的openId
	 * @return {JSON}	消息列表
	 */
	async getNewsList(openId) {
		const { app, ctx } = this;

		/**
		 * 获取私聊的消息列表
		 */

		// 获取缓存中最新消息
		var list = await app.redis.get('newsList').hgetall(openId);
		// 将消息列表按键值降序排序
		list = await ctx.helper.sortJson(list);
		// 获取数组内json的数量
		const listLength = await ctx.helper.getJsonLength(list);
		// 构造返回消息列表所需要的JSON数组
		var newsList = await ctx.helper.JsonConstructor(listLength);
		// 循环赋值
		var i = 0;
		for (var item in list) {
			const userInfo = await ctx.service.user.getUserInfo(item, openId);
			const { content, type, created } = await app.mysql.get('send_msg', { id: list[item]});
			const unReadNum = await this.getUnReadNum(item, openId);
			newsList[i].openId = item;
			newsList[i].nickName = userInfo.wx_name + '-' + userInfo.belong_id;
			newsList[i].avatarUrl = userInfo.avatarUrl;
			if (type === 1) {
				newsList[i].lastMsg = content;
			} else if (type === 2) {
				newsList[i].lastMsg = '[图片]';
			} else {
				newsList[i].lastMsg = '[视频]';
			}
			
			newsList[i].unReadNum = unReadNum;
			newsList[i].lastTime = created;
			i++;
		}

		/**
		 * 获取群聊的消息列表
		 */
		
		// 获取用户加入的群组id
		const groups = await app.mysql.select('group_user', {
			columns: ['group_id'],
			where: {
				uid: openId
			}
		});
		for (let i = 0; i < groups.length; i++) {
			const { name, group_headpic } = await app.mysql.get('group_info', { id: groups[i].group_id });
			const sql1 = `SELECT content AS content_group, created AS created_group, type AS type_group FROM send_msg WHERE id = (SELECT MAX(id) FROM send_msg WHERE group_id = ?)`;
			const sql2 = `SELECT rec_time FROM group_user WHERE group_id = ? AND uid = ?`;
			const sql3 = `SELECT COUNT(*) AS unReadNumGroup FROM send_msg WHERE group_id = ? AND created >= ?`;
			const result1 = await app.mysql.query(sql1, [groups[i].group_id]);
			const result2 = await app.mysql.query(sql2, [groups[i].group_id, openId]);
			const result3 = await app.mysql.query(sql3, [groups[i].group_id, result2[0].rec_time]);
			if (result1[0]) {
				var content_group;
				if (result1[0].type_group === 1) {
					content_group = result1[0].content_group;
				} else if (result1[0].type_group === 2) {
					content_group = '[图片]';
				} else {
					content_group = '[视频]';
				}
				newsList.push({
					groupId: groups[i].group_id,
					nickName: name,
					avatarUrl: group_headpic,
					lastMsg: content_group,
					unReadNum: result3[0].unReadNumGroup,
					lastTime: result1[0].created_group
				});
			}
		}

		newsList.sort(ctx.helper.sortJsonObj);
		for (let i = 0; i < newsList.length; i++) {
			newsList[i].lastTime = await ctx.helper.timeStampToDate(newsList[i].lastTime, 'newsList')
		}
		return newsList;
	}

	/**
	 * 用文件在OSS中的位置换取临时url
	 * @Author Cochan
	 * @param  {string} objectName
	 * @return {string}	url
	 */
	async getOssUrl(objectName) {
		const client = new OSS({
  			region: 'oss-cn-guangzhou',
  			internal: false,
  			cname: true,
  			secure: true,
  			endpoint: 'oss.cochan.tech',
  			// endpoint: 'oss-cn-shanghai-internal.aliyuncs.com', // 内网访问
  			accessKeyId: '',
  			accessKeySecret: '',
  			bucket: 'cochan-aliyun-gz'
  		});
  		const url = client.signatureUrl(objectName, {expires: 3600});
  		return url;
	}
}

module.exports = MessageService;
































