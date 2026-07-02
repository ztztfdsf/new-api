const fs = require('fs');
const path = require('path');

const classicDir = 'D:/- 酒馆/反向代理/new-api/web/classic/src';

// 1. Fix UserArea.jsx - remove topup dropdown item
let ua = fs.readFileSync(path.join(classicDir, 'components/layout/headerbar/UserArea.jsx'), 'utf8');
ua = ua.replace(
  `<Dropdown.Item\n                onClick={() => {\n                  navigate('/console/topup');\n                }}\n                className='!px-3 !py-1.5 !text-sm !text-semi-color-text-0 hover:!bg-semi-color-fill-1 dark:!text-gray-200 dark:hover:!bg-blue-500 dark:hover:!text-white'\n              >\n                <div className='flex items-center gap-2'>\n                  <IconCreditCard\n                    size='small'\n                    className='text-gray-500 dark:text-gray-400'\n                  />\n                  <span>{t('钱包管理')}</span>\n                </div>\n              </Dropdown.Item>\n              `,
  ''
);
fs.writeFileSync(path.join(classicDir, 'components/layout/headerbar/UserArea.jsx'), ua, 'utf8');
console.log('Fixed UserArea.jsx');

// 2. Fix PageLayout.jsx - remove redemption/midjourney/task paths
let pl = fs.readFileSync(path.join(classicDir, 'components/layout/PageLayout.jsx'), 'utf8');
pl = pl.replace("'/console/redemption',\n", '');
pl = pl.replace("'/console/midjourney',\n", '');
pl = pl.replace("'/console/task',\n", '');
fs.writeFileSync(path.join(classicDir, 'components/layout/PageLayout.jsx'), pl, 'utf8');
console.log('Fixed PageLayout.jsx');

// 3. Fix SiderBar.jsx routerMap - remove deleted entries
let sb = fs.readFileSync(path.join(classicDir, 'components/layout/SiderBar.jsx'), 'utf8');
sb = sb.replace("  redemption: '/console/redemption',\n", '');
sb = sb.replace("  topup: '/console/topup',\n", '');
sb = sb.replace("  subscription: '/console/subscription',\n", '');
sb = sb.replace("  midjourney: '/console/midjourney',\n", '');
sb = sb.replace("  task: '/console/task',\n", '');
sb = sb.replace("  models: '/console/models',\n", '');
sb = sb.replace("  deployment: '/console/deployment',\n", '');
fs.writeFileSync(path.join(classicDir, 'components/layout/SiderBar.jsx'), sb, 'utf8');
console.log('Fixed SiderBar.jsx');

// 4. Fix StatCards - the topup button was already fixed, but check if Tag import is still needed
let sc = fs.readFileSync(path.join(classicDir, 'components/dashboard/StatsCards.jsx'), 'utf8');
// Check if Tag is still used after removing the topup button
const tagUses = (sc.match(/<Tag/g) || []).length;
console.log('StatsCards.jsx: Tag used ' + tagUses + ' times');

console.log('\nDone!');