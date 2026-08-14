import { buildVariableSnippet } from './template-variables-sidebar.component';
import type { TemplateVariable } from '../models';

/**
 * The sidebar used to emit a bare Thymeleaf attribute (`th:text="${...}"`), which lands
 * outside any tag when inserted at the caret and produces invalid markup. Every snippet
 * must now be a complete element.
 */
describe('buildVariableSnippet', () => {
  const variable = (over: Partial<TemplateVariable>): TemplateVariable => ({
    path: 'entity.numero',
    group: 'entity',
    ...over,
  });

  it('wraps a text variable in a span carrying th:text', () => {
    const snippet = buildVariableSnippet(variable({ type: 'string', example: 'DEV-001' }));

    expect(snippet).toBe('<span th:text="${entity.numero}">DEV-001</span>');
  });

  it('falls back to the label then the path when no example is given', () => {
    expect(buildVariableSnippet(variable({ label: 'Numéro' }))).toBe(
      '<span th:text="${entity.numero}">Numéro</span>'
    );
    expect(buildVariableSnippet(variable({}))).toBe(
      '<span th:text="${entity.numero}">entity.numero</span>'
    );
  });

  it('emits an img for image variables', () => {
    const snippet = buildVariableSnippet(
      variable({ path: 'tenant.logo', type: 'image', group: 'tenant' })
    );

    expect(snippet).toBe('<img th:src="${tenant.logo}" alt=""/>');
  });

  it('treats a logo path as an image even when the type is missing', () => {
    const snippet = buildVariableSnippet(variable({ path: 'tenant.logo', group: 'tenant' }));

    expect(snippet).toContain('th:src="${tenant.logo}"');
  });

  it('formats dates and datetimes instead of printing the raw value', () => {
    expect(buildVariableSnippet(variable({ path: 'entity.dateEmission', type: 'date' }))).toBe(
      "<span th:text=\"${#temporals.format(entity.dateEmission, 'dd/MM/yyyy')}\">01/01/2026</span>"
    );
    expect(buildVariableSnippet(variable({ path: 'now', type: 'datetime', group: 'system' }))).toBe(
      "<span th:text=\"${#temporals.format(now, 'dd/MM/yyyy HH:mm')}\">01/01/2026 09:00</span>"
    );
  });

  it('never emits a bare attribute', () => {
    const kinds = ['string', 'number', 'date', 'datetime', 'image', undefined];

    for (const type of kinds) {
      const snippet = buildVariableSnippet(variable({ type }));
      expect(snippet.startsWith('<')).toBe(true);
      expect(snippet.endsWith('>')).toBe(true);
    }
  });
});
