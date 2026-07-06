import { Settings2 } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '../../../utils/tw'
import { VOROFORCE_PRESET } from '../../../vf'
import { PRESET_ITEMS } from '../../../vf/consts'
import { Selector, type SelectorItems } from '../selector'

type NoArray<T> = T extends Array<unknown> ? never : T

const processPresetItem = (
  presetItem: NoArray<(typeof PRESET_ITEMS)[number]>,
) => ({
  label: (
    <>
      {presetItem.videoSrc && (
        <video
          className='absolute inset-0 h-full w-full object-cover object-center'
          playsInline
          autoPlay
          muted
          controls={false}
          loop
        >
          <source src={presetItem.videoSrc} type='video/webm' />
        </video>
      )}
      {presetItem.imgSrc && (
        <img
          className='absolute inset-0 h-full w-full object-cover object-center'
          src={presetItem.imgSrc}
          alt={presetItem.name}
        />
      )}
      <div className='relative z-2'>{presetItem.name}</div>
    </>
  ),
  value: presetItem.id,
})

export function PresetSelector({
  className = '',
  value,
  onValueChange,
}: {
  className?: string
  value?: VOROFORCE_PRESET
  onValueChange: (value: VOROFORCE_PRESET) => void
}) {
  const presetItems: SelectorItems = useMemo(() => {
    return PRESET_ITEMS.filter(
      (presetItem) =>
        Array.isArray(presetItem) || presetItem.id !== VOROFORCE_PRESET.mobile,
    ).map((presetItem) =>
      Array.isArray(presetItem)
        ? presetItem.map(processPresetItem)
        : processPresetItem(presetItem),
    )
  }, [])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className='flex items-end gap-4'>
        <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 leading-none dark:text-white'>
          <Settings2 className='h-5 w-5 text-zinc-900 dark:text-white' />
          Preset
        </div>
      </div>
      <Selector
        itemClassName='text-white light:bg-foreground max-lg:landscape:py-1'
        itemBgClassName='z-1'
        defaultValue={value}
        onValueChange={(value) => {
          onValueChange(value as VOROFORCE_PRESET)
        }}
        items={presetItems}
      />
    </div>
  )
}
