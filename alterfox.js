// alterfox.js — Просто берём логику markdown-viewer и добавляем ACS-1 + UTF-8

(function() {
    'use strict';

    // --- 1. Проверка: является ли это plain-text документом?
    // Если в body есть <pre>, значит, браузер уже отобразил как текст — это наш случай.
    if (!document.querySelector('body > pre')) {
        return;
    }

    // --- 2. Принудительно читаем содержимое файла в UTF-8 через fetch
    const url = window.location.href;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text(); // ← Это гарантирует UTF-8
        })
        .then(text => {
            // --- 3. Об ACS-1 из первой строки
            const lines = text.split('\n');
            let acsDirective = null;
            let markdownBody = text;

            if (lines.length > 0 && lines[0].trimStart().startsWith('<!-- ACS:')) {
                acsDirective = lines[0].trimStart();
                markdownBody = lines.slice(1).join('\n');
            }

            // Парсим параметры
            const colors = { bg: '', text: '', link: '' };
            if (acsDirective) {
                const match = acsDirective.match(/<!--\s*ACS:\s*(.*?)\s*-->/i);
                if (match) {
                    const params = {};
                    match[1].split(';').forEach(p => {
                        const [k, v] = p.trim().split('=').map(s => s.trim());
                        if (k && v) params[k.toLowerCase()] = v;
                    });
                    colors.bg = params.bg || '';
                    colors.text = params.text || '';
                    colors.link = params.link || '';
                }
            }

            // --- 4. Генерируем CSS для ACS-1
            const style = document.createElement('style');
            style.textContent = `
                body { background-color: ${colors.bg} !important; }
                body { color: ${colors.text} !important; }
                a { color: ${colors.link} !important; }
            `;
            document.head.appendChild(style);

            // --- 5. Рендерим Markdown (используем showdown, как вы указали)
            if (typeof showdown !== 'undefined' && showdown.Converter) {
                const converter = new showdown.Converter({
                    simplifiedAutoLink: true,
                    strikethrough: true,
                    tables: true,
                    ghCodeBlocks: true,
                    tasklists: true,
                    emoji: true,
                    underline: true,
                    completeHTMLDocument: false
                });
                const html = converter.makeHtml(markdownBody);

                // --- 6. Заменяем содержимое body
                document.body.innerHTML = html;
            } else {
                document.body.innerHTML = `<pre>Ошибка: Showdown не загружен.</pre>`;
            }
        })
        .catch(err => {
            console.error('AlterFox error:', err);
            document.body.innerHTML = `<pre>AlterFox failed: ${err.message}</pre>`;
        });
})();
