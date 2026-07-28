import { describe, expect, it } from 'vitest'
import { renderNode, sanitizeAttributes, isSafeUrl, escapeHtml } from '../scripts/lib/markdoc-render.mjs'

/**
 * Post HTML is injected with `dangerouslySetInnerHTML`, so this allowlist is
 * the control that makes that sound. These tests exist so it stays one.
 */

const el = (name: string, attributes: Record<string, unknown> = {}, children: unknown[] = []) => ({
  name,
  attributes,
  children,
})

describe('isSafeUrl', () => {
  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'data:text/html;base64,PHNjcmlwdD4=',
  ])('rejects %s', (url) => {
    expect(isSafeUrl(url)).toBe(false)
  })

  it('rejects schemes obfuscated with control characters', () => {
    // `java\tscript:` and friends are still parsed as javascript: by browsers.
    expect(isSafeUrl('java\tscript:alert(1)')).toBe(false)
    expect(isSafeUrl('java\nscript:alert(1)')).toBe(false)
    expect(isSafeUrl(' javascript:alert(1)')).toBe(false)
  })

  it.each([
    'https://example.com/x',
    'http://example.com',
    '/blog/post',
    '#section',
    'mailto:a@example.com',
    'data:image/png;base64,iVBORw0KGgo=',
  ])('allows %s', (url) => {
    expect(isSafeUrl(url)).toBe(true)
  })
})

describe('sanitizeAttributes', () => {
  it('drops every event handler', () => {
    const kept = sanitizeAttributes('div', { onclick: 'steal()', onload: 'x()', id: 'ok' })
    expect(kept).toEqual({ id: 'ok' })
  })

  it('drops event handlers regardless of case', () => {
    expect(sanitizeAttributes('div', { OnClick: 'x()' })).toEqual({})
  })

  it('drops attributes not permitted on that element', () => {
    // href is fine on <a>, meaningless and unreviewed on <div>.
    expect(sanitizeAttributes('div', { href: 'https://example.com' })).toEqual({})
    expect(sanitizeAttributes('a', { href: 'https://example.com' })).toEqual({
      href: 'https://example.com',
    })
  })

  it('drops an unsafe href but keeps the rest of the element', () => {
    const kept = sanitizeAttributes('a', {
      href: 'javascript:alert(1)',
      title: 'harmless',
    })
    expect(kept).toEqual({ title: 'harmless' })
  })

  it('reports what it dropped', () => {
    const messages: string[] = []
    sanitizeAttributes('div', { onclick: 'x()' }, (m: string) => messages.push(m))
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('event-handler')
  })
})

describe('renderNode', () => {
  it('escapes text content', () => {
    expect(renderNode('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('drops a disallowed element but keeps its text', () => {
    // Losing a wrapper is recoverable; emitting an unreviewed element is not.
    const tree = el('script', {}, ['alert(1)'])
    expect(renderNode(tree)).toBe('alert(1)')
  })

  it.each(['script', 'iframe', 'object', 'embed', 'form', 'style', 'link', 'meta'])(
    'does not emit <%s>',
    (tag) => {
      expect(renderNode(el(tag, {}, ['x']))).not.toContain(`<${tag}`)
    },
  )

  it('renders permitted elements with permitted attributes', () => {
    const tree = el('a', { href: '/blog', title: 'Writing' }, ['Writing'])
    expect(renderNode(tree)).toBe('<a href="/blog" title="Writing">Writing</a>')
  })

  it('adds noopener to target=_blank links', () => {
    // Without it, the destination gets a handle on window.opener.
    const html = renderNode(el('a', { href: 'https://example.com', target: '_blank' }, ['x']))
    expect(html).toContain('noopener')
    expect(html).toContain('noreferrer')
  })

  it('escapes quotes inside attribute values so they cannot break out', () => {
    const html = renderNode(el('a', { href: '/x', title: 'a" onmouseover="evil()' }, ['x']))
    expect(html).not.toContain('onmouseover="evil()"')
    expect(html).toContain('&quot;')
  })

  it('emits void elements without a closing tag', () => {
    expect(renderNode(el('img', { src: '/a.png', alt: 'a' }))).toBe(
      '<img src="/a.png" alt="a">',
    )
  })

  it('renders nested children in order', () => {
    const tree = el('p', {}, ['Hello ', el('strong', {}, ['world']), '!'])
    expect(renderNode(tree)).toBe('<p>Hello <strong>world</strong>!</p>')
  })

  it('handles null and undefined children without emitting "undefined"', () => {
    expect(renderNode(el('p', {}, [null, undefined, 'x']))).toBe('<p>x</p>')
  })

  it('routes code fences through the highlighter', () => {
    const tree = el('pre', { 'data-language': 'bash' }, [el('code', {}, ['ls -la'])])
    const html = renderNode(tree, (code: string, lang?: string) => `<HL:${lang}>${code}</HL>`)
    expect(html).toBe('<HL:bash>ls -la</HL>')
  })
})

describe('escapeHtml', () => {
  it('escapes all five characters that matter', () => {
    expect(escapeHtml('<>&"')).toBe('&lt;&gt;&amp;&quot;')
  })

  it('escapes ampersands before other entities, avoiding double-escaping bugs', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})
