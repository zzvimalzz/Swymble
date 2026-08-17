import { describe, expect, it } from 'vitest'
import { reloadDecision } from '../src/core/version.js'

/* The whole self-healing policy is this one function — `watchVersion()` around it is wiring, and
   there is no DOM test environment here to drive it with. See the header of `core/version.js`. */
describe('deciding whether an open tab should reload itself', () => {
  it('does nothing until a baseline has been read', () => {
    expect(reloadDecision(null, 'aaaa', true)).toBe('none')
    expect(reloadDecision(undefined, 'aaaa', true)).toBe('none')
  })

  it('does nothing while the published build is the one this tab is running', () => {
    expect(reloadDecision('aaaa', 'aaaa', true)).toBe('none')
  })

  it('does nothing when the stamp could not be read', () => {
    expect(reloadDecision('aaaa', '', true)).toBe('none')
    expect(reloadDecision('aaaa', null, true)).toBe('none')
  })

  /* The reason the feature is allowed to exist: nobody is looking, and a reload costs nothing. */
  it('reloads a stale tab that is in the background', () => {
    expect(reloadDecision('aaaa', 'bbbb', true)).toBe('reload')
  })

  /* Being yanked out of a page mid-stroke is worse than running yesterday's build for a minute. */
  it('waits rather than reloading a stale tab somebody is looking at', () => {
    expect(reloadDecision('aaaa', 'bbbb', false)).toBe('wait')
  })

  /* Two edge nodes disagreeing mid-deploy would otherwise bounce a tab between builds forever. */
  it('refuses a stamp it has already reloaded for, so a ping-pong ends at two', () => {
    expect(reloadDecision('aaaa', 'bbbb', true, ['bbbb'])).toBe('none')
    expect(reloadDecision('aaaa', 'bbbb', false, ['bbbb'])).toBe('none')
    expect(reloadDecision('bbbb', 'aaaa', true, ['bbbb'])).toBe('reload')
  })
})
