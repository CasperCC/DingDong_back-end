'use strict';

const Service = require('egg').Service;
const MAXTIMEOUT = 86400;	//超时时间

class UserService extends Service {
	/**
	 * 获取weapp相关配置信息
	 * @Author Cochan
	 * @return {JSON} 微信小程序的appId和appSecret
	 */
	async getAppInfo() {
		const { app, ctx } = this;
		const { content: appId } = await app.mysql.get('config', { title: 'AppId' });
		const { content: appSecret } = await app.mysql.get('config', { title: 'AppSecret' });
		return { appId, appSecret };
	}

	/**
	 * 通过clientId获取微信openId
	 * @Author Cochan
	 * @param  {string} clientId
	 * @return {string} openId
	 */
	async getOpenId(clientId) {
		const { app } = this;
		const openId = await app.redis.get('heartbeat').get(clientId);
		return openId;
	}

	/**
	 * 通过openId获取socketId
	 * @Author Cochan
	 * @param  {string} openId
	 * @return {string} socketId
	 */
	async getSocketId(openId) {
		const { app } = this;
		const socketId = await app.redis.get('clientId').get(openId);
		return socketId;
	}

	/**
	 * 客户端连接时设置clientId和openId映射关系
	 * @Author Cochan
	 * @param  {string} openId
	 * @param  {string} clientId
	 * @return {JSON}	状态码
	 */
	async connection(openId, clientId) {
		const { app, ctx } = this;
		await app.redis.get('heartbeat').set(clientId, openId, 'EX', MAXTIMEOUT);
		await app.redis.get('clientId').set(openId, clientId, 'EX', MAXTIMEOUT);
		return ctx.response.success_return('connection!');
	}

	/**
	 * 客户端注销时删除内存中clientId和openId映射关系，以及更新数据库登出时间
	 * @Author Cochan
	 * @param  {string} openId
	 * @param  {string} clientId
	 * @return {JSON}	状态码
	 */
	async disConnection(openId, clientId) {
		const { app, ctx } = this;
		await app.redis.get('heartbeat').del(clientId);
		await app.redis.get('clientId').del(openId);
		await app.mysql.update('users', {
			updated: ctx.helper.getNow()
		}, {
			where: {
				wx_openid: openId
			}
		});
		return ctx.response.success_return('disconnection!');
	}

	/**
	 * 用户登录时检查用户是否创建，以及信息是否匹配，不匹配则更新用户信息
	 * @Author Cochan
	 * @param  {string} openid
	 * @param  {string} nickName  用户微信昵称
	 * @param  {string} avatarUrl 用户头像
	 * @param  {string} clientId
	 * @return {JSON}	状态码
	 */
	async checkUserInfo(openid, nickName, avatarUrl, clientId) {
		const { app, ctx } = this;
		var result;
		const userInfo = await app.mysql.get('users', { wx_openid: openid });
		if (!userInfo) {
			// 用户未创建
			result = await this.insertUserInfo(openid, nickName, avatarUrl);
			return result.ret === 0 ? ctx.response.success_return('已创建新用户！') : ctx.resopnse.db_error();
		} else if (userInfo.wx_name != nickName || userInfo.avatarUrl != avatarUrl) {
			// 更新用户信息
			result = await this.updateUserInfo(openid, nickName, avatarUrl);
			return result.ret === 0 ? ctx.response.success_return('已更新用户信息！') : ctx.response.db_error();
		} else {
			return ctx.response.success_return('查询成功！');
		}
	}

	/**
	 * 创建用户
	 * @Author Cochan
	 * @param  {string} openid
	 * @param  {string} nickName  微信昵称
	 * @param  {string} avatarUrl 用户头像
	 * @return {JSON}	状态码
	 */
	async insertUserInfo(openid, nickName, avatarUrl) {
		const { app, ctx } = this;
		const result = await app.mysql.insert('users', {
			wx_openid: openid,
			wx_name: nickName,
			avatarUrl: avatarUrl,
			status: 1,
			created: ctx.helper.getNow(),
			updated: ctx.helper.getNow()
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 更新用户信息
	 * @Author Cochan
	 * @param  {string} openid
	 * @param  {string} nickName  微信昵称
	 * @param  {string} avatarUrl 用户头像
	 * @return {JSON}	状态码
	 */
	async updateUserInfo(openid, nickName, avatarUrl) {
		const { app, ctx } = this;
		var result = await app.mysql.update('users', {
			wx_name: nickName,
			avatarUrl: avatarUrl
		}, {
			where: {
				wx_openid: openid
			}
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 获取通讯录
	 * @Author Cochan
	 * @return {JSON} 通讯录列表
	 */
	async getContacts(openId) {
		const { app } = this;
		const sql = `SELECT t1.friend_openid, t1.nickname, t2.wx_name, t2.mobile, t2.email, t2.avatarUrl, t2.pid, t2.belong_id FROM friends AS t1 LEFT JOIN users AS t2 ON t1.friend_openid = t2.wx_openid WHERE t1.user_openid = ? AND t1.status = 1 AND t1.is_blackList = 0 AND t2.status = 1`;
		const contacts = await app.mysql.query(sql, [openId]);
		const position = await app.mysql.select('position');
		const belong = await app.mysql.select('architecture');
		contacts.forEach((val, index) => {
			val["pid"] = position[contacts[index].pid-1].hierarchy;
			val["belong_id"] = belong[val["belong_id"]-1].name;
		});
		return contacts;
	}

	/**
	 * 获取公司所有联系人
	 * @Author Cochan
	 * @return {JSON} 联系人列表
	 */
	async getAllUsers() {
		const { app } = this;
		const contacts = await app.mysql.select('users');
		const position = await app.mysql.select('position');
		const belong = await app.mysql.select('architecture');
		contacts.forEach((val, index) => {
			val["pid"] = position[contacts[index].pid-1].hierarchy;
			val["belong_id"] = belong[val["belong_id"]-1].name;
		});
		return contacts;
	}

	/**
	 * 获取用户信息
	 * @Author Cochan
	 * @param  {string} oppOpenId
	 * @param  {string} myOpenId	用户自己的openId
	 * @return {JSON}	用户信息
	 */
	async getUserInfo(oppOpenId, myOpenId) {
		const { app } = this;
		var userInfo = await app.mysql.get('users', { wx_openid: oppOpenId });
		const position = await app.mysql.select('position');
		const belong = await app.mysql.select('architecture');
		userInfo.pid = position[userInfo.pid-1].hierarchy;
		userInfo.belong_id = belong[userInfo.belong_id-1].name;
		if (myOpenId !== undefined) {
			const friendInfo = await app.mysql.get('friends', {
				user_openid: myOpenId,
				friend_openid: oppOpenId
			});
			if (friendInfo) {
				if (friendInfo.nickname) {
					userInfo.wx_name = friendInfo.nickname;
				}
			}
		}
		return userInfo;
	}

	/**
	 * 搜索联系人
	 * @Author Cochan
	 * @param  {string} content 用户输入的内容（微信昵称/手机号/邮箱地址）
	 * @return {JSON} 	联系人列表
	 */
	async addContacts_search(content) {
		const { app } = this;
		const sql = `SELECT a.id, a.wx_openid, a.wx_name, a.mobile, a.email, a.avatarUrl, b.hierarchy FROM users a LEFT JOIN position b ON a.pid = b.id WHERE (a.wx_name = ? OR a.mobile = ? OR a.email = ?) AND a.status = 1`;
		const result = await app.mysql.query(sql, [content, content, content]);
		return result;
	}

	/**
	 * 获取好友申请列表
	 * @Author Cochan
	 * @param  {string} openId
	 * @return {JSON}	好友申请列表
	 */
	async getNewFriends(openId) {
		const { app, ctx } = this;
		// 搜索申请人的信息
		const sql1 = `SELECT a.wx_openid, a.wx_name, a.avatarUrl, a.pid, b.status FROM users a RIGHT JOIN friends_apply b ON a.wx_openid = b.applicant_openid WHERE b.respondent_openid = ? AND a.status = 1 ORDER BY b.created DESC`;
		const sql2 = `SELECT a.wx_openid, a.wx_name, a.avatarUrl, a.pid, b.status FROM users a RIGHT JOIN friends_apply b ON a.wx_openid = b.respondent_openid WHERE b.applicant_openid = ? AND a.status = 1 ORDER BY b.created DESC`;
		const result1 = await app.mysql.query(sql1, [openId]);
		const result2 = await app.mysql.query(sql2, [openId]);
		const position = await app.mysql.select('position');
		result1.forEach((val, index) => {
			val['is_applicant'] = 0;
			val['pid'] = position[result1[index].pid-1].hierarchy;
		});
		result2.forEach((val, index) => {
			val['is_applicant'] = 1;
			val['pid'] = position[result2[index].pid-1].hierarchy;
		})
		const result = Object.assign({}, result2, result1);
		return result;
	}

	/**
	 * 获取验证消息
	 * @Author Cochan
	 * @param  {string} myOpenId  用户自己的openId
	 * @param  {string} oppOpenId 对方的openId
	 * @return {JSON}	验证消息列表
	 */
	async getVerification(myOpenId, oppOpenId) {
		const { app, ctx } = this;
		const sql = `SELECT * FROM verification WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?) ORDER BY created ASC`;
		const verification = await app.mysql.query(sql, [myOpenId, oppOpenId, oppOpenId, myOpenId]);
		return verification;
	}

	/**
	 * 验证好友关系，检查是否为好友，或者只是设置了昵称并未添加好友
	 * @Author Cochan
	 * @param  {string} myOpenId  用户自己的openId
	 * @param  {string}	oppOpenId 对方的openId
	 * @return {JSON}	带好友信息的状态码
	 */
	async checkFriend(myOpenId, oppOpenId) {
		const { app, ctx } = this;
		const sql = `SELECT * FROM friends WHERE user_openid = ? AND friend_openid = ? AND status != 0`;
		const friend = await app.mysql.query(sql, [myOpenId, oppOpenId]);
		if (friend != '' && friend != null) {
			// 有好友关系或设置过备注
			return ctx.response.success_return(friend);
		} else {
			// 未添加好友且未设置过备注
			return ctx.response.fail_return('none');
		}
	}

	/**
	 * 设置对方昵称
	 * @Author Cochan
	 * @param  {string} myOpenId  自己的openId
	 * @param  {string} oppOpenId 对方的openId
	 * @param  {JSON}	状态码
	 */
	async setNickName(myOpenId, oppOpenId, nickName) {
		const { app, ctx } = this;
		const friend = await app.mysql.get('friends', {
			user_openid: myOpenId,
			friend_openid: oppOpenId
		});
		if (friend != '' && friend != null) {
			var result = await app.mysql.update('friends', {
				nickname: nickName,
				updated: ctx.helper.getNow()
			}, {
				where: {
					user_openid: myOpenId,
					friend_openid: oppOpenId
				}
			});
		} else {
			var result = await app.mysql.insert('friends', {
				user_openid: myOpenId,
				friend_openid: oppOpenId,
				nickname: nickName,
				status: 2,
				created: ctx.helper.getNow(),
				updated: ctx.helper.getNow()
			});
		}
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.resopnse.db_error();
	}

	/**
	 * 回复对方验证消息
	 * @Author Cochan
	 * @param  {string} myOpenId  自己的openId
	 * @param  {string} oppOpenId 对方的openId
	 * @param  {JSON}	状态码
	 */
	async setResponse(myOpenId, oppOpenId, response) {
		const { app, ctx } = this;
		const result = await app.mysql.insert('verification', {
			from_id: myOpenId,
			to_id: oppOpenId,
			content: response,
			created: ctx.helper.getNow()
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.resopnse.db_error();
	}

	/**
	 * 拉入黑名单
	 * @Author Cochan
	 * @param  {string} myOpenId  自己的openId
	 * @param  {string} oppOpenId 对方的openId
	 * @return {JSON}   状态码
	 */
	async setBlackList(myOpenId, oppOpenId) {
		const { app, ctx } = this;
		const result = await app.mysql.update('friends', {
			is_blackList: 1,
			updated: ctx.helper.getNow()
		}, {
			where: {
				user_openid: myOpenId,
				friend_openid: oppOpenId
			}
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.resopnse.db_error();
	}

	/**
	 * 拉出黑名单
	 * @Author Cochan
	 * @param  {string} myOpenId  自己的openId
	 * @param  {string} oppOpenId 对方的openId
	 * @return {JSON}	状态码
	 */
	async pullOutBlackList(myOpenId, oppOpenId) {
		const { app, ctx } = this;
		const result = await app.mysql.update('friends', {
			is_blackList: 0,
			updated: ctx.helper.getNow()
		}, {
			where: {
				user_openid: myOpenId,
				friend_openid: oppOpenId
			}
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.resopnse.db_error();
	}

	/**
	 * 获取黑名单
	 * @Author Cochan
	 * @param  {string} openId 用户openid
	 * @return {JSON}   黑名单列表
	 */
	async getBlackList(openId) {
		const { app, ctx } = this;
		const sql = `SELECT t2.*, t1.nickname FROM friends AS t1 LEFT JOIN users AS t2 ON t1.friend_openid = t2.wx_openid WHERE t1.user_openid = ? AND t1.status = 1 AND t1.is_blackList = 1 AND t2.status = 1`;
		const blackList = await app.mysql.query(sql, [openId]);
		const position = await app.mysql.select('position');
		blackList.forEach((val, index) => {
			val["pid"] = position[blackList[index].pid-1].hierarchy;
		});
		return blackList;
	}

	/**
	 * 同意好友申请，由于数据库为双向好友关系表，需要判断自己与对方关系以及对方与自己关系
	 * @Author Cochan
	 * @param  {string} myOpenId  自己的openId
	 * @param  {string} oppOpenId 对方的openId
	 * @return {JSON}	状态码
	 */
	async agreeApply(myOpenId, oppOpenId) {
		const { app, ctx } = this;
		// 判断己方好友关系
		const friend1 = await app.mysql.get('friends', {
			user_openid: myOpenId,
			friend_openid: oppOpenId
		});
		// 判断对方好友关系
		const friend2 = await app.mysql.get('friends', {
			user_openid: oppOpenId,
			friend_openid: myOpenId
		});

		// 开启mysql事务
		const conn = await app.mysql.beginTransaction();
		try {
			// 修改我方好友关系
			if (friend1 != '' && friend1 != null) {
				await conn.update('friends', {
					status: 1,
					updated: ctx.helper.getNow()
				}, {
					where: {
						user_openid: myOpenId,
						friend_openid: oppOpenId
					}
				});
			} else {
				await conn.insert('friends', {
					user_openid: myOpenId,
					friend_openid: oppOpenId,
					status: 1,
					created: ctx.helper.getNow(),
					updated: ctx.helper.getNow()
				});
			}
			
			// 修改对方好友关系
			if (friend2 != '' && friend2 != null) {
				await conn.update('friends', {
					status: 1,
					updated: ctx.helper.getNow()
				}, {
					where: {
						user_openid: oppOpenId,
						friend_openid: myOpenId
					}
				});
			} else {
				await conn.insert('friends', {
					user_openid: oppOpenId,
					friend_openid: myOpenId,
					status: 1,
					created: ctx.helper.getNow(),
					updated: ctx.helper.getNow()
				});
			}
			// 更新好友申请表
			await conn.update('friends_apply', {
				status: 1
			}, {
				where: {
					applicant_openid: oppOpenId,
					respondent_openid: myOpenId,
					status: 0
				}
			});
			await conn.commit();
			return ctx.response.success_return();

		} catch(err) {
			await conn.rollback();	// 事务回滚
			throw err;
			return ctx.response.db_error();
		}
		
	}

	/**
	 * 发送添加好友申请
	 * @Author Cochan
	 * @param  {string} myOpenId  自己的openId
	 * @param  {string} oppOpenId 对方的openId
	 * @return {JSON}	状态码
	 */
	async sendApply(myOpenId, oppOpenId, verification, nickName) {
		const { app, ctx } = this;
		const apply = await app.mysql.get('friends_apply', {
			applicant_openid: myOpenId,
			respondent_openid: oppOpenId
		});
		const conn = await app.mysql.beginTransaction();
		try {
			// 插入验证消息
			await conn.insert('verification', {
				from_id: myOpenId,
				to_id: oppOpenId,
				content: verification,
				created: ctx.helper.getNow()
			});
			if (apply != '' && apply != null) {
				// 更新昵称
				await conn.update('friends', {
					nickname: nickName,
					updated: ctx.helper.getNow()
				}, {
					where: {
						user_openid: myOpenId,
						friend_openid: oppOpenId
					}
				});
			} else {
				// 发送添加好友申请
				await conn.insert('friends_apply', {
					applicant_openid: myOpenId,
					respondent_openid: oppOpenId,
					status: 0,
					created: ctx.helper.getNow()
				});
				// 设置对方昵称
				await conn.insert('friends', {
					user_openid: myOpenId,
					friend_openid: oppOpenId,
					nickname: nickName,
					status: 2,
					created: ctx.helper.getNow(),
					updated: ctx.helper.getNow()
				});
			}
			await conn.commit();
		} catch(err) {
			await conn.rollback();	// 事务回滚
			throw err;
			return ctx.response.db_error();
		}
		return ctx.response.success_return();
	}

	/**
	 * 添加选中的用户创建群聊
	 * @Author Cochan
	 * @param  {Array}	userList	选中的用户openid数组	
	 * @param  {string} myOpenId
	 */
	async addUserToGroup(userList, myOpenId) {
		const { app, ctx } = this;
		const conn = await app.mysql.beginTransaction();
		try {
			const { insertId } = await conn.insert('group_info', {
				name: '群聊' + await ctx.helper.generateRdStr(10),
				create_id: myOpenId,
				owner_id: myOpenId,
				created: ctx.helper.getNow(),
				updated: ctx.helper.getNow()
			});
			const rows = [{
				group_id: insertId,
				uid: myOpenId,
				status: 2,
				created: ctx.helper.getNow()
			}];
			for (let i = 0; i < userList.length; i++) {
				rows.push({
					group_id: insertId,
					uid: userList[i],
					status: 1,
					created: ctx.helper.getNow()
				});
			}
			await conn.insert('group_user', rows);
			await conn.commit();
			return ctx.response.success_return();
		} catch(err) {
			await conn.rollback();	// 事务回滚
			throw err;
			return ctx.response.db_error();
		}
	}

	/**
	 * 获取用户加入群聊的info
	 * @Author Cochan
	 * @param  {string} openId
	 * @return {json}	infomation of group chat
	 */
	async getUserInGroups(openId) {
		const { app, ctx } = this;
		const sql = `SELECT t1.name, t1.group_headpic, t2.group_id FROM group_info AS t1 RIGHT JOIN group_user AS t2 ON t1.id = t2.group_id WHERE t2.uid = ? AND t2.out_type = 0`;
		const groups = await app.mysql.query(sql, [openId]);
		return groups;
	}

	/**
	 * 更改群组名称
	 * @Author Cochan
	 * @param  {int}	groupId 群组id
	 * @param  {string} name    新的群组名称
	 * @return {JSON}			状态码
	 */
	async updateGroupName(groupId, name) {
		const { app, ctx } = this;
		const result = await app.mysql.update('group_info', {
			id: groupId,
			name: name,
			updated: ctx.helper.getNow()
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 用户上下班打卡
	 * @Author Cochan
	 * @param  {string} openId       用户openID
	 * @param  {JSON} 	locationData 用户所在位置信息
	 * @param  {int} 	time         用户打卡时间戳
	 * @param  {int} 	item         用户打卡项目(0上班; 1下班)
	 * @return {JSON} 				 状态码
	 */
	async setTimeCard(openId, locationData, time, item) {
		const { app, ctx } = this;
		const { latitude, longitude, name, desc } = locationData;
		const result = await app.mysql.insert('timecard', {
			uid: openId,
			latitude: latitude,
			longitude: longitude,
			location: name,
			address: desc,
			item: item,
			created: time
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 获取打卡记录
	 * @Author Cochan
	 * @param  {string} openId 	用户微信openid
	 * @return {JSON}			打卡记录
	 */
	async getTimeCardHistory(openId) {
		const { app, ctx } = this;
		const history = await app.mysql.select('timecard', {
			where: {
				uid: openId,
				status: 1
			},
			orders: [
				['created', 'DESC']
			]
		});
		for (let i = 0; i < history.length; i++) {
			history[i].time = ctx.helper.timeStampToTime(history[i].created);
		}
		return history;
	}

	/**
	 * 发送加班申请
	 * @Author Cochan
	 * @return {JSON} 状态码
	 */
	async setOverworkApply(openId, date, duration, reason, comment) {
		const { app, ctx } = this;
		const result = await app.mysql.insert('overwork', {
			id: ctx.helper.generateRdStr(16),
			uid: openId,
			date: date,
			duration: duration,
			reason: reason,
			comment: comment,
			created: ctx.helper.getNow(),
			updated: ctx.helper.getNow()
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 获取加班申请记录
	 * @Author Cochan
	 * @param  {string} openId 	用户微信openid
	 * @return {JSON}   		记录
	 */
	async getOverworkApply(openId) {
		const { app, ctx } = this;
		const sql = `SELECT t1.id, t1.date, t1.duration, t1.reason, t1.comment, t1.status, t1.reply, t1.reply_uid, t1.updated, t2.wx_name FROM overwork AS t1 LEFT JOIN users AS t2 ON t1.uid = t2.wx_openid WHERE t1.uid = ? AND t2.status = 1 ORDER BY t1.updated DESC`;
		var applyList = await app.mysql.query(sql, [openId]);
		var condition = ['审批未通过', '未审批', '审批已完成'];
		var type = ['无特殊理由', '客户紧急情况', '项目延迟'];
		for (let i = 0; i < applyList.length; i++) {
			if (applyList[i].reply_uid) {
				var apply_user = await this.getUserInfo(applyList[i].reply_uid);
				applyList[i].reply_user = apply_user.wx_name;
			}
			applyList[i].date = ctx.helper.timeStampToDate(applyList[i].date, 'apply');
			applyList[i].condition = condition[applyList[i].status];
			applyList[i].time = ctx.helper.timeStampToTime(applyList[i].updated);
			applyList[i].type = type[applyList[i].reason];
		}
		return applyList;
	}

	/**
	 * 发送请假申请
	 * @Author Cochan
	 * @return {JSON} 状态码
	 */
	async setVacationApply(openId, startTimeStamp, endTimeStamp, reason, comment) {
		const { app, ctx } = this;
		const result = await app.mysql.insert('vacation_apply', {
			id: ctx.helper.generateRdStr(16),
			uid: openId,
			startdate: startTimeStamp,
			enddate: endTimeStamp,
			reason: reason,
			comment: comment,
			created: ctx.helper.getNow(),
			updated: ctx.helper.getNow()
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 获取请假申请记录
	 * @Author Cochan
	 * @param  {String} openId 微信openid
	 * @return {JSON}          状态码
	 */
	async getVacationApply(openId) {
		const { app, ctx } = this;
		const sql = `SELECT t1.id, t1.startdate, t1.enddate, t1.reason, t1.comment, t1.status, t1.reply_uid, t1.reply, t1.updated, t2.wx_name FROM vacation_apply AS t1 LEFT JOIN users AS t2 ON t1.uid = t2.wx_openid WHERE t1.uid = ? AND t2.status = 1 ORDER BY t1.updated DESC`;
		const applyList = await app.mysql.query(sql, [openId]);
		var condition = ['审批未通过', '未审批', '审批已完成'];
		var type = ['调休', '事假', '病假', '婚假', '产假', '探亲', '丧假'];
		for (let i = 0; i < applyList.length; i++) {
			if (applyList[i].reply_uid) {
				var apply_user = await this.getUserInfo(applyList[i].reply_uid);
				applyList[i].reply_user = apply_user.wx_name;
			}
			applyList[i].startdate = ctx.helper.timeStampToDate(applyList[i].startdate, 'apply');
			applyList[i].enddate = ctx.helper.timeStampToDate(applyList[i].enddate, 'apply');
			applyList[i].condition = condition[applyList[i].status];
			applyList[i].time = ctx.helper.timeStampToTime(applyList[i].updated);
			applyList[i].type = type[applyList[i].reason];
		}
		return applyList;
	}

	/**
	 * 发布公告
	 * @Author Cochan
	 * @param  {string} openId  用户微信openid
	 * @param  {string} title   公告标题
	 * @param  {string} content 公告内容
	 */
	async setNotice(openId, title, content) {
		const { app, ctx } = this;
		const result = await app.mysql.insert('notice', {
			notifier_id: openId,
			title: title,
			content: content,
			created: ctx.helper.getNow(),
			updated: ctx.helper.getNow()
		});
		return result.affectedRows === 1 ? ctx.response.success_return() : ctx.response.db_error();
	}

	/**
	 * 获取通知公告
	 * @Author Cochan
	 * @return {JOSN} 公告详情
	 */
	async getNotice() {
		const { app, ctx } = this;
		const sql = `SELECT t1.title, t1.content, t1.updated, t2.wx_name FROM notice AS t1 LEFT JOIN users AS t2 ON t1.notifier_id = t2.wx_openid WHERE t2.status = 1 AND t1.status = 1 ORDER BY t1.updated DESC`;
		var noticeList = await app.mysql.query(sql);
		for (let i = 0; i < noticeList.length; i++) {
			noticeList[i].time = ctx.helper.timeStampToTime(noticeList[i].updated);
		}
		return noticeList;
	}

}

module.exports = UserService;


















































