let currentMarkdown = '';
let processingUrls = new Set();

// ニュース処理機能
async function processNews() {
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
    showStatus('ニュースを処理中...', 'success');
    
    try {
        // 直接処理する方式に変更
        const result = await processNewsDirectly(url);
        
        if (result) {
            currentMarkdown = result;
            displayMarkdown(result);
            document.getElementById('downloadBtn').style.display = 'block';
            showStatus('✅ 処理が完了しました！', 'success');
        } else {
            showStatus('処理に失敗しました（詳細はコンソールを確認）', 'error');
        }
        
        document.getElementById('newsUrl').value = '';
        processingUrls.delete(url);
        
    } catch (error) {
        processingUrls.delete(url);
        console.error('処理エラー詳細:', error);
        showStatus('エラーが発生しました: ' + error.message, 'error');
    }
}

// 直接ニュース処理
async function processNewsDirectly(url) {
    const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    for (let i = 0; i < proxies.length; i++) {
        try {
            console.log(`プロキシ ${i + 1} を試行:`, proxies[i]);
            
            const response = await fetch(proxies[i]);
            console.log('レスポンス状態:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let data, contents;
            
            if (i === 0) { // allorigins
                data = await response.json();
                contents = data.contents;
                console.log('alloriginsデータ:', {
                    status: data.status,
                    contents_length: contents ? contents.length : 0
                });
            } else { // 他のプロキシ
                contents = await response.text();
                console.log('プロキシデータ長:', contents.length);
            }
            
            if (!contents || contents.length < 100) {
                throw new Error('コンテンツが空または不十分');
            }
            
            return await parseNewsContent(contents, url);
            
        } catch (error) {
            console.error(`プロキシ ${i + 1} エラー:`, error.message);
            if (i === proxies.length - 1) {
                throw new Error('すべてのプロキシで失敗しました');
            }
        }
    }
}

// ニュースコンテンツ解析
async function parseNewsContent(contents, url) {
    try {
        // HTMLをパース
        const parser = new DOMParser();
        const doc = parser.parseFromString(contents, 'text/html');
        console.log('パース結果:', {
            title_elements: doc.querySelectorAll('title').length,
            h1_elements: doc.querySelectorAll('h1').length,
            time_elements: doc.querySelectorAll('time').length
        });
        
        // タイトルを抽出
        const title = doc.querySelector('title')?.textContent?.trim() ||
                     doc.querySelector('h1')?.textContent?.trim() ||
                     'タイトル不明';
        
        // 日付を抽出
        const timeElement = doc.querySelector('time[datetime]') || 
                           doc.querySelector('[datetime]');
        const publishDate = timeElement?.getAttribute('datetime') ||
                           new Date().toISOString().split('T')[0];
        
        // 簡易コメントを生成（AIなし版）
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                           doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                           '詳細はリンク先でご確認ください';
        
        const catchyComment = description.length > 100 ? 
                             description.substring(0, 100) + '...' : 
                             description;
        
        // Markdownを生成
        const markdown = `# ${title}

**日付:** ${publishDate}  
**リンク:** [${title}](${url})  
**コメント:** ${catchyComment}

---
`;
        
        return markdown;
        
    } catch (error) {
        console.error('パースエラー詳細:', {
            message: error.message,
            url: url,
            stack: error.stack
        });
        throw error;
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
    a.download = `news-${new Date().toISOString().split('T')[0]}.md`;
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

