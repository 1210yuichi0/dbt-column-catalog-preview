import * as yaml from 'js-yaml';
import * as vscode from 'vscode';
import {
  DbtYamlSchema,
  CatalogRow,
  DbtTest,
  DbtModel,
  DbtColumn,
  DbtTestObject
} from './types/dbt';
import { SUPPORTED_DBT_VERSION, DEFAULT_DBT_VERSION, PII_KEYWORDS, ERROR_MESSAGES } from './constants';

export class YamlParser {

  /**
   * YAML文字列をパースしてdbtスキーマオブジェクトを返す
   */
  public parseYaml(content: string): DbtYamlSchema | null {
    try {
      const parsed = yaml.load(content) as DbtYamlSchema;
      return this.validateAndNormalizeSchema(parsed);
    } catch (error) {
      this.showParseError(error);
      return null;
    }
  }

  private validateAndNormalizeSchema(schema: DbtYamlSchema): DbtYamlSchema | null {
    if (!this.isVersionSupported(schema.version)) {
      this.showVersionWarning(schema.version);
      return null;
    }

    this.setDefaultVersion(schema);
    return schema;
  }

  private isVersionSupported(version: number | undefined): boolean {
    return version === undefined || version === SUPPORTED_DBT_VERSION;
  }

  private setDefaultVersion(schema: DbtYamlSchema): void {
    if (!schema.version) {
      schema.version = DEFAULT_DBT_VERSION;
    }
  }

  private showVersionWarning(version: number | undefined): void {
    vscode.window.showWarningMessage(
      `${ERROR_MESSAGES.UNSUPPORTED_VERSION}: ${version}`
    );
  }

  private showParseError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`${ERROR_MESSAGES.PARSE_FAILED}: ${message}`);
  }

  /**
   * dbtスキーマをカタログ行に変換
   */
  public toCatalogRows(schema: DbtYamlSchema): CatalogRow[] {
    if (!schema.models) {
      return [];
    }

    return schema.models.flatMap(model => this.convertModelToRows(model));
  }

  private convertModelToRows(model: DbtModel): CatalogRow[] {
    if (!model.columns) {
      return [];
    }

    return model.columns.map((column: DbtColumn) =>
      this.convertColumnToRow(model, column)
    );
  }

  private convertColumnToRow(model: DbtModel, column: DbtColumn): CatalogRow {
    const tests = column.tests || column.data_tests;

    return {
      modelName: model.name,
      modelDescription: model.description,
      columnName: column.name,
      dataType: column.data_type,
      tests: this.extractTests(tests),
      description: this.extractDescription(column.description),
      isPii: this.isPiiColumn(column),
      metadata: column.meta || {}
    };
  }

  /**
   * テスト配列から文字列配列に変換
   */
  private extractTests(tests?: DbtTest[]): string[] {
    if (!tests) {
      return [];
    }

    return tests.map(test => this.formatTest(test));
  }

  private formatTest(test: DbtTest): string {
    if (typeof test === 'string') {
      return test;
    }

    return this.formatObjectTest(test);
  }

  private formatObjectTest(test: DbtTestObject): string {
    const keys = Object.keys(test);

    if (keys.length === 0) {
      return 'unknown';
    }

    const testName = keys[0];
    const testConfig = test[testName as keyof DbtTestObject];

    return this.formatSpecificTest(testName, testConfig);
  }

  private formatSpecificTest(testName: string, config: unknown): string {
    if (testName === 'relationships' && this.isRelationshipsConfig(config)) {
      return this.formatRelationshipsTest(config);
    }

    if (testName === 'accepted_values' && this.isAcceptedValuesConfig(config)) {
      return this.formatAcceptedValuesTest(config);
    }

    return testName;
  }

  private isRelationshipsConfig(config: unknown): config is { to: string; field: string } {
    return (
      typeof config === 'object' &&
      config !== null &&
      'to' in config &&
      'field' in config
    );
  }

  private isAcceptedValuesConfig(config: unknown): config is { values: string[] } {
    return (
      typeof config === 'object' &&
      config !== null &&
      'values' in config &&
      Array.isArray((config as any).values)
    );
  }

  private formatRelationshipsTest(config: { to: string; field: string }): string {
    return `relationships(${config.to} -> ${config.field})`;
  }

  private formatAcceptedValuesTest(config: { values: string[] }): string {
    const values = config.values.join(', ');
    return `accepted_values(${values})`;
  }

  /**
   * 列からPII情報を抽出
   */
  private isPiiColumn(column: DbtColumn): boolean {
    return this.hasPiiMetadata(column) || this.hasPiiInDescription(column);
  }

  private hasPiiMetadata(column: DbtColumn): boolean {
    return column.meta?.pii === true;
  }

  private hasPiiInDescription(column: DbtColumn): boolean {
    if (!column.description) {
      return false;
    }

    const descriptionLower = column.description.toLowerCase();

    return PII_KEYWORDS.some(keyword =>
      descriptionLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Jinja docリファレンスを処理
   */
  private extractDescription(description?: string): string {
    if (!description) {
      return '';
    }

    return this.replaceDocReferences(description);
  }

  private replaceDocReferences(description: string): string {
    const docPattern = /\{\{\s*doc\(['"](.*?)['"]\)\s*\}\}/g;
    return description.replace(docPattern, '[doc: $1]');
  }

  /**
   * ファイルURIからYAMLコンテンツを読み込む
   */
  public async loadFromUri(uri: vscode.Uri): Promise<DbtYamlSchema | null> {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      return this.parseYaml(document.getText());
    } catch (error) {
      this.showLoadError(error);
      return null;
    }
  }

  private showLoadError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`${ERROR_MESSAGES.LOAD_FAILED}: ${message}`);
  }
}
