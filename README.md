# TOPIK 闪卡

手机友好的 TOPIK 单词闪卡（另有 📖 阅读、🧩 语法、✍️ 写作 51–54 模块）：<https://tegixia0.github.io/topik/>

- `index.html` — 应用（纯静态，无依赖）
- `decks/YYYY-MM-DD.json` — 每日题库；`decks/index.json` — 日期列表（新→旧）
- `publish.py` — 发布新的一天：`python3 publish.py topik-flashcards-YYYY-MM-DD.html`

闪卡只练单词（单词 中→韩 / 韩→中）。答错的单词进「📕 错词本」，可在闪卡页顶部按钮或词库「错词」标签里单独重练。语法请用「🧩 语法」模块；每日 HTML 的 `grammar-data` 可有可无，即使有也会被闪卡忽略（旧的语法句错题在闪卡错题本里隐藏，但不删除）。

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

| `voice` | 动词自动补 | 动词的 自/他：`自`（自动词，不及物）/ `他`（他动词，带 을/를）/ `自他`（两用）/ `被动` / `使动`；不用手写，`publish.py` 和 `tools/build_flashcards.py` 按 `voice.json` 自动填 |
| `pair` | 可选 | 对应词 `[{"ko":"끝나다","voice":"自"}]`（自↔他、主动↔被动/使动），同样由 `voice.json` 自动填 |

`syn`/`ant` 也接受简写字符串 `"대응하다（应对）; 처리하다（处理）"` 或 `["대응하다（应对）"]`，`publish.py` 会自动转换。

## 写作 51·52（`writing/`）

页面顶部切换「📇 单词/语法闪卡」和「✍️ 写作」（也可用 `#writing` / `#flash` 直接打开）。写作区顶部再分「51·52 句子填空」和「53·54 图表·议论文」两部分（记住上次选的；53·54 见下一节）。51·52 有这些标签页：

- **速查**：`writing/cheatsheet.html` 是一段 HTML 片段，运行时读取后插入页面，直接改这个文件就能更新速查表。
- **练习**：可按 51 / 52 / 全部，以及 真题 / 官方公开 / 回忆版 / 模拟题 筛选，也可随机顺序。每题有 ㉠ ㉡ 两个输入框（不保存草稿：每次打开题目都是空白，方便真正重写）；点「看参考答案」显示答案、解析、句型和中文翻译；每空自评 满分/部分/不会；「复制我的答案发给老师批改」会复制回次、题号、原文和我的答案。
- **错题**：任意一空自评为「部分」或「不会」的题会进错题；重做后两空都标「满分」就自动移出。

localStorage 键：`topik.writing.v1`（存 `{marks:{id:{a,b,t}}}`；旧版的 `drafts` 会在加载时清除）、`topik.writing.opts`（筛选条件/当前标签/当前题）、`topik.view`（当前是闪卡还是写作）。

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

### 我的易错点（`writing/mylog.json`）

老师批改后的个人错误记录，放在仓库里所以手机上也能看到（公开，但只有学习笔记）。
- 练习页：答题前显示「⚠️ 你这题㉠错过 N 次 · 注意：错误类型」（不泄露答案）；看参考答案后每空显示「📌 我上次的错误（错了 N 次）」：每次的答案、错因、正确写法，以及「✅ 下次怎么做」规则。
- 「易错点」标签（深链接 `?writing=mistakes` 或 `#mistakes`）：按错误类型汇总次数、从多到少排，每类有一句规则和我的例子（回次/题号/空），点例子直接去练那道题。
- 格式：`types`（`id → {name, rule}`）+ `entries`（`{q:"35-51", k:"a"|"b", try, date, ok, ans, cause, fix, tags:[type id], minor?}`）。`ok:true` 是写对的记录，只计入统计。
- 追加记录：
  ```bash
  python3 tools/add_mistake.py 35 51 a "물건들이 드리려고 합니다" "宾语用了 이（应 을/를）" "물건들을 무료로 드리려고 합니다" obj,ctx
  python3 tools/add_mistake.py 36 51 b "" "" "" "" --ok            # 写对了
  python3 tools/add_mistake.py 63 51 b "기회 일 것 같습니다" "-이다 连写" "기회일 것 같습니다" 分写 --date 2026-10-01 --commit
  python3 tools/add_mistake.py --types                             # 列出类型 + 次数
  python3 tools/add_mistake.py --new-type honor-end "敬语句尾" "对长辈用 -(으)십니까 / -(으)세요"
  ```
  BLANK 可写 `a/b/㉠/㉡`；TAGS 用逗号分隔，可写类型 id 或中文名（如 `宾语助词,没扣题`）；`--try N` 指定第几次（默认自动 +1）；`--minor` 标小问题；`--commit` 会 `git pull --rebase` 后提交并推送（不会 force）。

## 写作 53·54（`writing/w5354.*`）

「✍️ 写作」→「53·54 图表·议论文」，四个标签页：

- **速查**：53 / 54 分页 + 搜索。每个句型是一张可折叠卡片：韩语句型、中文意思、🧠 记忆法（汉字词对中文）、⚠️ 易错、例句（标“官方范文 第N回”的逐字取自该回官方 모범답안，其余标“自拟例句”）；另有 53/54 模板骨架（可复制）、交卷前检查清单、-습니다 → -ㄴ다 语体对照表。
- **闪卡**：60 张（53 × 24、54 × 20、万能词 × 16）。中→韩打字（只比较韩文；`(으)`、`을/를`、`하였/했` 等自动放宽，另有「其实我写对了」）或韩→中自评；答错/没记住进 53·54 错题本（localStorage `topik.w54.wrong.v1`），在错题本或重练里答对自动移出。
- **真题**：22 题 = 53 × 11 + 54 × 11，全部来自官方公开试卷（第35·36·37·47·52·60·64·83·91·96·102回）。53 附原卷图表截图（`writing/img/w{回}_53.png`）＋图表数字文字版；作文框每次都是空白、**不保存**（离开时有提示）；实时字数（含空格和标点、不含换行，≈原稿纸格数；53 目标 200–300，54 目标 600–700）；「📋 复制给老师」复制题目（含图表文字版）＋作文；「看参考答案」显示官方模范答案（第64回 54 官方未公开 → 标「参考范文（自编）」）。
- **错题本**：上面是「✍️ 作文易错点」（老师批改的 53/54 作文错误按类型汇总次数，附规则和例子，点例子去那道题重做），下面是闪卡错题列表。

### 我之前的作文（`writing/essaylog.json`）

老师批改过的 53/54 作文，放在仓库里所以手机上也能看到（公开）。
- 真题页：做过的题在下拉框里带「✓ 已做 N 次 · 最近 15–18分」，列表上方有「📚 做过」快捷按钮，题目头部有同样的标签。
- 打开做过的题：作文框上方有折叠的「📚 我之前的作文（N 次）」——每次的日期/第几次/分数、我的原文（错误片段波浪线标红）、主要错误（错→对 + 错因 + 类型）、改写示范、要记住的规则。默认折叠，免得照抄。
- 「🔁 重做」：收起历史、清空并聚焦空白作文框（作文框永远不保存）。「复制给老师」会注明这是第几次写这道题。
- 格式：
  ```json
  {"version":1, "updated":"…", "tags":{"搭配":"一句话规则", …},
   "attempts":{"35-53":[{"date":"2026-10-01","try":1,"score":"约15–18/30","essay":"原文",
     "errors":[{"wrong":"그 뒤에 이었다","right":"그 뒤를 이었다","cause":"固定搭配 뒤를 잇다","tags":["搭配"]}],
     "rewrite":"改写示范","rules":["规则1","规则2"]}]}}
  ```
- 追加记录（题号必须在 `writing/w5354.json` 里，`try` 默认自动 +1）：
  ```bash
  python3 tools/add_essay.py attempt.json --commit          # JSON：q, date, score, essay, errors[], rewrite, rules[]（也接受 主要错误/改写示范/规则/错因/tag 写法；"-" 读 stdin）
  python3 tools/add_essay.py --q 60-53 --score "约20/30" --essay-file essay.txt \
      --error "그 뒤에 이었다|그 뒤를 이었다|固定搭配 뒤를 잇다|搭配" --error "…|…|…|拼写,标点" \
      --rewrite-file rewrite.txt --rule "比例用 N(으)로 가장 높다" --date 2026-10-03 --commit
  python3 tools/add_essay.py --list                          # 所有记录
  python3 tools/add_essay.py --tags                          # 类型次数 + 规则
  python3 tools/add_essay.py --tag-rule 搭配 "图表固定搭配整句背：…"   # 设置类型的规则（显示在易错点里）
  ```
  `--commit` 会先提交再 `git pull --rebase`、push（不会 force，网络错误自动重试）。

51·52 真题下拉框/题目头部也会显示 `writing/mylog.json` 的批改摘要「📝 批改N次 ㉠✓㉡✗」（每空最近一次对错）。

设置存 localStorage `topik.w54.opt.v1`。

- 内容源：`tools/w5354_data.py`（句型/闪卡、模板、语体表、真题和范文）。生成：`python3 tools/build_w5354.py` → `writing/w5354.json`（会校验“官方范文”例句确实出现在对应范文里，并打印每篇范文字数）。
- 真题原文：官方 1교시 PDF（`kajiritate-no-hangul.com/TOPIK/{n}_TOPIK2_1.pdf`，topik.go.kr 公开试卷的镜像），范文：官方 정답 및 채점기준표 `{n}_TOPIK2_A.pdf`（第47·64·83·91·96·102回是扫描件：300dpi OCR 后对照原图校对）。第37回范文里的排印错误“통화여”已改为“통하여”。
- 深链接：
  - 速查 `?writing=5354`（`&no=54` 打开 54 分页）
  - 闪卡 `?cat=writing-5354`（可加 `&mode=zh2ko|ko2zh`）
  - 真题 `?writing=5354&tab=prac`（可加 `&q=60-53` 直接打开某题）、错题本 `?writing=5354&tab=wrong`、`#w5354`

## 分类词库（味道 / 运动 / 鸟类 …）

- 源文件：`categories/<slug>.json`。格式和每日词库一样，多出这些字段：`slug`、`name`、`emoji`、`order`、`desc`、`notion`（对应 Notion「主题」标签）。每个单词可以带 `exzh`（例句的中文翻译）、`hanja`、`tip`、`syn`、`ant`。`grammar` 不需要写（闪卡只用单词）。
- 生成 / 更新：`python3 add_category.py categories/taste.json`（会写 `decks/cat-<slug>.json` 和 `decks/categories.json`，合并 `wordinfo.json`，然后 commit + push；加 `--no-push` 只在本地生成）。想新增一个分类，复制一份 json、改 slug 后运行即可。
- 网站：题库下拉框里有一组「分类」；「全部混合」＝所有每日词库＋所有分类（按单词去重）。选中分类或某一天后，页脚会出现「🔗 复制本题库链接」。
- 深链接：
  - `?cat=taste` / `?cat=sports` / `?cat=birds`：直接打开某个分类
  - `?deck=2026-09-29`：打开某一天的词库
  - 可加 `&mode=zh2ko`（单词 中→韩）、`ko2zh`（单词 韩→中）；旧链接的 `gko2zh` / `gzh2ko` 自动回落到 `zh2ko`
  - 例：`https://tegixia0.github.io/topik/?cat=taste&mode=zh2ko`

## 写作语法（速查 + 语法闪卡）

- 内容源：`tools/wg_data.py`（句型、判断公式、常见错误、敬语替换表）。例句用 `{"ref":"35-51b","ai":0}` 从 `writing/questions.json` 取真题原句并高亮答案；没有 ref 的标“自拟例句”。
- 生成：`python3 tools/build_writing_grammar.py` → `writing/cheatsheet.html`（速查页：判断公式 / 句型卡 / 常见错误 / 步骤，带搜索）和 `writing/grammar.json`（语法闪卡数据，含自动判分用的 keys）。
- 深链接：`?cat=writing-grammar`（或 `#writing-grammar`），可加 `&mode=zh2ko|ko2zh`。语法错题存在 localStorage `topik.wg.wrong.v1`。

## 阅读真题（`reading/`）

- 顶部「📖 阅读」：练习（按 回次 / 题型 / 只看错题 筛选，点选项即判，答错展开解析）、整套模拟（50题/70分钟按比例限时，交卷出分和各题型正确率）、阅读错题本、题型攻略。
- 数据 `reading/rounds.json` 由 `python3 tools/build_reading.py` 生成：
  - 原文：官方公开 2교시 PDF（kajiritate-no-hangul.com 镜像 `{n}_TOPIK2_2.pdf`）用 `tools/reading_parse.py` 解析 → `tools/reading_src/{n}.json`；第83/91回 PDF 是扫描图：`pdftoppm -r 300 -gray` + `tesseract -l kor --psm 4` OCR 后逐行对照原图校对，转写在 `tools/src{n}.py`（运行即生成 `reading_src/{n}.json`）；
  - 答案：官方正答表 `{n}_TOPIK2_A.pdf`（第96/91/83回为图片，人工读表）；
  - 注释：`tools/rd{n}.py`（中文翻译、关键句、解析、逐项分析、生词、语法；`FIX` 修正抽取问题/加下划线）。
  - 5–10 题图片从原卷裁剪：`reading/img/r{n}_q{m}.png`。
- 已收录：第96回（48题，42–43 官方因版权未公开原文）、第91回（50题）、第83回（50题）、第60回（50题），共198题。
- 深链接：`?reading=1`、`?reading=1&type=insert`（题型 id：grammar synonym ad match order blank long headline blank2 match2 theme insert long2）、`?reading=1&round=60`（或 91 / 83 / 96）、`&tab=mock|wrong|tips`。

## 听力（`listening/`）

- 顶部「🎧 听力」：攻略（考试概况、各题号做法、**没听懂时怎么选**、信号词、每日练法，每条都链接到真题例子）、真题练习（选回次 → 按题号分组的题目列表 → 听音频、选答案 → 答案 + 대본 + 中文翻译 + 解析/陷阱/对应攻略/生词）、按题型练（两回混合）、错题本（错因标签：单词 / 转折 / 同义改写 / 没听清）。
- 数据 `listening/data.json` 由 `python3 tools/build_listening.py` 生成，全部来自 topik.go.kr 官方公开资料：
  - 题干 / 选项 / 正答：官网「기출문제 풀어보기」的官方题目脚本 `https://www.topik.go.kr/asset/exam/exam{n}/exam_{n}_2_h.js` → `node tools/listening_src/parse_exam_js.js {n} <下载目录>` → `tools/listening_src/official_{n}.json`；
  - 듣기 대본：官网 기출문제 자료실的「{n}회 TOPIK II 듣기 대본」PDF；83回是文字版（pdftotext），96回是扫描件（300dpi OCR 后对照原 PDF 和原音频逐句校对）→ `tools/listening_src/script{n}.py`；
  - 音频：官方 1교시 듣기 MP3，按 `tools/listening_src/cuts_{n}.json`（起止秒数，静音检测 + 两遍重复的互相关对齐）用 ffmpeg 切成每段一个文件 `listening/audio/{n}/qNN.mp3`（单声道 22.05kHz 48kbps，`-vn` 去掉封面图）。1–20 每题一段；21–50 每两题一段、只保留第一遍（页面上“从头听”即第二遍）。重新切：`ffmpeg -ss <起> -to <止> -i {n}_2.mp3 -vn -ac 1 -ar 22050 -b:a 48k qNN.mp3`；
  - 1–3 题图片：官方题目图片 `listening/img/l{n}_q{m}_{1-4}.png`；
  - 中文翻译 / 解析 / 陷阱 / 攻略标签 / 生词：`tools/listening_src/ann{n}.py`（自写评注）。攻略正文在 `listening/listening.js` 的 `guideHTML()`。
- 已收录：第96回（50题）、第83回（50题），共100题、70段音频（约 21MB）。
- 深链接：`?listening=1`（攻略）、`?listening=prac&round=83`、`?listening=1&type=idea`（题型 id：pic next act match idea doing intent who attitude topic before detail manner）、`?listening=1&q=96-14`、`?listening=wrong`。

## 语法（`grammar/`）

- 顶部「🧩 语法」：语法表（按功能分组 + 搜索）、易混组（中文对比表）、**分类练**（按功能组做整句针对性练习）、闪卡（中→韩写语法 / 句子填空写形式 / 韩→中自评 / 整句中→韩 / 整句韩→中；宽松判分 + “其实我写对了”；打字卡答错或点“不会”后有「✏️ 再写一次」：清空输入、隐藏答案重写，可无限次，单词提示保留；成绩和错题本只按第一次算，重写答对不会移出错题本，只提示“重写后答对”）、语法错题本（localStorage `topik.grammar.wrong.v1`）。
- **针对性练习（分类练）**：每一类（原因·理由、让步、推测…）可单独开练。题干是自拟/例句的**整句**，**不出现语法名称**；中→韩打字自动判分（`accepted.json` + 语尾宽松；**句末语体不同也算对**：-다/-ㄴ다/-는다、-아요/-어요/-해요/이에요/예요、반말 -아/-어/-해/이야/야、-ㅂ니다/-습니다 互相等价（含 -았/었-、-겠-，되었/됐、하였/했），只看句子最后一个谓语，命令/请求/共动 -세요/-주세요/-십시오/-아라/-자/-ㅂ시다 不归一；判对时提示“✓ 语体不同也算对（标准答案用 -다体）”。语法闪卡句子填空在空格位于句末时、中→韩对 -다 结尾的语法形式同样适用；写作卡组不受影响），答完显示参考韩语、该语法的中文意思、记忆法、易错，并可「📋 复制给老师」。进度存在本机 `topik.grammar.drill.v1`。语法表每组标题旁也有「🎯 练这一类」。
- 内容源 `tools/grammar_data.py`（111 个 TOPIK II 高频语法，16 组易混对比）+ `grammar/prac.json`（自拟整句练习），`python3 tools/build_grammar.py` 生成 `grammar/grammar.json`（含 `prac`）。例句标“真题 第N回 第M题”的均取自上面核对过的官方试卷，其余标“自拟”。
- 深链接：`?grammar=1`、`?grammar=1&g=baram`（打开某个语法）、`?cat=grammar-core&mode=zh2ko|fill|ko2zh|sent|sentzh`、`?grammar=drill`（分类目录）、`?grammar=drill&cat=cause`（练某一类）、`?cat=grammar-cause`（同上，id 见 `grammar.json` 的 `cats`）。

### 🤖 AI 判题（DeepSeek，可选）

- 语法整句 `gd:` 和语法闪卡 `gc:`（中→韩 / 句子填空）本地判错（标准答案、`accepted.json`、句末语体归一都不匹配）时，自动请 DeepSeek（`deepseek-chat`，`response_format: json_object`，`temperature: 0`）再判一次。共用代码（Key、开关、设置面板、请求/超时/错误处理）在 `assets/ai.js`（`window.TopikAI`）。
- 入口：语法闪卡工具栏 / 分类练页面 / 写作页顶部的「⚙️ AI 判题」（同一个设置面板、同一个 Key）。填 DeepSeek API Key → 保存 → 测试；可开关、清除 Key。**Key 只保存在用户浏览器的 localStorage（`topik.ai.deepseek.key`），浏览器直连 `api.deepseek.com`（已确认允许 CORS）；仓库里绝不放 Key。** 没有 Key 时和以前完全一样，只在判错时多一行提示。
- AI 判对：显示「🤖 AI 判定：正确」，按「其实我写对了」计分（重写时第一次仍记为错），并把这个写法记在本机 `topik.grammar.aiAccepted.v1`，下次直接判对。AI 判错：在错误反馈下显示错误点、改正和 📌 提示。超时（20 秒）/ 网络错误 / 401 / 格式错误时显示简短错误，按本地判分。「📋 复制给老师」照常可用，复制内容附带 AI 判定。
- **写作 AI 评分**（`writing/wai.js`，经 `TopikAI.chatJSON`）：
  - 51·52：「交卷 · 看参考答案 + 🤖 AI 评分」或「🤖 只要 AI 评分」→ 每空 5 分、共 10 分（意思对但有语法/拼写错 ≈3 分，部分符合 1–2 分）；检查语法、拼写、띄어쓰기、上下文衔接；51 用 -습니다 体和敬语（드리다 / -시-），52 用 -다 体不用 저/제；不是比对任务。返回每空 `score/correct/errors[{wrong,right,why}]/corrected/tags`（`mylog.json` 的类型 id）+ `total/tip`。超时 45 秒。
  - 53·54：「🤖 交卷 · AI 批改」→ 按官方配分：**53 = 内容及任务完成 7 + 文章结构 7 + 语言使用 16 = 30；54 = 12 + 12 + 26 = 50**。传本地算好的字数（含空格、不含换行），53 要对照图表数据，54 要回答每个小问题。返回 `score/breakdown/level_estimate/errors[{wrong,right,错因,tag}]`（`essaylog.json` 的标签）`/rewrite/rules/summary`。超时 90 秒，`max_tokens` 6000。
  - AI 的 `errors` 只保留能在学生答案里原样找到的片段；分数按配分截断，53·54 总分 = 三项之和。AI 输出一律按纯文本显示。
  - 记录只存在本机：51·52 → `topik.writing.ai.v1`（格式同 `mylog.json` 的 entries，加 `ai:true`），53·54 → `topik.w54.ai.v1`（格式同 `essaylog.json` 的 attempts）。和老师批改一起显示在每题的批改记录 /「📚 我之前的作文」/ 易错点里，标「🤖 AI」；「已做 N 次 · 最近 X分」两种都算。作答框每次打开仍是空白。「📋 复制给老师」附带 AI 分数和评语。

## ☁️ 多设备进度同步（GitHub 私密 Gist，可选）

- 入口：顶部导航下面的同步状态行「☁️ … ⚙️ 设置」（每个页面都有）；AI 判题设置面板里也有「进度同步设置」按钮。代码在 `assets/sync.js`（必须在其它模块之前加载）。
- 设置：创建 classic token（<https://github.com/settings/tokens/new?scopes=gist&description=topik-sync>，**只勾 gist**，不过期）→ 在每台设备粘贴同一个 Token。第一次同步自动建私密 Gist `topik-progress.json`；另一台设备没有 Gist ID 时会在你的 gist 里按文件名找到它（也可以手动填 Gist ID）。
- **Token 只存在本机 localStorage（`topik.sync.token`），不同步、不进仓库；DeepSeek Key 也不同步。** 仓库里绝不放 Token。
- 同步的 key：`topik.wrong.v1`、`topik.bank.v1`、`topik.writing.v1`、`topik.wg.wrong.v1`、`topik.w54.wrong.v1`、`topik.writing.ai.v1`、`topik.w54.ai.v1`、`topik.grammar.wrong.v1`、`topik.grammar.drill.v1`、`topik.grammar.aiAccepted.v1`、`topik.reading.v1`、`topik.reading.last`、`topik.listening.v1`（听力作答 `a` 取 `t` 较新；错题 `w` 取 `last` 较新、次数 `n` 取大）。不同步：Key/Token、界面偏好（`topik.view`、`topik.mode`、各种 `*.opt*`、`topik.ai.on`、`topik.grammar.hintsOn.v1`、`topik.wsplit.v1`）、进行中的整套模拟 `topik.reading.mock.v1`。
- 合并：三方合并（本机上次同步时的共同版本 `topik.sync.base` + 本机 + 云端）。只有一边改了 → 用改了的一边（删除也会同步，比如错题答对移出、清空错题本）；两边都改了 → 按数据形状合并：对象逐键合并、计数取大、数组按 id 并集去重、带时间戳的记录（词库每词 `l`/`n`，自评 `t`，阅读作答 `t`，分类练 `lastAt`）取较新的一条；其它标量按该 key 最后修改时间。没有共同版本（第一次同步、云端被别的设备覆盖过）时做并集，任何一边的数据都不丢。
- 时机（自动同步 = 拉取 + 合并 + 上传，**所有标签页合计最多每 5 分钟一次**；上次同步时间存在 `topik.sync.last`，刷新页面 / 切换模块 / 开新标签页都不会重新同步）：
  - 打开网站、回到前台：距上次同步满 5 分钟才同步，否则什么都不做。只有拉到了其他设备的新进度、且刚打开还没操作时才自动刷新一次页面；没变化的例行同步不弹提示。
  - 做题产生新进度（`topik.sync.dirty` 记最后修改时间）：不再 5 秒后上传，而是排一个定时器，在“距上次同步满 5 分钟”时同步一次。
  - 切到后台 / 锁屏 / 关闭页面：如果有还没上传的进度（且距上次同步 ≥1 分钟），静默补传一次（不弹提示、不刷新），防止手机上的进度只留在本机。
  - 「立即同步」按钮不受限制，马上同步。关掉「自动同步」后只有手动同步。
各模块监听 `topik-sync` 事件重新读取 localStorage，避免内存里的旧数据覆盖合并结果。
- 测试：`node tools/test_sync_merge.js`。

## 问老师 · 老师认可的写法（`accepted.json`）

所有打字闪卡（单词 中→韩、`?cat=writing-5354`、`?cat=writing-grammar`、`?cat=grammar-core` 中→韩/句子填空、语法整句练习 `?grammar=drill`）
判错时会多一个 **📋 复制给老师** 按钮，复制的内容：

```
【闪卡待判】卡组：写作53·54 闪卡（writing-5354） · 卡片ID：w54:p11
中文：先增加后减少（增长后转为下降）
标准答案：증가하다가 감소하였다
我写的：늘어가다가 줄어들었다
请帮我判断对不对，对的话加到正确答案里。
```

老师判断是对的，就把这个写法加进 `accepted.json`。之后在任何卡组里写出这个写法都判对，显示
「✅ 对（老师认可的写法）」＋老师说明＋标准答案；卡片的详情面板（📖）里列出「✅ 也可以写（老师认可）」。
比较时按各卡组自己的判分规则（忽略空格/标点；53·54 里 하였/했、되었/됐 视为相同，也接受前面多写词干）。
标准答案本身仍显示普通的「✓ 对了」。

**卡片ID**（稳定、唯一，复制给老师的文字里就有）：

| 前缀 | 卡组 | 例子 |
|---|---|---|
| `v:<韩语词>` | 每日/分类单词卡（同一个词在各天、各分类共用一个ID） | `v:고령화` |
| `w54:<id>` | 写作 53·54 闪卡（`writing/w5354.json` 的 id） | `w54:p11` |
| `wg:<id>` | 写作 51·52 语法闪卡（`writing/grammar.json`） | `wg:req-jusigi` |
| `gc:<id>` | 语法闪卡 中→韩（`grammar/grammar.json`） | `gc:baram` |
| `gc:<id>#<n>` | 语法闪卡 句子填空第 n 句（从 0 起） | `gc:baram#0` |
| `gd:<id>#<n>` | 语法整句练习第 n 句（`prac`+干净例句） | `gd:baram#0` |

**命令行** `tools/add_accepted.py`：

```bash
python3 tools/add_accepted.py --find "先增加后减少"            # 用韩语或中文查卡片ID（空格分隔=同时包含）
python3 tools/add_accepted.py w54:p11 "늘어나다가 줄어들었다" "固有词版本，同样标准" --commit
python3 tools/add_accepted.py --show w54:p11                  # 标准答案 + 已认可的写法
python3 tools/add_accepted.py --list
python3 tools/add_accepted.py --remove w54:p11 "증가하다가 줄어들었다" --commit
```

- 第三个参数「说明」可省略；同一写法再加一次只会更新说明。和标准答案相同的写法会被拒绝（已经算对）。
- 找不到的卡片ID会报错（防止打错），确实要加用 `--force`。
- `--commit`：只 add `accepted.json` → commit → `git pull --rebase` → push（不 force，网络错误自动重试）。

`accepted.json` 格式：`{"version":1,"updated":"YYYY-MM-DD","cards":{"w54:p11":{"deck":…,"zh":…,"ko":…,"alts":[{"a":"늘어나다가 줄어들었다","note":"…"}]}}}`
（`deck/zh/ko` 只是方便人看；页面只读 `alts`）。前端代码在 `assets/accepted.js`（`window.TopikAcc`）。

## 📚 词库（TOPIK 中高级词汇，`bank/`）

顶部「📚 词库」，四个标签页：

- **⭐ 高频**：1500 个高频词，按频度从高到低，每 50 个一组；可按词性 / 中级·高级筛选；点词展开详情；「练这一组」「只练没学会的」。
- **🗂 分类**：18 个主题（社会·政治·法律 / 经济·消费 / 环境·资源 / 自然·天气·动植物 / 教育·学习 / 健康·医疗·身体 / 科技·媒体·通信 / 文化·艺术·休闲 / 情感·性格·态度 / 人物·人际·家庭 / 工作·职场 / 日常生活 / 思维·语言·表达 / 动作·变化 / 形容词·状态 / 时间·数量·位置 / 抽象概念 / 副词·连接·虚词），附数量和已学会进度；另有「按词性」入口。点进去和高频页一样（分组、筛选、练习、浏览）。
- **📅 每日50**：每天 N 个新词（默认 50，可选 10–200）＋ 到期复习。新词来源可选 ⭐高频（默认，按频度顺序）/ 全部（先高频再其余）/ 某个分类；只有没练过的词才算新词。当天计划固定（换来源/改数量会保留当天已练的词）；做完可「再加 N 个新词」。
- **📈 进度**：已学会 / 总数（高频 / 中级 / 高级 / 全部）、连续天数、今天已练、今天待复习、最近 14 天柱状图、各分类进度。

练习：**中→韩 打字**（自动核对；支持 `accepted.json` 老师认可的写法；判错时有「📋 复制给老师」「其实我写对了」；写成了词库里的另一个词会提示那个词的意思）和 **韩→中 自评**（不做字符串比对）。答错自动展开「📖 词性·记忆法·近反义词」，答对可以点开看。没有选择题。

间隔复习（localStorage `topik.bank.v1`）：答对一次升一级，1/2/4/7/15/30 天后再出现；答错 → 级别归零、明天复习、本轮末尾再出一次，并记入单词错词本 `topik.wrong.v1`（同样的键 `v|<韩语>`，自带词条信息）。重练入口：📇 闪卡顶部红色「📕 错词本 · 重练错词」按钮（题库下拉也有「错词本」），或 📚 词库 →「📕 错词」标签；中→韩打字 / 韩→中自评，答对后从该模式移出。“已学会”＝至少答对过一次。卡片 ID 和每日单词卡一样是 `v:<韩语词>`，`tools/add_accepted.py` 能找到词库的词。

深链接：`?bank=1`（上次的标签页）、`?bank=hf`、`?bank=daily`、`?bank=cat`、`?bank=cat&c=economy`（分类 id 见 `bank/index.json` 的 `cats`）、`?bank=progress`、`#bank`。

### 数据来源与许可

- 词表：国立国语院《한국어 학습용 어휘 목록》（2003，5,965 词，A 初级 / B 中级 / C 高级；「순위」＝国立国语院 2002《현대 국어 사용 빈도 조사》的频度排名）。
  官方 xls：<https://www.korean.go.kr/front/etcData/etcDataView.do?etc_seq=71>（공공누리 제1유형：注明出处即可自由使用）。
  收录 B 2,111 + C 2,872 中除专有名词（地名/人名）外的全部词；同形的不同词（如 가구 家口/家具）合并成一张卡（ID 不变），意思用「；」分开。
- 中文对译、汉字（原语）、发音、例句、语义范畴、反义词/유의어：国立国语院《한국어기초사전》（krdict.korean.go.kr，CC BY-SA 2.0 KR），用的是 Hugging Face 上的全量导出 `hac541309/basic_korean_dict`（xls_20230601）。例句全部是词典原句（没有中文翻译）。
- 汉字只用词典标注的原语（NIKL 列表给的汉字与词典对不上时以 NIKL 为准，并人工补中文）；繁体 → 简体用 OpenCC t2s ＋ 韩国异体字表。
- **高频**＝频度排名最靠前的 1500 个 B+C 词；在本站阅读真题（第60·83·91·96回，`reading/rounds.json` 的原文和生词表）里出现过的词，排名按 ×2 加权提前。不是 TOPIK 官方频度表（官方没有公开）。

### 词条信息怎么来的

`tools/build_bank.py` 按下面的顺序合成（后面的覆盖前面的）：
1. 自动：中文意思（词典对译，第一义项 1–2 个 + 其他义项）、词性（하다/되다 词标注）、汉字、例句、反义词（词典「반대말」）、近义词（词典「유의어」＋ 同一中文对译、同词性的词库词）。
2. 自动记忆法：汉字词逐字对齐「경(竞)+쟁(争) → 竞争」；字面和中文意思不一样的（如 심각하다 深刻 → 严重）自动加「⚠️ 汉字是…但意思是…」；派生/合成词拆词（…+하다、…+스럽다、-아/어지다、名词+名词）；外来词标英语原词。
3. 自动易错：发音和拼写不同（[가능썽]、[부조카다]）；同形词（등 背 / 등 灯 / 등 等）。
4. `wordinfo.json` 里已有的手写词条（和每日词库保持一致）。
5. 人工补充 `tools/bank_src/manual*.txt`（固有词记忆法、易错、近反义词、修正中文意思和分类）：
   `가꾸다 | mem=… | tip=… | syn=꾸미다(装饰), 기르다(养) | ant=… | zh=… | cat=daily | ex=… | exzh=…`（`tipadd=` 在自动易错后面追加）。
   现状（2026-10-02）：全部 4,687 词都有 中文意思＋词性＋记忆法＋近义/同类或反义词；`manual_hf1-7.txt` 是高频 1500 词逐条人工校对，`manual_rest1-7.txt` 是其余词（固有词记忆法、派生词补释义、近反义词）。其余词里汉字词的记忆法和部分近义词是自动生成的，比高频部分粗；具体物品名的「近义词」多是同类词（标“同类”）。

生成：`python3 tools/build_bank.py`（`--stats` 只看统计）→ `bank/index.json`（词表 ~210KB：韩语、中文、分类、级别、高频、词性）＋ `bank/o-NN.json`（按学习顺序每 250 词一块的详情，每日/高频练习用）＋ `bank/c-<分类>.json`（按分类的详情）。详情文件带 `?v=<build>` 缓存，改了内容 build 号自动变。
原始数据重新抽取：`python3 tools/bank_extract.py`（需要官方 xls 和词典导出，见脚本开头）→ `tools/bank_src/base.json`。

## 动词 自动/他动/被动/使动 标签（`voice.json`）

中→韩 时 끝나다/끝내다、열다/열리다、먹다/먹이다 这类词中文意思一样，分不清该写哪个，所以每个动词都标了：

- `自`（自动词，不及物，例：끝나다）/ `他`（他动词，带 을/를，例：끝내다）/ `自他`（两用，例：움직이다、멈추다）/ `被动`（例：열리다、잡히다、쓰이다；X되다 是 X하다 的被动时也标被动，如 사용되다）/ `使动`（例：먹이다、알리다、높이다）。
- `voice.json` 是总表：`{"끝내다": {"voice": "他", "pair": [{"ko": "끝나다", "voice": "自"}]}}`；`pair` 是对应词。同形异义词可以加 `"zh": {"聋": {"voice": "自"}}`（按卡片中文意思选标签，如 먹다）。
- `python3 tools/apply_voice.py` 把总表写进所有词汇数据（`bank/o-*.json`、`bank/c-*.json`、`wordinfo.json`、`decks/*.json`、`categories/*.json`）：pos 含「动词」的词条加 `voice`（和 `pair`），其它字段不动；同时更新 `bank/index.json` 的 `build`（分块缓存版本）。`--check` 只列出没有标签的动词。`tools/build_bank.py` 重建词库时也会带上。
- 每日新词：`publish.py` 自动从 `voice.json` 补 `voice`/`pair`；HTML 里给了 `voice` 而总表没有的动词会写进 `voice.json`；都没有的打印 `WARNING`（请补进 `voice.json`）。
- 显示：闪卡（每日/分类/全部/错题本）和 📚 词库练习在**题目上**显示「动词·他动」小标签（中→韩 就能看到）；答案里直接显示说明和「↔ 끝나다（自动）」，词库词表点开的详情里也有。`assets/voice.js` 负责显示，没有 `voice` 字段的旧错题用 `voice.json` 补。
- 可下载的每日闪卡 HTML：`python3 tools/build_flashcards.py vocab.json --date YYYY-MM-DD --theme "主题"`（模板 `tools/flashcard_template.html`，自动补 `voice`），或 `python3 tools/build_flashcards.py 旧的.html` 用新模板原地重新生成。

