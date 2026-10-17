# shuyu-edu

这是一个面向原创交互式书籍的阅读与学习平台。项目采用静态网页构建，每本书都可以拥有独立的中文页面、英文页面和交互式练习。

## 当前书籍

- [几何原本（中文）](https://foocker.github.io/shuyu-edu/index-zh.html)
- [Geometry（英文）](https://foocker.github.io/shuyu-edu/index.html)
- [算术（中文）](arithmetica-zh.html)
- [Arithmetic（英文）](arithmetica.html)
- [三段论艺术（中文）](https://foocker.github.io/shuyu-edu/ars-syllogistica-zh.html)
- [Ars Syllogistica（英文）](https://foocker.github.io/shuyu-edu/ars-syllogistica.html)
- [与中学生谈谈代数（中文精选交互版）](https://foocker.github.io/shuyu-edu/algebra-zh.html)

在线入口：<https://foocker.github.io/shuyu-edu/>

## 项目约定

顶栏用于切换书籍，中文和英文由独立的语言按钮切换。新增书籍时，在 `site-nav.js` 的 `pages` 列表中加入对应文件即可；仅提供一种语言的书籍可以只配置该语言。

后续将持续加入原创的交互式书籍、练习和阅读工具。

## 原始参考

- [Classical Mathematics](https://gcrastinus.github.io/Classical-Mathematics/)
- [Ars Syllogistica](https://gcrastinus.github.io/ars-syllogistica/)

## 几何与算术同步（2026-10-17）

已核对原站在线页面，并同步至上游提交 [`1e62bbfa0e89`](https://github.com/gcrastinus/Classical-Mathematics/commit/1e62bbfa0e897abf86ae629b399cefe9e6ead152)。下载文件与该提交中的文件逐字节一致；版本号与 SHA-256 校验值记录在 `scripts/classical-upstream.json`。

- 几何课程由第 1 章扩展至第 6 章：原有 39 条定理，加上新增 87 条，共 126 条。
- 新增《几何原本》第 I—VI 卷，共 173 条命题，支持课程／原典切换、对应命题跳转和希腊文对照。
- 新增独立算术中英文页面：第 7 章课程共 32 条定理，原典第 VII 卷共 39 条命题。第 VIII—XIII 卷未包含在原站当前发布页面内，不能据仓库中的提取文件视为已经上线。
- 保留本站书籍菜单、中文默认入口及原有中文修订；切换语言时保留当前命题位置。
- 修复原站两处外切图形的标签方向参数，并修正外接多边形的半径，使各边确实与圆相切。这些补丁在同步脚本内有精确匹配检查。
- 补上原站遗漏的第 2—6 章课程定理的全屏作图入口。

新增的课程和原典定义、定理／命题标题已人工校订，证明正文采用机器初译并做术语、符号和抽样检查，尚未逐句人工审校。英文页面保留原文；中文数据中的希腊文和未显示的重复英文证明原稿也予以保留。后续校订优先修改 `scripts/classical-reviewed-zh.json`（按条目 ID）或 `scripts/classical-zh-overrides.json`（按原文），再重新构建。

本次术语校订依据同一工作区的 [`../math-translator/dictionaries/merged.json`](../math-translator/dictionaries/merged.json)，覆盖几何、算术的标题、定义、证明、对应目录和图注。统一采用“比例中项”“比例第三项”“外中比”“复比”“完满数”“三角形数”“素因数分解”“米凯尔点”“德萨格定理”等译名；同时修正对顶角、内错角、圆周角、弓形、全等、互余等误译。修改保存在本地翻译 JSON 中，重新构建即可复现，不依赖运行时加载外部词典。

多义词按原文语境选义：几何中的 congruence 取“全等”，古典算术中的 common measure 取“公因数”，动词 measure 表示“整除”；multitude 依词典译为“多数”，在定义中说明它指多个同类事物的集合。比例变换采用词典完整词条中的“更比／反比／合比／分比”，避免套用单词的其他义项。词典未收录或解释不足的古典术语保留上下文校订，本轮不代表全部证明已完成逐句语义审校。

在项目根目录执行：

```sh
python scripts/sync-classical.py
python scripts/sync-classical.py --check
node scripts/check-classical.cjs
```

构建只读取固定版本的上游文件和本地翻译，不会调用翻译服务。首次运行从 GitHub 下载固定版本并校验，随后使用 `.cache/`；也可用 `--source-dir DIR` 指定已下载的原始 `index.html` 与 `arithmetica.html`。更新上游时需同时更新清单、补齐新增译文，并检查本地补丁是否仍适用。当前构建要求原典命题都有完整的分步证明；若上游新增仅有整段证明的命题，会停止并要求补译正文。

验证覆盖四个页面的内嵌脚本语法、双语内容结构、引用与几何标识，以及全部 378 个图形的 SVG 渲染和两处外切图形的相切关系。浏览器验证另外覆盖课程／原典目录、手机布局、证明播放、全屏作图、搜索、语言切换和希腊文开关。
