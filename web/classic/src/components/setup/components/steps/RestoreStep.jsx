/*
Copyright (C) 2026 ztztfdsf

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

import React, { useState, useRef } from 'react';
import { Banner, Button, Toast } from '@douyinfe/semi-ui';
import { IconUpload, IconFile } from '@douyinfe/semi-icons';
import { API } from '../../../../helpers';

/**
 * 从备份恢复步骤组件
 * 可选地上传备份 JSON 文件恢复数据，或跳过全新安装
 */
const RestoreStep = ({ setupStatus, next, renderNavigationButtons, t }) => {
  const [file, setFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.json')) {
        Toast.error(t('请选择 JSON 备份文件'));
        return;
      }
      setFile(selected);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) {
      if (!dropped.name.endsWith('.json')) {
        Toast.error(t('请选择 JSON 备份文件'));
        return;
      }
      setFile(dropped);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      Toast.error(t('请先选择备份文件'));
      return;
    }

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await API.post('/api/setup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { success, message } = res.data;
      if (success) {
        Toast.success(t('备份恢复成功！'));
        // 跳转到登录页面
        window.location.href = '/login';
      } else {
        Toast.error(message || t('恢复失败'));
      }
    } catch (error) {
      Toast.error(t('备份恢复失败'));
    } finally {
      setRestoring(false);
    }
  };

  const handleSkip = () => {
    if (next) next();
  };

  return (
    <div className='space-y-4'>
      <div className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
        <p>{t('上传之前导出的 JSON 备份文件来恢复数据，或跳过进行全新安装。')}</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <IconUpload className='text-gray-400 mb-3' size='extra-large' />
        <p className='text-sm text-gray-500 dark:text-gray-400 mb-3'>
          {file ? file.name : t('点击选择或将 JSON 备份文件拖放到此处')}
        </p>
        <input
          ref={fileInputRef}
          type='file'
          accept='.json'
          onChange={handleFileSelect}
          className='hidden'
        />
        <Button
          theme='solid'
          type='primary'
          size='small'
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {t('选择文件')}
        </Button>
      </div>

      {file && (
        <div className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
          <IconFile className='text-blue-500' />
          <span className='text-sm flex-1 truncate'>{file.name}</span>
          <span className='text-xs text-gray-400'>
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      )}

      <div className='flex gap-3 pt-2'>
        <Button
          theme='solid'
          type='primary'
          onClick={handleRestore}
          disabled={!file || restoring}
          loading={restoring}
          style={{ flex: 1 }}
        >
          {restoring ? t('恢复中…') : t('恢复备份')}
        </Button>
        <Button
          type='secondary'
          onClick={handleSkip}
          style={{ flex: 1 }}
        >
          {t('跳过，全新安装')}
        </Button>
      </div>
    </div>
  );
};

export default RestoreStep;