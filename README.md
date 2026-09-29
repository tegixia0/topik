# TOPIK 闪卡

手机友好的 TOPIK 单词 / 语法句闪卡：<https://tegixia0.github.io/topik/>

- `index.html` — 应用（纯静态，无依赖）
- `decks/YYYY-MM-DD.json` — 每日题库；`decks/index.json` — 日期列表（新→旧）
- `publish.py` — 发布新的一天：`python3 publish.py topik-flashcards-YYYY-MM-DD.html`

错题记录只保存在浏览器本地（localStorage）。
