(function () {
  // 定数定義
  const CONFIG = {
    INIT_DELAY: 300,
    DEFAULT_LINE_HEIGHT: 24,
    CSV_FILENAME: 'dbt-catalog.csv',
    DEBUG: true
  };

  const SELECTORS = {
    SEARCH_BOX: 'searchBox',
    EXPORT_BTN: 'exportBtn',
    TABLE_BODIES: '.catalog-table tbody',
    ALL_TABLES: '.catalog-table',
    TABLE_HEADERS: '.catalog-table th',
    DESCRIPTION_CELL: '.description-cell',
    DESCRIPTION_CONTENT: '.description-content',
    EXPAND_TOGGLE: '.expand-toggle',
    HIDDEN_CLASS: 'hidden',
    EXPANDED_CLASS: 'expanded'
  };

  // DOM要素の取得
  const elements = {
    searchBox: document.getElementById(SELECTORS.SEARCH_BOX),
    exportBtn: document.getElementById(SELECTORS.EXPORT_BTN),
    tableBodies: document.querySelectorAll(SELECTORS.TABLE_BODIES),
    allTables: document.querySelectorAll(SELECTORS.ALL_TABLES)
  };

  // 初期化
  function init() {
    // レンダリング完了を待つ
    requestAnimationFrame(() => {
      setTimeout(() => {
        initializeDescriptionToggle();
      }, CONFIG.INIT_DELAY);
    });

    initializeSearch();
    initializeExport();
    initializeSort();
  }

  // 検索機能の初期化
  function initializeSearch() {
    if (!elements.searchBox || elements.tableBodies.length === 0) {
      return;
    }

    elements.searchBox.addEventListener('input', handleSearch);
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();

    elements.tableBodies.forEach(tbody => {
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const shouldShow = text.includes(searchTerm);
        row.classList.toggle(SELECTORS.HIDDEN_CLASS, !shouldShow);
      });
    });
  }

  // CSV エクスポート機能の初期化
  function initializeExport() {
    if (!elements.exportBtn || elements.tableBodies.length === 0) {
      return;
    }

    elements.exportBtn.addEventListener('click', handleExport);
  }

  function handleExport() {
    try {
      const csv = generateCSV();
      downloadCSV(csv, CONFIG.CSV_FILENAME);
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  }

  function generateCSV() {
    const headers = extractHeaders();
    const rows = extractRows();
    return [headers, ...rows].join('\n');
  }

  function extractHeaders() {
    const headerElements = document.querySelectorAll(SELECTORS.TABLE_HEADERS);
    return Array.from(headerElements)
      .map(th => th.textContent)
      .join(',');
  }

  function extractRows() {
    const csvRows = [];

    elements.tableBodies.forEach(tbody => {
      const rows = tbody.querySelectorAll(`tr:not(.${SELECTORS.HIDDEN_CLASS})`);
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const csvCells = Array.from(cells).map(formatCellForCSV);
        csvRows.push(csvCells.join(','));
      });
    });

    return csvRows;
  }

  function formatCellForCSV(cell) {
    const text = cell.textContent
      .replace(/,/g, ';')
      .replace(/more/g, '')
      .replace(/less/g, '')
      .trim();
    return `"${text}"`;
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  // ソート機能の初期化
  function initializeSort() {
    elements.allTables.forEach(table => {
      const headers = table.querySelectorAll('th');
      const tbody = table.querySelector('tbody');

      if (!tbody) {
        return;
      }

      headers.forEach((header, columnIndex) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
          sortTableByColumn(tbody, columnIndex);
        });
      });
    });
  }

  function sortTableByColumn(tbody, columnIndex) {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const sortedRows = sortRows(rows, columnIndex);
    replaceTableRows(tbody, sortedRows);
  }

  function sortRows(rows, columnIndex) {
    return rows.sort((rowA, rowB) => {
      const textA = getCellText(rowA, columnIndex);
      const textB = getCellText(rowB, columnIndex);
      return textA.localeCompare(textB);
    });
  }

  function getCellText(row, columnIndex) {
    const cell = row.querySelectorAll('td')[columnIndex];
    return cell?.textContent?.trim() || '';
  }

  function replaceTableRows(tbody, rows) {
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
  }

  // 説明文の折りたたみ機能の初期化
  function initializeDescriptionToggle() {
    // カラムのDescription
    const descriptionCells = document.querySelectorAll(SELECTORS.DESCRIPTION_CELL);
    descriptionCells.forEach(setupDescriptionCell);

    // モデルのDescription
    const modelDescriptions = document.querySelectorAll('.model-description-wrapper');
    modelDescriptions.forEach(setupDescriptionWrapper);

    // ウィンドウ幅変更時にボタン表示を再評価
    const resizeObserver = new ResizeObserver(() => {
      descriptionCells.forEach(cell => reevaluateToggle(cell));
      modelDescriptions.forEach(wrapper => reevaluateToggle(wrapper));
    });
    resizeObserver.observe(document.body);
  }

  function reevaluateToggle(container) {
    const content = container.querySelector(SELECTORS.DESCRIPTION_CONTENT);
    const toggle = container.querySelector(SELECTORS.EXPAND_TOGGLE);
    if (!content || !toggle) return;

    const isExpanded = content.classList.contains(SELECTORS.EXPANDED_CLASS);
    if (isExpanded) return; // 展開中は再評価しない

    if (shouldShowToggle(content)) {
      toggle.style.display = 'block';
    } else {
      toggle.style.display = 'none';
    }
  }

  function setupDescriptionCell(cell) {
    const content = cell.querySelector(SELECTORS.DESCRIPTION_CONTENT);
    const toggle = cell.querySelector(SELECTORS.EXPAND_TOGGLE);

    if (!content || !toggle) {
      return;
    }

    if (shouldShowToggle(content)) {
      showToggleButton(toggle);
      addToggleClickHandler(content, toggle);
      // 複数行の場合はクラスを追加
      toggle.classList.add('has-multiline');
    }
  }

  function setupDescriptionWrapper(wrapper) {
    const content = wrapper.querySelector(SELECTORS.DESCRIPTION_CONTENT);
    const toggle = wrapper.querySelector(SELECTORS.EXPAND_TOGGLE);

    if (!content || !toggle) {
      return;
    }

    if (shouldShowToggle(content)) {
      showToggleButton(toggle);
      addToggleClickHandler(content, toggle);
      // モデルDescriptionは背景色更新不要
      // 複数行の場合はクラスを追加
      toggle.classList.add('has-multiline');
    }
  }

  function shouldShowToggle(content) {
    // padding-rightを一時的に削除して正確に測定
    const originalPaddingRight = content.style.paddingRight;
    content.style.paddingRight = '0';

    const currentStyle = window.getComputedStyle(content);
    const lineClamp = parseInt(currentStyle.getPropertyValue('-webkit-line-clamp'), 10);
    const overflow = currentStyle.getPropertyValue('overflow');
    const scrollHeight = content.scrollHeight;
    const clientHeight = content.clientHeight;

    // padding-rightを戻す
    content.style.paddingRight = originalPaddingRight;

    if (CONFIG.DEBUG) {
      console.log('Toggle decision:', {
        text: content.textContent.trim().substring(0, 50),
        lineClamp,
        overflow,
        scrollHeight,
        clientHeight,
        diff: scrollHeight - clientHeight
      });
    }

    // line-clampとoverflowが適用されている場合のみチェック
    if (lineClamp > 0 && overflow === 'hidden') {
      // scrollHeightがclientHeightより大きければクランプされている
      const heightDiff = scrollHeight - clientHeight;
      const isClamped = heightDiff > 0;

      if (CONFIG.DEBUG) {
        console.log(isClamped ? '✅ Show toggle: content is clamped' : '❌ No toggle: content fits',
                   `(diff: ${heightDiff}px)`);
      }

      return isClamped;
    }

    if (CONFIG.DEBUG) {
      console.log('❌ No toggle: line-clamp not active');
    }

    return false;
  }

  function showToggleButton(toggle) {
    toggle.style.display = 'block';
  }

  function addToggleClickHandler(content, toggle) {
    toggle.addEventListener('click', () => {
      toggleDescription(content, toggle);
    });
  }

  function toggleDescription(content, toggle) {
    const isExpanded = content.classList.contains(SELECTORS.EXPANDED_CLASS);

    if (isExpanded) {
      content.classList.remove(SELECTORS.EXPANDED_CLASS);
      toggle.textContent = 'more';
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      content.classList.add(SELECTORS.EXPANDED_CLASS);
      toggle.textContent = 'less';
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  // アプリケーション起動
  init();
})();
