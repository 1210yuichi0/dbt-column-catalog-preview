import * as vscode from 'vscode';
import { WebviewManager } from './webviewManager';

export class FileWatcher implements vscode.Disposable {
  private fileSystemWatcher: vscode.FileSystemWatcher;
  private documentChangeListener: vscode.Disposable;

  constructor(private webviewManager: WebviewManager) {
    // 全てのYAMLファイルを監視
    this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
      '**/*.{yml,yaml}'
    );

    // ドキュメント保存イベントを監視
    this.documentChangeListener = vscode.workspace.onDidSaveTextDocument(
      this.onDocumentSaved.bind(this)
    );
  }

  public startWatching(): void {
    // ファイル変更イベント
    this.fileSystemWatcher.onDidChange(async uri => {
      await this.webviewManager.updateContent(uri);
    });

    // ファイル作成イベント
    this.fileSystemWatcher.onDidCreate(async uri => {
      console.log(`New YAML file detected: ${uri.fsPath}`);
    });

    // ファイル削除イベント
    this.fileSystemWatcher.onDidDelete(uri => {
      console.log(`YAML file deleted: ${uri.fsPath}`);
    });
  }

  private async onDocumentSaved(document: vscode.TextDocument): Promise<void> {
    // YAMLファイルの保存時のみ反応
    if (document.fileName.match(/\.ya?ml$/)) {
      await this.webviewManager.refreshCurrentPreview();
    }
  }

  public dispose(): void {
    this.fileSystemWatcher.dispose();
    this.documentChangeListener.dispose();
  }
}
