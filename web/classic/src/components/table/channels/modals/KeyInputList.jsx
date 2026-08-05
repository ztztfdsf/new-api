import React from 'react';
import { Button, Input, Space, Typography } from '@douyinfe/semi-ui';
import { IconPlus, IconMinusCircle } from '@douyinfe/semi-icons';

const { Text } = Typography;

const KeyInputList = ({
  keys,
  onKeysChange,
  disabled,
  isEdit,
  isMultiKeyChannel,
  keyMode,
  handleShow2FAModal,
  batchExtra,
  t,
}) => {
  const handleKeyChange = (index, value) => {
    const newKeys = [...keys];
    newKeys[index] = value;
    onKeysChange(newKeys);
  };

  const handleAddKey = () => {
    onKeysChange([...keys, '']);
  };

  const handleRemoveKey = (index) => {
    const newKeys = keys.filter((_, i) => i !== index);
    onKeysChange(newKeys.length > 0 ? newKeys : ['']);
  };

  return (
    <div className='mb-4'>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {t('密钥')}
      </Text>
      <div className='space-y-2'>
        {keys.map((key, index) => (
          <div key={index} className='flex items-center gap-2'>
            <Input
              value={key}
              onChange={(val) => handleKeyChange(index, val)}
              placeholder={t('请输入密钥')}
              disabled={disabled}
              style={{ flex: 1 }}
              autoComplete='new-password'
            />
            {keys.length > 1 && (
              <Button
                icon={<IconMinusCircle />}
                size='small'
                type='danger'
                theme='borderless'
                onClick={() => handleRemoveKey(index)}
                disabled={disabled}
              />
            )}
          </div>
        ))}
      </div>
      <div className='flex items-center gap-2 mt-2 flex-wrap'>
        <Button
          icon={<IconPlus />}
          size='small'
          type='primary'
          theme='outline'
          onClick={handleAddKey}
          disabled={disabled}
        >
          {t('添加密钥')}
        </Button>
        {isEdit && isMultiKeyChannel && keyMode === 'append' && (
          <Text type='warning' size='small'>
            {t('追加模式：新密钥将添加到现有密钥列表的末尾')}
          </Text>
        )}
        {isEdit && (
          <Button
            size='small'
            type='primary'
            theme='outline'
            onClick={handleShow2FAModal}
          >
            {t('查看密钥')}
          </Button>
        )}
        {batchExtra}
      </div>
    </div>
  );
};

export default KeyInputList;