import * as vscode from 'vscode';
import { WebviewManager } from './webviewManager';
import { FileWatcher } from './fileWatcher';
import { COMMAND_ID, YAML_FILE_PATTERN, ERROR_MESSAGES } from './constants';

export function activate(context: vscode.ExtensionContext) {
  console.log('dbt-column-catalog-preview is now active');

  const webviewManager = new WebviewManager(context);
  const fileWatcher = new FileWatcher(webviewManager);

  // コマンド登録: プレビューを開く
  const previewCommand = vscode.commands.registerCommand(
    COMMAND_ID,
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage(ERROR_MESSAGES.NO_ACTIVE_EDITOR);
        return;
      }

      const document = editor.document;
      if (!document.fileName.match(YAML_FILE_PATTERN)) {
        vscode.window.showWarningMessage(ERROR_MESSAGES.YAML_FILES_ONLY);
        return;
      }

      webviewManager.showPreview(document.uri);
    }
  );

  // ファイル監視開始
  fileWatcher.startWatching();

  context.subscriptions.push(previewCommand, fileWatcher);
}

export function deactivate() {
  console.log('dbt-column-catalog-preview is now deactivated');
}
