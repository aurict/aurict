import React from 'react';
import { parseMarkdown, type MarkdownBlock } from './markdown-parser.js';

interface Props {
  content: string;
}

function inline(content: string): React.ReactNode[] {
  const parts = content.split(/(\*\*.+?\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} style={{ color: 'var(--text)', fontWeight: 650 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} style={inlineCodeStyle}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function InlineText({ content }: { content: string }) {
  return <>{content.split('\n').map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{inline(line)}</React.Fragment>)}</>;
}

function BlockView({ block }: { block: MarkdownBlock }) {
  switch (block.kind) {
    case 'heading': {
      const size = block.level === 1 ? 21 : block.level === 2 ? 17 : 14;
      return <div style={{ margin: block.level === 1 ? '18px 0 10px' : '16px 0 7px', fontFamily: 'var(--font-ui)', fontSize: size, lineHeight: 1.25, color: 'var(--text)', fontWeight: block.level <= 2 ? 650 : 600 }}><InlineText content={block.content} /></div>;
    }
    case 'paragraph': return <p style={paragraphStyle}><InlineText content={block.content} /></p>;
    case 'rule': return <hr style={ruleStyle} />;
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return <List style={listStyle}>{block.items.map((item) => <li key={item}><InlineText content={item} /></li>)}</List>;
    }
    case 'table': return <div style={tableScrollStyle}><table style={tableStyle}><thead><tr>{block.headers.map((header) => <th key={header} style={headerCellStyle}><InlineText content={header} /></th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={`${rowIndex}-${row.join('|')}`}>{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`} style={cellStyle}><InlineText content={cell} /></td>)}</tr>)}</tbody></table></div>;
    case 'code': return <pre style={codeStyle}>{block.content}</pre>;
  }
}

export function MarkdownMessage({ content }: Props) {
  return <div style={messageStyle}>{parseMarkdown(content).map((block, index) => <BlockView key={`${block.kind}-${index}`} block={block} />)}</div>;
}

const messageStyle: React.CSSProperties = { marginBottom: 10, color: 'var(--text)' };
const paragraphStyle: React.CSSProperties = { margin: '0 0 11px', fontFamily: 'var(--font-ui)', fontSize: 14.5, lineHeight: 1.62, color: 'var(--text)' };
const inlineCodeStyle: React.CSSProperties = { padding: '1px 5px', borderRadius: 5, color: 'var(--accent-text)', background: 'var(--control-bg)', fontFamily: 'var(--font-mono)', fontSize: '.88em' };
const ruleStyle: React.CSSProperties = { margin: '18px 0', border: 'none', borderTop: '1px solid var(--border-subtle)' };
const listStyle: React.CSSProperties = { margin: '0 0 13px', paddingLeft: 21, fontFamily: 'var(--font-ui)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' };
const tableScrollStyle: React.CSSProperties = { margin: '12px 0 16px', overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-control)' };
const tableStyle: React.CSSProperties = { width: '100%', minWidth: 460, borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.5 };
const headerCellStyle: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', color: 'var(--text)', background: 'var(--bg-alt)', borderBottom: '1px solid var(--border-strong)', verticalAlign: 'top' };
const cellStyle: React.CSSProperties = { padding: '8px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'top' };
const codeStyle: React.CSSProperties = { margin: '0 0 12px', padding: '12px 14px', overflowX: 'auto', whiteSpace: 'pre-wrap', color: 'var(--text)', background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-control)', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6 };
