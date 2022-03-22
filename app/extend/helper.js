'use strict';

module.exports = {
	/**
	 * 包装消息
	 * @Author Cochan
	 * @param  {string} action   消息类型(private chat/group chat)
	 * @param  {string} msg      消息内容
	 * @param  {JSON} 	metadata 发送方及接收方
	 * @return {JSON}	带时间、类型、双方信息的消息
	 * return示例：
	 * {
	 *	  meta: {
	 *	    created: 1616342146,
	 *	    clientId: 'HbgJatpyqtZ84kGHAAAA',
	 *	    target: 'oHuDy5LDtPSQiWdnz8Q3pcYpCAgQ'
	 *	  },
	 *	  data: { action: 'private chat', msg: 'Hello World' }
	 * }
	 */
	parseMsg(action, msg, metadata, type) {
		const meta = Object.assign({}, {
			created: Math.round(new Date() / 1000)
		}, metadata);

		return {
			meta,
			data: {
				action,
				msg,
				type
			}
		};
	},

	/**
	 * 获取JSON数组内部键的数量
	 * @Author Cochan
	 * @param  {JSON}	jsonObj	JSON对象
	 * @return {int}	Length
	 */
	getJsonLength(jsonObj) {
        var Length = 0;
	    for (var item in jsonObj) {
           	Length++;
        }
		return Length;
	},

	/**
	 * 根据传来的键的数量构造JSON数组
	 * @Author Cochan
	 * @param  {int}	length 需要构造的键的数量
	 * @return {JSON}	空的JSON数组
	 */
	JsonConstructor(length) {
		var list = [];
		for (var i = 0; i < length; i++) {
			let a = {};
			list.push(a);
		}
		return list;
	},

	/**
	 * 按照键值进行降序排序
	 * @Author Cochan
	 * @param  {JOSN}	obj
	 * @return {JSON}	newObj	
	 */
	sortJson(obj) {
      const keys = Object.keys(obj).sort(function(a, b) { return obj[b] - obj[a] });
      var newObj = {};
      for (var i = 0; i < keys.length; i++) {
        const key = keys[i];
        newObj[key] = obj[key];
      }
      return newObj;
    },

    /**
     * 降序排序JSON数组
     * @Author Cochan
     */
	sortJsonObj(a,b){  
	   return b.lastTime-a.lastTime
	},

    /**
     * @Author Cochan
     * @param  {int} 时间戳
     * @param  {string} 格式: ① newsList ② chattingRecords
     * @return {string}
     */
	timeStampToDate(timeStamp, scene) {
		var now = new Date();
		var time = new Date(timeStamp * 1000);
		var y = time.getFullYear();
		var m = time.getMonth()+1;
		var d = time.getDate();
		var h = time.getHours();
		var mm = time.getMinutes();
		var s = time.getSeconds();

		if (scene == 'apply') {
			return y+'-'+add0(m)+'-'+add0(d);
		}

		if (now.getFullYear() == y && now.getMonth()+1 == m) {
			if (now.getDate() == d) {
				return add0(h)+':'+add0(mm);
			} else if (now.getDate()-d == 1) {
				if (scene == 'newsList') {
					return '昨天';
				} else {
					return '昨天 '+add0(h)+':'+add0(mm);
				}
			} else if (now.getDate()-d == 2) {
				if (scene == 'newsList') {
					return '前天';
				} else {
					return '前天 '+add0(h)+':'+add0(mm);
				}
			} else {
				return add0(m)+'月'+add0(d)+'日';
			}
		} else {
			return y+'年'+add0(m)+'月'+add0(d)+'日';
		}
	},

	/**
	 * 时间戳转日期时间
	 * @Author Cochan
	 * @param  {int} timeStamp  时间戳
	 * @return {string}			日期时间
	 */
	timeStampToTime(timeStamp) {
		var date = new Date(timeStamp * 1000);
		var y = date.getFullYear();
		var m = date.getMonth() + 1;
		var d = date.getDate();
		var time = y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + date.toTimeString().substr(0, 8);
		return time;
	},

	/**
	 * 生成随机字符串
	 * @Author Cochan
	 * @return {string} uuid
	 */
	generateRdStr(length) {
        var str = '';
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        for (var i = 0; i < length; i++) {
            str += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return str;
    },

    /**
     * 获取当前时间戳
     * @Author Cochan
     */
    getNow() {
    	return Math.round(new Date() / 1000);
    },

	/**
	 * 服务端获取签名（上传OSS）
	 * @Author Cochan
	 * @param  {JSON} options	相关配置
	 * @return
	 */
  	createUploadParams(options) {
    	const policy = this.getPolicyBase64(options);
    	const signature = this.signature(policy, options.accessKeySecret);
    	return {
      		OSSAccessKeyId: options.accessKeyId,
      		policy: policy,
      		signature: signature,
    	};
  	},

  	getPolicyBase64(options) {
		let date = new Date();
		// 设置policy过期时间。
		date.setHours(date.getHours() + options.timeOut);
		let srcT = date.toISOString();
		const policyText = {
			expiration: srcT,
	  		conditions: [
	        	// 限制上传文件大小。
	        	["content-length-range", 0, options.maxSize * 1024 * 1024],
	  		],
		};
	    const buffer = new Buffer.from(JSON.stringify(policyText));
	    return buffer.toString("base64");
	},

	signature(policy, accessKeySecret) {
		return this.ctx.crypto.enc.Base64.stringify(
	  		this.ctx.crypto.HmacSHA1(policy, accessKeySecret)
		);
	}
	
}


/**
 * 辅助函数，构造二位数使日期格式对齐
 * @Author Cochan
 * @param  {int}	m
 * @return {string}
 * 示例：9 -> '09'
 */
function add0(m) {
	return m<10?'0'+m:m;
}





























