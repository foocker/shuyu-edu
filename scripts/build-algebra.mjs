import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(scriptDir, '..');
const sourceDir = resolve(siteDir, '..', 'shuyu', 'part', 'safa');
const chapterDir = join(sourceDir, 'chapters');
const assetDir = join(siteDir, 'assets', 'safa');

const readChapter = (name) => readFileSync(join(chapterDir, name), 'utf8');

function section(text, start, end) {
  const startAt = text.indexOf(start);
  if (startAt < 0) throw new Error(`Missing section marker: ${start}`);
  const endAt = end ? text.indexOf(end, startAt + start.length) : text.length;
  if (end && endAt < 0) throw new Error(`Missing next section marker: ${end}`);
  return text.slice(startAt, endAt).trim();
}

const chapter1 = readChapter('chapter_01_part_00.tex');
const chapter3a = readChapter('chapter_03_part_00.tex');
const chapter3b = readChapter('chapter_03_part_01.tex');
const chapter4 = readChapter('chapter_04_part_00.tex');

const selections = [
  {
    id: 'irrational-root-two', group: '整数', tool: 'root-two',
    tex: section(chapter1, '\\section{1 $ \\sqrt{2} $ 不是有理数}', '\\section{2 其他平方根的无理性}')
  },
  {
    id: 'prime-factorization', group: '整数', tool: 'factor',
    tex: section(chapter1, '\\section{3 自然数的素分解}')
  },
  {
    id: 'sets-subsets', group: '有限集', tool: 'subset',
    tex: section(chapter3a, '\\section{7 集合与子集}', '\\section{8 组合}')
  },
  {
    id: 'combinations', group: '有限集', tool: 'combination',
    tex: section(chapter3a, '\\section{8 组合}', '\\section{9 集代数}')
  },
  {
    id: 'set-algebra', group: '有限集', tool: 'set-algebra',
    tex: `${section(chapter3a, '\\section{9 集代数}')}\n${chapter3b.slice(0, chapter3b.indexOf('\\section{10 概率的语言}')).trim()}`
  },
  {
    id: 'probability', group: '有限集', tool: 'probability',
    tex: section(chapter3b, '\\section{10 概率的语言}', '\\section*{补充：切比雪夫不等式}')
  },
  {
    id: 'infinite-primes', group: '素数', tool: 'euclid-primes',
    tex: section(chapter4, '\\section{11 素数的个数是无限的}', '\\section{12 欧拉关于素数有无限多个的证明}')
  },
  {
    id: 'prime-distribution', group: '素数', tool: 'prime-sieve',
    tex: section(chapter4, '\\section{13 素数的分布}', '\\section{补充：关于  $ \\pi(n) $ 的切比雪夫不等式}')
  }
];

function convert(tex) {
  return execFileSync('pandoc', [
    '--from=latex', '--to=html5', '--mathml', '--wrap=none'
  ], {
    cwd: sourceDir,
    input: tex,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024
  })
    .replaceAll('src="imgs/', 'src="assets/safa/')
    .replace(/<h1([^>]*)>/, '<h2$1>')
    .replace(/<\/h1>/, '</h2>');
}

const articles = selections.map((item, index) => {
  const html = convert(item.tex);
  return `<article class="book-section" id="${item.id}" data-tool="${item.tool}" data-index="${index}">\n${html}\n</article>`;
}).join('\n');

mkdirSync(assetDir, { recursive: true });
const imageNames = new Set([...articles.matchAll(/assets\/safa\/([^"?#]+)/g)].map((match) => match[1]));
for (const name of imageNames) {
  copyFileSync(join(sourceDir, 'imgs', name), join(assetDir, name));
}

const navigation = selections.map((item) => {
  const title = item.tex.match(/\\section\*?\{([^\n]+)\}/)?.[1]
    .replace(/\$\s*\\sqrt\{2\}\s*\$/g, '√2')
    .replaceAll('\\', '') || item.id;
  return `<a href="#${item.id}" data-section-link="${item.id}"><span>${title.match(/^\d+/)?.[0] || ''}</span>${title.replace(/^\d+\s*/, '')}</a>`;
}).join('\n');

const template = readFileSync(join(siteDir, 'algebra-zh.template.html'), 'utf8');
const output = template
  .replace('<!-- BOOK_NAVIGATION -->', navigation)
  .replace('<!-- BOOK_CONTENT -->', articles);

writeFileSync(join(siteDir, 'algebra-zh.html'), output, 'utf8');
console.log(`Built algebra-zh.html: ${selections.length} sections, ${imageNames.size} source images.`);
