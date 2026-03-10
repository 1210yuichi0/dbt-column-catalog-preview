/**
 * dbt YAML schema version 2の型定義
 */

export interface DbtYamlSchema {
  version?: number;
  models?: DbtModel[];
  functions?: DbtFunction[];
  unit_tests?: DbtUnitTest[];
}

export interface DbtModel {
  name: string;
  description?: string;
  config?: DbtModelConfig;
  columns?: DbtColumn[];
}

export interface DbtModelConfig {
  contract?: {
    enforced: boolean;
  };
  [key: string]: unknown;
}

export interface DbtColumn {
  name: string;
  description?: string;
  data_type?: string;
  tests?: DbtTest[];
  data_tests?: DbtTest[];
  meta?: DbtColumnMeta;
}

export interface DbtColumnMeta {
  pii?: boolean;
  [key: string]: unknown;
}

export type DbtTest = string | DbtTestObject;

export interface DbtTestObject {
  unique?: null;
  not_null?: null;
  relationships?: DbtRelationshipsTest;
  accepted_values?: DbtAcceptedValuesTest;
  [key: string]: unknown;
}

export interface DbtRelationshipsTest {
  to: string;
  field: string;
}

export interface DbtAcceptedValuesTest {
  values: string[];
}

export interface DbtFunction {
  name: string;
  description?: string;
  config?: DbtFunctionConfig;
  arguments?: DbtFunctionArgument[];
  returns?: DbtFunctionReturn;
}

export interface DbtFunctionConfig {
  runtime_version: string;
  entry_point: string;
  [key: string]: unknown;
}

export interface DbtFunctionArgument {
  name: string;
  data_type: string;
  description?: string;
}

export interface DbtFunctionReturn {
  data_type: string;
}

export interface DbtUnitTest {
  name: string;
  description?: string;
  model: string;
  given?: unknown[];
  expect?: unknown;
}

/**
 * カタログビュー用の平坦化されたデータ構造
 */
export interface CatalogRow {
  modelName: string;
  modelDescription?: string;
  columnName: string;
  dataType?: string;
  tests: string[];
  description: string;
  isPii: boolean;
  metadata: Record<string, unknown>;
}

/**
 * 統計情報
 */
export interface CatalogStats {
  modelCount: number;
  columnCount: number;
  piiCount: number;
  testedCount: number;
}
