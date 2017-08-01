require('./index');
var themePath = '/themes/linker';

// var themePath = '';

require('./controllers/main');
require('.'+ themePath +'/controllers/home');
require('./controllers/user');
require('./controllers/admin');
require('./controllers/adminAccount');
require('./controllers/adminServer');
require('./controllers/adminUser');
require('./controllers/adminNotice');
require('./controllers/adminSetting');

require('.'+ themePath +'/routes/home');
require('./routes/user');
require('./routes/admin');

require('./filters/flow');
require('./filters/time');
require('./filters/substr');
require('./filters/orderStatus');

require('./directives/focusMe');

require('./services/preloadService.js');
require('./services/adminService.js');
require('./services/homeService.js');
require('./services/userService.js');
require('./services/dialogService.js');

require('./services/websocketService.js');

