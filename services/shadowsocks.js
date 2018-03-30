const log4js = require('log4js');
const logger = log4js.getLogger('system');
const cron = appRequire('init/cron');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const version = appRequire('package').version;
const exec = require('child_process').exec;
const http = require('http');

let clientIp = [];

const config = appRequire('services/config').all();
const host = config.shadowsocks.address.split(':')[0];
const port = +config.shadowsocks.address.split(':')[1];
const mPort = +config.manager.address.split(':')[1];

client.bind(mPort);

const knex = appRequire('init/knex').knex;

const moment = require('moment');

let shadowsocksType = 'libev';
let lastFlow;

const sendPing = () => {
  client.send(new Buffer('ping'), port, host);
};

let existPort = [];
let existPortUpdatedAt = Date.now();
const setExistPort = flow => {
  existPort = [];
  for(const f in flow) {
    existPort.push(+f);
  }
  existPortUpdatedAt = Date.now();
};

let firstFlow = true;
let portsForLibev = [];
const connect = () => {
  client.on('message', async (msg, rinfo) => {
    const msgStr = new String(msg);
    if(msgStr.substr(0, 4) === 'pong') {
      shadowsocksType = 'python';
    } else if(msgStr.substr(0, 3) === '[\n\t') {
      portsForLibev = JSON.parse(msgStr);
    } else if(msgStr.substr(0, 5) === 'stat:') {
      let flow = JSON.parse(msgStr.substr(5));
      setExistPort(flow);
      const realFlow = compareWithLastFlow(flow, lastFlow);

      const getConnectedIp = port => {
        setTimeout(() => {
          getIp(+port).then(ips => {
            ips.forEach(ip => {
              clientIp.push({ port: +port, time: Date.now(), ip });
            });
          });
        }, Math.ceil(Math.random() * 3 * 60 * 1000));
      };
      if((new Date()).getMinutes() % 3 === 0) {
        for(const rf in realFlow) {
          if(realFlow[rf]) {
            getConnectedIp(rf);
          }
        }
      }

      logger.info(`Receive flow from shadowsocks: (${ shadowsocksType })\n${JSON.stringify(realFlow, null, 2)}`);
      lastFlow = flow;
      const insertFlow = Object.keys(realFlow).map(m => {
        return {
          port: +m,
          flow: +realFlow[m],
          time: Date.now(),
        };
      }).filter(f => {
        return f.flow > 0;
      });
      const accounts = await knex('account').select();
      if(shadowsocksType === 'python') {
        insertFlow.forEach(fe => {
          const account = accounts.filter(f => {
            return fe.port === f.port;
          })[0];
          if(!account) {
            sendMessage(`remove: {"server_port": ${ fe.port }}`);
          }
        });
      } else {
        portsForLibev.forEach(async f => {
          const account = accounts.filter(a => a.port === +f.server_port)[0];
          if(!account) {
            await sendMessage(`remove: {"server_port": ${ f.server_port }}`);
          } else if (account.password !== f.password) {
            await sendMessage(`remove: {"server_port": ${ f.server_port }}`);
            await sendMessage(`add: {"server_port": ${ account.port }, "password": "${ account.password }"}`);
          } else if (account.method && account.method !== f.method) {
            await sendMessage(`remove: {"server_port": ${ f.server_port }}`);
            await sendMessage(`add: {"server_port": ${ account.port }, "password": "${ account.password }"}`);
          }
        });
      }
      if(insertFlow.length > 0) {
        if(firstFlow) {
          firstFlow = false;
        } else {
          const insertPromises = [];
          for(let i = 0; i < Math.ceil(insertFlow.length/50); i++) {
            const insert = knex('flow').insert(insertFlow.slice(i * 50, i * 50 + 50));
            insertPromises.push(insert);
          }
          Promise.all(insertPromises).then();
        }
      }
    };
  });

  client.on('error', err => {
    logger.error(`client error: `, err);
  });
  client.on('close', () => {
    logger.error(`client close`);
  });
};

const sendMessage = (message) => {
  const randomTraceNumber = Math.random().toString().substr(2,6);
  // logger.info(`[${ randomTraceNumber }] Send to shadowsocks: ${ message }`);
  client.send(message, port, host);
  return Promise.resolve('ok');
};

const startUp = async () => {
  client.send(new Buffer('ping'), port, host);
  if(config.runShadowsocks === 'python') {
    sendMessage(`remove: {"server_port": 65535}`);
  }
  const accounts = await knex('account').select([ 'port', 'password' ]);
  accounts.forEach(f => {
    sendMessage(`add: {"server_port": ${ f.port }, "password": "${ f.password }"}`);
  });
};

const resend = async () => {
  if(Date.now() - existPortUpdatedAt >= 180 * 1000) {
    existPort = [];
  }
  const accounts = await knex('account').select([ 'port', 'password' ]);
  accounts.forEach(f => {
    if(existPort.indexOf(f.port) < 0) {
      sendMessage(`add: {"server_port": ${ f.port }, "password": "${ f.password }"}`);
    }
  });
};

const compareWithLastFlow = (flow, lastFlow) => {
  if(shadowsocksType === 'python') {
    return flow;
  }
  const realFlow = {};
  if(!lastFlow) {
    for(const f in flow) {
      if(flow[f] <= 0) { delete flow[f]; }
    }
    return flow;
  }
  for(const f in flow) {
    if(lastFlow[f]) {
      realFlow[f] = flow[f] - lastFlow[f];
    } else {
      realFlow[f] = flow[f];
    }
  }
  if(Object.keys(realFlow).map(m => realFlow[m]).sort((a, b) => a > b)[0] < 0) {
    return flow;
  }
  for(const r in realFlow) {
    if(realFlow[r] <= 0) { delete realFlow[r]; }
  }
  return realFlow;
};

connect();
startUp();
cron.minute(() => {
  resend();
  sendPing();
  getGfwStatus();
}, 1);

const checkPortRange = (port) => {
  if(!config.shadowsocks.portRange) { return true; }
  const portRange = config.shadowsocks.portRange.split(',');
  let isInRange = false;
  portRange.forEach(f => {
    if(f.indexOf('-') >= 0) {
      const range = f.trim().split('-');
      if(port >= +range[0] && port <= +range[1]) {
        isInRange = true;
      }
    } else if (port === +f) {
      isInRange = true;
    }
  });
  return isInRange;
};

const addAccount = async (port, password) => {
  try {
    if(!checkPortRange(port)) {
      return Promise.reject('error');
    }
    const insertAccount = await knex('account').insert({
      port,
      password,
    });
    await sendMessage(`add: {"server_port": ${ port }, "password": "${ password }"}`);
    return { port, password };
  } catch(err) {
    return Promise.reject('error');
  }
};

const removeAccount = async (port) => {
  try {
    const deleteAccount = await knex('account').where({
      port,
    }).delete();
    if(deleteAccount <= 0) {
      return Promise.reject('error');
    }
    await knex('flow').where({
      port,
    }).delete();
    await sendMessage(`remove: {"server_port": ${ port }}`);
    return { port };
  } catch(err) {
    return Promise.reject('error');
  }
};

const changePassword = async (port, password) => {
  try {
    const updateAccount = await knex('account').where({port}).update({
      password,
    });
    if(updateAccount <= 0) {
      return Promise.reject('error');
    }
    await sendMessage(`remove: {"server_port": ${ port }}`);
    await sendMessage(`add: {"server_port": ${ port }, "password": "${ password }"}`);
    return { port, password };
  } catch(err) {
    return Promise.reject('error');
  }
};

const listAccount = async () => {
  try {
    const accounts = await knex('account').select([ 'port', 'password' ]);
    return accounts;
  } catch(err) {
    return Promise.reject('error');
  }
};

const getFlow = async (options) => {
  try {
    const startTime = moment(options.startTime || new Date(0)).toDate().getTime();
    const endTime = moment(options.endTime || new Date()).toDate().getTime();

    const accounts = await knex('account').select([ 'port' ]);
    const flows = await knex('flow').select([ 'port' ])
    .sum('flow as sumFlow').groupBy('port')
    .whereBetween('time', [ startTime, endTime ]);
    accounts.map(m => {
      const flow = flows.filter(f => {
        return f.port === m.port;
      })[0];
      if(flow) {
        m.sumFlow = flow.sumFlow;
      } else {
        m.sumFlow = 0;
      }
      return m;
    });
    if(options.clear) {
      await knex('flow').whereBetween('time', [ startTime, endTime ]).delete();
    }
    return accounts;
  } catch(err) {
    logger.error(err);
    return Promise.reject('error');
  }
};

let isGfw = 0;
let getGfwStatusTime = null;
const getGfwStatus = () => {
  if(getGfwStatusTime && isGfw === 0 && Date.now() - getGfwStatusTime < 600 * 1000) { return; }
  getGfwStatusTime = Date.now();
  const sites = [
    'baidu.com:80',
  ];
  const site = sites[+Math.random().toString().substr(2) % sites.length];
  const req = http.request({
    hostname: site.split(':')[0],
    port: +site.split(':')[1],
    path: '/',
    method: 'GET',
    timeout: 2000,
  }, res => {
    if(res.statusCode === 200) {
      isGfw = 0;
    }
    res.setEncoding('utf8');
    res.on('data', (chunk) => {});
    res.on('end', () => {});
  });
  req.on('timeout', () => {
    req.abort();
    isGfw += 1;
  });
  req.on('error', (e) => {
    isGfw += 1;
  });
  req.end();
};

const getVersion = () => {
  return {
    version,
    isGfw: !!(isGfw > 5),
  };
};

const getIp = port => {
  const cmd = `ss -an | grep ":${ port } " | grep ESTAB | awk '{print $6}' | cut -d: -f1 | grep -v 127.0.0.1 | uniq -d`;
  return new Promise((resolve, reject) => {
    exec(cmd, function(err, stdout, stderr){
      if(err) {
        reject(stderr);
      } else {
        const result = [];
        stdout.split('\n').filter(f => f).forEach(f => {
          if(result.indexOf(f) < 0) { result.push(f); }
        });
        resolve(result);
      }
    });
  });
};

const getClientIp = port => {
  clientIp = clientIp.filter(f => {
    return Date.now() - f.time <= 15 * 60 * 1000;
  });
  const result = [];
  clientIp.filter(f => {
    return Date.now() - f.time <= 15 * 60 * 1000 && f.port === port;
  }).map(m => {
    return m.ip;
  }).forEach(f => {
    if(result.indexOf(f) < 0) { result.push(f); }
  });
  return result;
};

exports.addAccount = addAccount;
exports.removeAccount = removeAccount;
exports.changePassword = changePassword;
exports.listAccount = listAccount;
exports.getFlow = getFlow;
exports.getVersion = getVersion;
exports.getClientIp = getClientIp;
