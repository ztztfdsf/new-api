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
import { Button, Table, Modal, Form, InputNumber, Input, Tag, DatePicker } from '@douyinfe/semi-ui';
import { API, showSuccess, showError, copy } from '../../helpers';

const Invitation = () => {
  const { t } = useTranslation();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [createdCodes, setCreatedCodes] = useState([]);

  const serverAddr = window.location.origin;

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
      const expires_at = expiresAt ? Math.floor(expiresAt.getTime() / 1000) : 0;
      const res = await API.post('/api/invitation/', { count, note, expires_at });
      if (res.data.success) {
        showSuccess(t('生成成功'));
        setCreatedCodes(res.data.data || []);
        setShowCreate(false);
        setShowResult(true);
        setNote('');
        setExpiresAt(null);
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

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess(t('已复制'));
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString();
  };

  const buildLink = (code) => `${serverAddr}/register?code=${code}`;

  const columns = [
    {
      title: t('邀请链接'),
      width: 400,
      render: (_, record) => {
        const link = buildLink(record.code);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color='blue' style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</Tag>
            <Button size='small' theme='borderless' type='primary' onClick={() => copyText(link)}>
              {t('复制链接')}
            </Button>
          </span>
        );
      },
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
      title: t('状态'),
      render: (_, record) => {
        if (record.used_by) return <Tag color='light-green'>{t('已使用')}</Tag>;
        if (record.expires_at && Date.now() / 1000 > record.expires_at) return <Tag color='red'>{t('已过期')}</Tag>;
        return <Tag color='blue'>{t('有效')}</Tag>;
      },
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
        <h3 style={{ margin: 0 }}>{t('邀请链接管理')}</h3>
        <Button type='primary' onClick={() => setShowCreate(true)}>
          {t('生成邀请链接')}
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
        title={t('生成邀请链接')}
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
            style={{ width: '100%', marginBottom: 16 }}
          />
          <DatePicker
            type='dateTime'
            value={expiresAt}
            onChange={(date) => setExpiresAt(date)}
            placeholder={t('过期时间（可选，留空永不过期）')}
            label={t('过期时间')}
            style={{ width: '100%' }}
          />
        </Form>
      </Modal>

      <Modal
        title={t('邀请链接已生成')}
        visible={showResult}
        onOk={() => setShowResult(false)}
        onCancel={() => setShowResult(false)}
        okText={t('确定')}
        cancelText={t('关闭')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {createdCodes.map((item, idx) => {
            const link = buildLink(item.code);
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <Tag color='blue' size='large' style={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</Tag>
                <Button size='small' onClick={() => copyText(link)}>{t('复制链接')}</Button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default Invitation;