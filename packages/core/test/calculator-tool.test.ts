import { describe, expect, it } from 'bun:test'
import { selectTools } from '../src/tool/capability-router.js'
import { calculateArithmetic, calculatorTool } from '../src/tool/built-in/calculator.js'
import { ToolRegistry } from '../src/tool/registry.js'

const context = { sessionId: 'test', workdir: process.cwd(), signal: new AbortController().signal }

describe('calculator tool', () => {
  it('performs precise decimal arithmetic without a financial formula', () => {
    expect(calculateArithmetic({ operation: 'add', operands: ['0.1', '0.2'] })).toBe('0.3')
    expect(calculateArithmetic({ operation: 'divide', operands: ['1000', '3'] })).toBe('333.333333333333')
    expect(calculateArithmetic({ operation: 'power', operands: ['1.05', '2'] })).toBe('1.1025')
  })

  it('rejects invalid arithmetic loudly', () => {
    expect(() => calculateArithmetic({ operation: 'divide', operands: ['10', '0'] })).toThrow('Cannot divide')
    expect(() => calculateArithmetic({ operation: 'power', operands: ['2', '3', '4'] })).toThrow('exactly two')
  })

  it('returns an auditable calculator result to the agent', async () => {
    const result = await calculatorTool.execute({ operation: 'multiply', operands: ['125', '0.18'] }, context)

    expect(result.error).toBeUndefined()
    expect(JSON.parse(result.output)).toMatchObject({ operation: 'multiply', result: '22.5', precision: { decimalPlaces: 12, rounding: 'half_up' } })
  })

  it('does not expose the removed financial-formula tool to agents', () => {
    expect(ToolRegistry.get('calculator')).toBe(calculatorTool)
    expect(ToolRegistry.get('finance_calculate')).toBeUndefined()
  })

  it('routes finance conversations to the calculator instead of a formula tool', () => {
    const selection = selectTools({
      text: 'Calculate the return on this tahvil investment',
      availableToolIds: ['read', 'grep', 'calculator'],
    })

    expect(selection.selectedToolIds).toContain('calculator')
    expect(selection.selectedToolIds).not.toContain('finance_calculate')
  })
})
