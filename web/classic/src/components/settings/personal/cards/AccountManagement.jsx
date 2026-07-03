/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';
import {
  Button,
  Card,
  Input,
  Space,
  Typography,
  Avatar,
  Modal,
} from '@douyinfe/semi-ui';
import {
  IconKey,
  IconLock,
  IconDelete,
} from '@douyinfe/semi-icons';
import { ShieldCheck } from 'lucide-react';
import TwoFASetting from '../components/TwoFASetting';

const AccountManagement = ({
  t,
  systemToken,
  generateAccessToken,
  handleSystemTokenClick,
  setShowChangePasswordModal,
  setShowAccountDeleteModal,
  passkeyStatus,
  passkeySupported,
  passkeyRegisterLoading,
  passkeyDeleteLoading,
  onPasskeyRegister,
  onPasskeyDelete,
}) => {
  const passkeyEnabled = passkeyStatus?.enabled;
  const lastUsedLabel = passkeyStatus?.last_used_at
    ? new Date(passkeyStatus.last_used_at).toLocaleString()
    : t('尚未使用');

  return (
    <Card className='!rounded-2xl'>
      {/* 卡片头部 */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='teal' className='mr-3 shadow-md'>
          <ShieldCheck size={16} />
        </Avatar>
        <div>
          <Typography.Text className='text-lg font-medium'>
            {t('安全设置')}
          </Typography.Text>
          <div className='text-xs text-gray-600'>
            {t('密码、身份验证和账户安全')}
          </div>
        </div>
      </div>

      <div className='py-4'>
        <div className='space-y-6'>
          <Space vertical className='w-full'>
            {/* 系统访问令牌 */}
            <Card className='!rounded-xl w-full'>
              <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                <div className='flex items-start w-full sm:w-auto'>
                  <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0'>
                    <IconKey size='large' className='text-slate-600' />
                  </div>
                  <div className='flex-1'>
                    <Typography.Title heading={6} className='mb-1'>
                      {t('系统访问令牌')}
                    </Typography.Title>
                    <Typography.Text type='tertiary' className='text-sm'>
                      {t('用于API调用的身份验证令牌，请妥善保管')}
                    </Typography.Text>
                    {systemToken && (
                      <div className='mt-3'>
                        <Input
                          readonly
                          value={systemToken}
                          onClick={handleSystemTokenClick}
                          size='large'
                          prefix={<IconKey />}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type='primary'
                  theme='solid'
                  onClick={generateAccessToken}
                  className='!bg-slate-600 hover:!bg-slate-700 w-full sm:w-auto'
                  icon={<IconKey />}
                >
                  {systemToken ? t('重新生成') : t('生成令牌')}
                </Button>
              </div>
            </Card>

            {/* 密码管理 */}
            <Card className='!rounded-xl w-full'>
              <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                <div className='flex items-start w-full sm:w-auto'>
                  <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0'>
                    <IconLock size='large' className='text-slate-600' />
                  </div>
                  <div>
                    <Typography.Title heading={6} className='mb-1'>
                      {t('密码管理')}
                    </Typography.Title>
                    <Typography.Text type='tertiary' className='text-sm'>
                      {t('定期更改密码可以提高账户安全性')}
                    </Typography.Text>
                  </div>
                </div>
                <Button
                  type='primary'
                  theme='solid'
                  onClick={() => setShowChangePasswordModal(true)}
                  className='!bg-slate-600 hover:!bg-slate-700 w-full sm:w-auto'
                  icon={<IconLock />}
                >
                  {t('修改密码')}
                </Button>
              </div>
            </Card>

            {/* Passkey 设置 */}
            <Card className='!rounded-xl w-full'>
              <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                <div className='flex items-start w-full sm:w-auto'>
                  <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0'>
                    <IconKey size='large' className='text-slate-600' />
                  </div>
                  <div>
                    <Typography.Title heading={6} className='mb-1'>
                      {t('Passkey 登录')}
                    </Typography.Title>
                    <Typography.Text type='tertiary' className='text-sm'>
                      {passkeyEnabled
                        ? t('已启用 Passkey，无需密码即可登录')
                        : t('使用 Passkey 实现免密且更安全的登录体验')}
                    </Typography.Text>
                    <div className='mt-2 text-xs text-gray-500 space-y-1'>
                      <div>
                        {t('最后使用时间')}：{lastUsedLabel}
                      </div>
                      {!passkeySupported && (
                        <div className='text-amber-600'>
                          {t('当前设备不支持 Passkey')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type={passkeyEnabled ? 'danger' : 'primary'}
                  theme='solid'
                  onClick={
                    passkeyEnabled
                      ? () => {
                          Modal.confirm({
                            title: t('确认解绑 Passkey'),
                            content: t(
                              '解绑后将无法使用 Passkey 登录，确定要继续吗？',
                            ),
                            okText: t('确认解绑'),
                            cancelText: t('取消'),
                            okType: 'danger',
                            onOk: onPasskeyDelete,
                          });
                        }
                      : onPasskeyRegister
                  }
                  className={`w-full sm:w-auto ${passkeyEnabled ? '!bg-slate-500 hover:!bg-slate-600' : ''}`}
                  icon={<IconKey />}
                  disabled={!passkeySupported && !passkeyEnabled}
                  loading={
                    passkeyEnabled
                      ? passkeyDeleteLoading
                      : passkeyRegisterLoading
                  }
                >
                  {passkeyEnabled ? t('解绑 Passkey') : t('注册 Passkey')}
                </Button>
              </div>
            </Card>

            {/* 两步验证设置 */}
            <TwoFASetting t={t} />

            {/* 危险区域 */}
            <Card className='!rounded-xl w-full'>
              <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                <div className='flex items-start w-full sm:w-auto'>
                  <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0'>
                    <IconDelete size='large' className='text-slate-600' />
                  </div>
                  <div>
                    <Typography.Title
                      heading={6}
                      className='mb-1 text-slate-700'
                    >
                      {t('删除账户')}
                    </Typography.Title>
                    <Typography.Text type='tertiary' className='text-sm'>
                      {t('此操作不可逆，所有数据将被永久删除')}
                    </Typography.Text>
                  </div>
                </div>
                <Button
                  type='danger'
                  theme='solid'
                  onClick={() => setShowAccountDeleteModal(true)}
                  className='w-full sm:w-auto !bg-slate-500 hover:!bg-slate-600'
                  icon={<IconDelete />}
                >
                  {t('删除账户')}
                </Button>
              </div>
            </Card>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default AccountManagement;