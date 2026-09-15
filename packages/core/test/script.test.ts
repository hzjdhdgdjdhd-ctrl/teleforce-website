import { describe, expect, it } from 'vitest'
import {
  answer,
  capturedFields,
  currentNode,
  hhcroScript,
  isComplete,
  startCall,
  validateScript,
  type ScriptState,
} from '../src/script/index'

/** Walk a list of option ids from the start, asserting each is valid. */
function walk(path: Array<string | { value: string }>): ScriptState {
  let state = through(startCall(hhcroScript, 0))
  for (const step of path) {
    state =
      typeof step === 'string'
        ? answer(hhcroScript, state, { optionId: step }, 0)
        : answer(hhcroScript, state, { value: step.value }, 0)
  }
  return state
}

/** Advance through any statement nodes sitting between questions. */
function through(state: ScriptState): ScriptState {
  let s = state
  while (!isComplete(s)) {
    const node = currentNode(hhcroScript, s)
    if (!node || node.kind !== 'statement') break
    s = answer(hhcroScript, s, {}, 0)
  }
  return s
}

describe('script integrity', () => {
  it('has no structural problems', () => {
    expect(validateScript(hhcroScript)).toEqual([])
  })

  it('starts on the introduction', () => {
    const state = startCall(hhcroScript, 0)
    expect(state.currentNodeId).toBe('intro')
    expect(state.outcome).toBe('in_progress')
  })
})

describe('step 1 — property pre-qualification', () => {
  it('terminates when both cavity and loft are already insulated', () => {
    // Source: "If we get Yes on Both Questions 1 & 2 We have to go directly
    // termination Script"
    const s = walk(['yes', 'yes'])
    expect(s.outcome).toBe('terminated_property')
    expect(isComplete(s)).toBe(true)
  })

  it('continues on cavity when the loft is done but the cavity is not', () => {
    let s = through(startCall(hhcroScript, 0))
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // cavity NOT insulated
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // loft done recently
    expect(s.outcome).toBe('in_progress')
    expect(s.leadType).toBe('cavity')
    expect(s.currentNodeId).toBe('elig1')
  })

  it('routes insulation above the joists away from a loft lead', () => {
    // Source: "If above the joist - no good for loft lead and move straight
    // on to cavity wall questions"
    let s = through(startCall(hhcroScript, 0))
    s = answer(hhcroScript, s, { optionId: 'no' }, 0)
    s = answer(hhcroScript, s, { optionId: 'no' }, 0)
    s = answer(hhcroScript, s, { optionId: 'above' }, 0)
    expect(s.leadType).toBe('cavity')
  })
})

describe('step 2 — eligibility', () => {
  const toEligibility = () => {
    let s = through(startCall(hhcroScript, 0))
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // cavity not insulated
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // loft not insulated
    s = answer(hhcroScript, s, { optionId: 'below' }, 0) // below joists
    return s
  }

  it('pension credit jumps straight to property criteria', () => {
    // Source: "If Yes jump to Property criteria questions"
    let s = toEligibility()
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0)
    expect(s.currentNodeId).toBe('prop_intro')
    expect(s.groupsSatisfied).toContain('elig1')
  })

  it('child tax credit requires the income question too', () => {
    let s = toEligibility()
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // no pension credit
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // child tax credit
    expect(s.currentNodeId).toBe('elig2_income')
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // income too high
    expect(s.currentNodeId).toBe('elig3_jsa')
  })

  it('needs one YES from check 3 Q1 before offering Q2', () => {
    let s = toEligibility()
    s = answer(hhcroScript, s, { optionId: 'no' }, 0)
    s = answer(hhcroScript, s, { optionId: 'no' }, 0)
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // no JSA
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // no ESA
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // income support
    expect(s.currentNodeId).toBe('elig3_q2')
    expect(s.groupsSatisfied).toContain('elig3.q1')
  })

  it('falls through to check 4 when check 3 Q2 has no qualifying element', () => {
    let s = toEligibility()
    for (const id of ['no', 'no', 'yes']) {
      s = answer(hhcroScript, s, { optionId: id }, 0)
    }
    s = answer(hhcroScript, s, { optionId: 'none' }, 0)
    expect(s.currentNodeId).toBe('elig4_wtc')
  })

  it('terminates when the final eligibility gate fails', () => {
    // Source: "If No, thank customer for their time and end call"
    let s = toEligibility()
    for (const id of ['no', 'no', 'no', 'no', 'no']) {
      s = answer(hhcroScript, s, { optionId: id }, 0)
    }
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // no working tax credit
    expect(s.outcome).toBe('terminated_ineligible')
  })
})

describe('step 3 — property criteria', () => {
  const qualified = () => {
    let s = through(startCall(hhcroScript, 0))
    s = answer(hhcroScript, s, { optionId: 'no' }, 0)
    s = answer(hhcroScript, s, { optionId: 'no' }, 0)
    s = answer(hhcroScript, s, { optionId: 'below' }, 0)
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // pension credit
    return through(s) // through prop_intro
  }

  it('terminates when the caller does not own the property', () => {
    let s = qualified()
    s = answer(hhcroScript, s, { optionId: 'no' }, 0)
    expect(s.outcome).toBe('terminated_property')
  })

  it('rejects flats and apartments', () => {
    let s = qualified()
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0)
    s = answer(hhcroScript, s, { optionId: 'flat' }, 0)
    expect(s.outcome).toBe('terminated_property')
  })

  it('fails the cavity on a pre-1935 build', () => {
    let s = qualified()
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0)
    s = answer(hhcroScript, s, { optionId: 'semi' }, 0)
    s = answer(hhcroScript, s, { optionId: '3' }, 0)
    s = answer(hhcroScript, s, { optionId: 'cavity' }, 0)
    s = answer(hhcroScript, s, { optionId: 'before' }, 0)
    expect(s.outcome).toBe('terminated_property')
  })

  it('moves a boarded loft onto the cavity questions', () => {
    let s = qualified()
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0)
    s = answer(hhcroScript, s, { optionId: 'detached' }, 0)
    s = answer(hhcroScript, s, { optionId: '4' }, 0)
    s = answer(hhcroScript, s, { optionId: 'loft' }, 0)
    s = answer(hhcroScript, s, { optionId: 'below' }, 0)
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // boarded
    expect(s.currentNodeId).toBe('cav_age')
    expect(s.leadType).toBe('cavity')
  })
})

describe('full qualified call', () => {
  function runQualified(): ScriptState {
    let s = through(startCall(hhcroScript, 0))
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // cavity not insulated
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // loft not insulated
    s = answer(hhcroScript, s, { optionId: 'below' }, 0) // below joists
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // pension credit
    s = through(s) // prop_intro
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // owns property
    s = answer(hhcroScript, s, { optionId: 'detached' }, 0)
    s = answer(hhcroScript, s, { optionId: '3' }, 0)
    s = answer(hhcroScript, s, { optionId: 'loft' }, 0)
    s = answer(hhcroScript, s, { optionId: 'below' }, 0)
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // not boarded
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // can be emptied
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // room to work
    s = answer(hhcroScript, s, { optionId: 'no' }, 0) // not converted
    s = answer(hhcroScript, s, { optionId: 'yes' }, 0) // interested
    s = through(s) // surveyor_reason statement
    s = answer(hhcroScript, s, { value: 'Morning' }, 0)
    s = answer(hhcroScript, s, { value: '07700 900123' }, 0)
    s = answer(hhcroScript, s, { value: 'Blue' }, 0)
    return through(s) // close
  }

  it('reaches a qualified outcome', () => {
    const s = runQualified()
    expect(s.outcome).toBe('qualified')
    expect(isComplete(s)).toBe(true)
  })

  it('collects every mandatory checkpoint', () => {
    const s = runQualified()
    expect(s.checkpointsReached).toEqual(
      expect.arrayContaining([
        'interest_level',
        'surveyor_reason',
        'alternative_number_asked',
        'password_agreed',
        'best_time',
      ]),
    )
  })

  it('captures the fields the lead record needs', () => {
    const fields = capturedFields(hhcroScript, runQualified())
    expect(fields).toEqual({
      bestTimeToCall: 'Morning',
      alternativeNumber: '07700 900123',
      password: 'Blue',
    })
  })
})

