// 뉴스 출처 등급 + 국면별 섹터 강세 + 매매 수수료를 반영한 시뮬레이터
const ALL = [
  [.02,'b','반도체'],[.025,'b','반도체'],[.09,'t','반도체'],
  [.025,'b','에너지'],[.07,'t','에너지'],
  [.025,'b','소재'],[.025,'b','소재'],
  [.03,'b','운송기기'],[.03,'b','운송기기'],
  [.025,'b','인프라'],[.03,'b','인프라'],
  [.02,'b','식품'],[.025,'b','식품']
];

function makeStocks() {
  let st = ALL.filter(() => Math.random() < .75);
  [...new Set(ALL.map(s => s[2]))].forEach(sec => { if (!st.some(s => s[2] === sec)) { const c = ALL.filter(s => s[2] === sec); st.push(c[Math.floor(Math.random()*c.length)]); } });
  if (!st.some(s => s[1] === 't')) st.push(ALL[2]);
  return st.map(([vol, cat, sec]) => ({ vol, cat, sec, p: 1e5, base: 1e5, q: 0, dl: false }));
}

function pickWeighted(w) { let r = Math.random(); for (const [k, v] of Object.entries(w)) { r -= v; if (r < 0) return k; } return Object.keys(w)[0]; }

function run(P, diff, strat) {
  const d = P[diff];
  const regKeys = Object.keys(P.regimes);
  let cash = d.start, turn = 1, rc = 0, ev = null, news = null;
  let reg = { k: regKeys[Math.floor(Math.random()*4)], t: 12 + Math.floor(Math.random()*9) };
  const st = makeStocks();
  let hold = null;
  const nw = () => cash + st.reduce((s, x) => s + x.p * x.q, 0);
  const live = () => st.filter(x => !x.dl);
  const rotate = target => { // 목표 종목이 바뀔 때만 매매 (수수료 발생)
    if (hold === target && (!hold || !hold.dl)) return;
    if (hold && hold.q) { const v = hold.p * hold.q; cash += v - Math.round(v * P.fee); hold.q = 0; }
    hold = target;
    if (target) { const n = Math.floor(cash / (target.p * (1 + P.fee))); target.q = n; const c = n * target.p; cash -= c + Math.round(c * P.fee); }
  };
  const regimePick = () => {
    const fav = P.regimes[reg.k].sector;
    const best = live().filter(x => x.cat === 'b').sort((a, b) => (fav[b.sec] || 0) - (fav[a.sec] || 0));
    return best[0];
  };
  const randomBlue = () => { const bl = live().filter(x => x.cat === 'b'); return bl[Math.floor(Math.random()*bl.length)]; };
  while (turn < 300) {
    // ── 플레이어 ──
    let target = hold && !hold.dl ? hold : null;
    const goodNews = news && news.dir > 0 && news.ids.length
      && (strat === 'news' || ((strat === 'smart' || strat === 'combo') && (news.src !== 'rumor' || (P.analyst && news.verdict))));
    if (goodNews) target = news.ids.includes(hold) ? hold : news.ids[0];
    else if (strat === 'regime' || strat === 'combo') target = regimePick();
    else if (strat === 'random') { if (Math.random() < .3 || !target) { const l = live(); target = l[Math.floor(Math.random()*l.length)]; } }
    else if (!target || (news && news.dir < 0 && news.ids.includes(target))) target = randomBlue();
    rotate(target);

    // ── 시장 ──
    turn++;
    const R = P.regimes[reg.k];
    if (!ev && Math.random() < .1) { const pool = live().filter(x => x.cat === 't'); if (pool.length) { const r = Math.random(); ev = { s: pool[Math.floor(Math.random()*pool.length)], ph: 's', n: r < .5 ? 1 : r < .8 ? 2 : 3, d: 6, cr: false }; } }
    live().forEach(x => {
      let c = (Math.random() - d.bias) * x.vol * 2 * d.vol * R.vol + R.drift + (R.sector[x.sec] || 0);
      if (x.cat === 'b') c += P.blueDrift;
      if (ev && ev.s === x) { if (ev.ph === 's') { c += .12 + Math.random()*.13; if (--ev.n <= 0) ev.ph = 'd'; } else { c -= ev.cr ? .06 : .12; ev.cr = true; if (--ev.d <= 0) ev = null; } }
      if (news && news.ids.includes(x)) { const S = P.sources[news.src]; c += news.truth ? news.dir * S.hit : -news.dir * S.miss; }
      x.p = Math.max(50, Math.round(x.p * (1 + c)));
      if (x.p <= x.base * .12) { x.q = 0; x.dl = true; }
    });
    if (ev && ev.s.dl) ev = null;
    if (news) { news.ids = news.ids.filter(x => !x.dl); if (!news.ids.length || --news.t <= 0) news = null; }
    if (--reg.t <= 0) { const others = regKeys.filter(k => k !== reg.k); reg = { k: others[Math.floor(Math.random()*3)], t: 12 + Math.floor(Math.random()*9) }; }
    if (!news && Math.random() < P.newsChance) {
      const l = live(); const dir = Math.random() < .5 ? 1 : -1; const src = pickWeighted(P.srcWeights);
      const truth = Math.random() < P.sources[src].acc;
      const verdict = Math.random() < .8 ? truth : !truth; // 정보 분석가 판단
      let ids;
      if (Math.random() < .4) { const secs = [...new Set(l.map(x => x.sec))]; const sec = secs[Math.floor(Math.random()*secs.length)]; ids = l.filter(x => x.sec === sec); }
      else ids = [l[Math.floor(Math.random()*l.length)]];
      news = { ids, dir, t: 3, src, truth, verdict };
    }
    if (turn % 5 === 0) { cash -= Math.round(P.rentBase * Math.pow(d.growth, rc)); rc++; }
    const w = nw();
    if (w <= 0) return { r: 'b', turn };
    if (w >= P.target) return { r: 'r', turn };
  }
  return { r: 't', turn };
}

const med = a => { a = [...a].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : '-'; };
function report(P, N = 3000, strats = ['news', 'smart', 'regime', 'combo', 'random']) {
  for (const diff of ['stable', 'aggressive']) for (const s of strats) {
    const res = Array.from({ length: N }, () => run(P, diff, s));
    const ret = res.filter(r => r.r === 'r');
    console.log(`${diff.padEnd(10)} ${s.padEnd(6)} 은퇴 ${String(Math.round(ret.length / N * 100)).padStart(3)}%  은퇴턴 ${String(med(ret.map(r => r.turn))).padStart(3)}  판길이 ${med(res.map(r => r.turn))}`);
  }
}

const BASE = {
  target: 5e7, fee: .0025, rentBase: 200000, blueDrift: .005, newsChance: .45, analyst: false,
  srcWeights: { disclosure: .3, report: .45, rumor: .25 },
  sources: {
    disclosure: { acc: .9,  hit: .04, miss: .04 },
    report:     { acc: .7,  hit: .07, miss: .05 },
    rumor:      { acc: .45, hit: .12, miss: .08 }
  },
  regimes: {
    bull:     { drift: .004,  vol: 1.0, sector: { '반도체': .008, '레저·엔터': .008, '운송기기': .005, '바이오': .004 } },
    bear:     { drift: -.006, vol: 1.1, sector: { '식품': .009, '인프라': .007, '에너지': .003 } },
    sideways: { drift: 0,     vol: .7,  sector: { '에너지': .004, '소재': .004 } },
    volatile: { drift: 0,     vol: 1.5, sector: { '바이오': .004, '레저·엔터': .004 } }
  },
  stable: { start: 25e6, vol: .7, bias: .49, growth: 1.4 },
  aggressive: { start: 22e6, vol: 1.4, bias: .495, growth: 1.55 }
};
module.exports = { run, report, BASE };
if (require.main === module) report(BASE);
