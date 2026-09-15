import { describe, expect, it } from 'vitest'
import {
  answer,
  hhcroScript,
  isComplete,
  currentNode,
  startCall,
  type ScriptState,
} from '../src/script/index'
import {
  mandatoryCheckpoints,
  prohibitedStatements,
  scanTranscript,
  scoreCall,
} from '../src/compliance/index'

function through(state: ScriptState): ScriptState {
  let s = state
  while (!isComplete(s)) {
    const node = currentNode(hhcroScript, s)
    if (!node || node.kind !== 'statement') break
    s = answer(hhcroScript, s, {}, 0)
  }
  return s
}

/** A clean qualified call that hits every mandatory checkpoint. */
function qualifiedCall(): ScriptState {
  let s = through(startCall(hhcroScript, 0))
  for (const id of ['no', 'no', 'below', 'yes']) {
    s = answer(hhcroScript, s, { optionId: id }, 0)
  }
  s = through(s)
  for (const id of ['yes', 'detached', '3', 'loft', 'below', 'no', 'yes', 'yes', 'no', 'yes']) {
    s = answer(hhcroScript, s, { optionId: id }, 0)
  }
  s = through(s)
  s = answer(hhcroScript, s, { value: 'Morning' }, 0)
  s = answer(hhcroScript, s, { value: '07700 900123' }, 0)
  s = answer(hhcroScript, s, { value: 'Blue' }, 0)
  return through(s)
}

/** A call terminated at the last eligibility gate. */
function ineligibleCall(): ScriptState {
  let s = through(startCall(hhcroScript, 0))
  for (const id of ['no', 'no', 'below', 'no', 'no', 'no', 'no', 'no', 'no']) {
    s = answer(hhcroScript, s, { optionId: id }, 0)
  }
  return s
}

describe('scoring a qualified call', () => {
  it('scores 100 and is billable', () => {
    const result = scoreCall(qualifiedCall())
    expect(result.score).toBe(100)
    expect(result.billable).toBe(true)
    expect(result.missedCritical).toEqual([])
    expect(result.summary).toContain('billable lead')
  })

  it('marks every mandatory checkpoint as met', () => {
    const result = scoreCall(qualifiedCall())
    expect(result.checkpoints.every((c) => c.met)).toBe(true)
    expect(result.checkpoints).toHaveLength(mandatoryCheckpoints.length)
  })
})

describe('scoring a terminated call', () => {
  it('is never billable, whatever the score', () => {
    const result = scoreCall(ineligibleCall())
    expect(result.billable).toBe(false)
    expect(result.summary).toContain('terminated ineligible')
  })
})

describe('missing mandatory checkpoints', () => {
  it('makes an otherwise qualified lead unbillable', () => {
    // The document is explicit: leads missing the MUSTs cannot be presented
    // as billable. Simulate a call that skipped the password step.
    const state = qualifiedCall()
    const tampered: ScriptState = {
      ...state,
      checkpointsReached: state.checkpointsReached.filter(
        (c) => c !== 'password_agreed',
      ),
    }
    const result = scoreCall(tampered)
    expect(result.billable).toBe(false)
    expect(result.score).toBeLessThan(100)
    expect(result.missedCritical.map((c) => c.key)).toEqual(['password_agreed'])
    expect(result.summary).toContain('NOT billable')
  })

  it('weights a major miss less heavily than a critical one', () => {
    const state = qualifiedCall()
    const missMajor = scoreCall({
      ...state,
      checkpointsReached: state.checkpointsReached.filter((c) => c !== 'best_time'),
    })
    const missCritical = scoreCall({
      ...state,
      checkpointsReached: state.checkpointsReached.filter(
        (c) => c !== 'interest_level',
      ),
    })
    expect(missMajor.score).toBeGreaterThan(missCritical.score)
    // A major miss alone does not block billing; a critical one does.
    expect(missMajor.billable).toBe(true)
    expect(missCritical.billable).toBe(false)
  })
})

describe('prohibited statement detection', () => {
  it('flags a claim of government authority', () => {
    const hits = scanTranscript(
      'Good morning, we are calling on behalf of the government to advise you about a grant.',
    )
    expect(hits.map((h) => h.id)).toContain('calling_on_behalf_of_government')
    expect(hits[0]?.insteadSay).toBeTruthy()
  })

  it('flags coaching the customer to a qualifying answer', () => {
    const hits = scanTranscript(
      "You're not sure how deep it is? Shall we say that it's level with the joists then.",
    )
    expect(hits.map((h) => h.id)).toContain('coach_the_answer')
  })

  it('flags promising to clear the loft', () => {
    const hits = scanTranscript(
      'Don’t worry about the boxes, our installers will clear the loft to do the work.',
    )
    expect(hits.map((h) => h.id)).toContain('we_will_clear_loft')
  })

  it('normalises curly apostrophes so wording still matches', () => {
    const straight = scanTranscript("let's just say it is level")
    const curly = scanTranscript('let’s just say it is level')
    expect(curly.map((h) => h.id)).toEqual(straight.map((h) => h.id))
    expect(curly.length).toBe(1)
  })

  it('returns nothing for a compliant transcript', () => {
    expect(
      scanTranscript(
        'The grants for this insulation work are being funded by the utility ' +
          'companies, for example Eon or British Gas, as part of a government ' +
          'backed energy saving initiative.',
      ),
    ).toEqual([])
  })

  it('raises the call for review without auto-failing billability', () => {
    // Transcription is lossy, so a phrase hit flags for a human rather than
    // overriding the structural result.
    const result = scoreCall(qualifiedCall(), {
      transcript: 'we are calling on behalf of the government today',
    })
    expect(result.requiresReview).toBe(true)
    expect(result.billable).toBe(true)
    expect(result.summary).toContain('flagged for review')
  })

  it('gives an excerpt with surrounding context', () => {
    const hits = scanTranscript(
      'and just so you know the grant means that you will only have to pay 20% of the final bill, alright?',
    )
    expect(hits).toHaveLength(1)
    expect(hits[0]?.excerpt).toContain('20% of the final bill')
  })
})

describe('ruleset integrity', () => {
  it('every prohibited statement has at least one detection phrase', () => {
    for (const rule of prohibitedStatements) {
      expect(rule.detect.length, rule.id).toBeGreaterThan(0)
    }
  })

  it('every mandatory checkpoint maps to a node in the script', () => {
    const inScript = new Set(
      Object.values(hhcroScript.nodes)
        .map((n) => n.checkpoint)
        .filter(Boolean),
    )
    for (const c of mandatoryCheckpoints) {
      expect(inScript.has(c.key), `checkpoint "${c.key}" has no script node`).toBe(true)
    }
  })

  it('rule ids are unique', () => {
    const ids = prohibitedStatements.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
