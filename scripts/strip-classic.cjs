const fs = require('fs');
const path = require('path');

const classicDir = 'D:/- 酒馆/反向代理/new-api/web/classic/src';

function read(p) { return fs.readFileSync(path.join(classicDir, p), 'utf8'); }
function write(p, c) { fs.writeFileSync(path.join(classicDir, p), c, 'utf8'); console.log('  Updated: ' + p); }

// ============================================================
// 1. Sidebar: 移除钱包/订阅/模型/模型部署/兑换码/绘图日志/任务日志
// ============================================================
let sidebar = read('components/layout/SiderBar.jsx');

// Remove workspace items (绘图日志, 任务日志) from workspaceItems
sidebar = sidebar.replace(
  `{
        text: t('绘图日志'),
        itemKey: 'midjourney',
        to: '/midjourney',
        className:
          localStorage.getItem('enable_drawing') === 'true'
            ? ''
            : 'tableHiddle',
      },
      {
        text: t('任务日志'),
        itemKey: 'task',
        to: '/task',
        className:
          localStorage.getItem('enable_task') === 'true' ? '' : 'tableHiddle',
      },`,
  ''
);

// Add Invitation Codes to financeItems (after 个人设置)
sidebar = sidebar.replace(
  `{
        text: t('个人设置'),
        itemKey: 'personal',
        to: '/personal',
      },`,
  `{
        text: t('个人设置'),
        itemKey: 'personal',
        to: '/personal',
      },
      {
        text: t('邀请码'),
        itemKey: 'invitation',
        to: '/console/invitation-codes',
      },`
);

// Remove admin items: 订阅管理, 模型管理, 模型部署, 兑换码管理
sidebar = sidebar.replace(
  `{
        text: t('订阅管理'),
        itemKey: 'subscription',
        to: '/subscription',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('模型管理'),
        itemKey: 'models',
        to: '/console/models',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('模型部署'),
        itemKey: 'deployment',
        to: '/deployment',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('兑换码管理'),
        itemKey: 'redemption',
        to: '/redemption',
        className: isAdmin() ? '' : 'tableHiddle',
      },`,
  ''
);

write('components/layout/SiderBar.jsx', sidebar);

// ============================================================
// 2. App.jsx: 移除已删除页面的路由
// ============================================================
let app = read('App.jsx');

// 去掉 import
const removedImports = [
  ["import Redemption from './pages/Redemption';", ''],
  ["import TopUp from './pages/TopUp';", ''],
  ["import MjProxy from './pages/Midjourney';", ''],
  ["import Task from './pages/Task';", ''],
  ["import ModelPage from './pages/Model';", ''],
  ["import ModelDeploymentPage from './pages/ModelDeployment';", ''],
  ["import Subscription from './pages/Subscription';", ''],
];

for (const [f, t] of removedImports) {
  app = app.replace(f, t);
}

// Remove routes for deleted pages
const removedRoutes = [
  // ModelPage
  `<Route
          path='/console/models'
          element={
            <AdminRoute>
              <ModelPage />
            </AdminRoute>
          }
        />`,
  // ModelDeploymentPage
  `<Route
          path='/console/deployment'
          element={
            <AdminRoute>
              <ModelDeploymentPage />
            </AdminRoute>
          }
        />`,
  // Subscription
  `<Route
          path='/console/subscription'
          element={
            <AdminRoute>
              <Subscription />
            </AdminRoute>
          }
        />`,
  // Redemption
  `<Route
          path='/console/redemption'
          element={
            <AdminRoute>
              <Redemption />
            </AdminRoute>
          }
        />`,
  // TopUp
  `<Route
          path='/console/topup'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <TopUp />
              </Suspense>
            </PrivateRoute>
          }
        />`,
  // Midjourney
  `<Route
          path='/console/midjourney'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <MjProxy />
              </Suspense>
            </PrivateRoute>
          }
        />`,
  // Task
  `<Route
          path='/console/task'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <Task />
              </Suspense>
            </PrivateRoute>
          }
        />`,
];

for (const route of removedRoutes) {
  app = app.replace(route, '');
}

write('App.jsx', app);

// ============================================================
// 3. Setting/index.jsx: 移除绘图/支付/模型部署设置tab
// ============================================================
let setting = read('pages/Setting/index.jsx');

// Remove drawing setting tab
setting = setting.replace(
  `panes.push({
      tab: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Palette size={18} />
          {t('绘图设置')}
        </span>
      ),
      content: <DrawingSetting />,
      itemKey: 'drawing',
    });`,
  ''
);

// Remove payment setting tab
setting = setting.replace(
  `panes.push({
      tab: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CreditCard size={18} />
          {t('支付设置')}
        </span>
      ),
      content: <PaymentSetting />,
      itemKey: 'payment',
    });`,
  ''
);

// Remove model deployment setting tab
setting = setting.replace(
  `panes.push({
      tab: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Server size={18} />
          {t('模型部署设置')}
        </span>
      ),
      content: <ModelDeploymentSetting />,
      itemKey: 'model-deployment',
    });`,
  ''
);

// Remove corresponding imports
setting = setting.replace(`import DrawingSetting from '../../components/settings/DrawingSetting';\n`, '');
setting = setting.replace(`import PaymentSetting from '../../components/settings/PaymentSetting';\n`, '');
setting = setting.replace(`import ModelDeploymentSetting from '../../components/settings/ModelDeploymentSetting';\n`, '');

write('pages/Setting/index.jsx', setting);

// ============================================================
// 4. Log page: 移除绘图/任务日志段落
// ============================================================
let log = read('pages/Log/index.jsx');
// Remove midjourney/task log tabs/sections
log = log.replace(/const isMidjourney.*\n.*\n.*midjourney/gs, '');
log = log.replace(/isMidjourney\b/g, 'false');
write('pages/Log/index.jsx', log);

// ============================================================
// 5. Delete unused pages directory
// ============================================================
const pagesToDelete = [
  'pages/TopUp',
  'pages/Midjourney',
  'pages/Task',
  'pages/Subscription',
  'pages/Redemption',
  'pages/ModelDeployment',
  'pages/Model',
  'pages/Setting/Payment',
  'pages/Setting/Drawing',
  'pages/Setting/Model/SettingModelDeployment.jsx',
];

for (const p of pagesToDelete) {
  const fullP = path.join(classicDir, p);
  if (fs.existsSync(fullP)) {
    const stat = fs.statSync(fullP);
    if (stat.isDirectory()) {
      fs.rmSync(fullP, { recursive: true, force: true });
      console.log('  Removed dir: ' + p);
    } else {
      fs.unlinkSync(fullP);
      console.log('  Removed file: ' + p);
    }
  }
}

// ============================================================
// 6. Remove unused setting components
// ============================================================
const compsToDelete = [
  '../settings/DrawingSetting.jsx',
  '../settings/PaymentSetting.jsx',
  '../settings/ModelDeploymentSetting.jsx',
];

for (const p of compsToDelete) {
  const fullP = path.join('D:/- 酒馆/反向代理/new-api/web/classic/src/components', p);
  if (fs.existsSync(fullP)) {
    fs.unlinkSync(fullP);
    console.log('  Removed file: components/' + p);
  }
}

console.log('\nDone! Classic frontend stripped.');
