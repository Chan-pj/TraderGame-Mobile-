const { report, BASE } = require('./sim4.js');
const variants = {
  A: { sources: { disclosure: { acc: .9, hit: .04, miss: .04 }, report: { acc: .7, hit: .06, miss: .05 }, rumor: { acc: .4, hit: .12, miss: .1 } },
       regimes: { bull: { drift: .004, vol: 1, sector: { '반도체': .012, '레저·엔터': .012, '운송기기': .008, '바이오': .006 } },
                  bear: { drift: -.006, vol: 1.1, sector: { '식품': .012, '인프라': .009, '에너지': .004 } },
                  sideways: { drift: 0, vol: .7, sector: { '에너지': .007, '소재': .007 } },
                  volatile: { drift: 0, vol: 1.5, sector: { '바이오': .006, '레저·엔터': .006, '반도체': .004 } } } },
  B: { sources: { disclosure: { acc: .9, hit: .045, miss: .04 }, report: { acc: .7, hit: .065, miss: .05 }, rumor: { acc: .4, hit: .12, miss: .1 } },
       regimes: { bull: { drift: .004, vol: 1, sector: { '반도체': .014, '레저·엔터': .014, '운송기기': .01, '바이오': .008 } },
                  bear: { drift: -.006, vol: 1.1, sector: { '식품': .014, '인프라': .011, '에너지': .005 } },
                  sideways: { drift: 0, vol: .7, sector: { '에너지': .009, '소재': .009 } },
                  volatile: { drift: 0, vol: 1.5, sector: { '바이오': .008, '레저·엔터': .008, '반도체': .005 } } } }
};
const which = process.argv[2];
const P = { ...BASE, ...variants[which], ...(process.argv[3] ? JSON.parse(process.argv[3]) : {}) };
console.log('── variant', which, process.argv[3] || '');
report(P, 2500, ['news', 'smart', 'regime', 'combo', 'random']);