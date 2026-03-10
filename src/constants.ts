/**
 * アプリケーション全体で使用される定数
 */

// コマンドID
export const COMMAND_ID = 'dbt-catalog.preview';

// Webview関連
export const WEBVIEW_TYPE = 'dbtCatalogPreview';
export const VIEW_COLUMN = 2; // vscode.ViewColumn.Beside

// ファイル関連
export const YAML_FILE_PATTERN = /\.ya?ml$/;
export const EXCLUDED_FILES = ['dbt_project.yml', 'profiles.yml', 'packages.yml', 'selectors.yml'];

// dbtスキーマバージョン
export const SUPPORTED_DBT_VERSION = 2;
export const DEFAULT_DBT_VERSION = 2;

// PII検出キーワード
export const PII_KEYWORDS = ['PII', 'personal', 'sensitive', '個人情報'];

// HTMLプレースホルダー
export const EMPTY_PLACEHOLDER = '<em>-</em>';

// CSSクラス名
export const CSS_CLASSES = {
  EMPTY_STATE: 'empty-state',
  MODEL_SECTION: 'model-section',
  MODEL_HEADER: 'model-header',
  MODEL_NAME: 'model-name',
  MODEL_DESCRIPTION: 'model-description',
  MODEL_DESCRIPTION_WRAPPER: 'model-description-wrapper',
  CATALOG_TABLE: 'catalog-table',
  ROW_NUMBER: 'row-number',
  DESCRIPTION_CELL: 'description-cell',
  DESCRIPTION_WRAPPER: 'description-wrapper',
  DESCRIPTION_CONTENT: 'description-content',
  MARKDOWN_CONTENT: 'markdown-content',
  EXPAND_TOGGLE: 'expand-toggle',
  PII_ROW: 'pii-row',
  PII_BADGE: 'pii-badge',
  TEST_BADGE: 'test-badge',
  STATS_CONTAINER: 'stats-container',
  STAT_ITEM: 'stat-item',
  STAT_LABEL: 'stat-label',
  STAT_VALUE: 'stat-value',
  STAT_WARNING: 'stat-warning'
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  NO_ACTIVE_EDITOR: 'No active editor found',
  YAML_FILES_ONLY: 'This command only works with YAML files',
  PARSE_FAILED: 'Failed to parse YAML',
  LOAD_FAILED: 'Failed to load file',
  UPDATE_PREVIEW_FAILED: 'Failed to update preview',
  UNSUPPORTED_VERSION: 'Unsupported dbt schema version',
  MARKDOWN_RENDER_FAILED: 'Markdown rendering failed'
} as const;
