/* When I'm Gone — jsdom check harness.
   Build 1.0 (2) checks: video messages (record/pick/replace/send/delete),
   will photo storage, Alberta legality screen, funeral-ideas page,
   plus the standing build-1 invariants (no donate panel, no Matt 5:4,
   talk fallback, tips switch, all screens reachable, plan gathers).
   Usage: node tools/harness.js [path-to-index.html]
   jsdom resolves from NODE_PATH or the date-night-planner notes install.
   IndexedDB and URL.createObjectURL are shimmed in-memory: the flows are
   exercised end to end, but real camera capture and real share-sheet
   behaviour can only be proven on a phone. */
'use strict';
const fs = require('fs');
const path = require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) { ({ JSDOM, VirtualConsole } = require('/home/hatch/workspace/date-night-planner/notes/node_modules/jsdom')); }

const file = process.argv[2] || path.join(__dirname, '..', 'www', 'index.html');
const pkgDir = path.join(__dirname, '..');
const html = fs.readFileSync(file, 'utf8');

let pass = 0, fail = 0;
const failures = [];
function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; failures.push(name); console.log('FAIL: ' + name); }
}
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
async function waitFor(name, fn, timeout) {
  const t0 = Date.now();
  while (Date.now() - t0 < (timeout || 4000)) {
    if (fn()) return true;
    await tick(40);
  }
  console.log('TIMEOUT waiting for: ' + name);
  return false;
}

/* ---------- static source checks ---------- */
check('no donate panel (paid app)', !/donate/i.test(html));
check('no Matthew 5:4 reference', html.indexOf('5:4') === -1);
check('locked not-a-will line present', html.indexOf('This app is not a will. It helps your family find yours.') !== -1);
check('honest video line present', html.indexOf('can be lost with the phone') !== -1);
const plist = fs.readFileSync(path.join(pkgDir, 'ios/App/App/Info.plist'), 'utf8');
check('Info.plist camera string', plist.indexOf('NSCameraUsageDescription') !== -1);
check('Info.plist photo library string', plist.indexOf('NSPhotoLibraryUsageDescription') !== -1);
check('Info.plist mic string', plist.indexOf('NSMicrophoneUsageDescription') !== -1);
check('Info.plist speech string', plist.indexOf('NSSpeechRecognitionUsageDescription') !== -1);
const pbx = fs.readFileSync(path.join(pkgDir, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
check('iOS build number is 2 (x2)', (pbx.match(/CURRENT_PROJECT_VERSION = 2;/g) || []).length === 2);

/* ---------- jsdom setup with media shims ---------- */
const jsErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  const msg = String((e && e.message) || e);
  if (msg.indexOf('Not implemented') !== -1) return; // anchor navigation etc.
  jsErrors.push(msg);
});
vc.on('error', (m) => jsErrors.push(String(m)));

function makeIDB() {
  const data = new Map();
  function req(result) {
    const r = { result: result };
    setTimeout(() => { if (r.onsuccess) r.onsuccess({ target: r }); }, 0);
    return r;
  }
  const storeObj = {
    put(rec) { data.set(rec.id, rec); return req(undefined); },
    get(id) { return req(data.get(id)); },
    delete(id) { data.delete(id); return req(undefined); }
  };
  const db = {
    transaction() { return { objectStore() { return storeObj; } }; },
    objectStoreNames: { contains() { return true; } },
    createObjectStore() { return storeObj; }
  };
  return {
    open() {
      const r = {};
      setTimeout(() => { r.result = db; if (r.onsuccess) r.onsuccess({ target: r }); }, 0);
      return r;
    },
    _data: data
  };
}

const idb = makeIDB();
let shareCalls = [];
const dom = new JSDOM(html, {
  url: 'https://example.org/',
  runScripts: 'dangerously',
  virtualConsole: vc,
  beforeParse(window) {
    window.indexedDB = idb;
    window.URL.createObjectURL = function () { return 'blob:fake'; };
    window.URL.revokeObjectURL = function () {};
    window.scrollTo = function () {};
  }
});
const { window } = dom;
const document = window.document;
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const store = () => JSON.parse(window.localStorage.getItem('whenImGone.v1') || '{}');
function clickBtn(root, textPart) {
  const b = $$('button', root).find(x => x.textContent.indexOf(textPart) !== -1);
  if (!b) throw new Error('button not found: ' + textPart);
  b.click();
  return b;
}
function goTo(id) {
  const b = $('[data-go="' + id + '"]');
  if (!b) throw new Error('no door to ' + id);
  b.click();
}
function goHome() { $('.screen.active .btn-home').click(); }
function activeId() { const s = $('.screen.active'); return s ? s.id : ''; }
function pickFile(fileObj) {
  const inp = $('input.media-pick');
  if (!inp) throw new Error('no media picker input open');
  Object.defineProperty(inp, 'files', { value: [fileObj], configurable: true });
  inp.dispatchEvent(new window.Event('change', { bubbles: true }));
  return inp;
}

(async function main() {
  await tick(120);

  /* ---------- screens exist & doors ---------- */
  ['home','funeral','will','wills-info','where','call','gets','messages','videos',
   'willphotos','alberta','faith','cost','ideas','share'].forEach(function (id) {
    check('screen exists: ' + id, !!document.getElementById('screen-' + id));
  });
  check('home still has its eight doors + share',
    $$('#screen-home [data-go]').length === 9);

  /* ---------- funeral fields intact + talk fallback ---------- */
  goTo('funeral');
  check('funeral screen active', activeId() === 'screen-funeral');
  check('funeral still has 8 fields', $$('#funeralFields .field').length === 8);
  const talkBtn = $('#funeralFields .talk-btn');
  talkBtn.click();
  await tick(30);
  check('talk fallback line shows without speech recognition',
    $('#funeralFields .talk-note').classList.contains('show'));
  goHome();

  /* ---------- will screen: new doors ---------- */
  goTo('will');
  check('will screen has Photos door', !!$('#screen-will [data-go="willphotos"]'));
  check('will screen has Alberta door', !!$('#screen-will [data-go="alberta"]'));
  check('will screen keeps About Wills in Canada door', !!$('#screen-will [data-go="wills-info"]'));

  /* ---------- Alberta legality screen ---------- */
  goTo('alberta');
  check('alberta screen active', activeId() === 'screen-alberta');
  const albertaText = $('#screen-alberta').textContent;
  check('alberta: two witnesses', /two witnesses/i.test(albertaText));
  check('alberta: handwritten will case', /handwriting/i.test(albertaText));
  check('alberta: does-not-make-wills line',
    albertaText.indexOf('This app does not make wills') !== -1);
  goHome();

  /* ---------- will photos ---------- */
  goTo('will');
  goTo('willphotos');
  check('willphotos screen active', activeId() === 'screen-willphotos');
  check('willphotos empty state shows', $('#willPages').textContent.indexOf('No pages yet') !== -1);
  clickBtn($('#screen-willphotos'), 'Photograph a Page');
  let inp = $('input.media-pick');
  check('photograph opens image picker with camera', !!inp && inp.accept === 'image/*' && inp.getAttribute('capture') === 'environment');
  pickFile(new window.File(['imgdata'], 'page1.png', { type: 'image/png' }));
  check('will page stored after pick', await waitFor('will page', () => (store().willPages || []).length === 1, 5000));
  check('will page thumbnail renders', await waitFor('thumb', () => $$('#willPages .will-page img').length === 1));
  clickBtn($('#screen-willphotos'), 'Pick a Photo');
  inp = $('input.media-pick');
  check('pick opens image picker without camera capture', !!inp && inp.accept === 'image/*' && !inp.getAttribute('capture'));
  pickFile(new window.File(['imgdata2'], 'page2.jpg', { type: 'image/jpeg' }));
  check('second will page stored', await waitFor('page 2', () => (store().willPages || []).length === 2));
  clickBtn($$('#willPages .will-page')[0], 'Remove');
  await tick(80);
  check('will page removed', (store().willPages || []).length === 1 && $$('#willPages .will-page').length === 1);
  goHome();
  check('home will status started (photo counts)', $('[data-status="will"]').textContent.indexOf('Started') !== -1);

  /* ---------- messages -> videos ---------- */
  goTo('messages');
  check('messages screen carries Video Messages entry', !!$('#screen-messages [data-go="videos"]'));
  goTo('videos');
  check('videos screen active', activeId() === 'screen-videos');
  check('videos honest line on screen', $('#screen-videos').textContent.indexOf('lost with the phone') !== -1);
  check('funeral video card present', !!$('#funeralVideo .entry-card'));
  check('funeral empty state has Record + Pick',
    !!$$('#funeralVideo button').find(b => b.textContent.indexOf('Record a Video') !== -1) &&
    !!$$('#funeralVideo button').find(b => b.textContent.indexOf('Pick from My Videos') !== -1));

  /* record the funeral video via camera path */
  clickBtn($('#funeralVideo'), 'Record a Video');
  inp = $('input.media-pick');
  check('record opens video picker with camcorder capture', !!inp && inp.accept === 'video/*' && inp.getAttribute('capture') === 'camcorder');
  pickFile(new window.File(['viddata'], 'funeral.mp4', { type: 'video/mp4' }));
  check('funeral video renders a player', await waitFor('funeral player', () => !!$('#funeralVideo video')));
  const s1 = store();
  check('funeral meta saved once, has=true', s1.videos.filter(v => v.kind === 'funeral').length === 1 && s1.videos[0].has === true);
  check('recorded card offers RECORD A NEW ONE', !!$$('#funeralVideo button').find(b => b.textContent.indexOf('RECORD A NEW ONE') !== -1));
  check('recorded card offers SEND TO FAMILY', !!$$('#funeralVideo button').find(b => b.textContent.indexOf('SEND TO FAMILY') !== -1));
  check('last-updated line shows', $('#funeralVideo').textContent.indexOf('Last updated') !== -1);

  /* replace: newest wins, still one funeral video */
  clickBtn($('#funeralVideo'), 'RECORD A NEW ONE');
  pickFile(new window.File(['viddata-v2'], 'funeral2.mp4', { type: 'video/mp4' }));
  await waitFor('replace render', () => !!$('#funeralVideo video'));
  await tick(60);
  check('replace keeps exactly one funeral video', store().videos.filter(v => v.kind === 'funeral').length === 1);

  /* send with no share-sheet support: falls back without throwing */
  let threw = false;
  try { clickBtn($('#funeralVideo'), 'SEND TO FAMILY'); await tick(80); } catch (e) { threw = true; }
  check('SEND TO FAMILY fallback does not throw', !threw);

  /* family video: add, name, pick from library, share-sheet path */
  clickBtn($('#screen-videos'), 'Add a Video for Someone');
  await tick(60);
  check('family video card added', $$('#familyVideos .entry-card').length === 1);
  const nameInput = $('#familyVideos input[type="text"]');
  nameInput.value = 'Morgan';
  nameInput.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick(30);
  check('family video name saved', (store().videos.find(v => v.kind === 'family') || {}).name === 'Morgan');
  clickBtn($('#familyVideos'), 'Pick from My Videos');
  inp = $('input.media-pick');
  check('library pick has no capture', !!inp && inp.accept === 'video/*' && !inp.getAttribute('capture'));
  pickFile(new window.File(['famvid'], 'morgan.mov', { type: 'video/quicktime' }));
  check('family video renders a player', await waitFor('family player', () => !!$('#familyVideos video')));
  check('family card offers SEND TO FAMILY', !!$$('#familyVideos button').find(b => b.textContent.indexOf('SEND TO FAMILY') !== -1));

  shareCalls = [];
  Object.defineProperty(window.navigator, 'canShare', { value: () => true, configurable: true });
  Object.defineProperty(window.navigator, 'share', {
    value: (data) => { shareCalls.push(data); return Promise.resolve(); }, configurable: true
  });
  clickBtn($('#familyVideos'), 'SEND TO FAMILY');
  await tick(80);
  check('share sheet receives the video file',
    shareCalls.length === 1 && shareCalls[0].files && shareCalls[0].files.length === 1 &&
    shareCalls[0].files[0].name.indexOf('Morgan') !== -1);

  /* delete the family video */
  clickBtn($('#familyVideos .entry-card'), 'Remove');
  await tick(80);
  check('family video deleted', store().videos.filter(v => v.kind === 'family').length === 0 && $$('#familyVideos .entry-card').length === 0);
  goHome();
  check('home messages/videos status: videos started', $('[data-status="videos"]').textContent.indexOf('Started') !== -1);

  /* ---------- cost -> funeral ideas ---------- */
  goTo('cost');
  check('cost screen has Ways to Say Goodbye door', !!$('#screen-cost [data-go="ideas"]'));
  goTo('ideas');
  check('ideas screen active', activeId() === 'screen-ideas');
  const ideasText = $('#screen-ideas').textContent;
  ['Church service','Casket','Burial plot','Tombstone','Embalming',
   'Cremation','Backyard barbecue','Get-together in a park','Celebration in a bar'].forEach(function (item) {
    check('idea listed: ' + item, ideasText.indexOf(item) !== -1);
  });
  const ideaBtns = $$('#screen-ideas .big-btn');
  const lastBtn = ideaBtns[ideaBtns.length - 1];
  check('ideas page ends at Save on Dying button',
    !!lastBtn && lastBtn.getAttribute('data-go') === 'cost' && lastBtn.textContent.indexOf('Save on Dying') !== -1);
  goHome();

  /* ---------- share my plan gathers media ---------- */
  goTo('share');
  await tick(60);
  const plan = $('#planOutput').value;
  check('plan lists VIDEO MESSAGES', plan.indexOf('VIDEO MESSAGES') !== -1);
  check('plan lists the funeral video', plan.indexOf('For my funeral') !== -1);
  check('plan lists will photos', plan.indexOf('PHOTOS OF MY SIGNED WILL') !== -1);
  goHome();

  /* ---------- tips switch ---------- */
  const before = document.body.classList.contains('tips-off');
  $('#tipsToggle').click();
  check('tips toggle flips', document.body.classList.contains('tips-off') === !before);
  check('tips choice persists', store().tipsOn === before);
  $('#tipsToggle').click();

  /* ---------- remaining doors still open ---------- */
  ['where','call','gets','faith'].forEach(function (id) {
    goTo(id);
    check('door opens: ' + id, activeId() === 'screen-' + id);
    goHome();
  });

  check('no JavaScript errors across the walk', jsErrors.length === 0);
  if (jsErrors.length) console.log('JS ERRORS:', jsErrors.slice(0, 5));

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (failures.length) console.log('Failures:\n - ' + failures.join('\n - '));
  process.exit(fail ? 1 : 0);
})().catch(function (e) {
  console.log('HARNESS ERROR:', e && e.stack || e);
  console.log(pass + ' passed, ' + fail + ' failed before the error');
  process.exit(1);
});
