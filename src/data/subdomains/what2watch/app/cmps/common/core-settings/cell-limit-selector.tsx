import { Grid3x3Icon } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '../../../utils/tw'
import { type CELL_LIMIT, CELL_LIMIT_ITEMS } from '../../../vf/consts'
import { Selector, type SelectorItems } from '../selector'

export function CellLimitSelector({
  className = '',
  selectorClassName = '',
  selectorItemClassName = '',
  value,
  onValueChange,
}: {
  className?: string
  selectorClassName?: string
  selectorItemClassName?: string
  value?: CELL_LIMIT
  onValueChange: (value: CELL_LIMIT) => void
}) {
  const cellLimitItems: SelectorItems = useMemo(() => {
    return CELL_LIMIT_ITEMS.map((cellLimit) => ({
      label: cellLimit.label,
      value: String(cellLimit.value),
    }))
  }, [])

  return (
    <div className={cn('flex flex-col gap-4 md:flex-row', className)}>
      <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
        <Grid3x3Icon className='h-5 w-5 text-zinc-900 dark:text-white' />
        Films
      </div>
      <Selector
        className={cn('md:grow', selectorClassName)}
        itemClassName={cn(
          'flex items-center justify-center rounded-lg py-1 text-center text-sm leading-none md:text-xs xl:text-sm',
          selectorItemClassName,
        )}
        defaultValue={String(value)}
        onValueChange={(value) => {
          onValueChange(Number.parseInt(value) as CELL_LIMIT)
        }}
        items={cellLimitItems}
      />
    </div>
  )
}
