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
import { ImageIcon, Trash2Icon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  PromptInputButton,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type PlaygroundInputToolsProps = {
  disabled?: boolean
  hasMessages?: boolean
  onClearMessages?: () => void
  onImageSelected?: (dataUrls: string[]) => void
}

export function PlaygroundInputTools({
  disabled,
  hasMessages = false,
  onClearMessages,
  onImageSelected,
}: PlaygroundInputToolsProps) {
  const { t } = useTranslation()
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const processFiles = (files: FileList | File[]) => {
    const readers: Promise<string>[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        toast.error(t('Please select image files only'))
        continue
      }
      readers.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      )
    }

    Promise.all(readers).then((dataUrls) => {
      if (dataUrls.length > 0) {
        onImageSelected?.(dataUrls)
      }
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processFiles(files)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (dragCounterRef.current === 1) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleClearMessages = () => {
    onClearMessages?.()
    setClearConfirmOpen(false)
    toast.success(t('Conversation cleared'))
  }

  return (
    <>
      <PromptInputTools
        className='bg-background/70 border-border/60 rounded-lg border p-1 shadow-xs'
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <PromptInputButton
                aria-label={t('Upload image')}
                className={cn(
                  'text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium',
                  isDragging && 'bg-primary/10 text-primary'
                )}
                disabled={disabled}
                variant='ghost'
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={16} />
              </PromptInputButton>
            }
          >
            <p>{t('Click to select or drag an image here')}</p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Click to select or drag an image here')}</p>
          </TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          multiple
          onChange={handleImageSelect}
          className='hidden'
        />

        <Tooltip>
          <TooltipTrigger
            render={
              <PromptInputButton
                aria-label={t('Clear chat history')}
                className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium'
                disabled={disabled || !hasMessages || !onClearMessages}
                onClick={() => setClearConfirmOpen(true)}
                variant='ghost'
              >
                <Trash2Icon size={16} />
              </PromptInputButton>
            }
          >
            <p>{t('Clear chat history')}</p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Clear chat history')}</p>
          </TooltipContent>
        </Tooltip>
      </PromptInputTools>

      <ConfirmDialog
        destructive
        desc={t(
          'All playground messages saved in this browser will be removed. This cannot be undone.'
        )}
        confirmText={t('Clear')}
        handleConfirm={handleClearMessages}
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title={t('Clear chat history?')}
      />
    </>
  )
}
