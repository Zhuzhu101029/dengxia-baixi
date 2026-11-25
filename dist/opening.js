// A single clock sets the rhythm. Glyphs stay in their final positions while the ink develops.
const foreword = document.getElementById('foreword');
const enterStory = document.getElementById('foreword-enter');
const storyLines = document.getElementById('foreword-lines');
const mainGame = document.querySelector('main');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let openingFrame = 0;
const passages = Array.from(storyLines.children, p => p.textContent);
document.getElementById('foreword-reading').textContent = passages.join(' ');

function beginForeword() {
  cancelAnimationFrame(openingFrame);
  mainGame.inert = true;
  foreword.className = '';
  foreword.hidden = false;
  enterStory.disabled = true;
  foreword.focus({preventScroll:true});
  const brief = motionPreference.matches;
  let at = brief ? 60 : 560;
  const cues = [];
  Array.from(storyLines.children).forEach((line, i) => {
    line.replaceChildren();
    for (const character of passages[i]) {
      const glyph = document.createElement('span');
      glyph.textContent = character;
      line.append(glyph);
      cues.push({at, glyph});
      const pause = /[。？！]/.test(character) ? 300 : /[，、：]/.test(character) ? 130 : 0;
      at += brief ? 22 : 74 + pause;
    }
    at += brief ? 80 : 340;
  });
  const start = performance.now();
  let next = 0;
  function reveal(now) {
    const elapsed = now - start;
    while (next < cues.length && cues[next].at <= elapsed) cues[next++].glyph.classList.add('ink');
    if (elapsed < at + (brief ? 25 : 230)) {
      openingFrame = requestAnimationFrame(reveal);
    } else {
      enterStory.disabled = false;
      foreword.classList.add('ready');
    }
  }
  openingFrame = requestAnimationFrame(reveal);
}

function enterFromForeword() {
  if (!foreword.classList.contains('ready')) return;
  foreword.classList.replace('ready', 'entering');
  enterStory.disabled = true;
  const brief = motionPreference.matches;
  // Audio activation belongs to this gesture, even when the painted dissolve is still playing.
  stageSound.unlock();
  setTimeout(() => {
    mainGame.inert = false;
    if (s.stage !== 4) el('start').click();
    foreword.classList.add('departing');
    setTimeout(() => {
      foreword.hidden = true;
      if (s.stage === 4) el('start').focus({preventScroll:true});
    }, brief ? 0 : 1120);
  }, brief ? 0 : 1950);
}
foreword.addEventListener('click', enterFromForeword);
window.addEventListener('keydown', event => {
  if (foreword.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
  event.stopImmediatePropagation();
  if (event.key === 'Tab') {
    event.preventDefault();
    if (!enterStory.disabled) enterStory.focus();
  } else if (['Enter',' '].includes(event.key)) {
    event.preventDefault();
    if (!event.repeat) enterFromForeword();
  }
}, true);
window.addEventListener('keyup', event => {
  if (!foreword.hidden) event.stopImmediatePropagation();
}, true);
beginForeword();
