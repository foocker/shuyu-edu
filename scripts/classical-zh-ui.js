/* Localize reader chrome and figure captions without modifying geometric IDs. */
(function () {
  'use strict';
  const dictionary = window.__SHUYU_UI_ZH__ || {};
  const attrs = ['title', 'aria-label', 'placeholder'];
  const skip = 'script,style,[lang="el"],[translate="no"]';
  function translate(value) {
    const key = value.trim();
    if (!key || /[\u3400-\u9fff]/.test(key)) return value;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) return value.replace(key, dictionary[key]);
    return value
      .replace(/Not treated as its own theorem in Augros Chapter (\d+)\./g, '奥格罗斯课程第 $1 章未单列此命题。')
      .replace(/\bBooks? ([IVX]+)(?:–([IVX]+))?/g, (_, a, b) => b ? `第 ${a}—${b} 卷` : `第 ${a} 卷`)
      .replace(/\bChapter (\d+)/g, '第 $1 章').replace(/\bCh\.(\d+)/g, '第 $1 章')
      .replace(/\bDefinition\s+(\d+)/g, '定义 $1').replace(/\bPostulate\s+(\d+)/g, '公设 $1')
      .replace(/\bTheorem\s+([\w]+)/g, '定理 $1').replace(/\bGeneral Principle\s+(\d+)/g, '公理 $1')
      .replace(/\bCommon Notion\s+(\d+)/g, '公理 $1').replace(/\bProposition\s+(\d+)/g, '命题 $1')
      .replace(/\bPrinciple\s+(\d+)/g, '原则 $1').replace(/\bGen\. Pr\.\s*(\d+)/g, '公理 $1')
      .replace(/\bch(\d+):thm:(\w+)/g, '第 $1 章 · 定理 $2')
      .replace(/\bstep (\d+) of (\d+)/gi, '步骤 $1 / $2')
      .replace(/\b(\d+) lines? broken/g, '$1 个步骤不成立')
      .replace(/\bConstruction · /g, '作图 · ').replace(/\bElements (?=[IVX])/g, '原本 ')
      .replace(/\bThm\.\s*/g, '定理 ').replace(/\bDef\./g, '定义').replace(/\bPost\./g, '公设')
      .replace(/\bC\.N\./g, '公理').replace(/\bTheo\./g, '定理').replace(/\bPrinc\./g, '原则')
      .replace(/\bStep (\d+)/g, '步骤 $1');
  }
  function node(n) {
    if (n.nodeType === Node.TEXT_NODE) {
      if (!n.parentElement || n.parentElement.closest(skip)) return;
      const value = translate(n.nodeValue);
      if (value !== n.nodeValue) n.nodeValue = value;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE || n.matches(skip)) return;
    for (const attr of attrs) {
      if (!n.hasAttribute(attr)) continue;
      const old = n.getAttribute(attr), value = translate(old);
      if (value !== old) n.setAttribute(attr, value);
    }
    for (const child of n.childNodes) node(child);
  }
  function start() {
    node(document.body);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes' || record.type === 'characterData') node(record.target);
        else for (const added of record.addedNodes) node(added);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attrs });
  }
  const style = document.createElement('style');
  style.textContent = 'html[lang="zh-CN"]{--serif:"Noto Serif SC","Source Han Serif SC","Songti SC",SimSun,serif}' +
    '.scrollitem .statement,.scrollitem .kid{overflow-wrap:anywhere;word-break:break-word}' +
    '.scrollfig{width:100%;box-sizing:border-box}.scrollfig svg{max-width:100%}' +
    '@media(max-width:900px){.scrollwrap{max-width:100%;overflow-x:hidden}.scrollitem{min-width:0}.scrollitem .title{overflow-wrap:anywhere}header .shelf .tbtn{padding:6px 8px}header h1{font-size:16px}header .shelf{flex-shrink:0}}';
  document.head.appendChild(style);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
