# 機能説明

## 折りたたみ可能な説明文

### 動作

1. **短い説明（1行）**
   - そのまま全文表示
   - トグルボタンなし

2. **長い説明（2行以上）**
   - 初期状態：1行のみ表示
   - 「more」ボタンが表示される
   - クリックで全文表示に展開
   - 「less」ボタンに変わる

### 実装詳細

#### CSS (`media/styles.css`)
```css
.description-content {
  display: -webkit-box;
  -webkit-line-clamp: 1;        /* 1行に制限 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 1.5em;
  transition: max-height 0.3s ease;
}

.description-content.expanded {
  display: block;
  -webkit-line-clamp: unset;    /* 制限解除 */
  max-height: none;
}
```

#### JavaScript (`media/script.js`)
```javascript
// 定数
CONFIG.LINE_HEIGHT_THRESHOLD = 1.5  // 1.5行以上で折りたたみ

// 自動検出
function shouldShowToggle(content) {
  const { fullHeight, lineHeight } = measureContentHeight(content);
  return fullHeight > lineHeight * 1.5;
}

// トグル動作
function toggleDescription(content, toggle) {
  if (isExpanded) {
    content.classList.remove('expanded');
    toggle.textContent = 'more';
  } else {
    content.classList.add('expanded');
    toggle.textContent = 'less';
  }
}
```

#### HTML生成 (`src/catalogProvider.ts`)
```typescript
private renderDescriptionCell(description: string): string {
  return `
    <td class="description-cell">
      <div class="description-content markdown-content">
        ${this.renderMarkdown(description)}
      </div>
      <button class="expand-toggle" style="display: none;">more</button>
    </td>
  `;
}
```

### テスト方法

1. F5キーでExtension Development Hostを起動
2. `test/test_schema.yml` を開く
3. エディタのテーブルアイコンをクリック
4. 確認項目：
   - `short_desc`: トグルボタンなし
   - `medium_desc`: 「more」ボタンあり
   - `long_desc`: クリックで展開/折りたたみ
   - `markdown_desc`: Markdownレンダリング + 折りたたみ

### スクリーンショット撮影ポイント

1. **初期状態**: 長い説明が1行で切り詰められている
2. **「more」ボタン**: トグルボタンが表示されている
3. **展開状態**: クリック後、全文が表示されている
4. **「less」ボタン**: 展開時はボタンが「less」に変わる
