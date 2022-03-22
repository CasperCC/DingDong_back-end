'use strict';

module.exports = {
	success_return(data) {
		const ret = 0;
		const msg = 'ok';
		return output_json(ret, msg, data);
	},

	db_error() {
		const ret = -1;
		const msg = 'database fail';
		return output_json(ret, msg);
	},

	paramMiss() {
		const ret = -2;
		const msg = '缺少参数';
		return output_json(ret, msg);
	},

	fail_return(data) {
		const ret = -3;
		const msg = 'fail_return';
		return output_json(ret, msg, data);
	}
}

function output_json(ret, msg, data) {
	if (data === undefined) {
		return {
			ret: ret,
			msg: msg
		};
	} else {
		return {
			ret: ret,
			msg: msg,
			data: data
		};
	}
};