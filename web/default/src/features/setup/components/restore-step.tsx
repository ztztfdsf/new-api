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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

import { restoreBackup } from '../api'

interface RestoreStepProps {
  onRestored?: () => void
}

export function RestoreStep({ onRestored }: RestoreStepProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)

  const restoreMutation = useMutation({
    mutationFn: restoreBackup,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(t('Backup restored successfully!'))
        onRestored?.()
        queryClient.invalidateQueries({ queryKey: ['setup-status'] })
      } else {
        toast.error(response.message || t('Restore failed'))
      }
    },
    onError: () => {
      toast.error(t('Failed to restore backup'))
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.name.endsWith('.json')) {
        toast.error(t('Please select a JSON backup file'))
        return
      }
      setFile(selected)
    }
  }

  const handleRestore = () => {
    if (!file) {
      toast.error(t('Please select a backup file first'))
      return
    }
    restoreMutation.mutate(file)
  }

  const handleSkip = () => {
    onRestored?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>{t('Restore from backup (optional)')}</CardTitle>
        <CardDescription>
          {t('Upload a previously exported JSON backup to restore your data, or skip to start fresh.')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8'>
          <Upload className='text-muted-foreground mb-3 h-10 w-10' />
          <p className='text-muted-foreground mb-2 text-sm'>
            {file ? file.name : t('Click to select or drag a JSON backup file here')}
          </p>
          <input
            type='file'
            accept='.json'
            onChange={handleFileChange}
            className='hidden'
            id='backup-upload'
          />
          <label htmlFor='backup-upload'>
            <Button variant='outline' size='sm' className='cursor-pointer' asChild>
              <span>{t('Select file')}</span>
            </Button>
          </label>
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={handleRestore}
            disabled={!file || restoreMutation.isPending}
            className='flex-1'
          >
            {restoreMutation.isPending ? t('Restoring…') : t('Restore backup')}
          </Button>
          <Button variant='secondary' onClick={handleSkip} className='flex-1'>
            {t('Skip, fresh install')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
