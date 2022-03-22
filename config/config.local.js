/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  //关闭csrf
  config.security = {
    csrf: {
      enable: false
    }
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1612148439997_3551';

  // add your middleware config here
  config.middleware = [];

  config.io = {
    init: {
      wsEngine: 'ws',
    }, // passed to engine.io
    namespace: {
      '/': {
        connectionMiddleware: [
          'connection'
        ],
        packetMiddleware: [],
      },
      '/heartbeat': {
        connectionMiddleware: [],
        packetMiddleware: []
      }
    }
  };

  exports.mysql = {
  // 单数据库信息配置
    client: {
      // host
      host: '127.0.0.1',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: 'chanxin159',
      // 数据库名
      database: 'DingDong',
      // 字符集
      charset : 'utf8mb4'
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: true,
  };

  config.redis = {
    clients: {
      heartbeat: {
        port: 6379,
        host: '127.0.0.1', 
        password: 'chanxin159',
        db: 0
      },
      clientId: {
        port: 6379,
        host: '127.0.0.1', 
        password: 'chanxin159',
        db: 1
      },
      newsList: {
        port: 6379,
        host: '127.0.0.1', 
        password: 'chanxin159',
        db: 2
      }
    }
  }

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
