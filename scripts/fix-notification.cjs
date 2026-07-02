const fs = require('fs');
const fp = 'D:/- 酒馆/反向代理/new-api/web/classic/src/components/settings/personal/cards/NotificationSettings.jsx';
let c = fs.readFileSync(fp, 'utf8');
c = c.replace(
  '        { key: \'topup\', title: t(\'钱包管理\'), description: t(\'余额充值管理\') },\n',
  ''
);
c = c.replace('      topup: true,\n', '');
c = c.replace('topup: true, ', '');
fs.writeFileSync(fp, c, 'utf8');
console.log('Removed topup from NotificationSettings');
