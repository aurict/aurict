import { z } from 'zod'
import { callAurictApi, describeAurictApiFailure } from './_shared/aurict-api.js'
import type { ExecuteResult, ToolContext, ToolDef } from '../types.js'

const actions = ['search', 'get_statute', 'get_unit'] as const

export const legalSearchTool: ToolDef = {
  id: 'legal_search',
  description:
    'Search and retrieve real Turkish statute text (Türk mevzuatı) from the Aurict legal service — a hierarchical article/paragraph tree with resolved cross-references between laws, sourced from mevzuat.gov.tr. This tool only retrieves text; it never interprets or gives legal advice — YOU must reason over the returned article text to answer the user, and you must always cite the specific madde/fıkra you relied on. This is not legal advice and must not be presented as such. First fetch of an uncached statute can take a few seconds (live fetch + parse). If a search or lookup returns nothing, say so honestly — do not invent a madde number or its content.',
  parameters: z.object({
    action: z.enum(actions).describe(
      "'search' — keyword search across cached statute text (requires query). 'get_statute' — fetch a statute by jurisdiction+identifier, lazily caching it if not already cached (e.g. jurisdiction=\"TR\", identifier=\"6098\" for Türk Borçlar Kanunu). 'get_unit' — fetch one unit (madde/fıkra) by its id, optionally expanding its cross-references.",
    ),
    query: z.string().optional().describe('Keyword to search for — required for "search".'),
    jurisdiction: z.string().optional().describe('e.g. "TR" — required for "search" (optional filter) and "get_statute" (required).'),
    identifier: z.string().optional().describe('Statute number, e.g. "6098" — required for "get_statute".'),
    unitId: z.string().optional().describe('A unit id returned by "search" or "get_statute" — required for "get_unit".'),
    expandCitations: z.boolean().optional().describe('For "get_unit": also return this unit\'s resolved cross-references to other laws.'),
  }),
  spec: { category: 'network', riskLevel: 'low', permissionSummary: 'Fetch Turkish statute text from the Aurict legal service' },
  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ExecuteResult> {
    const action = args.action as (typeof actions)[number]
    const query = typeof args.query === 'string' ? args.query : undefined
    const jurisdiction = typeof args.jurisdiction === 'string' ? args.jurisdiction : undefined
    const identifier = typeof args.identifier === 'string' ? args.identifier : undefined
    const unitId = typeof args.unitId === 'string' ? args.unitId : undefined
    const expandCitations = args.expandCitations === true

    if (action === 'search' && !query) return { output: '', error: '"search" requires a "query" argument.' }
    if (action === 'get_statute' && (!jurisdiction || !identifier)) {
      return { output: '', error: '"get_statute" requires both "jurisdiction" and "identifier".' }
    }
    if (action === 'get_unit' && !unitId) return { output: '', error: '"get_unit" requires a "unitId" argument.' }

    const path = buildPath(action, { query, jurisdiction, identifier, unitId, expandCitations })
    const result = await callAurictApi(ctx, path)
    if (result.kind !== 'success') {
      if (result.kind === 'error' && result.status === 404) {
        return { output: 'Not found. Tell the user honestly — do not invent statute or article text.' }
      }
      return { output: '', error: describeAurictApiFailure(result) }
    }

    if (action === 'search') {
      const data = result.data as { results: unknown[] }
      if (data.results.length === 0) return { output: 'No matching articles found for this search. Tell the user honestly.' }
    }

    return { output: JSON.stringify(result.data, null, 2) }
  },
}

function buildPath(
  action: (typeof actions)[number],
  params: { query: string | undefined; jurisdiction: string | undefined; identifier: string | undefined; unitId: string | undefined; expandCitations: boolean },
): string {
  switch (action) {
    case 'search': {
      const query = new URLSearchParams({ q: params.query! })
      if (params.jurisdiction) query.set('jurisdiction', params.jurisdiction)
      return `/legal/search?${query}`
    }
    case 'get_statute':
      return `/legal/statute/${encodeURIComponent(params.jurisdiction!)}/${encodeURIComponent(params.identifier!)}`
    case 'get_unit':
      return params.expandCitations
        ? `/legal/unit/${encodeURIComponent(params.unitId!)}?expand=citations`
        : `/legal/unit/${encodeURIComponent(params.unitId!)}`
  }
}
