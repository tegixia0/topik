# TOPIK 闪卡

手机友好的 TOPIK 单词 / 语法句闪卡：<https://tegixia0.github.io/topik/>

- `index.html` — 应用（纯静态，无依赖）
- `decks/YYYY-MM-DD.json` — 每日题库；`decks/index.json` — 日期列表（新→旧）
- `publish.py` — 发布新的一天：`python3 publish.py topik-flashcards-YYYY-MM-DD.html`

错题记录只保存在浏览器本地（localStorage）。

## 单词信息（词性 · 记忆法 · 易错 · 近义词 · 反义词）

- `wordinfo.json` — 共享词汇信息字典，按韩语单词做键，所有日期共用（同一个词各天内容一致）。
- `publish.py` 生成题库时，会把 `wordinfo.json` 的内容合并进每个单词；如果每日 HTML 里单词自带这些字段，
  这个词在 `wordinfo.json` 里还没有（或该字段为空）时就用 HTML 的内容，并写回 `wordinfo.json`。
  默认以 `wordinfo.json` 里已有的内容为准，保证前后一致；加 `--prefer-html` 则由 HTML 覆盖字典。
  缺 `pos` 或 `mem` 的单词会打印 `WARNING` 列表。
- 重新合并已有题库：`python3 publish.py decks/2026-09-2*.json --no-push`

### 每日 HTML 的数据格式

每日 HTML 仍然把单词放在 `<script id="vocab-data" type="application/json">[...]</script>` 里（JSON 数组），
每个单词在原有的 `ko / zh / hint / ex` 之外追加以下字段（中文为简体）：

```json
{"ko":"여론","zh":"舆论","hint":"yeo-ron","ex":"가짜 뉴스가 여론을 왜곡할 수 있다.",
 "pos":"名词",
 "hanja":"輿論（舆论）",
 "mem":"輿論：여(輿)+론(論，论)→舆论。여론 조사＝民意调查。",
 "tip":"和 언론（言論，新闻媒体）只差一个字：여론＝公众意见，언론＝媒体。",
 "syn":[{"ko":"민심","zh":"民心"},{"ko":"공론","zh":"公论"}],
 "ant":[]}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `pos` | ✔ | 词性：名词 / 动词 / 形容词 / 副词 / 依存名词 / 冠形词 / 名词（词组）…；하다词写 `动词（하다动词）`、`形容词（하다形容词）`，되다词写 `动词（되다动词）` |
| `hanja` | 汉字词填 | 汉字（韩国繁体）+（简体），如 `輿論（舆论）`；固有词省略；不确定就省略，不要猜 |
| `mem` | ✔ | 记忆法（1–2 句）：汉字词讲音节↔汉字对应；固有词用拆词/词根、谐音或联想 |
| `tip` | 可选 | 易错提醒：形近词、同音词、받침/发音陷阱 |
| `syn` | 建议 | 近义词/同类词 1–3 个：`[{"ko":"…","zh":"…"}]` |
| `ant` | 可选 | 反义词 0–2 个，没有自然的反义词就写 `[]` |

`syn`/`ant` 也接受简写字符串 `"대응하다（应对）; 처리하다（处理）"` 或 `["대응하다（应对）"]`，`publish.py` 会自动转换。
