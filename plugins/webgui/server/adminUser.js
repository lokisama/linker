const user = appRequire('plugins/user/index');

exports.getUsers = (req, res) => {
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 20;
  const search = req.query.search || '';
  const sort = req.query.sort || 'id_asc';
  const type = req.query.type || ['normal'];
  const group = req.adminInfo.id === 1 ? +req.query.group : req.adminInfo.group;
  user.getUserAndPaging({
    page,
    pageSize,
    search,
    sort,
    type,
    group,
  }).then(success => {
    success.users = success.users.map(m => {
      return {
        id: m.id,
        type: m.type,
        email: m.email,
        lastLogin: m.lastLogin,
        username: m.username,
        port: m.port,
      };
    });
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addUser = (req, res) => {
  req.checkBody('email', 'Invalid email').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('type', 'Invalid type').isIn(['normal', 'admin']);
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email;
      const password = req.body.password;
      const group = req.adminInfo.id === 1 ? 0 : req.adminInfo.group;
      const type = req.adminInfo.id === 1 ? req.body.type: 'normal' ;
      return user.add({
        username: email,
        email,
        password,
        type,
        group,
      });
    }
    result.throw();
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};