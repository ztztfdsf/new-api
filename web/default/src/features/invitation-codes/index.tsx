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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import { SectionPageLayout } from '@/components/layout'
import {
  DataTablePage,
  useDataTable,
} from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { api } from '@/lib/api'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

interface InvitationCodeItem {
  id: number
  code: string
  created_by: number
  invitee_id: number
  expires_at: number
  used_at: number
  note: string
  created_at: number
}

function formatDate(ts: number): string {
  if (ts <= 0) return '-'
  return new Date(ts * 1000).toLocaleString()
}

function getStatus(inv: InvitationCodeItem): 'available' | 'used' | 'expired' {
  if (inv.invitee_id !== 0) return 'used'
  if (inv.expires_at > 0 && Date.now() / 1000 > inv.expires_at) return 'expired'
  return 'available'
}

export function InvitationCodes() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.auth.user)
  const isSuperAdmin = user?.role === ROLE.SUPER_ADMIN

  const [page, setPage] = useState(1)
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const [count, setCount] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['invitation-codes', page],
    queryFn: async () => {
      const res = await api.get(`/api/invitation/?p=${page}&page_size=20`)
      return res.data
    },
    enabled: isSuperAdmin,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const expires = expiresAt ? new Date(expiresAt).getTime() / 1000 : 0
      const res = await api.post('/api/invitation/', {
        expires_at: expires,
        note: note || '',
        count: count,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success(t('Invitation code created successfully'))
      setExpiresAt('')
      setNote('')
      setCount(1)
      queryClient.invalidateQueries({ queryKey: ['invitation-codes'] })
    },
    onError: () => {
      toast.error(t('Failed to create invitation code'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/invitation/${id}`)
    },
    onSuccess: () => {
      toast.success(t('Invitation code deleted successfully'))
      queryClient.invalidateQueries({ queryKey: ['invitation-codes'] })
    },
  })

  const items: InvitationCodeItem[] = data?.data?.items || []
  const total = data?.data?.total || 0
  const pageSize = 20
  const pageCount = Math.ceil(total / pageSize) || 1

  const columns: ColumnDef<InvitationCodeItem>[] = [
    {
      accessorKey: 'code',
      header: t('Invitation code'),
      cell: (row) => (
        <span className='font-mono text-sm'>{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'note',
      header: t('Note'),
      cell: (row) => row.original.note || '-',
    },
    {
      id: 'status',
      header: t('Status'),
      cell: (row) => {
        const s = getStatus(row.original)
        const labels: Record<string, string> = {
          available: t('Not used'),
          used: t('Used'),
          expired: t('Expired'),
        }
        const colors: Record<string, string> = {
          available: 'bg-green-100 text-green-800',
          used: 'bg-gray-100 text-gray-800',
          expired: 'bg-red-100 text-red-800',
        }
        return (
          <span className={`rounded px-2 py-0.5 text-xs ${colors[s]}`}>
            {labels[s] || s}
          </span>
        )
      },
    },
    {
      accessorKey: 'expires_at',
      header: t('Expires'),
      cell: (row) => formatDate(row.original.expires_at),
    },
    {
      accessorKey: 'used_at',
      header: t('Used'),
      cell: (row) => formatDate(row.original.used_at),
    },
    {
      accessorKey: 'created_at',
      header: t('Created'),
      cell: (row) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => (
        <div className='flex gap-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              const link = `${window.location.origin}/sign-up?invite=${row.original.code}`
              navigator.clipboard.writeText(link)
              toast.success(t('Copy link'))
            }}
          >
            {t('Copy link')}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              if (confirm(t('Delete this invitation code?'))) {
                deleteMutation.mutate(row.original.id)
              }
            }}
          >
            {t('Delete')}
          </Button>
        </div>
      ),
    },
  ]

  const table = useDataTable<InvitationCodeItem>({
    data: items,
    columns,
    pageCount,
    pageIndex: page - 1,
    onPaginationChange: (newPage) => setPage(newPage + 1),
    totalCount: total,
    manualPagination: true,
  })

  if (!isSuperAdmin) {
    return (
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Invitation code list')}</SectionPageLayout.Title>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-muted-foreground'>{t('You do not have permission')}</p>
          </CardContent>
        </Card>
      </SectionPageLayout>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Invitation code list')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('Create invitation codes')}</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-wrap gap-3'>
              <div className='flex flex-col gap-1'>
                <Label>{t('Expiration date (optional)')}</Label>
                <Input
                  type='datetime-local'
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className='w-56'
                />
              </div>
              <div className='flex flex-col gap-1'>
                <Label>{t('Note (optional)')}</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className='w-40'
                />
              </div>
              <div className='flex flex-col gap-1'>
                <Label>{t('Quantity')}</Label>
                <Input
                  type='number'
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className='w-20'
                />
              </div>
              <div className='flex items-end'>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? t('Creating…') : t('Create')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <DataTablePage
            table={table}
            columns={columns}
            isLoading={isLoading || createMutation.isPending || deleteMutation.isPending}
            emptyTitle={t('No invitation codes')}
            emptyDescription={t('Create your first invitation code above')}
          />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
