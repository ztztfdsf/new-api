/*

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
import { VChart } from '@visactor/react-vchart'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@/context/theme-provider'
import { getDashboardChartColors } from '@/features/dashboard/lib'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { VCHART_OPTION } from '@/lib/vchart'

interface DonutChartProps {
  data: QuotaDataItem[]
  loading?: boolean
}

const DONUT_COLORS = [
  '#5B8FF9',
  '#5AD8A6',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#9270CA',
  '#FF9D4D',
  '#269A99',
  '#FF99C3',
  '#5D7092',
]

function buildDonutSpec(params: {
  values: Array<{ type: string; value: number }>
  titleText: string
  colors: string[]
}): Record<string, unknown> {
  const { values, titleText, colors } = params

  if (values.length === 0) {
    return {
      type: 'pie',
      data: [{ id: 'id0', values: [] }],
      outerRadius: 0.8,
      innerRadius: 0.5,
      padAngle: 0.6,
      valueField: 'value',
      categoryField: 'type',
      title: {
        visible: true,
        text: titleText,
        subtext: 'No data available',
      },
      legends: { visible: true, orient: 'left' },
      label: { visible: false },
      tooltip: { mark: { content: [] } },
      background: { fill: 'transparent' },
    }
  }

  const color = {
    type: 'ordinal' as const,
    domain: values.map((v) => v.type),
    range: colors,
  }

  return {
    type: 'pie',
    data: [{ id: 'id0', values }],
    outerRadius: 0.8,
    innerRadius: 0.5,
    padAngle: 0.6,
    valueField: 'value',
    categoryField: 'type',
    title: {
      visible: true,
      text: titleText,
    },
    legends: { visible: true, orient: 'left' },
    label: { visible: true },
    color,
    pie: {
      style: {},
      state: {
        hover: { outerRadius: 0.85, stroke: '#000', lineWidth: 1 },
        selected: { outerRadius: 0.85, stroke: '#000', lineWidth: 1 },
      },
    },
    tooltip: {
      mark: {
        content: [
          {
            key: (datum: Record<string, unknown>) => datum?.type,
            value: (datum: Record<string, unknown>) =>
              typeof datum?.value === 'number'
                ? datum.value.toLocaleString()
                : String(datum?.value ?? ''),
          },
        ],
      },
    },
    background: { fill: 'transparent' },
    animation: true,
  }
}

export function DonutChartsSection(props: DonutChartProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const loading = props.loading ?? false
  const data = props.data ?? []

  const modelDonutSpec = useMemo(() => {
    if (loading || data.length === 0) {
      return buildDonutSpec({
        values: [],
        titleText: t('Call Count Distribution'),
        colors: DONUT_COLORS,
      })
    }

    const modelTotals = new Map<string, number>()
    data.forEach((item) => {
      const model = item.model_name || 'Unknown'
      const count = Number(item.count) || 0
      modelTotals.set(model, (modelTotals.get(model) || 0) + count)
    })

    const values = Array.from(modelTotals.entries())
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value)

    const colors = getDashboardChartColors(values.length)

    return buildDonutSpec({
      values,
      titleText: t('Call Count Distribution'),
      colors,
    })
  }, [data, loading, t])

  const userDonutSpec = useMemo(() => {
    if (loading || data.length === 0) {
      return buildDonutSpec({
        values: [],
        titleText: t('User Consumption Ranking'),
        colors: DONUT_COLORS,
      })
    }

    const userTotals = new Map<string, number>()
    data.forEach((item) => {
      const username = item.username || 'unknown'
      const quota = Number(item.quota) || 0
      userTotals.set(username, (userTotals.get(username) || 0) + quota)
    })

    const values = Array.from(userTotals.entries())
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value)

    const colors = getDashboardChartColors(values.length)

    return buildDonutSpec({
      values,
      titleText: t('User Consumption Ranking'),
      colors,
    })
  }, [data, loading, t])

  const emptyMessage = t('No data available')

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      <DonutChartPanel
        title={t('Call Count Distribution')}
        spec={modelDonutSpec}
        theme={resolvedTheme}
        emptyMessage={emptyMessage}
      />
      <DonutChartPanel
        title={t('User Consumption Ranking')}
        spec={userDonutSpec}
        theme={resolvedTheme}
        emptyMessage={emptyMessage}
      />
    </div>
  )
}

function DonutChartPanel(props: {
  title: string
  spec: Record<string, unknown>
  theme: string
  emptyMessage: string
}) {
  const { title, spec, theme, emptyMessage } = props
  const isEmpty =
    Array.isArray((spec.data as Array<{ id: string; values: unknown[] }>)?.[0]
      ?.values) &&
    (spec.data as Array<{ id: string; values: unknown[] }>)[0].values.length === 0

  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='border-b px-3 py-2 sm:px-5 sm:py-3'>
        <div className='text-sm font-semibold'>{title}</div>
      </div>
      <div className='h-[280px] p-1.5 sm:h-80 sm:p-2'>
        {!isEmpty && (
          <VChart
            spec={{
              ...spec,
              theme: theme === 'dark' ? 'dark' : 'light',
              background: 'transparent',
            }}
            option={VCHART_OPTION}
          />
        )}
        {isEmpty && (
          <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}
