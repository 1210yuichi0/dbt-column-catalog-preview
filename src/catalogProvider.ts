import { CatalogRow } from './types/dbt';
import { YamlParser } from './yamlParser';
import { marked } from 'marked';
import { EMPTY_PLACEHOLDER, CSS_CLASSES, ERROR_MESSAGES } from './constants';

export class CatalogProvider {
  private parser: YamlParser;

  constructor() {
    this.parser = new YamlParser();
    this.configureMarkdown();
  }

  private configureMarkdown(): void {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }

  /**
   * YAML内容からカタログデータを生成
   */
  public async generateCatalog(content: string): Promise<CatalogRow[]> {
    const schema = this.parser.parseYaml(content);
    if (!schema) {
      return [];
    }

    return this.parser.toCatalogRows(schema);
  }

  /**
   * カタログデータをHTML表に変換（モデルごとにグループ化）
   */
  public generateHtmlTable(rows: CatalogRow[]): string {
    if (rows.length === 0) {
      return this.renderEmptyState();
    }

    const modelGroups = this.groupByModel(rows);
    return this.renderModelSections(modelGroups);
  }

  private renderEmptyState(): string {
    return `<p class="${CSS_CLASSES.EMPTY_STATE}">No models or columns found in this schema file.</p>`;
  }

  private groupByModel(rows: CatalogRow[]): Map<string, CatalogRow[]> {
    const groups = new Map<string, CatalogRow[]>();

    for (const row of rows) {
      if (!groups.has(row.modelName)) {
        groups.set(row.modelName, []);
      }
      groups.get(row.modelName)!.push(row);
    }

    return groups;
  }

  private renderModelSections(modelGroups: Map<string, CatalogRow[]>): string {
    return Array.from(modelGroups.entries())
      .map(([modelName, modelRows]) => this.renderModelSection(modelName, modelRows))
      .join('');
  }

  private renderModelSection(modelName: string, rows: CatalogRow[]): string {
    const modelDescription = rows[0]?.modelDescription || '';

    return `
      <div class="${CSS_CLASSES.MODEL_SECTION}">
        ${this.renderModelHeader(modelName, modelDescription)}
        ${this.renderTable(rows)}
      </div>
    `;
  }

  private renderModelHeader(modelName: string, description: string): string {
    const contentId = `model-desc-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionHtml = description
      ? `<div class="${CSS_CLASSES.MODEL_DESCRIPTION_WRAPPER}">
           <div id="${contentId}" class="${CSS_CLASSES.MODEL_DESCRIPTION} ${CSS_CLASSES.DESCRIPTION_CONTENT} ${CSS_CLASSES.MARKDOWN_CONTENT}">${this.renderMarkdown(description)}</div>
           <button class="${CSS_CLASSES.EXPAND_TOGGLE}" style="display: none;" aria-expanded="false" aria-controls="${contentId}">more</button>
         </div>`
      : '';

    return `
      <div class="${CSS_CLASSES.MODEL_HEADER}">
        <h3 class="${CSS_CLASSES.MODEL_NAME}">${this.escapeHtml(modelName)}</h3>
        ${descriptionHtml}
      </div>
    `;
  }

  private renderTable(rows: CatalogRow[]): string {
    return `
      <table class="${CSS_CLASSES.CATALOG_TABLE}">
        <thead>
          <tr>
            <th class="${CSS_CLASSES.ROW_NUMBER}">#</th>
            <th>Column</th>
            <th>Description</th>
            <th>Type</th>
            <th>Metadata</th>
            <th>Tests</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => this.renderTableRow(row, index + 1)).join('')}
        </tbody>
      </table>
    `;
  }

  private renderTableRow(row: CatalogRow, rowNumber: number): string {
    const rowClass = row.isPii ? CSS_CLASSES.PII_ROW : '';

    return `
      <tr class="${rowClass}">
        <td class="${CSS_CLASSES.ROW_NUMBER}">${rowNumber}</td>
        <td>${this.escapeHtml(row.columnName)}</td>
        ${this.renderDescriptionCell(row.description)}
        <td>${this.renderDataType(row.dataType)}</td>
        <td>${this.renderMetadata(row.isPii)}</td>
        <td>${this.renderTests(row.tests)}</td>
      </tr>
    `;
  }

  private renderDescriptionCell(description: string): string {
    const contentId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    return `
      <td class="${CSS_CLASSES.DESCRIPTION_CELL}">
        <div class="${CSS_CLASSES.DESCRIPTION_WRAPPER}">
          <div id="${contentId}" class="${CSS_CLASSES.DESCRIPTION_CONTENT} ${CSS_CLASSES.MARKDOWN_CONTENT}">${this.renderMarkdown(description)}</div>
          <button class="${CSS_CLASSES.EXPAND_TOGGLE}" style="display: none;" aria-expanded="false" aria-controls="${contentId}">more</button>
        </div>
      </td>
    `;
  }

  private renderDataType(dataType?: string): string {
    return dataType ? this.escapeHtml(dataType) : EMPTY_PLACEHOLDER;
  }

  private renderMetadata(isPii: boolean): string {
    return isPii ? `<span class="${CSS_CLASSES.PII_BADGE}">PII</span>` : '';
  }

  /**
   * テスト配列をバッジ形式でレンダリング
   */
  private renderTests(tests: string[]): string {
    if (tests.length === 0) {
      return EMPTY_PLACEHOLDER;
    }

    return tests
      .map(test => this.renderTestBadge(test))
      .join(' ');
  }

  private renderTestBadge(test: string): string {
    return `<span class="${CSS_CLASSES.TEST_BADGE}">${this.escapeHtml(test)}</span>`;
  }

  /**
   * HTMLエスケープ
   */
  private escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => escapeMap[char]);
  }

  /**
   * MarkdownをHTMLに変換
   */
  private renderMarkdown(text?: string): string {
    if (!text) {
      return EMPTY_PLACEHOLDER;
    }

    try {
      const html = marked.parse(text, { async: false }) as string;
      return html.trim();
    } catch (error) {
      console.error(`${ERROR_MESSAGES.MARKDOWN_RENDER_FAILED}:`, error);
      return this.escapeHtml(text);
    }
  }

  /**
   * 統計情報を生成
   */
  public generateStats(rows: CatalogRow[]): string {
    const stats = this.calculateStats(rows);
    return this.renderStats(stats);
  }

  private calculateStats(rows: CatalogRow[]) {
    return {
      modelCount: new Set(rows.map(r => r.modelName)).size,
      columnCount: rows.length,
      piiCount: rows.filter(r => r.isPii).length,
      testedCount: rows.filter(r => r.tests.length > 0).length
    };
  }

  private renderStats(stats: ReturnType<typeof this.calculateStats>): string {
    return `
      <div class="${CSS_CLASSES.STATS_CONTAINER}">
        ${this.renderStatItem('Models', stats.modelCount)}
        ${this.renderStatItem('Columns', stats.columnCount)}
        ${this.renderStatItem('Tested', stats.testedCount)}
        ${this.renderStatItem('PII', stats.piiCount, stats.piiCount > 0)}
      </div>
    `;
  }

  private renderStatItem(label: string, value: number, isWarning = false): string {
    const warningClass = isWarning ? CSS_CLASSES.STAT_WARNING : '';

    return `
      <div class="${CSS_CLASSES.STAT_ITEM} ${warningClass}">
        <span class="${CSS_CLASSES.STAT_LABEL}">${label}:</span>
        <span class="${CSS_CLASSES.STAT_VALUE}">${value}</span>
      </div>
    `;
  }
}
