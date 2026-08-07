import React, { useState, useMemo, useCallback } from 'react';
import { Card, Button, Typography, Tabs, TabPane } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconChevronRight } from '@douyinfe/semi-icons';
import { PieChart } from 'lucide-react';
import { VChart } from '@visactor/react-vchart';
import { timestamp2string } from '../../helpers';

const { Text } = Typography;

const ChartsPanel = ({
  spec_line,
  spec_pie,
  spec_user_consume,
  isAdminUser,
  CARD_PROPS,
  CHART_CONFIG,
  FLEX_CENTER_GAP2,
  hasApiInfoPanel,
  handleInputChange,
  inputs,
  loadData,
  t,
}) => {
  // 当前激活的 tab
  const [activeTab, setActiveTab] = useState('consume');

  // 日期导航
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return d;
  });

  const dateStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  const isToday =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();

  const updateDateRange = useCallback((date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 0);

    const startTs = timestamp2string(dayStart.getTime() / 1000);
    const endTs = timestamp2string(dayEnd.getTime() / 1000);

    handleInputChange(startTs, 'start_timestamp');
    handleInputChange(endTs, 'end_timestamp');
  }, [handleInputChange]);

  const goPrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
    updateDateRange(prev);
  };

  const goNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    if (next <= today) {
      setCurrentDate(next);
      updateDateRange(next);
    }
  };

  const goToday = () => {
    const d = new Date();
    setCurrentDate(d);
    updateDateRange(d);
  };

  return (
    <Card
      {...CARD_PROPS}
      className={`!rounded-2xl ${hasApiInfoPanel ? 'lg:col-span-3' : ''}`}
      title={
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between w-full gap-3'>
          <div className={FLEX_CENTER_GAP2}>
            <PieChart size={16} />
            {t('模型数据分析')}
          </div>
          <Tabs
            type='slash'
            activeKey={activeTab}
            onChange={setActiveTab}
          >
            <TabPane tab={<span>{t('模型消耗')}</span>} itemKey='consume' />
            <TabPane tab={<span>{t('每日报告')}</span>} itemKey='report' />
          </Tabs>
        </div>
      }
      bodyStyle={{ padding: 0 }}
    >
      {activeTab === 'consume' ? (
        /* ===== 模型消耗：消耗分布柱状图（时间颗粒度天） ===== */
        <div className='h-96 p-2'>
          <VChart spec={spec_line} option={CHART_CONFIG} />
        </div>
      ) : (
        /* ===== 每日报告：日期导航 + 两个环形图 ===== */
        <div>
          {/* 日期导航 */}
          <div className='flex items-center justify-center gap-3 pt-4 pb-2'>
            <Button
              icon={<IconChevronLeft />}
              size='small'
              theme='borderless'
              onClick={goPrevDay}
            />
            <Button
              size='small'
              theme='borderless'
              onClick={goToday}
              type={isToday ? 'primary' : 'tertiary'}
            >
              <Text
                strong
                style={{
                  fontSize: 16,
                  minWidth: 100,
                  textAlign: 'center',
                }}
              >
                {dateStr}
              </Text>
            </Button>
            <Button
              icon={<IconChevronRight />}
              size='small'
              theme='borderless'
              onClick={goNextDay}
              disabled={isToday}
            />
          </div>

          {/* 两个环形图 */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 p-2'>
            <div className='h-72'>
              <VChart spec={spec_pie} option={CHART_CONFIG} />
            </div>
            <div className='h-72'>
              <VChart spec={spec_user_consume} option={CHART_CONFIG} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChartsPanel;