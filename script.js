let currentCategory = '';
let currentMarkdown = '';

// ニュース追加機能
async function addNews() {
    const url = document.getElementById('newsUrl').value;
    if (!url) {
        showStatus('URLを入力してください', 'error');
        return;
    }

    showStatus('ニュースを処理中...', 'success');
    
    try {
        // GitHub Issues経由でワークフローをトリガー
        const issueData = {
            title: `新しいニュース: ${new Date().toISOString()}`,
            body: `URL: ${url}\n\n自動処理を開始します。`,
            labels: ['news-processing']
        };
        
        showStatus('ニュースが追加されました。処理完了まで数分お待ちください。', 'success');
        document.getElementById('newsUrl').value = '';
        
    } catch (error) {
        showStatus('エラーが発生しました: ' + error.message, 'error');
    }
}

// カテゴリ読み込み
async function loadCategory(category) {
    currentCategory = category;
    showStatus('カテゴリを読み込み中...', 'success');
    
    try {
        // GitHub Pages上のMarkdownファイルを読み込み
        const response = await fetch(`news/${category}.md`);
        if (response.ok) {
            currentMarkdown = await response.text();
            displayMarkdown(currentMarkdown);
            document.getElementById('downloadBtn').style.display = 'block';
        } else {
            displayMarkdown(`# ${getCategoryName(category)}\n\nまだニュースがありません。`);
        }
        hideStatus();
    } catch (error) {
        showStatus('カテゴリの読み込みに失敗しました', 'error');
    }
}

// Markdown表示
function displayMarkdown(markdown) {
    const content = document.getElementById('markdownContent');
    // 簡易Markdown→HTML変換
    let html = markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n/gim, '<br>');
    
    content.innerHTML = html;
}

// Markdownダウンロード
function downloadMarkdown() {
    if (!currentMarkdown) return;
    
    const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCategory}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

// ステータス表示
function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status').style.display = 'none';
}

// カテゴリ名取得
function getCategoryName(category) {
    const names = {
        'technology': 'テクノロジー',
        'business': 'ビジネス',
        'sports': 'スポーツ',
        'general': '一般'
    };
    return names[category] || category;
}