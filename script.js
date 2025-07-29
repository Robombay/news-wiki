let currentCategory = '';
let currentMarkdown = '';
let categories = ['technology', 'business', 'sports', 'general'];
let processingUrls = new Set();

// GitHub Actionsリンクを設定
window.addEventListener('load', function() {
    const repoUrl = window.location.hostname.includes('github.io') 
        ? `https://github.com/${window.location.pathname.split('/')[1]}/news-wiki`
        : 'https://github.com/YOUR_USERNAME/news-wiki';
    document.getElementById('actionsLink').href = `${repoUrl}/actions`;
});

// ニュース追加機能
async function addNews() {
    const url = document.getElementById('newsUrl').value;
    if (!url) {
        showStatus('URLを入力してください', 'error');
        return;
    }

    if (processingUrls.has(url)) {
        showStatus('このURLは既に処理中です', 'error');
        return;
    }

    processingUrls.add(url);
    showStatus('ニュースを処理中... (2-3分お待ちください)', 'success');
    
    try {
        // GitHub Issues経由でワークフローをトリガー
        const issueData = {
            title: `新しいニュース: ${new Date().toISOString()}`,
            body: `URL: ${url}\n\n自動処理を開始します。`,
            labels: ['news-processing']
        };
        
        document.getElementById('newsUrl').value = '';
        
        // 処理完了をチェック
        checkProcessingStatus(url);
        
    } catch (error) {
        processingUrls.delete(url);
        showStatus('エラーが発生しました: ' + error.message, 'error');
    }
}

// 処理完了チェック
async function checkProcessingStatus(url) {
    let attempts = 0;
    const maxAttempts = 20; // 10分間チェック
    
    const checkInterval = setInterval(async () => {
        attempts++;
        
        try {
            // 各カテゴリファイルの更新をチェック
            let found = false;
            for (const category of categories) {
                const response = await fetch(`news/${category}.md?t=${Date.now()}`);
                if (response.ok) {
                    const content = await response.text();
                    if (content.includes(url)) {
                        found = true;
                        processingUrls.delete(url);
                        showStatus(`✅ ニュースが${getCategoryName(category)}カテゴリに追加されました！`, 'success');
                        clearInterval(checkInterval);
                        break;
                    }
                }
            }
            
            if (attempts >= maxAttempts) {
                processingUrls.delete(url);
                showStatus('処理に時間がかかっています。GitHub Actionsページで状況を確認してください。', 'error');
                clearInterval(checkInterval);
            }
        } catch (error) {
            // 継続してチェック
        }
    }, 30000); // 30秒ごとにチェック
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

// カテゴリ追加機能
function addCategory() {
    const newCategoryInput = document.getElementById('newCategory');
    const categoryName = newCategoryInput.value.trim().toLowerCase();
    
    if (!categoryName) {
        showStatus('カテゴリ名を入力してください', 'error');
        return;
    }
    
    if (categories.includes(categoryName)) {
        showStatus('このカテゴリは既に存在します', 'error');
        return;
    }
    
    categories.push(categoryName);
    
    // ボタンを追加
    const categoryButtons = document.getElementById('categoryButtons');
    const button = document.createElement('button');
    button.textContent = categoryName;
    button.onclick = () => loadCategory(categoryName);
    categoryButtons.appendChild(button);
    
    newCategoryInput.value = '';
    showStatus(`カテゴリ「${categoryName}」を追加しました`, 'success');
    
    // ローカルストレージに保存
    localStorage.setItem('customCategories', JSON.stringify(categories));
}

// カテゴリ復元
function loadCustomCategories() {
    const saved = localStorage.getItem('customCategories');
    if (saved) {
        const savedCategories = JSON.parse(saved);
        const defaultCategories = ['technology', 'business', 'sports', 'general'];
        const customCategories = savedCategories.filter(cat => !defaultCategories.includes(cat));
        
        categories = savedCategories;
        
        const categoryButtons = document.getElementById('categoryButtons');
        customCategories.forEach(categoryName => {
            const button = document.createElement('button');
            button.textContent = categoryName;
            button.onclick = () => loadCategory(categoryName);
            categoryButtons.appendChild(button);
        });
    }
}

// ページ読み込み時にカスタムカテゴリを復元
window.addEventListener('load', loadCustomCategories);

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