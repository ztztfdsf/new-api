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

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Table, Modal, Form, InputNumber, Input, Tag, Space } from '@douyinfe/semi-ui';
import { API, showSuccess, showError } from '../../helpers';

const Invitation = () => {
  const { t } = useTranslation();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');

  const loadCodes = async (p = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/invitation/?page=${p}&page_size=20`);
      if (res.data.success) {
        setCodes(res.data.data.items || []);
        setTotal(res.data.data.total || 0);
        setPage(p);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(t('加载失败'));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleCreate = async () => {
    if (count <= 0) return;
    try {
      const res = await API.post('/api/invitation/', { count, note });
      if (res.data.success) {
        showSuccess(t('生成成功'));
        setShowCreate(false);
        setNote('');
        loadCodes();
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(t('生成失败'));
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await API.delete(`/api/invitation/${id}`);
      if (res.data.success) {
        showSuccess(t('删除成功'));
        loadCodes();
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(t('删除失败'));
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString();
  };

  const columns = [
    {
      title: t('邀请码'),
      dataIndex: 'code',
      render: (text) => <Tag color='blue'>{text}</Tag>,
    },
    {
      title: t('备注'),
      dataIndex: 'note',
      render: (text) => text || '-',
    },
    {
      title: t('创建时间'),
      dataIndex: 'created_at',
      render: (val) => formatTime(val),
    },
    {
      title: t('过期时间'),
      dataIndex: 'expires_at',
      render: (val) => (val ? formatTime(val) : t('永不过期')),
    },
    {
      title: t('使用人'),
      dataIndex: 'used_by',
      render: (val) => val || '-',
    },
    {
      title: t('使用时间'),
      dataIndex: 'used_at',
      render: (val) => (val ? formatTime(val) : '-'),
    },
    {
      title: t('操作'),
      render: (_, record) => (
        <Button
          type='danger'
          size='small'
          theme='borderless'
          onClick={() => handleDelete(record.id)}
        >
          {t('删除')}
        </Button>
      ),
    },
  ];

  return (
    <div className='mt-[60px] px-2'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{t('邀请码管理')}</h3>
        <Button type='primary' onClick={() => setShowCreate(true)}>
          {t('生成邀请码')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={codes}
        loading={loading}
        pagination={{
          currentPage: page,
          pageSize: 20,
          total,
          onPageChange: loadCodes,
        }}
        rowKey='id'
      />

      <Modal
        title={t('生成邀请码')}
        visible={showCreate}
        onOk={handleCreate}
        onCancel={() => setShowCreate(false)}
        okText={t('生成')}
        cancelText={t('取消')}
      >
        <Form>
          <InputNumber
            value={count}
            onChange={(v) => setCount(v || 1)}
            min={1}
            max={100}
            label={t('生成数量')}
            style={{ width: '100%', marginBottom: 16 }}
          />
          <Input
            value={note}
            onChange={(v) => setNote(v)}
            placeholder={t('备注（可选）')}
            label={t('备注')}
            style={{ width: '100%' }}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default Invitation;