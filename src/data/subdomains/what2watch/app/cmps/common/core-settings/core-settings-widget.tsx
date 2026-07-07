import { type ReactNode, useState } from 'react'

import { useMediaQuery } from '../../../hooks/use-media-query'
import { useShallowState } from '../../../store'
import { REENTER_SESSION_KEY } from '../../../store/voroforce-slice'
import { isDefined } from '../../../utils/misc'
import { down } from '../../../utils/mq'
import { cn } from '../../../utils/tw'
import { VOROFORCE_PRESET } from '../../../vf'
import { CELL_LIMIT } from '../../../vf/consts'
import { Button, type ButtonProps } from '../../ui/button'
import { AnimateDimensionsChange } from '../animate-dimensions-change'
import { FadeTransition } from '../fade-transition'
import { CellLimitSelector } from './cell-limit-selector'
import { PresetSelector } from './preset-selector'

export function CoreSettingsWidget({
  className = '',
  onSubmit,
  submitLabel = 'Apply',
  submitProps,
  submitVisibility = 'dirty',
}: {
  className?: string
  onSubmit?: () => void
  submitLabel?: string | ReactNode
  submitProps?: ButtonProps
  submitVisibility?: 'dirty' | 'always'
}) {
  const { setStorePreset, storePreset, setStoreCellLimit, storeCellLimit } =
    useShallowState((state) => ({
      setStorePreset: state.setPreset,
      storePreset: state.preset,
      setStoreCellLimit: state.setCellLimit,
      storeCellLimit: state.cellLimit,
    }))

  const isSmallScreen = useMediaQuery(down('md'))

  const [preset, setPreset] = useState<VOROFORCE_PRESET | undefined>(
    storePreset ??
      (isSmallScreen ? VOROFORCE_PRESET.mobile : VOROFORCE_PRESET.minimal),
  )

  const [cellLimit, setCellLimit] = useState<CELL_LIMIT | undefined>(
    storeCellLimit ?? CELL_LIMIT.xxxs,
  )

  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  return (
    <AnimateDimensionsChange
      axis='height'
      className='overflow-visible'
      innerClassName={cn('flex flex-col gap-4', className)}
    >
      <PresetSelector
        className='max-md:hidden'
        value={preset}
        onValueChange={(value: VOROFORCE_PRESET) => {
          setPreset(value)
          setIsDirty(value !== storePreset || cellLimit !== storeCellLimit)
        }}
      />
      <CellLimitSelector
        className='max-md:hidden'
        value={cellLimit}
        onValueChange={(value: CELL_LIMIT) => {
          setCellLimit(value)
          setIsDirty(preset !== storePreset || value !== storeCellLimit)
        }}
      />
      <FadeTransition
        transitionOptions={{
          initialEntered: submitVisibility === 'always',
          timeout: 0,
        }}
        visible={submitVisibility === 'always' || isDirty}
      >
        <Button
          onClick={() => {
            if (isSubmitted) return
            setIsSubmitted(true)
            const newPreset = isDefined(preset)
              ? preset
              : VOROFORCE_PRESET.minimal
            setStorePreset(newPreset)
            setStoreCellLimit(
              isDefined(cellLimit) ? cellLimit : CELL_LIMIT.xxxs,
            )
            // preset/film-count changes re-init the engine via a reload;
            // flag it so the app re-enters behind the loader instead of
            // showing the Enter landing screen again
            try {
              sessionStorage.setItem(REENTER_SESSION_KEY, '1')
            } catch {}
            onSubmit?.()
          }}
          size='lg'
          disabled={
            !isSmallScreen && (!isDefined(preset) || !isDefined(cellLimit))
          }
          {...submitProps}
          className={cn(
            'w-full cursor-pointer text-lg',
            submitProps?.className,
          )}
        >
          {submitLabel}
        </Button>
      </FadeTransition>
    </AnimateDimensionsChange>
  )
}
