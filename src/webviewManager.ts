import * as vscode from 'vscode';
import * as path from 'path';
import { CatalogProvider } from './catalogProvider';
import { CatalogRow } from './types/dbt';
import { WEBVIEW_TYPE, VIEW_COLUMN, ERROR_MESSAGES } from './constants';

export class WebviewManager {
  private panel: vscode.WebviewPanel | undefined;
  private catalogProvider: CatalogProvider;
  private currentUri: vscode.Uri | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.catalogProvider = new CatalogProvider();
  }

  /**
   * プレビューを表示
   */
  public async showPreview(uri: vscode.Uri): Promise<void> {
    this.currentUri = uri;
    const fileName = path.basename(uri.fsPath);

    // 既存パネルがあれば再利用
    if (this.panel) {
      this.panel.title = fileName;
      this.panel.reveal(vscode.ViewColumn.Beside);
      await this.updateContent(uri);
      return;
    }

    // 新規パネル作成
    this.panel = vscode.window.createWebviewPanel(
      WEBVIEW_TYPE,
      fileName,
      VIEW_COLUMN,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
        ]
      }
    );

    // パネルが閉じられたときの処理
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      this.context.subscriptions
    );

    await this.updateContent(uri);
  }

  /**
   * コンテンツを更新
   */
  public async updateContent(uri: vscode.Uri): Promise<void> {
    if (!this.panel) {
      return;
    }

    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();
      const rows = await this.catalogProvider.generateCatalog(content);

      const html = this.getHtmlContent(uri, rows);
      this.panel.webview.html = html;
    } catch (error) {
      vscode.window.showErrorMessage(
        `${ERROR_MESSAGES.UPDATE_PREVIEW_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 現在表示中のURIを更新（ファイル監視用）
   */
  public async refreshCurrentPreview(): Promise<void> {
    if (this.currentUri && this.panel) {
      await this.updateContent(this.currentUri);
    }
  }

  /**
   * HTML全体を生成
   */
  private getHtmlContent(uri: vscode.Uri, rows: CatalogRow[]): string {
    const styleUri = this.panel!.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'styles.css'))
    );
    const scriptUri = this.panel!.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'script.js'))
    );

    const stats = this.catalogProvider.generateStats(rows);
    const table = this.catalogProvider.generateHtmlTable(rows);
    const fileName = path.basename(uri.fsPath);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${this.panel!.webview.cspSource}; script-src ${
      this.panel!.webview.cspSource
    };">
  <link rel="stylesheet" href="${styleUri}">
  <title>${fileName}</title>
</head>
<body>
  <div class="header">
    <h1 class="file-path">${fileName}</h1>
    ${stats}
  </div>

  <div class="controls">
    <input type="text" id="searchBox" placeholder="🔍 Filter by model, column, type, or test..." />
    <button id="exportBtn">📥 Export CSV</button>
  </div>

  <div class="table-container">
    ${table}
  </div>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
