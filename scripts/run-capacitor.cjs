const os = require('node:os');

// Node 26 can fail to read the account database in restricted Windows shells.
// Capacitor's terminal helper only needs a shell path, so provide the standard
// Windows fallback when userInfo() is unavailable.
const originalUserInfo = os.userInfo;
os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch {
    return { username: process.env.USERNAME || 'user', shell: process.env.COMSPEC || 'cmd.exe', homedir: os.homedir(), uid: -1, gid: -1 };
  }
};

require('../node_modules/@capacitor/cli/bin/capacitor');
