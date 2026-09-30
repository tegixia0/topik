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

## 写作 51·52（`writing/`）

页面顶部切换「📇 单词/语法闪卡」和「✍️ 写作 51·52」（也可用 `#writing` / `#flash` 直接打开）。写作区有三个标签页：

- **速查**：`writing/cheatsheet.html` 是一段 HTML 片段，运行时读取后插入页面，直接改这个文件就能更新速查表。
- **练习**：可按 51 / 52 / 全部，以及 真题 / 官方公开 / 回忆版 / 模拟题 筛选，也可随机顺序。每题有 ㉠ ㉡ 两个输入框（草稿自动保存）；点「看参考答案」显示答案、解析、句型和中文翻译；每空自评 满分/部分/不会；「复制我的答案发给老师批改」会复制回次、题号、原文和我的答案。
- **错题**：任意一空自评为「部分」或「不会」的题会进错题；重做后两空都标「满分」就自动移出。

localStorage 键：`topik.writing.v1`（存 `{marks:{id:{a,b,t}}, drafts:{id:{a,b}}}`）、`topik.writing.opts`（筛选条件/当前标签/当前题）、`topik.view`（当前是闪卡还是写作）。

### `writing/questions.json` 格式

```json
{
  "version": 1,
  "updated": "2026-09-30",
  "questions": [
    {
      "id": "35-51",            // 唯一：回次-题号（模拟题建议 "mock-51-01"）
      "round": 35,              // 回次（模拟题填 0）
      "no": 51,                 // 51 或 52
      "kind": "real",           // "real" 真题 | "mock" 模拟题
      "src": "official",        // real 时："official" 官方公开试卷 | "transcript" 公开资料转录 | "recalled" 考后回忆/重构
      "title": "무료로 드립니다", // 可选（51 的标题）
      "text": "… 그래서 지금 ( ㉠ ). … ( ㉡ ). …",  // 空格必须写成 "( ㉠ )" "( ㉡ )"，\n 换行
      "zh": "中文翻译（答案可写在括号里）",
      "ans": {"a": ["模范答案1", "…"], "b": ["…"]},
      "ansType": "official",    // "official" 官方答案 | "reference" 非官方参考答案 | "mine" 自拟
      "alt": {"a": ["其他写法（自拟）"], "b": []},   // 可选
      "exp": {"a": "㉠ 的线索和解析（中文）", "b": "…"},
      "pat": {"a": "-(으)려고 합니다", "b": "-아/어 주시기 바랍니다"},
      "note": "可选备注",
      "urls": ["来源链接（不在页面显示）"]
    }
  ]
}
```

页面上的标签：official →「真题 第N回」，transcript →「真题 第N回（公开资料转录）」，recalled →「真题 第N回·回忆版」，mock →「模拟题」。自己写的题一律用 `kind:"mock"`、`ansType:"mine"`，**不要**标成真题。

## 分类词库（味道 / 运动 / 鸟类 …）

- 源文件：`categories/<slug>.json`。格式和每日词库一样，多出这些字段：`slug`、`name`、`emoji`、`order`、`desc`、`notion`（对应 Notion「主题」标签）。每个单词可以带 `exzh`（例句的中文翻译）、`hanja`、`tip`、`syn`、`ant`。`grammar` 可以不写（这样选语法模式时会提示“请切换到单词模式”）。
- 生成 / 更新：`python3 add_category.py categories/taste.json`（会写 `decks/cat-<slug>.json` 和 `decks/categories.json`，合并 `wordinfo.json`，然后 commit + push；加 `--no-push` 只在本地生成）。想新增一个分类，复制一份 json、改 slug 后运行即可。
- 网站：题库下拉框里有一组「分类」；「全部混合」＝所有每日词库＋所有分类（按单词去重）。选中分类或某一天后，页脚会出现「🔗 复制本题库链接」。
- 深链接：
  - `?cat=taste` / `?cat=sports` / `?cat=birds`：直接打开某个分类
  - `?deck=2026-09-29`：打开某一天的词库
  - 可加 `&mode=zh2ko`（单词 中→韩）、`ko2zh`（单词 韩→中）、`gko2zh`（语法句 韩→中）、`gzh2ko`（语法句 中→韩）
  - 例：`https://tegixia0.github.io/topik/?cat=taste&mode=zh2ko`

## 写作语法（速查 + 语法闪卡）

- 内容源：`tools/wg_data.py`（句型、判断公式、常见错误、敬语替换表）。例句用 `{"ref":"35-51b","ai":0}` 从 `writing/questions.json` 取真题原句并高亮答案；没有 ref 的标“自拟例句”。
- 生成：`python3 tools/build_writing_grammar.py` → `writing/cheatsheet.html`（速查页：判断公式 / 句型卡 / 常见错误 / 步骤，带搜索）和 `writing/grammar.json`（语法闪卡数据，含自动判分用的 keys）。
- 深链接：`?cat=writing-grammar`（或 `#writing-grammar`），可加 `&mode=zh2ko|ko2zh`。语法错题存在 localStorage `topik.wg.wrong.v1`。

## 阅读真题（`reading/`）

- 顶部「📖 阅读」：练习（按 回次 / 题型 / 只看错题 筛选，点选项即判，答错展开解析）、整套模拟（50题/70分钟按比例限时，交卷出分和各题型正确率）、阅读错题本、题型攻略。
- 数据 `reading/rounds.json` 由 `python3 tools/build_reading.py` 生成：
  - 原文：官方公开 2교시 PDF（kajiritate-no-hangul.com 镜像 `{n}_TOPIK2_2.pdf`）用 `tools/reading_parse.py` 解析 → `tools/reading_src/{n}.json`；
  - 答案：官方正答表 `{n}_TOPIK2_A.pdf`（第96回为图片，人工读表）；
  - 注释：`tools/rd{n}.py`（中文翻译、关键句、解析、逐项分析、生词、语法；`FIX` 修正抽取问题/加下划线）。
  - 5–10 题图片从原卷裁剪：`reading/img/r{n}_q{m}.png`。
- 已收录：第96回（48题，42–43 官方因版权未公开原文）、第60回（50题）。第64/83/91回官方PDF为扫描图，需 OCR 后再加。
- 深链接：`?reading=1`、`?reading=1&type=insert`（题型 id：grammar synonym ad match order blank long headline blank2 match2 theme insert long2）、`?reading=1&round=60`、`&tab=mock|wrong|tips`。

## 语法（`grammar/`）

- 顶部「🧩 语法」：语法表（按功能分组 + 搜索）、易混组（中文对比表）、闪卡（中→韩写语法 / 句子填空写形式 / 韩→中自评；宽松判分 + “其实我写对了”）、语法错题本（localStorage `topik.grammar.wrong.v1`）。
- 内容源 `tools/grammar_data.py`（111 个 TOPIK II 高频语法，16 组易混对比），`python3 tools/build_grammar.py` 生成 `grammar/grammar.json`。例句标“真题 第N回 第M题”的均取自上面核对过的官方试卷，其余标“自拟”。
- 深链接：`?grammar=1`、`?grammar=1&g=baram`（打开某个语法）、`?cat=grammar-core&mode=zh2ko|fill|ko2zh`。
