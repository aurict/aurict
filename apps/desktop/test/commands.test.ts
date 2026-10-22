/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { matchCommands, parseSlash, slashQuery, type CommandAction } from '../src/renderer/experience/commands.js';

const command = (id: string, slash: string, title: string): CommandAction => ({ id, slash, title, detail: `${title} detail`, group: 'Session', icon: 'plus', run: () => undefined });
const commands = [command('undo', 'undo', 'Undo last turn'), command('design', 'design', 'Design from a brief'), command('diff', 'diff', 'Review changes')];

describe('composer commands', () => {
  it('parses a slash command and its argument', () => {
    expect(parseSlash('/design a pricing page', commands)).toMatchObject({ command: { id: 'design' }, args: 'a pricing page' });
    expect(parseSlash('/UNDO', commands)).toMatchObject({ command: { id: 'undo' }, args: '' });
    expect(parseSlash('/unknown thing', commands)).toBeNull();
    expect(parseSlash('please /undo this', commands)).toBeNull();
  });

  it('only offers the menu while the command name is being typed', () => {
    expect(slashQuery('/')).toBe('');
    expect(slashQuery('/de')).toBe('de');
    expect(slashQuery('/design brief')).toBeNull();
    expect(slashQuery('hello')).toBeNull();
  });

  it('ranks slash-name prefixes before title and detail matches', () => {
    expect(matchCommands(commands, 'd').map((item) => item.id)).toEqual(['design', 'diff', 'undo']);
    expect(matchCommands(commands, 'review').map((item) => item.id)).toEqual(['diff']);
    expect(matchCommands(commands, '')).toHaveLength(3);
  });
});
