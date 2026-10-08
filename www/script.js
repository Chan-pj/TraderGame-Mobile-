// 개발 중에는 여기서 alert()로 바로 에러를 띄워 확인했지만,
// 실제 플레이 중에 날것의 에러 팝업이 뜨면 완성도가 떨어져 보여서 콘솔 로그로 전환.
// 디버깅이 필요하면 chrome://inspect로 기기를 원격 연결해 콘솔을 확인하면 됨.
window.addEventListener('error', (e) => {
  console.error('에러 발생:', e.message, `(${e.filename}:${e.lineno})`);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise 에러:', e.reason);
});

// ───────── 기본 상수 ─────────
// 밸런스 수치는 몬테카를로 시뮬레이션으로 조정 (메타 보너스 없는 첫 판 기준)
//  - 안정형: 뉴스를 잘 활용하면 은퇴 약 50%, 은퇴까지 약 33턴
//  - 공격형: 뉴스를 잘 활용하면 은퇴 약 25%, 은퇴까지 약 31턴
//  - 무작정 매매하면 거의 파산, 어떤 판이든 대략 80턴 안에 끝남 (임대료가 기하급수로 증가)
const STARTING_CASH = { stable: 25000000, aggressive: 22000000 };
const TARGET_NET_WORTH = 50000000; // 난이도 무관, 이 금액 도달 시 은퇴 가능

const LOAN_AMOUNT_BASE = 5000000;
const LOAN_AMOUNT_MIN = 500000;
const LOAN_AMOUNT_STEP = 500000;
const LOAN_SOFT_TURNS = 10;       // 이 턴 이내 상환 시 원금만
const LOAN_FORCE_TURNS = 20;      // 이 턴 경과 시 강제 상환
const LOAN_INTEREST_EVERY = 10;   // 10턴마다 원금의 5% 가산
const LOAN_INTEREST_RATE = 0.05;  // 원금 대비 5%
const LOAN_SPECIALIST_INTEREST_RATE = 0;   // 대출 전문가 고용 시 20턴 전까지 이자 완전 면제
const LOAN_SPECIALIST_CAP_BONUS = 5000000;   // 대출 전문가 고용 시 한도 +5,000,000원
const LOAN_FEE_RATE = 0.03;       // 대출 실행 시 취급 수수료 (선공제)
const LOAN_COOLDOWN_TURNS = 5;    // 상환(강제 상환 포함) 후 재대출 불가 기간

const RENT_INTERVAL_TURNS = 5;
const RENT_BASE = 200000;

const EVENT_CHANCE = 0.1;
// 급등 이벤트: 급등이 '일어난 뒤'에 배너가 뜨고, 몇 턴 더 오를지는 알 수 없음
const EVENT_SPIKE_TURN_WEIGHTS = [0.5, 0.3, 0.2]; // 총 급등 턴 수 1/2/3턴 확률
const EVENT_SPIKE_MIN = 0.12;      // 급등 턴당 상승폭 하한
const EVENT_SPIKE_RANGE = 0.13;    // 하한 + 0~13%p
const EVENT_CRASH = 0.12;          // 급등이 끝난 첫 턴 차익 실현 매물
const EVENT_DECAY = 0.06;          // 이후 턴당 하락
const EVENT_DECAY_TURNS = 6;
const NEWS_CHANCE = 0.45;
// 뉴스 출처 등급: 진위(truth)는 보도 시점에 한 번 정해지고 3턴간 일관되게 반영
//  - 공시: 거의 맞지만 먹을 게 적음 / 보도: 중간 / 루머: 대박 아니면 쪽박 (분석가 없이 따라가면 손해)
const NEWS_SOURCES = {
  disclosure: { label: '공시', byline: '전자공시시스템', weight: 0.3,  acc: 0.9,  hit: 0.045, miss: 0.04 },
  report:     { label: '보도', byline: '경제부 기자',    weight: 0.45, acc: 0.7,  hit: 0.06,  miss: 0.05 },
  rumor:      { label: '루머', byline: '증권가 메신저',  weight: 0.25, acc: 0.35, hit: 0.12,  miss: 0.1 }
};
const ANALYST_VERDICT_ACCURACY = 0.8; // 정보 분석가의 진위 판단 적중률
const TRADE_FEE_RATE = 0.0025;        // 매수·매도 수수료
const SURGE_THRESHOLD = 0.12;
const TURN_TOAST_DURATION = 900;
const ACTION_TOAST_DURATION = 1200;
const EVENT_BANNER_DURATION = 3500;
const RISK_THRESHOLD = 0.3;
const DELIST_THRESHOLD = 0.12;
const BLUECHIP_DRIFT = 0.005;
const SECTOR_NEWS_CHANCE = 0.4;
const NEAR_BANKRUPT_RATIO = 0.5; // 순자산이 시작 자금의 이 비율 이하로 떨어지면 '기사회생' 조건 충족

const DIFFICULTIES = {
  stable:     { label: '안정형', volMult: 0.7, rentGrowth: 1.4,  biasOffset: 0.49 },
  aggressive: { label: '공격형', volMult: 1.4, rentGrowth: 1.55, biasOffset: 0.495 }
};

// ───────── 직원 시스템 설정값 ─────────
const FINANCE_MANAGER_DISCOUNT = 0.2;
const LOBBYIST_EXEMPT_EVERY = 3;      // 임대료 징수 3회마다 1회 완전 면제
const FUND_MANAGER_RATE = 0.005;      // 매턴 보유 현금의 0.5%
const LOAN_CAP_BONUS = 2500000;
const STAFF_DISCOUNT_RATE = 0.4;      // 재무 컨설턴트 - 전 직원 급여 40% 절감
const THEME_HUNTER_HINT_ACCURACY = 0.75; // 테마 헌터 - 급등 지속 여부 예측 적중률
const TAX_REFUND_RATE = 0.15;         // 세무사 - 매도 차익 환급 비율
const HEDGE_RECOVERY_RATE = 0.3;      // 헤지 매니저 - 상장폐지 시 매입 원금 회수 비율

// 직원은 고용비 없이 '영입(드래프트)'으로만 합류, 대가는 5턴마다 청구되는 급여
// locked: true 인 직원은 성장 화면에서 해금해야 영입 후보에 등장
const EMPLOYEES = [
  { id: 'risk_manager',    name: '리스크 매니저', desc: '대출 한도 +2,500,000원',                     salary: 100000 },
  { id: 'analyst',         name: '정보 분석가',   desc: '뉴스마다 진위 판단 제공 (적중률 80%)',       salary: 150000 },
  { id: 'consultant',      name: '재무 컨설턴트', desc: '전 직원 급여 40% 절감',                       salary: 100000 },
  { id: 'loan_specialist', name: '대출 전문가',   desc: '대출 한도 +5,000,000원, 20턴 전까지 이자 면제', salary: 150000 },
  { id: 'finance_manager', name: '재무팀장',      desc: '임대료·급여 20% 감면',                        salary: 125000 },
  { id: 'lobbyist',        name: '로비스트',      desc: '임대료 징수 3회마다 1회 완전 면제',            salary: 200000 },
  { id: 'fund_manager',    name: '펀드매니저',    desc: '매턴 보유 현금의 0.5%를 안정적으로 증식',      salary: 300000 },
  { id: 'theme_hunter',    name: '테마 헌터',     desc: '급등 발생 시 추가 상승 여부 예측 (적중률 75%)', salary: 150000, locked: true },
  { id: 'tax_expert',      name: '세무사',        desc: '매도 차익의 15%를 추가로 환급',                salary: 150000, locked: true },
  { id: 'hedge_manager',   name: '헤지 매니저',   desc: '상장폐지 시 매입 원금의 30% 회수',             salary: 125000, locked: true }
];

function getEmployee(id) { return EMPLOYEES.find(e => e.id === id); }

// ───────── 로그라이크: 판마다 달라지는 요소 ─────────
const STOCK_KEEP_CHANCE = 0.75;   // 해금된 종목 중 이번 판에 상장될 확률 (섹터별 최소 1종목 보장)
const START_PRICE_JITTER = 0.2;   // 시작 주가 ±20% 랜덤

const MARKET_REGIMES = {
  // sectors: 해당 국면에서 추가로 오르는 업종 (턴당)
  bull:     { label: '상승장', drift:  0.004, volMult: 1.0, tone: 'positive', desc: '시장 전반에 매수세가 몰리고 있습니다',
              sectors: { '반도체': 0.014, '레저·엔터': 0.014, '운송기기': 0.01, '바이오': 0.008 } },
  bear:     { label: '하락장', drift: -0.006, volMult: 1.1, tone: 'negative', desc: '시장 전반에 매도세가 확산되고 있습니다',
              sectors: { '식품': 0.014, '인프라': 0.011, '에너지': 0.005 } },
  sideways: { label: '박스권', drift:  0,     volMult: 0.7, tone: 'neutral',  desc: '뚜렷한 방향 없이 좁은 범위에서 움직입니다',
              sectors: { '에너지': 0.009, '소재': 0.009 } },
  volatile: { label: '변동장', drift:  0,     volMult: 1.5, tone: 'neutral',  desc: '종목들이 크게 출렁이고 있습니다',
              sectors: { '바이오': 0.008, '레저·엔터': 0.008, '반도체': 0.005 } }
};
const REGIME_MIN_TURNS = 12;
const REGIME_MAX_TURNS = 20;

const DRAFT_FIRST_TURN = 3;    // 첫 직원 영입 턴
const DRAFT_INTERVAL = 8;      // 이후 영입 주기
const DRAFT_BASE_OPTIONS = 3;  // 기본 영입 후보 수

// ───────── 메타 진행 (판과 판 사이의 성장) ─────────
const POINTS_PER_ACHIEVEMENT = 5;
const LOCKED_SECTORS = ['바이오', '레저·엔터'];
const UPGRADES = [
  { key: 'start_cash',     name: '종잣돈',          desc: '시작 자금 +1,000,000원 (단계당)', maxLevel: 5, cost: lv => [10, 15, 20, 30, 40][lv] },
  { key: 'draft_plus',     name: '헤드헌터 계약',   desc: '직원 영입 후보 +1명',            maxLevel: 1, cost: () => 30 },
  { key: 'sector_bio',     name: '바이오 섹터',     desc: '바이오 종목이 시장에 등장',       maxLevel: 1, cost: () => 15, sector: '바이오' },
  { key: 'sector_leisure', name: '레저·엔터 섹터',  desc: '레저·엔터 종목이 시장에 등장',    maxLevel: 1, cost: () => 15, sector: '레저·엔터' },
  { key: 'emp_theme_hunter',  name: '테마 헌터',    desc: '영입 후보에 테마 헌터 추가',      maxLevel: 1, cost: () => 12, employee: 'theme_hunter' },
  { key: 'emp_tax_expert',    name: '세무사',       desc: '영입 후보에 세무사 추가',         maxLevel: 1, cost: () => 12, employee: 'tax_expert' },
  { key: 'emp_hedge_manager', name: '헤지 매니저',  desc: '영입 후보에 헤지 매니저 추가',    maxLevel: 1, cost: () => 12, employee: 'hedge_manager' },
  // 소모품: 전부 해금한 뒤에도 포인트를 쓸 곳 (최대 3개 보유, 판 시작 시 1개 사용)
  { key: 'scout_ticket',   name: '스카우트 계약',   desc: '다음 판 시작 즉시 인재 영입 (후보 +2명) · 1회용', maxLevel: 3, cost: () => 10, consumable: true }
];
const UPGRADE_START_CASH_STEP = 1000000;

// ───────── 종목 구성 ─────────
const STOCKS_CONFIG = [
  // 반도체 섹터 (우량주 2 + 테마주 1)
  { id: 1,  name: '한빛전자',     color: '#ff5252', volatility: 0.02,  basePrice: 60000, category: 'bluechip', sector: '반도체' },
  { id: 2,  name: '대한반도체',   color: '#80cbc4', volatility: 0.025, basePrice: 80000, category: 'bluechip', sector: '반도체' },
  { id: 3,  name: '코어반도체',   color: '#4dd0e1', volatility: 0.09,  basePrice: 275000, category: 'theme',    sector: '반도체' },
  // 바이오 섹터
  { id: 4,  name: '대성바이오',   color: '#f06292', volatility: 0.08,  basePrice: 40000,  category: 'theme',    sector: '바이오' },
  { id: 5,  name: '온누리제약',   color: '#e57373', volatility: 0.08,  basePrice: 125000, category: 'theme',    sector: '바이오' },
  // 에너지 섹터
  { id: 6,  name: '삼한정유',     color: '#ba68c8', volatility: 0.025, basePrice: 225000, category: 'bluechip', sector: '에너지' },
  { id: 7,  name: '그린에너지',   color: '#4db6ac', volatility: 0.07,  basePrice: 110000, category: 'theme',    sector: '에너지' },
  // 소재 섹터
  { id: 8,  name: '청록케미칼',   color: '#4fc3f7', volatility: 0.025, basePrice: 100000, category: 'bluechip', sector: '소재' },
  { id: 10, name: '동방스틸',     color: '#a1887f', volatility: 0.025, basePrice: 90000, category: 'bluechip', sector: '소재' },
  // 운송기기 섹터
  { id: 9,  name: '우진모터스',   color: '#81c784', volatility: 0.03,  basePrice: 175000, category: 'bluechip', sector: '운송기기' },
  { id: 14, name: '대양조선',     color: '#90a4ae', volatility: 0.03,  basePrice: 150000, category: 'bluechip', sector: '운송기기' },
  // 인프라 섹터
  { id: 12, name: '넥스텔레콤',   color: '#64b5f6', volatility: 0.025, basePrice: 140000, category: 'bluechip', sector: '인프라' },
  { id: 13, name: '한강건설',     color: '#d4a373', volatility: 0.03,  basePrice: 75000, category: 'bluechip', sector: '인프라' },
  // 식품 섹터
  { id: 11, name: '해피푸드',     color: '#ffb74d', volatility: 0.02,  basePrice: 45000,  category: 'bluechip', sector: '식품' },
  { id: 17, name: '다정식품',     color: '#c5a880', volatility: 0.025, basePrice: 70000, category: 'bluechip', sector: '식품' },
  // 레저·엔터 섹터
  { id: 15, name: '스카이항공',   color: '#7986cb', volatility: 0.07,  basePrice: 200000, category: 'theme',    sector: '레저·엔터' },
  { id: 16, name: '픽셀게임즈',   color: '#fff176', volatility: 0.09,  basePrice: 50000, category: 'theme',    sector: '레저·엔터' }
];

// ───────── 뉴스 문구 ─────────
const POSITIVE_NEWS = [
  '{name}, 신제품 출시 기대감에 관심 집중',
  '{name}, 대규모 수출 계약 체결 소식',
  '{name}, 실적 호조 전망에 매수세 유입',
  '{name}, 정부 지원 정책 수혜 기대',
  '{name}, 해외 투자 유치 성공 소식',
  '{name}, 대규모 특허 취득 소식',
  '{name}, 신규 파트너십 체결 기대감',
  '{name}, 사상 최대 분기 실적 예고',
  '{name}, 해외 판로 확대 소식에 강세',
  '{name}, 우호적 세제 개편 수혜 기대',
  '{name}, 기관 매수세 유입으로 수급 개선',
  '{name}, 목표가 상향 리포트 잇따라',
  '{name}, 배당 확대 가능성에 관심 집중',
  '{name}, 신규 사업 수주 소식에 기대감',
  '{name}, 비용 절감 효과로 수익성 개선 전망'
];
const NEGATIVE_NEWS = [
  '{name}, 실적 부진 우려 확산',
  '{name}, 경영진 리스크 이슈 발생',
  '{name}, 주요 계약 해지 소식 전해져',
  '{name}, 업황 악화 우려로 투자심리 위축',
  '{name}, 규제 강화 이슈로 불확실성 증가',
  '{name}, 품질 논란으로 신뢰도 하락',
  '{name}, 핵심 인력 이탈 소식',
  '{name}, 원가 부담 가중으로 수익성 우려',
  '{name}, 소송 리스크 부각',
  '{name}, 단기 실적 가이던스 하향 조정',
  '{name}, 기관 순매도세 확대',
  '{name}, 경쟁 심화로 마진 압박 우려',
  '{name}, 설비 투자 지연 가능성 제기',
  '{name}, 신용등급 전망 하향 검토 소식',
  '{name}, 단기 과열 논란에 차익 실현 매물'
];

// 섹터별 맞춤 헤드라인 (종목·업종에 어색하지 않은 문구)
const SECTOR_STOCK_NEWS = {
  '반도체': {
    pos: [
      '{name}, 차세대 공정 양산 일정 앞당겨질 전망',
      '{name}, AI 반도체 수요 급증에 수혜 기대',
      '{name}, 대형 고객사 신규 주문 확보 소식',
      '{name}, 메모리 가격 반등 조짐에 실적 개선 기대',
      '{name}, 설비 가동률 상승으로 마진 개선 전망'
    ],
    neg: [
      '{name}, 글로벌 반도체 재고 조정 장기화 우려',
      '{name}, 주요 고객사 주문 축소 가능성 제기',
      '{name}, 미세공정 수율 이슈로 단기 불안',
      '{name}, 장비 도입 지연으로 증설 일정 차질 우려',
      '{name}, 경쟁사 신제품 출시에 점유율 압박'
    ]
  },
  '바이오': {
    pos: [
      '{name}, 신약 임상 중간 결과 긍정적 평가',
      '{name}, 기술이전 계약 논의 진전 소식',
      '{name}, 해외 규제 당국 승인 기대감 확산',
      '{name}, 파이프라인 가치 재평가 전망',
      '{name}, 대규모 연구 협력 계약 체결'
    ],
    neg: [
      '{name}, 임상 결과 기대 미달 우려 확산',
      '{name}, 허가 일정 지연 가능성 제기',
      '{name}, 경쟁 약물 출시로 시장 점유 압박',
      '{name}, 연구개발비 부담 가중 우려',
      '{name}, 주요 파이프라인 중단 가능성 거론'
    ]
  },
  '에너지': {
    pos: [
      '{name}, 국제 유가 안정에 정제 마진 개선 기대',
      '{name}, 친환경 에너지 수주 확대 소식',
      '{name}, 신규 광구·발전 사업 진출 기대감',
      '{name}, 정부 에너지 전환 정책 수혜 전망',
      '{name}, 장기 공급 계약 체결로 실적 가시성 확보'
    ],
    neg: [
      '{name}, 에너지 가격 변동성 확대로 실적 불확실',
      '{name}, 환경 규제 강화로 비용 부담 우려',
      '{name}, 설비 점검·가동 중단 일정 발표',
      '{name}, 원재료 조달 비용 상승 압력',
      '{name}, 수요 둔화로 판매량 감소 우려'
    ]
  },
  '소재': {
    pos: [
      '{name}, 고부가 소재 수요 증가에 수혜 기대',
      '{name}, 전방 산업 회복으로 출하 증가 전망',
      '{name}, 신규 생산라인 가동 임박 소식',
      '{name}, 원자재 가격 안정으로 수익성 개선',
      '{name}, 해외 바이어 대규모 발주 소식'
    ],
    neg: [
      '{name}, 원자재 가격 급등으로 원가 부담',
      '{name}, 전방 수요 둔화로 재고 부담 우려',
      '{name}, 환경 규제에 따른 설비 투자 부담',
      '{name}, 중국발 공급 과잉 우려 재점화',
      '{name}, 물류비 상승으로 마진 압박'
    ]
  },
  '운송기기': {
    pos: [
      '{name}, 신차·신모델 예약 호조 소식',
      '{name}, 해외 시장 판매 호조에 실적 기대',
      '{name}, 친환경 모빌리티 수주 확대',
      '{name}, 부품 공급망 정상화로 생산 회복',
      '{name}, 대형 해운·조선 수주 공시'
    ],
    neg: [
      '{name}, 글로벌 수요 둔화로 출하 부진 우려',
      '{name}, 부품 수급 차질로 생산 일정 지연',
      '{name}, 원자재·물류비 상승 압박',
      '{name}, 경쟁 심화로 판가 인하 압력',
      '{name}, 안전·리콜 이슈로 브랜드 신뢰 타격'
    ]
  },
  '인프라': {
    pos: [
      '{name}, 대규모 공공 인프라 수주 기대감',
      '{name}, 5G·통신 투자 확대 수혜 전망',
      '{name}, 스마트시티·재개발 사업 참여 소식',
      '{name}, 정부의 SOC 예산 증액 수혜 기대',
      '{name}, 해외 건설·통신 프로젝트 수주'
    ],
    neg: [
      '{name}, 공공 입찰 경쟁 심화로 마진 우려',
      '{name}, 공사비 상승으로 수익성 압박',
      '{name}, 주요 프로젝트 착공 지연 소식',
      '{name}, 규제·인허가 지연 리스크',
      '{name}, 수주 잔고 감소 우려 제기'
    ]
  },
  '식품': {
    pos: [
      '{name}, 신제품 히트로 매출 성장 기대',
      '{name}, 해외 수출 확대 및 현지화 성공',
      '{name}, 원재료 가격 안정으로 마진 개선',
      '{name}, 건강·프리미엄 라인 수요 호조',
      '{name}, 대형 유통채널 입점 확대 소식'
    ],
    neg: [
      '{name}, 원재료 가격 상승으로 원가 부담',
      '{name}, 내수 소비 둔화로 판매 부진 우려',
      '{name}, 안전·품질 이슈로 일시 판매 중단 우려',
      '{name}, 유통 채널 재고 조정 압력',
      '{name}, 경쟁 심화로 판촉비 증가 전망'
    ]
  },
  '레저·엔터': {
    pos: [
      '{name}, 신작 콘텐츠·게임 흥행 기대감 고조',
      '{name}, 해외 이용자 급증으로 매출 성장 전망',
      '{name}, 성수기 예약률·탑승률 호조 소식',
      '{name}, IP 확장·콜라보 계약 체결',
      '{name}, 구독·인앱 매출 사상 최대 경신 전망'
    ],
    neg: [
      '{name}, 신작 흥행 부진 우려로 투자심리 위축',
      '{name}, 이용자 감소·리텐션 하락 지적',
      '{name}, 유가·환율 변동으로 항공 비용 부담',
      '{name}, 플랫폼 수수료·마케팅비 부담 가중',
      '{name}, 콘텐츠 심의·규제 이슈로 일정 지연'
    ]
  }
};

const SECTOR_POSITIVE_NEWS = [
  '{sector} 업종 전반에 훈풍, 관련주 동반 강세',
  '{sector} 업종, 정책 지원 기대감에 매수세 확산',
  '{sector} 업종 수요 급증 전망에 관련주 들썩',
  '{sector} 업종, 신기술 도입 기대감 확산',
  '{sector} 업종 수출 호조에 관련주 강세',
  '{sector} 업종 실적 시즌 호조 전망',
  '{sector} 업종, 외국인 순매수 확대'
];
const SECTOR_NEGATIVE_NEWS = [
  '{sector} 업종 전반에 먹구름, 투자심리 위축',
  '{sector} 업종 규제 강화 우려 확산',
  '{sector} 업종 수요 둔화 우려에 관련주 동반 약세',
  '{sector} 업종, 공급망 차질 우려 확산',
  '{sector} 업종 원가 부담 가중 우려',
  '{sector} 업종 외국인 매도세 확대',
  '{sector} 업종 단기 과열 해소 매물 출회'
];

// ───────── 업적 (달성 시 포인트 + 이후 모든 판에 적용되는 영구 보너스) ─────────
const ACHV_LOCK_SVG = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const ACHV_CHECK_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

const ACHIEVEMENTS = [
  { key: 'first_retire',       name: '첫 은퇴',       desc: '처음으로 은퇴에 성공',                         reward: '시작 자금 +500,000원',          perk: { startCash: 500000 } },
  { key: 'no_loan_retire',     name: '무차입 은퇴',   desc: '대출 없이 은퇴 성공',                          reward: '대출 한도 +1,000,000원',        perk: { loanCap: 1000000 } },
  { key: 'streak_3',           name: '3연속 은퇴',    desc: '파산 없이 3회 연속 은퇴',                      reward: '기본 임대료 10% 감면',          perk: { rentBase: 0.1 } },
  { key: 'big_win',            name: '큰손',          desc: '한 번의 매도로 2,500,000원 이상 차익 실현',     reward: '시작 자금 +500,000원',          perk: { startCash: 500000 } },
  { key: 'comeback_retire',    name: '기사회생',      desc: '순자산이 시작 자금의 절반 이하로 떨어졌다가 회복해 은퇴 성공', reward: '모든 뉴스 적중률 +5%p', perk: { newsAcc: 0.05 } },
  { key: 'aggressive_retire',  name: '벼랑 끝 승부',  desc: '공격형 난이도로 은퇴에 성공',                  reward: '시작 자금 +1,000,000원',        perk: { startCash: 1000000 } },
  { key: 'sector_master',      name: '만물박사',      desc: '한 게임에서 그 판에 상장된 모든 섹터의 종목을 한 번씩 보유', reward: '게임 시작 즉시 직원 1명 영입', perk: { instantDraft: true } },
  { key: 'no_delist_retire',   name: '무사고 은퇴',   desc: '상장폐지 손실 없이 은퇴에 성공',               reward: '상장폐지 시 매입 원금 15% 회수', perk: { delistRecovery: 0.15 } },
  { key: 'aggressive_speedrun',name: '질풍노도',      desc: '공격형 난이도로 40턴 이내에 은퇴 성공 (공격형 전용)', reward: '직원 영입 후보 +1명',      perk: { draftPlus: 1 } }
];

// ───────── DB ─────────
const DB_NAME = 'trade_game_db';
const SQLite = Capacitor.Plugins.CapacitorSQLite;

// ───────── 게임 상태 전역변수 ─────────
let cash, stocks, loan, loansTakenCount, priceHistory, netWorthHistory, activeEvent, activeNews;
let turnCount, difficulty, sessionBigWin, gameStartCash;
let gameLoanMaxCap, gameNewsAccBonus, gameLoanInterestRate, gameRentDiscount;
let rentChargeCount, lobbyistCounter;
let hiredEmployees = new Set();
let newsHistory = []; // { turn, text, tone } - 최신순으로 보여줌
let marketRegime = null; // { key, turnsLeft }
let peakNetWorth = 0;    // 이번 판 최고 순자산 (포인트 계산용)
let loanCooldownUntil = 0; // 이 턴부터 다시 대출 가능
let pendingDraft = null; // 아직 고르지 않은 영입 후보 employee id 배열
let metaState = {};      // 메타 진행 (points, 업그레이드 단계) - meta 테이블 캐시
let metaBonus = null;    // 업적 + 업그레이드로 얻은 영구 보너스 합계
let sectorsHeldThisGame = new Set();
let hadDelistLoss = false;
let hasOfferedRetire = false;
let hadNearBankruptcy = false; // 순자산이 시작 자금의 절반 이하로 떨어진 적 있는지 (기사회생 업적용)
let isTurnProcessing = false; // 다음 턴 연타 방지
let isGameEnded = false;      // gameOver 중복 실행 방지
let pendingDifficulty = null;
let currentTab = 'all';
let currentSort = 'default';
let sortAscending = false; // false = 내림차순(기본)
let groupBySector = false;
let expandedStockIds = new Set();

// ───────── DOM - 화면 ─────────
const mainMenu = document.getElementById('main-menu');
const continueBtn = document.getElementById('continue-btn');
const newGameBtn = document.getElementById('new-game-btn');
const mmStatsEl = document.getElementById('mm-stats');
const mmTickerTrack = document.getElementById('mm-ticker-track');
const howtoBtn = document.getElementById('howto-btn');
const howtoScreen = document.getElementById('howto-screen');
const howtoBackBtn = document.getElementById('howto-back-btn');
const achievementsBtn = document.getElementById('achievements-btn');
const recordsBtn = document.getElementById('records-btn');

const achievementsScreen = document.getElementById('achievements-screen');
const achvBackBtn = document.getElementById('achv-back-btn');
const achievementsListEl = document.getElementById('achievements-list');

const recordsScreen = document.getElementById('records-screen');
const recordsBackBtn = document.getElementById('records-back-btn');
const recordsSummaryEl = document.getElementById('records-summary');
const recordsListEl = document.getElementById('records-list');

const difficultyScreen = document.getElementById('difficulty-screen');
const diffBackBtn = document.getElementById('diff-back-btn');
const diffButtons = document.querySelectorAll('.diff-btn');

const gameContainer = document.getElementById('game-container');
const profileLine = document.getElementById('profile-line');
const employeeBadgesEl = document.getElementById('employee-badges');

// ───────── DOM - 게임 화면 내부 ─────────
const cashValue = document.getElementById('cash-value');
const networthValue = document.getElementById('networth-value');
const turnValue = document.getElementById('turn-value');
const nextFeeValue = document.getElementById('next-fee-value');
const nextSalaryValue = document.getElementById('next-salary-value');
const nextNextFeeValue = document.getElementById('next-next-fee-value');
const feeTurnsLeftEl = document.getElementById('fee-turns-left');
const eventBanner = document.getElementById('event-banner');
const tabButtons = document.querySelectorAll('.tab-btn');
const sortButtons = document.querySelectorAll('.sort-btn');
const groupToggleBtn = document.getElementById('group-toggle-btn');
const stockPanel = document.getElementById('stock-panel');
const loanStatus = document.getElementById('loan-status');
const loanBtn = document.getElementById('loan-btn');
const repayBtn = document.getElementById('repay-btn');
const repayAmountSpan = document.getElementById('repay-amount');
const retireBtn = document.getElementById('retire-btn');
const settleBtn = document.getElementById('settle-btn');
const sellAllBtn = document.getElementById('sell-all-btn');
const nextTurnBtn = document.getElementById('next-turn-btn');
const exitGameBtn = document.getElementById('exit-game-btn');

const mainTabButtons = document.querySelectorAll('.main-tab-btn');
const tabContentMarket = document.getElementById('tab-content-market');
const tabContentEmployees = document.getElementById('tab-content-employees');
const tabContentNews = document.getElementById('tab-content-news');
const newsBadge = document.getElementById('news-badge');
const newsHistoryListEl = document.getElementById('news-history-list');
const resultOverlay = document.getElementById('result-overlay');
const resultTitle = document.getElementById('result-title');
const resultDetail = document.getElementById('result-detail');
const newAchievementsBox = document.getElementById('new-achievements');
const historyBox = document.getElementById('history-box');
const restartBtn = document.getElementById('restart-btn');
const networthChartCanvas = document.getElementById('networth-chart');
const networthChartCtx = networthChartCanvas.getContext('2d');

const historyModal = document.getElementById('history-modal');
const historyModalTitle = document.getElementById('history-modal-title');
const historyListEl = document.getElementById('history-list');
const closeHistoryBtn = document.getElementById('close-history-btn');
const historyChartCanvas = document.getElementById('history-chart');
const historyChartCtx = historyChartCanvas.getContext('2d');

const employeesListEl = document.getElementById('employees-list');

const loanModal = document.getElementById('loan-modal');
const loanModalBox = document.getElementById('loan-modal-box');
const loanMaxLabel = document.getElementById('loan-max-label');
const loanAmountDisplay = document.getElementById('loan-amount-display');
const loanDecreaseBtn = document.getElementById('loan-decrease-btn');
const loanIncreaseBtn = document.getElementById('loan-increase-btn');
let selectedLoanAmount = 0;
const loanRepayPreview = document.getElementById('loan-repay-preview');
const loanCancelBtn = document.getElementById('loan-cancel-btn');
const loanConfirmBtn = document.getElementById('loan-confirm-btn');

const turnToast = document.getElementById('turn-toast');
const turnToastBox = document.getElementById('turn-toast-box');
const turnToastNumber = document.getElementById('turn-toast-number');
const turnToastSubinfo = document.getElementById('turn-toast-subinfo');
const turnToastFee = document.getElementById('turn-toast-fee');
const turnToastLoan = document.getElementById('turn-toast-loan');
let turnToastHideTimeout = null;

const actionToast = document.getElementById('action-toast');
const actionToastBox = document.getElementById('action-toast-box');
const actionToastText = document.getElementById('action-toast-text');
let actionToastHideTimeout = null;
let eventBannerHideTimeout = null;

const newsModal = document.getElementById('news-modal');
const newsModalBox = document.getElementById('news-modal-box');
const newsModalText = document.getElementById('news-modal-text');
const newsSourceTag = document.getElementById('news-source-tag');
const newsBylineEl = document.getElementById('news-byline');
const newsAnalystEl = document.getElementById('news-analyst');
const newsSentimentEl = document.getElementById('news-sentiment');
const newsCloseBtn = document.getElementById('news-close-btn');
const newsConfirmBtn = document.getElementById('news-confirm-btn');

const appAlertModal = document.getElementById('app-alert-modal');
const appAlertBox = document.getElementById('app-alert-box');
const appAlertMessage = document.getElementById('app-alert-message');
const appAlertOkBtn = document.getElementById('app-alert-ok-btn');
const appAlertCancelBtn = document.getElementById('app-alert-cancel-btn');

const upgradeBtn = document.getElementById('upgrade-btn');
const upgradeScreen = document.getElementById('upgrade-screen');
const upgradeBackBtn = document.getElementById('upgrade-back-btn');
const upgradePointsEl = document.getElementById('upgrade-points');
const upgradeListEl = document.getElementById('upgrade-list');

const draftModal = document.getElementById('draft-modal');
const draftModalBox = document.getElementById('draft-modal-box');
const draftOptionsEl = document.getElementById('draft-options');
const draftSkipBtn = document.getElementById('draft-skip-btn');
const regimeChip = document.getElementById('regime-chip');
const resultPointsEl = document.getElementById('result-points');
const employeesDescEl = document.getElementById('employees-modal-desc');

// ───────── 화면 전환 ─────────
function showScreen(screen) {
  mainMenu.classList.add('hidden');
  upgradeScreen.classList.add('hidden');
  howtoScreen.classList.add('hidden');
  achievementsScreen.classList.add('hidden');
  recordsScreen.classList.add('hidden');
  difficultyScreen.classList.add('hidden');
  gameContainer.classList.add('hidden');
  screen.classList.remove('hidden');

  appAlertModal.classList.remove('visible');
  appAlertModal.classList.add('hidden');
}

// ───────── 커스텀 알림/확인 모달 ─────────
function hideAppAlert() {
  appAlertBox.classList.remove('show');
  appAlertModal.classList.remove('visible');
  setTimeout(() => appAlertModal.classList.add('hidden'), 200);
}

function showAppAlert(message) {
  appAlertMessage.textContent = message;
  appAlertCancelBtn.classList.add('hidden');
  appAlertModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    appAlertModal.classList.add('visible');
    requestAnimationFrame(() => appAlertBox.classList.add('show'));
  });
  return new Promise(resolve => {
    const onOk = () => { hideAppAlert(); appAlertOkBtn.removeEventListener('click', onOk); resolve(true); };
    appAlertOkBtn.addEventListener('click', onOk);
  });
}

function showAppConfirm(message, okLabel = '확인', cancelLabel = '취소') {
  appAlertMessage.textContent = message;
  appAlertOkBtn.textContent = okLabel;
  appAlertCancelBtn.textContent = cancelLabel;
  appAlertCancelBtn.classList.remove('hidden');
  appAlertModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    appAlertModal.classList.add('visible');
    requestAnimationFrame(() => appAlertBox.classList.add('show'));
  });
  return new Promise(resolve => {
    const cleanup = () => {
      hideAppAlert();
      appAlertOkBtn.textContent = '확인';
      appAlertCancelBtn.textContent = '취소';
      appAlertOkBtn.removeEventListener('click', onOk);
      appAlertCancelBtn.removeEventListener('click', onCancel);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    appAlertOkBtn.addEventListener('click', onOk);
    appAlertCancelBtn.addEventListener('click', onCancel);
  });
}

// ───────── 턴 토스트 ─────────
function showTurnToast(turnNum, upcomingFee, loanTurnsLeft) {
  clearTimeout(turnToastHideTimeout);
  turnToastNumber.textContent = `${turnNum}턴`;

  const hasFee = !!upcomingFee;
  const hasLoanWarning = loanTurnsLeft !== null && loanTurnsLeft !== undefined;

  if (hasFee) {
    turnToastFee.textContent = `다음 턴 임대료 ${upcomingFee.toLocaleString()}원`;
    turnToastFee.classList.remove('hidden');
  } else {
    turnToastFee.classList.add('hidden');
    turnToastFee.textContent = '';
  }

  if (hasLoanWarning) {
    turnToastLoan.textContent = loanTurnsLeft <= 0
      ? '대출 상환 기한이 임박했습니다!'
      : `대출 상환까지 D-${loanTurnsLeft}`;
    turnToastLoan.classList.remove('hidden');
  } else {
    turnToastLoan.classList.add('hidden');
    turnToastLoan.textContent = '';
  }

  turnToastSubinfo.classList.toggle('hidden', !(hasFee || hasLoanWarning));

  turnToastBox.classList.remove('show');
  turnToast.classList.remove('hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => turnToastBox.classList.add('show')));

  turnToastHideTimeout = setTimeout(() => {
    turnToastBox.classList.remove('show');
    setTimeout(() => turnToast.classList.add('hidden'), 200);
  }, TURN_TOAST_DURATION);
}

// ───────── 액션 토스트 (매수/매도 피드백) ─────────
function showActionToast(message, type = 'neutral') {
  if (!actionToast || !actionToastBox || !actionToastText) return;
  clearTimeout(actionToastHideTimeout);
  actionToastText.textContent = message;
  actionToastBox.classList.remove('buy', 'sell', 'neutral');
  actionToastBox.classList.add(type);
  // 연타 시에도 메시지만 갱신 (애니메이션 재시작으로 깜빡임 최소화)
  actionToast.classList.remove('hidden');
  actionToastBox.classList.add('show');
  actionToastHideTimeout = setTimeout(() => {
    actionToastBox.classList.remove('show');
    setTimeout(() => actionToast.classList.add('hidden'), 200);
  }, ACTION_TOAST_DURATION);
}

function showEventBanner(message) {
  clearTimeout(eventBannerHideTimeout);
  eventBanner.textContent = message;
  eventBanner.classList.remove('hidden');
  eventBannerHideTimeout = setTimeout(() => {
    eventBanner.classList.add('hidden');
  }, EVENT_BANNER_DURATION);
}

// ───────── 뉴스 팝업 ─────────
function showNewsModal(text, isPositive, srcKey = null, verdict = null) {
  const src = srcKey ? NEWS_SOURCES[srcKey] : null;
  newsModalText.textContent = text;
  newsSentimentEl.textContent = isPositive ? '호재' : '악재';
  newsSentimentEl.className = isPositive ? 'positive' : 'negative';
  newsSourceTag.textContent = src ? src.label : '속보';
  newsSourceTag.className = 'news-tag' + (srcKey ? ` src-${srcKey}` : '');
  newsBylineEl.textContent = src ? src.byline : '경제부 기자';
  if (verdict === null) {
    newsAnalystEl.classList.add('hidden');
  } else {
    newsAnalystEl.textContent = verdict ? '분석가 의견: 신빙성 높음' : '분석가 의견: 신빙성 낮음';
    newsAnalystEl.className = verdict ? 'trust' : 'doubt';
  }
  newsModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    newsModal.classList.add('visible');
    requestAnimationFrame(() => newsModalBox.classList.add('show'));
  });
}
function hideNewsModal() {
  newsModalBox.classList.remove('show');
  newsModal.classList.remove('visible');
  setTimeout(() => newsModal.classList.add('hidden'), 200);
}
newsCloseBtn.addEventListener('click', hideNewsModal);
newsConfirmBtn.addEventListener('click', hideNewsModal);

// ───────── DB 초기화 ─────────
async function initDB() {
  try {
    await SQLite.createConnection({ database: DB_NAME, encrypted: false, mode: 'no-encryption', version: 1, readonly: false });
  } catch (e) {}
  await SQLite.open({ database: DB_NAME });

  await SQLite.execute({
    database: DB_NAME,
    statements: `
      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        cash INTEGER, has_loan INTEGER, loan_turns_left INTEGER, loan_amount INTEGER, loan_repay INTEGER,
        loans_taken INTEGER, turn_count INTEGER, difficulty TEXT,
        rent_charge_count INTEGER, lobbyist_counter INTEGER, updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS employee_state (
        employee_id TEXT PRIMARY KEY,
        hired INTEGER DEFAULT 0,
        ever_hired INTEGER DEFAULT 0,
        locked_until_turn INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS stock_state (
        stock_id INTEGER PRIMARY KEY, price INTEGER, quantity INTEGER, avg_buy_price INTEGER, delisted INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        final_net_worth INTEGER, result TEXT, loans_taken INTEGER, turns_survived INTEGER,
        difficulty TEXT, employees_hired_count INTEGER, employees_hired_names TEXT,
        played_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS achievements (
        key TEXT PRIMARY KEY, unlocked_at TEXT
      );
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY, value INTEGER
      );
    `
  });

  // 기존 설치본 마이그레이션: 업적 진행 상황(flags) 컬럼 추가
  const cols = await SQLite.query({ database: DB_NAME, statement: 'PRAGMA table_info(game_state);', values: [] });
  if (!(cols.values || []).some(c => c.name === 'flags')) {
    await SQLite.execute({ database: DB_NAME, statements: 'ALTER TABLE game_state ADD COLUMN flags TEXT;' });
  }
}

async function hasSavedGame() {
  const result = await SQLite.query({ database: DB_NAME, statement: 'SELECT id FROM game_state WHERE id = 1;', values: [] });
  return !!(result.values && result.values.length > 0);
}

async function updateContinueButtonState() {
  const exists = await hasSavedGame();
  continueBtn.disabled = !exists;
  continueBtn.textContent = exists ? '이어하기' : '이어하기 (저장 없음)';
}

async function updateMainMenuStats() {
  const result = await SQLite.query({
    database: DB_NAME,
    statement: `SELECT COUNT(*) as total, SUM(CASE WHEN result='retired' THEN 1 ELSE 0 END) as retires, MAX(final_net_worth) as best FROM game_sessions;`,
    values: []
  });
  const row = result.values && result.values[0];
  if (!row || !row.total) {
    mmStatsEl.classList.add('hidden');
    return;
  }
  mmStatsEl.textContent = `최고 순자산 ${row.best.toLocaleString()}원 · 총 ${row.total}판 · 은퇴 ${row.retires || 0}회`;
  mmStatsEl.classList.remove('hidden');
}

function buildTickerTape() {
  const items = STOCKS_CONFIG.map(s => {
    const isUp = Math.random() < 0.5;
    const pct = (Math.random() * 4 + 0.3).toFixed(1);
    return `<span class="mm-ticker-item">${s.name} ${s.basePrice.toLocaleString()} <span class="${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'}${pct}%</span></span>`;
  }).join('');
  mmTickerTrack.innerHTML = items + items; // 두 배로 이어붙여 매끈하게 루프
}

async function getUnlockedAchievements() {
  const result = await SQLite.query({ database: DB_NAME, statement: 'SELECT key FROM achievements;', values: [] });
  return (result.values || []).map(r => r.key);
}

async function unlockAchievement(key) {
  await SQLite.run({
    database: DB_NAME,
    statement: `INSERT OR IGNORE INTO achievements (key, unlocked_at) VALUES (?, datetime('now'));`,
    values: [key]
  });
}

async function getRecentSessions(limit) {
  const result = await SQLite.query({
    database: DB_NAME, statement: `SELECT * FROM game_sessions ORDER BY id DESC LIMIT ?;`, values: [limit]
  });
  return result.values || [];
}

// ───────── 처음 하는 플레이어용 팁 (한 번만 표시) ─────────
const TIPS = {
  start:  '💡 상단 오른쪽 시장 국면 표시를 누르면 지금 강세인 업종을 볼 수 있어요.\n국면이 바뀌면 소식 탭에도 알려줍니다.',
  news:   '💡 뉴스는 3턴 동안 해당 종목에 영향을 줍니다.\n공시는 거의 확실하지만 움직임이 작고, 보도는 그 중간입니다.\n결과(적중/빗나감)는 소식 탭에서 확인할 수 있어요.',
  rumor:  '💡 루머는 크게 움직이지만 대부분 헛소문입니다.\n정보 분석가를 영입하면 진위를 가려낼 수 있어요.',
  rent:   '💡 다음 턴에 첫 임대료가 청구됩니다.\n임대료는 청구할 때마다 크게 늘어나니, 오래 버티기보다 빠르게 목표를 노리세요.',
  settle: "💡 판이 많이 기울었다면 하단의 '조기 정산'으로 지금까지 불린 만큼 포인트를 받고 끝낼 수 있어요."
};
const tipQueue = [];

function queueTip(key) {
  if (getMeta('tip_' + key) || tipQueue.includes(key)) return;
  tipQueue.push(key);
}

async function flushTips() {
  while (tipQueue.length > 0 && !isGameEnded) {
    const key = tipQueue.shift();
    await setMeta('tip_' + key, 1);
    await showAppAlert(TIPS[key]);
  }
}

// ───────── 메타 진행 ─────────
async function loadMetaState() {
  const result = await SQLite.query({ database: DB_NAME, statement: 'SELECT key, value FROM meta;', values: [] });
  metaState = {};
  (result.values || []).forEach(r => { metaState[r.key] = r.value; });
}

function getMeta(key) { return metaState[key] || 0; }

async function setMeta(key, value) {
  metaState[key] = value;
  await SQLite.run({
    database: DB_NAME,
    statement: 'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value;',
    values: [key, value]
  });
}

function isSectorUnlocked(sector) {
  if (!LOCKED_SECTORS.includes(sector)) return true;
  const upg = UPGRADES.find(u => u.sector === sector);
  return !!(upg && getMeta(upg.key));
}

function isEmployeeUnlocked(emp) {
  if (!emp.locked) return true;
  const upg = UPGRADES.find(u => u.employee === emp.id);
  return !!(upg && getMeta(upg.key));
}

// 달성한 업적의 보상 + 구매한 업그레이드를 합산
async function computeMetaBonus() {
  const bonus = { startCash: 0, loanCap: 0, rentBase: 0, newsAcc: 0, instantDraft: false, delistRecovery: 0, draftPlus: 0 };
  const unlocked = await getUnlockedAchievements();
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.includes(a.key)) return;
    Object.entries(a.perk).forEach(([k, v]) => {
      if (typeof v === 'boolean') bonus[k] = bonus[k] || v;
      else bonus[k] += v;
    });
  });
  bonus.startCash += getMeta('start_cash') * UPGRADE_START_CASH_STEP;
  bonus.draftPlus += getMeta('draft_plus');
  return bonus;
}

// 한 판 결과로 얻는 포인트: 시작 자금 대비 최고 순자산 증가분 250만원당 1P + 은퇴 10P, 공격형은 전체 ×1.5
// (증가분 기준이라 시작하자마자 조기 정산해도 포인트를 얻을 수 없음)
const AGGRESSIVE_POINT_MULT = 1.5;
const POINT_GROWTH_UNIT = 2500000;
function computeRunPoints(result) {
  const peak = Math.max(0, peakNetWorth, ...netWorthHistory);
  let points = Math.floor(Math.max(0, peak - gameStartCash) / POINT_GROWTH_UNIT);
  if (result === 'retired') points += 10;
  if (difficulty === 'aggressive') points = Math.round(points * AGGRESSIVE_POINT_MULT);
  return points;
}

async function renderUpgradeScreen() {
  upgradePointsEl.textContent = `보유 포인트 ${getMeta('points')}P`;
  upgradeListEl.innerHTML = '';
  UPGRADES.forEach(u => {
    const level = getMeta(u.key);
    const isMax = level >= u.maxLevel;
    const cost = isMax ? 0 : u.cost(level);
    const canBuy = !isMax && getMeta('points') >= cost;

    const row = document.createElement('div');
    row.className = 'upgrade-row' + (level > 0 && !u.consumable ? ' owned' : '');
    const levelText = u.consumable
      ? ` <span class="upgrade-level">보유 ${level}/${u.maxLevel}</span>`
      : (u.maxLevel > 1 ? ` <span class="upgrade-level">${level}/${u.maxLevel}</span>` : '');
    row.innerHTML = `
      <div class="upgrade-body">
        <div class="upgrade-name">${u.name}${levelText}</div>
        <div class="upgrade-desc">${u.desc}</div>
      </div>
      <button class="upgrade-buy-btn" data-key="${u.key}" ${canBuy ? '' : 'disabled'}>
        ${isMax ? (u.consumable ? '보유 최대' : (u.maxLevel > 1 ? '최대' : '해금됨')) : `${cost}P`}
      </button>
    `;
    upgradeListEl.appendChild(row);
  });
}

upgradeListEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('.upgrade-buy-btn');
  if (!btn || btn.disabled) return;
  const u = UPGRADES.find(x => x.key === btn.dataset.key);
  const level = getMeta(u.key);
  if (level >= u.maxLevel) return;
  const cost = u.cost(level);
  if (getMeta('points') < cost) return;
  await setMeta('points', getMeta('points') - cost);
  await setMeta(u.key, level + 1);
  await renderUpgradeScreen();
});

upgradeBtn.addEventListener('click', async () => {
  await renderUpgradeScreen();
  showScreen(upgradeScreen);
});
upgradeBackBtn.addEventListener('click', () => showScreen(mainMenu));

async function checkAchievements() {
  const alreadyUnlocked = await getUnlockedAchievements();
  const newly = [];
  const sessions = await getRecentSessions(10);
  const lastSession = sessions[0];

  const tryUnlock = async (key) => {
    if (alreadyUnlocked.includes(key) || newly.includes(key)) return;
    await unlockAchievement(key);
    newly.push(key);
  };

  if (lastSession && lastSession.result === 'retired') {
    await tryUnlock('first_retire');
    if (lastSession.loans_taken === 0) await tryUnlock('no_loan_retire');
    if (lastSession.difficulty === 'aggressive') await tryUnlock('aggressive_retire');
    if (!hadDelistLoss) await tryUnlock('no_delist_retire');
    if (lastSession.difficulty === 'aggressive' && lastSession.turns_survived <= 40) await tryUnlock('aggressive_speedrun');
    if (hadNearBankruptcy) await tryUnlock('comeback_retire');

    const last3 = sessions.slice(0, 3);
    if (last3.length === 3 && last3.every(s => s.result === 'retired')) await tryUnlock('streak_3');
  }

  if (sessionBigWin) await tryUnlock('big_win');

  const totalSectors = new Set(stocks.map(s => s.sector)).size;
  if (sectorsHeldThisGame.size >= totalSectors) await tryUnlock('sector_master');

  return newly;
}

async function renderAchievementsPreview() {
  const unlocked = await getUnlockedAchievements();
  achievementsListEl.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const isUnlocked = unlocked.includes(a.key);
    const row = document.createElement('div');
    row.className = 'achv-row' + (isUnlocked ? ' unlocked' : '');
    row.innerHTML = `
      <div class="achv-icon">${isUnlocked ? ACHV_CHECK_SVG : ACHV_LOCK_SVG}</div>
      <div class="achv-body">
        <div class="achv-name">${a.name}</div>
        <div class="achv-desc">${a.desc}</div>
        <div class="achv-reward">보상: ${a.reward} · ${POINTS_PER_ACHIEVEMENT}P</div>
        ${isUnlocked ? '<div class="achv-status">달성 완료 · 보상 적용 중</div>' : ''}
      </div>
    `;
    achievementsListEl.appendChild(row);
  });
}

howtoBtn.addEventListener('click', () => showScreen(howtoScreen));
howtoBackBtn.addEventListener('click', () => showScreen(mainMenu));

achievementsBtn.addEventListener('click', async () => {
  await renderAchievementsPreview();
  showScreen(achievementsScreen);
});
achvBackBtn.addEventListener('click', () => showScreen(mainMenu));

// ───────── 플레이 기록 ─────────
const RESULT_LABELS = { retired: '은퇴', settled: '정산', bankrupt: '파산' };
const RESULT_CLASSES = { retired: 'result-good', settled: 'result-mid', bankrupt: 'result-bad' };
function getResultLabel(result) { return RESULT_LABELS[result] || '파산'; }

async function saveSession(finalNetWorth, result) {
  const employeeNames = [...hiredEmployees].map(id => {
    const emp = getEmployee(id);
    return emp ? emp.name : id;
  }).join(', ');

  await SQLite.run({
    database: DB_NAME,
    statement: `INSERT INTO game_sessions (final_net_worth, result, loans_taken, turns_survived, difficulty, employees_hired_count, employees_hired_names)
                VALUES (?, ?, ?, ?, ?, ?, ?);`,
    values: [Math.round(finalNetWorth), result, loansTakenCount, turnCount, difficulty, hiredEmployees.size, employeeNames]
  });
}
async function getResultHistory() {
  const result = await SQLite.query({
    database: DB_NAME,
    statement: `SELECT result, COUNT(*) as cnt, MAX(final_net_worth) as best FROM game_sessions GROUP BY result;`,
    values: []
  });
  return result.values || [];
}
async function getSessionsList(limit) {
  const result = await SQLite.query({
    database: DB_NAME, statement: `SELECT * FROM game_sessions ORDER BY id DESC LIMIT ?;`, values: [limit]
  });
  return result.values || [];
}

async function renderRecordsScreen() {
  const summary = await getResultHistory();
  recordsSummaryEl.innerHTML = '';
  if (summary.length === 0) {
    recordsSummaryEl.textContent = '아직 플레이 기록이 없습니다.';
  } else {
    summary.forEach(h => {
      const label = getResultLabel(h.result);
      const div = document.createElement('div');
      div.textContent = `${label} ${h.cnt}회 · 최고 자산 ${h.best.toLocaleString()}원`;
      recordsSummaryEl.appendChild(div);
    });
  }

  const sessions = await getSessionsList(20);
  recordsListEl.innerHTML = '';
  if (sessions.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'empty-msg';
    msg.textContent = '플레이 기록이 없습니다.';
    recordsListEl.appendChild(msg);
    return;
  }

  sessions.forEach(s => {
    const resultLabel = getResultLabel(s.result);
    const resultClass = RESULT_CLASSES[s.result] || 'result-bad';
    const dateStr = (s.played_at || '').slice(0, 16);
    const diffLabel = DIFFICULTIES[s.difficulty] ? DIFFICULTIES[s.difficulty].label : '-';

    const empCount = s.employees_hired_count || 0;
    const empNames = s.employees_hired_names || '';

    const row = document.createElement('div');
    row.className = 'record-row';
    row.innerHTML = `
      <div class="record-top">
        <span class="record-result ${resultClass}">${resultLabel}</span>
        <span class="record-date">${dateStr}</span>
      </div>
      <div class="record-detail">${diffLabel} · 직원 ${empCount}명</div>
      <div class="record-detail">최종 순자산 ${s.final_net_worth.toLocaleString()}원 · ${s.turns_survived}턴 생존</div>
    `;
    row.addEventListener('click', () => {
      const detail = [
        `결과: ${resultLabel}`,
        `난이도: ${diffLabel}`,
        `최종 순자산: ${s.final_net_worth.toLocaleString()}원`,
        `생존 턴: ${s.turns_survived}턴`,
        `대출 이용 횟수: ${s.loans_taken}회`,
        `고용 직원: ${empCount}명${empNames ? ' (' + empNames + ')' : ''}`,
        `플레이 일시: ${s.played_at || '-'}`
      ].join('\n');
      showAppAlert(detail);
    });
    recordsListEl.appendChild(row);
  });
}
recordsBtn.addEventListener('click', async () => { await renderRecordsScreen(); showScreen(recordsScreen); });
recordsBackBtn.addEventListener('click', () => showScreen(mainMenu));

// ───────── 직원 효과 재계산 ─────────
function recomputeEmployeeEffects() {
  gameLoanMaxCap = LOAN_AMOUNT_BASE;
  gameNewsAccBonus = 0;
  gameLoanInterestRate = LOAN_INTEREST_RATE;
  gameRentDiscount = 0;

  if (metaBonus) {
    gameLoanMaxCap += metaBonus.loanCap;
    gameNewsAccBonus += metaBonus.newsAcc;
  }

  if (hiredEmployees.has('risk_manager')) gameLoanMaxCap += LOAN_CAP_BONUS;
  if (hiredEmployees.has('loan_specialist')) {
    gameLoanMaxCap += LOAN_SPECIALIST_CAP_BONUS;
    gameLoanInterestRate = LOAN_SPECIALIST_INTEREST_RATE;
  }
  if (hiredEmployees.has('finance_manager')) gameRentDiscount = FINANCE_MANAGER_DISCOUNT;
}

function getLoanCurrentRepay() {
  if (!loan) return 0;
  // 10턴 이내: 원금만 / 이후: 원금+누적이자
  if (loan.age < LOAN_SOFT_TURNS) return loan.amount;
  return loan.amount + (loan.interest || 0);
}

// chargeOffset: 0 = 이번 청구, 1 = 그다음 청구
function computeRentBreakdown(chargeOffset = 0) {
  const baseDiscount = metaBonus ? metaBonus.rentBase : 0;
  const base = Math.round(RENT_BASE * Math.pow(DIFFICULTIES[difficulty].rentGrowth, rentChargeCount + chargeOffset) * (1 - baseDiscount));

  let salaryTotal = 0;
  hiredEmployees.forEach(id => {
    const emp = getEmployee(id);
    if (emp) salaryTotal += emp.salary;
  });
  if (hiredEmployees.has('consultant')) salaryTotal = Math.round(salaryTotal * (1 - STAFF_DISCOUNT_RATE));

  const subtotal = base + salaryTotal;
  const total = Math.round(subtotal * (1 - gameRentDiscount));
  return { base, salaryTotal, total };
}

function computeRentAmount() {
  return computeRentBreakdown().total;
}

// ───────── 직원 영입 (드래프트) ─────────
function isDraftTurn(t) {
  return t >= DRAFT_FIRST_TURN && (t - DRAFT_FIRST_TURN) % DRAFT_INTERVAL === 0;
}

function getNextDraftTurn(t) {
  if (t < DRAFT_FIRST_TURN) return DRAFT_FIRST_TURN;
  return DRAFT_FIRST_TURN + (Math.floor((t - DRAFT_FIRST_TURN) / DRAFT_INTERVAL) + 1) * DRAFT_INTERVAL;
}

function rollDraft(extraOptions = 0) {
  const pool = EMPLOYEES.filter(e => isEmployeeUnlocked(e) && !hiredEmployees.has(e.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const size = DRAFT_BASE_OPTIONS + (metaBonus ? metaBonus.draftPlus : 0) + extraOptions;
  const picked = pool.slice(0, size).map(e => e.id);
  return picked.length > 0 ? picked : null;
}

function showDraftModal() {
  if (!pendingDraft) return;
  draftOptionsEl.innerHTML = '';
  pendingDraft.forEach(id => {
    const emp = getEmployee(id);
    if (!emp) return;
    const btn = document.createElement('button');
    btn.className = 'draft-option';
    btn.dataset.id = emp.id;
    btn.innerHTML = `
      <span class="draft-option-name">${emp.name}</span>
      <span class="draft-option-desc">${emp.desc}</span>
      <span class="draft-option-salary">급여 ${emp.salary.toLocaleString()}원 / 5턴</span>
    `;
    draftOptionsEl.appendChild(btn);
  });
  draftModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    draftModal.classList.add('visible');
    requestAnimationFrame(() => draftModalBox.classList.add('show'));
  });
}

function hideDraftModal() {
  draftModalBox.classList.remove('show');
  draftModal.classList.remove('visible');
  setTimeout(() => draftModal.classList.add('hidden'), 200);
}

async function resolveDraft(empId) {
  if (!pendingDraft) return;
  pendingDraft = null;
  hideDraftModal();
  if (empId) {
    hiredEmployees.add(empId);
    showActionToast(`${getEmployee(empId).name} 영입 완료`, 'neutral');
  }
  recomputeEmployeeEffects();
  updateLoanButtonLabel();
  await saveState();
  updateTopBar();
  updateProfileLine();
  renderEmployeeBadges();
  if (mainTab === 'employees') renderEmployeesModal();
}

draftOptionsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.draft-option');
  if (btn) resolveDraft(btn.dataset.id);
});
draftSkipBtn.addEventListener('click', () => resolveDraft(null));

// ───────── 직원 관리 탭 ─────────
function renderEmployeesModal() {
  const nextDraft = getNextDraftTurn(turnCount);
  employeesDescEl.textContent = pendingDraft
    ? '영입 대기 중인 후보가 있습니다. "다음 턴"을 누르면 선택 창이 열립니다.'
    : `다음 인재 영입까지 ${nextDraft - turnCount}턴 · 급여는 임대료와 함께 청구됩니다.`;

  employeesListEl.innerHTML = '';
  const hired = EMPLOYEES.filter(e => hiredEmployees.has(e.id));
  const others = EMPLOYEES.filter(e => !hiredEmployees.has(e.id));

  if (hired.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'employee-empty';
    msg.textContent = '아직 영입한 직원이 없습니다.';
    employeesListEl.appendChild(msg);
  }
  hired.forEach(emp => {
    const row = document.createElement('div');
    row.className = 'employee-row hired';
    row.innerHTML = `
      <div class="employee-top">
        <span class="employee-name">${emp.name}</span>
        <span class="employee-status">근무중</span>
      </div>
      <div class="employee-desc">${emp.desc} · 급여 ${emp.salary.toLocaleString()}원/징수</div>
      <button class="employee-action-btn fire-btn" data-action="fire" data-id="${emp.id}">해고</button>
    `;
    employeesListEl.appendChild(row);
  });

  const header = document.createElement('div');
  header.className = 'employee-pool-header';
  header.textContent = '영입 후보 풀';
  employeesListEl.appendChild(header);

  others.forEach(emp => {
    const unlocked = isEmployeeUnlocked(emp);
    const row = document.createElement('div');
    row.className = 'employee-row pool' + (unlocked ? '' : ' locked');
    row.innerHTML = `
      <div class="employee-top">
        <span class="employee-name">${emp.name}</span>
        <span class="employee-pool-tag">${unlocked ? '후보' : '성장에서 해금'}</span>
      </div>
      <div class="employee-desc">${emp.desc} · 급여 ${emp.salary.toLocaleString()}원/징수</div>
    `;
    employeesListEl.appendChild(row);
  });
}

employeesListEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action="fire"]');
  if (!btn) return;
  const emp = getEmployee(btn.dataset.id);
  const ok = await showAppConfirm(`${emp.name}을(를) 해고할까요?\n다시 영입 후보로 나올 때까지 함께할 수 없습니다.`, '해고', '취소');
  if (!ok) return;

  hiredEmployees.delete(emp.id);
  recomputeEmployeeEffects();
  updateLoanButtonLabel();
  await saveState();
  updateTopBar();
  updateProfileLine();
  renderEmployeeBadges();
  renderEmployeesModal();
});

// ───────── 메인 탭 (시장 / 직원관리 / 소식) ─────────
let mainTab = 'market';
let hasUnreadNews = false;

function switchMainTab(tab) {
  mainTab = tab;
  mainTabButtons.forEach(b => b.classList.toggle('active', b.dataset.maintab === tab));
  tabContentMarket.classList.toggle('hidden', tab !== 'market');
  tabContentEmployees.classList.toggle('hidden', tab !== 'employees');
  tabContentNews.classList.toggle('hidden', tab !== 'news');

  if (tab === 'employees') renderEmployeesModal();
  if (tab === 'news') {
    hasUnreadNews = false;
    newsBadge.classList.add('hidden');
    renderNewsHistory();
  }
}

mainTabButtons.forEach(btn => {
  btn.addEventListener('click', () => switchMainTab(btn.dataset.maintab));
});

function renderEmployeeBadges() {
  employeeBadgesEl.innerHTML = '';
  hiredEmployees.forEach(id => {
    const emp = getEmployee(id);
    if (!emp) return;
    const badge = document.createElement('span');
    badge.className = 'employee-badge';
    badge.textContent = emp.name;
    employeeBadgesEl.appendChild(badge);
  });
}

// ───────── 게임 상태 저장/로드 ─────────
// 종목 17개 + 직원 7개 + 게임 상태를 매번 따로 DB 왕복하면 느려서,
// executeSet으로 한 번에 배치 실행 (DB 왕복 1회로 단축)
async function saveState() {
  if (isGameEnded) return; // 게임 종료(clearState) 후 저장되면 끝난 게임이 '이어하기'로 되살아남
  const set = [];

  set.push({
    statement: `INSERT INTO game_state (id, cash, has_loan, loan_turns_left, loan_amount, loan_repay, loans_taken, turn_count, difficulty,
                  rent_charge_count, lobbyist_counter, flags, updated_at)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(id) DO UPDATE SET
                  cash=excluded.cash, has_loan=excluded.has_loan, loan_turns_left=excluded.loan_turns_left,
                  loan_amount=excluded.loan_amount, loan_repay=excluded.loan_repay, loans_taken=excluded.loans_taken,
                  turn_count=excluded.turn_count, difficulty=excluded.difficulty,
                  rent_charge_count=excluded.rent_charge_count, lobbyist_counter=excluded.lobbyist_counter,
                  flags=excluded.flags, updated_at=excluded.updated_at;`,
    values: [cash, loan ? 1 : 0, loan ? (loan.age || 0) : 0, loan ? loan.amount : 0, loan ? (loan.interest || 0) : 0,
             loansTakenCount, turnCount, difficulty, rentChargeCount, lobbyistCounter, JSON.stringify({
               bigWin: sessionBigWin,
               nearBankruptcy: hadNearBankruptcy,
               delistLoss: hadDelistLoss,
               offeredRetire: hasOfferedRetire,
               sectors: [...sectorsHeldThisGame],
               // 로그라이크 판 구성 (이번 판에 상장된 종목과 시작가, 시장 국면, 영입 대기 후보)
               runStocks: stocks.map(s => [s.id, s.basePrice]),
               regime: marketRegime,
               draft: pendingDraft,
               startCash: gameStartCash,
               peak: peakNetWorth,
               loanCooldownUntil,
               news: activeNews,
               event: activeEvent,
               newsHistory: newsHistory.slice(0, 30)
             })]
  });

  for (const s of stocks) {
    set.push({
      statement: `INSERT INTO stock_state (stock_id, price, quantity, avg_buy_price, delisted) VALUES (?, ?, ?, ?, ?)
                  ON CONFLICT(stock_id) DO UPDATE SET price=excluded.price, quantity=excluded.quantity, avg_buy_price=excluded.avg_buy_price, delisted=excluded.delisted;`,
      values: [s.id, s.price, s.quantity, s.avgBuyPrice, s.delisted ? 1 : 0]
    });
  }

  for (const emp of EMPLOYEES) {
    set.push({
      statement: `INSERT INTO employee_state (employee_id, hired, locked_until_turn) VALUES (?, ?, ?)
                  ON CONFLICT(employee_id) DO UPDATE SET hired=excluded.hired, locked_until_turn=excluded.locked_until_turn;`,
      values: [emp.id, hiredEmployees.has(emp.id) ? 1 : 0, 0]
    });
  }

  await SQLite.executeSet({ database: DB_NAME, set, transaction: true });
}

async function clearState() {
  await SQLite.run({ database: DB_NAME, statement: 'DELETE FROM game_state;', values: [] });
  await SQLite.run({ database: DB_NAME, statement: 'DELETE FROM stock_state;', values: [] });
  await SQLite.run({ database: DB_NAME, statement: 'DELETE FROM employee_state;', values: [] });
}

// ───────── 메인 메뉴 / 난이도 선택 ─────────
continueBtn.addEventListener('click', async () => {
  if (continueBtn.disabled) return;
  const resumed = await tryResumeGame();
  if (resumed) {
    showScreen(gameContainer);
    if (pendingDraft) showDraftModal();
  }
});
newGameBtn.addEventListener('click', () => showScreen(difficultyScreen));
diffBackBtn.addEventListener('click', () => showScreen(mainMenu));

diffButtons.forEach(btn => {
  btn.addEventListener('click', () => startNewGame(btn.dataset.diff));
});

function updateLoanButtonLabel() {
  const cooldown = loan ? 0 : getLoanCooldownLeft();
  loanBtn.disabled = cooldown > 0;
  loanBtn.textContent = cooldown > 0
    ? `대출 불가 (${cooldown}턴 후 가능)`
    : `대출 받기 (최대 ${gameLoanMaxCap.toLocaleString()}원)`;
}

function rollSpikeTurns() {
  let r = Math.random();
  for (let i = 0; i < EVENT_SPIKE_TURN_WEIGHTS.length; i++) {
    r -= EVENT_SPIKE_TURN_WEIGHTS[i];
    if (r < 0) return i + 1;
  }
  return 1;
}

function updateProfileLine() {
  const diffLabel = DIFFICULTIES[difficulty] ? DIFFICULTIES[difficulty].label : '';
  profileLine.textContent = `${diffLabel} · 직원 ${hiredEmployees.size}명 근무 중`;
}

function updateRegimeChip() {
  const regime = marketRegime && MARKET_REGIMES[marketRegime.key];
  regimeChip.textContent = regime ? regime.label : '';
  regimeChip.className = regime ? `regime-${marketRegime.key}` : '';
}

// 이번 판에 상장된 업종 중 해당 국면에서 강세인 업종 안내 문구
function describeStrongSectors(regimeKey) {
  const listed = new Set(stocks.map(s => s.sector));
  const strong = Object.keys(MARKET_REGIMES[regimeKey].sectors).filter(sec => listed.has(sec));
  return strong.length ? ` 강세 예상 업종: ${strong.join('·')}` : '';
}

regimeChip.addEventListener('click', () => {
  if (!marketRegime) return;
  const regime = MARKET_REGIMES[marketRegime.key];
  showAppAlert(`현재 시장 국면: ${regime.label}\n${regime.desc}.\n${describeStrongSectors(marketRegime.key).trim() || '뚜렷한 강세 업종 없음'}`);
});

function rollRegime(excludeKey) {
  const keys = Object.keys(MARKET_REGIMES).filter(k => k !== excludeKey);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const turnsLeft = REGIME_MIN_TURNS + Math.floor(Math.random() * (REGIME_MAX_TURNS - REGIME_MIN_TURNS + 1));
  return { key, turnsLeft };
}

// 이번 판에 상장될 종목 구성: 해금된 섹터에서 랜덤 추출 + 시작가 랜덤
function generateRunStocks() {
  const pool = STOCKS_CONFIG.filter(s => isSectorUnlocked(s.sector));
  const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];
  const picked = new Set(pool.filter(() => Math.random() < STOCK_KEEP_CHANCE));

  // 섹터마다 최소 1종목, 테마주(급등 이벤트 대상) 최소 1종목 보장
  [...new Set(pool.map(s => s.sector))].forEach(sector => {
    if (![...picked].some(s => s.sector === sector)) picked.add(pickRandom(pool.filter(s => s.sector === sector)));
  });
  if (![...picked].some(s => s.category === 'theme')) {
    const themes = pool.filter(s => s.category === 'theme');
    if (themes.length > 0) picked.add(pickRandom(themes));
  }

  return pool.filter(s => picked.has(s)).map(cfg => {
    const jitter = 1 + (Math.random() * 2 - 1) * START_PRICE_JITTER;
    const base = Math.max(1000, Math.round(cfg.basePrice * jitter / 100) * 100);
    return { ...cfg, basePrice: base, price: base, quantity: 0, avgBuyPrice: 0, delisted: false };
  });
}

async function startNewGame(diffKey) {
  metaBonus = await computeMetaBonus();
  difficulty = diffKey;
  gameStartCash = STARTING_CASH[diffKey] + metaBonus.startCash;
  isGameEnded = false;
  isTurnProcessing = false;

  cash = gameStartCash;
  loan = null;
  loansTakenCount = 0;
  turnCount = 1;
  rentChargeCount = 0;
  lobbyistCounter = 0;
  sessionBigWin = false;
  sectorsHeldThisGame = new Set();
  hadDelistLoss = false;
  hasOfferedRetire = false;
  hadNearBankruptcy = false;
  hiredEmployees = new Set();
  activeEvent = null;
  activeNews = null;
  newsHistory = [];
  hasUnreadNews = false;
  stocks = generateRunStocks();
  priceHistory = stocks.map(s => [s.price]);
  netWorthHistory = [cash];
  peakNetWorth = cash;
  loanCooldownUntil = 0;
  expandedStockIds = new Set();
  marketRegime = rollRegime(null);
  // 시작 즉시 영입: 업적 '만물박사' 보상 또는 스카우트 계약(후보 +2명, 1개 소모)
  const useScout = getMeta('scout_ticket') > 0;
  if (useScout) await setMeta('scout_ticket', getMeta('scout_ticket') - 1);
  pendingDraft = (metaBonus.instantDraft || useScout) ? rollDraft(useScout ? 2 : 0) : null;

  recomputeEmployeeEffects();
  const regime = MARKET_REGIMES[marketRegime.key];
  pushNewsItem(`개장 — 이번 시장은 ${regime.label}. ${regime.desc}${describeStrongSectors(marketRegime.key)}`, regime.tone);
  await saveState();

  showScreen(gameContainer);
  updateLoanButtonLabel();
  updateProfileLine();
  updateRegimeChip();
  renderEmployeeBadges();
  switchMainTab('market');
  renderStockPanel();
  updateTopBar();
  updateBottomPanel();
  resultOverlay.classList.add('hidden');
  if (pendingDraft) showDraftModal();
  queueTip('start');
  await flushTips();
}

async function tryResumeGame() {
  const stateResult = await SQLite.query({ database: DB_NAME, statement: 'SELECT * FROM game_state WHERE id = 1;', values: [] });
  if (!(stateResult.values && stateResult.values.length > 0)) return false;

  const state = stateResult.values[0];
  let flags = null;
  try { flags = state.flags ? JSON.parse(state.flags) : null; } catch (e) { flags = null; }
  metaBonus = await computeMetaBonus();

  cash = state.cash;
  loansTakenCount = state.loans_taken;
  turnCount = state.turn_count;
  difficulty = state.difficulty || 'stable';
  gameStartCash = (flags && flags.startCash) || STARTING_CASH[difficulty];
  isGameEnded = false;
  isTurnProcessing = false;
  rentChargeCount = state.rent_charge_count || 0;
  lobbyistCounter = state.lobbyist_counter || 0;
  if (state.has_loan) {
    const age = state.loan_turns_left || 0; // DB 필드 재사용: turns_left 자리에 age 저장
    const interest = state.loan_repay || 0; // repay 자리에 interest 저장
    loan = {
      amount: state.loan_amount,
      interest,
      age,
      repay: age < LOAN_SOFT_TURNS ? state.loan_amount : state.loan_amount + interest,
      turnsLeft: Math.max(0, LOAN_FORCE_TURNS - age)
    };
  } else {
    loan = null;
  }
  sessionBigWin = false;

  const empResult = await SQLite.query({ database: DB_NAME, statement: 'SELECT * FROM employee_state;', values: [] });
  hiredEmployees = new Set();
  (empResult.values || []).forEach(row => {
    if (row.hired && getEmployee(row.employee_id)) hiredEmployees.add(row.employee_id);
  });
  recomputeEmployeeEffects();

  const stockResult = await SQLite.query({ database: DB_NAME, statement: 'SELECT * FROM stock_state ORDER BY stock_id;', values: [] });
  // STOCKS_CONFIG는 섹터순이라 id 순서와 다르므로, 배열 인덱스가 아닌 stock_id로 매칭
  const savedById = new Map((stockResult.values || []).map(r => [r.stock_id, r]));
  // 이번 판에 상장된 종목과 시작가 (구버전 저장 데이터는 전 종목·기본가)
  const runBase = new Map(flags && flags.runStocks ? flags.runStocks : STOCKS_CONFIG.map(c => [c.id, c.basePrice]));
  stocks = STOCKS_CONFIG.filter(cfg => runBase.has(cfg.id)).map(cfg => {
    const base = runBase.get(cfg.id);
    const r = savedById.get(cfg.id);
    if (!r) return { ...cfg, basePrice: base, price: base, quantity: 0, avgBuyPrice: 0, delisted: false };
    return { ...cfg, basePrice: base, price: r.price, quantity: r.quantity, avgBuyPrice: r.avg_buy_price, delisted: !!r.delisted };
  });

  marketRegime = (flags && flags.regime && MARKET_REGIMES[flags.regime.key]) ? flags.regime : rollRegime(null);
  pendingDraft = flags && Array.isArray(flags.draft) ? flags.draft.filter(id => getEmployee(id)) : null;
  if (pendingDraft && pendingDraft.length === 0) pendingDraft = null;

  if (flags) {
    sessionBigWin = !!flags.bigWin;
    hadNearBankruptcy = !!flags.nearBankruptcy;
    hadDelistLoss = !!flags.delistLoss;
    hasOfferedRetire = !!flags.offeredRetire;
    sectorsHeldThisGame = new Set(flags.sectors || []);
  } else {
    // 구버전 저장 데이터: 과거 이력을 알 수 없어 현재 상태 기준으로 근사 복원
    hadNearBankruptcy = calcNetWorthWith(stocks, cash, loan) <= gameStartCash * NEAR_BANKRUPT_RATIO;
    hadDelistLoss = false;
    hasOfferedRetire = calcNetWorthWith(stocks, cash, loan) >= TARGET_NET_WORTH;
    sectorsHeldThisGame = new Set();
  }
  stocks.forEach(s => { if (s.quantity > 0) sectorsHeldThisGame.add(s.sector); });
  // 진행 중이던 뉴스·급등 이벤트와 소식 기록 복원 (상장된 종목만 유효)
  const listedIds = new Set(stocks.filter(s => !s.delisted).map(s => s.id));
  activeNews = null;
  if (flags && flags.news && NEWS_SOURCES[flags.news.src]) {
    const ids = (flags.news.stockIds || []).filter(id => listedIds.has(id));
    if (ids.length > 0) activeNews = { ...flags.news, stockIds: ids };
  }
  activeEvent = (flags && flags.event && listedIds.has(flags.event.stockId)) ? flags.event : null;
  newsHistory = (flags && Array.isArray(flags.newsHistory)) ? flags.newsHistory : [];
  hasUnreadNews = false;
  expandedStockIds = new Set();
  priceHistory = stocks.map(s => [s.price]);
  netWorthHistory = [calcNetWorthWith(stocks, cash, loan)];
  peakNetWorth = Math.max(netWorthHistory[0], (flags && flags.peak) || 0);
  loanCooldownUntil = (flags && flags.loanCooldownUntil) || 0;

  updateLoanButtonLabel();
  updateProfileLine();
  updateRegimeChip();
  renderEmployeeBadges();
  switchMainTab('market');
  renderStockPanel();
  updateTopBar();
  updateBottomPanel();
  return true;
}

// ───────── 게임 로직 ─────────
function calcNetWorthWith(stocksArr, cashVal, loanVal) {
  const stockValue = stocksArr.reduce((sum, s) => sum + s.price * s.quantity, 0);
  let loanDebt = 0;
  if (loanVal) {
    const age = loanVal.age || 0;
    loanDebt = age < LOAN_SOFT_TURNS ? loanVal.amount : (loanVal.amount + (loanVal.interest || 0));
  }
  return cashVal + stockValue - loanDebt;
}
function calcNetWorth() { return calcNetWorthWith(stocks, cash, loan); }

function rollNewsSource() {
  let r = Math.random();
  for (const [key, src] of Object.entries(NEWS_SOURCES)) {
    r -= src.weight;
    if (r < 0) return key;
  }
  return 'report';
}

function generateNews() {
  const pool = stocks.filter(s => !s.delisted);
  if (pool.length === 0) return;

  const isPositive = Math.random() < 0.5;
  const isSectorNews = Math.random() < SECTOR_NEWS_CHANCE;
  let targetIds, text;

  if (isSectorNews) {
    const sectors = [...new Set(pool.map(s => s.sector))];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const sectorStocks = pool.filter(s => s.sector === sector);
    targetIds = sectorStocks.map(s => s.id);
    const templates = isPositive ? SECTOR_POSITIVE_NEWS : SECTOR_NEGATIVE_NEWS;
    text = templates[Math.floor(Math.random() * templates.length)].replace('{sector}', sector);
  } else {
    const target = pool[Math.floor(Math.random() * pool.length)];
    targetIds = [target.id];
    const sectorPack = SECTOR_STOCK_NEWS[target.sector];
    let templates;
    if (sectorPack) {
      templates = isPositive ? sectorPack.pos : sectorPack.neg;
    } else {
      templates = isPositive ? POSITIVE_NEWS : NEGATIVE_NEWS;
    }
    // 30% 확률로 일반 헤드라인 섞어 다양성 확보
    if (Math.random() < 0.3) {
      templates = isPositive ? POSITIVE_NEWS : NEGATIVE_NEWS;
    }
    text = templates[Math.floor(Math.random() * templates.length)].replace('{name}', target.name);
  }

  const srcKey = rollNewsSource();
  const src = NEWS_SOURCES[srcKey];
  const truth = Math.random() < Math.min(0.95, src.acc + gameNewsAccBonus);
  const verdict = hiredEmployees.has('analyst')
    ? (Math.random() < ANALYST_VERDICT_ACCURACY ? truth : !truth)
    : null;

  showNewsModal(text, isPositive, srcKey, verdict);
  const verdictNote = verdict === null ? '' : (verdict ? ' (분석가: 신빙성 높음)' : ' (분석가: 신빙성 낮음)');
  const historyId = pushNewsItem(text + verdictNote, isPositive ? 'positive' : 'negative', src.label);
  activeNews = { stockIds: targetIds, direction: isPositive ? 1 : -1, turnsLeft: 3, src: srcKey, truth, historyId };
  queueTip(srcKey === 'rumor' ? 'rumor' : 'news');
}

// 신문 팝업에 띄우는 동시에 소식 탭 히스토리에도 기록 (뉴스/상장폐지/시황 공용)
// tone: 'positive' | 'negative' | 'neutral'
const NEWS_TONE_LABELS = { positive: '호재', negative: '악재', neutral: '시황' };
function pushNewsItem(text, tone, sourceLabel = null) {
  const id = `n${turnCount}-${Math.random().toString(36).slice(2, 8)}`;
  newsHistory.unshift({ id, turn: turnCount, text, tone, sourceLabel });
  if (newsHistory.length > 50) newsHistory.pop();
  if (mainTab === 'news') {
    renderNewsHistory();
  } else {
    hasUnreadNews = true;
    newsBadge.classList.remove('hidden');
  }
  return id;
}

// 뉴스 효과가 끝나면 소식 탭의 해당 기사에 결과 표시
function finishActiveNews() {
  if (!activeNews) return;
  const item = newsHistory.find(n => n.id === activeNews.historyId);
  if (item) item.result = activeNews.truth ? 'hit' : 'miss';
  activeNews = null;
  if (mainTab === 'news') renderNewsHistory();
}

function renderNewsResult(item) {
  if (item.result === 'hit') return '<span class="news-history-result hit">적중</span>';
  if (item.result === 'miss') return '<span class="news-history-result miss">빗나감</span>';
  if (activeNews && activeNews.historyId === item.id) return `<span class="news-history-result pending">진행 중 · ${activeNews.turnsLeft}턴</span>`;
  return '';
}

function renderNewsHistory() {
  newsHistoryListEl.innerHTML = '';
  if (newsHistory.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'news-history-empty';
    msg.textContent = '아직 발생한 소식이 없습니다.';
    newsHistoryListEl.appendChild(msg);
    return;
  }
  newsHistory.forEach(item => {
    const div = document.createElement('div');
    div.className = 'news-history-item';
    div.innerHTML = `
      <div class="news-history-top">
        <span class="news-history-tags">
          <span class="news-history-tag ${item.tone}">${NEWS_TONE_LABELS[item.tone]}</span>
          ${item.sourceLabel ? `<span class="news-history-source">${item.sourceLabel}</span>` : ''}
          ${renderNewsResult(item)}
        </span>
        <span class="news-history-turn">${item.turn}턴</span>
      </div>
      <div class="news-history-text">${item.text}</div>
    `;
    newsHistoryListEl.appendChild(div);
  });
}

async function goToNextTurn() {
  if (isTurnProcessing || isGameEnded) return;
  if (pendingDraft) { showDraftModal(); return; } // 영입 후보를 고르기 전에는 진행 불가
  isTurnProcessing = true;
  try {
    await processNextTurn();
    if (!isGameEnded) {
      if ((turnCount + 1) % RENT_INTERVAL_TURNS === 0 && rentChargeCount === 0) queueTip('rent');
      if (turnCount >= 15 && calcNetWorth() < gameStartCash * 0.6) queueTip('settle');
      await flushTips();
    }
  } finally {
    isTurnProcessing = false;
  }
}

async function processNextTurn() {
  turnCount++;
  expandedStockIds.clear();

  // 다음 턴이 임대료 징수 턴이면 미리 예고
  let feePreview = null;
  if ((turnCount + 1) % RENT_INTERVAL_TURNS === 0) {
    feePreview = computeRentAmount();
  }

  let loanWarning = null;
  if (loan) {
    const turnsLeftAfterThisTurn = LOAN_FORCE_TURNS - ((loan.age || 0) + 1);
    if (turnsLeftAfterThisTurn <= 3) loanWarning = Math.max(0, turnsLeftAfterThisTurn);
  }
  showTurnToast(turnCount, feePreview, loanWarning);

  const regime = MARKET_REGIMES[marketRegime.key];
  const volMult = DIFFICULTIES[difficulty].volMult * regime.volMult;
  const delistedNamesThisTurn = [];
  const delistRecoveryRate = Math.max(
    hiredEmployees.has('hedge_manager') ? HEDGE_RECOVERY_RATE : 0,
    metaBonus ? metaBonus.delistRecovery : 0
  );
  let delistRecovered = 0;

  // 급등 이벤트 발생 판정 (이번 턴 가격에 바로 반영 → 배너는 급등 '후'에 표시)
  let newEventStock = null;
  if (!activeEvent && Math.random() < EVENT_CHANCE) {
    const pool = stocks.filter(s => !s.delisted && s.category === 'theme');
    if (pool.length > 0) {
      newEventStock = pool[Math.floor(Math.random() * pool.length)];
      activeEvent = { stockId: newEventStock.id, phase: 'spike', spikeTurns: rollSpikeTurns(), decayTurns: EVENT_DECAY_TURNS, crashed: false };
    }
  }

  stocks.forEach((s, i) => {
    if (s.delisted) return;

    const biasOffset = DIFFICULTIES[difficulty].biasOffset;
    let changePercent = (Math.random() - biasOffset) * s.volatility * 2 * volMult;
    if (s.category === 'bluechip') changePercent += BLUECHIP_DRIFT;
    changePercent += regime.drift + (regime.sectors[s.sector] || 0);

    if (activeEvent && activeEvent.stockId === s.id) {
      if (activeEvent.phase === 'spike') {
        changePercent += EVENT_SPIKE_MIN + Math.random() * EVENT_SPIKE_RANGE;
        activeEvent.spikeTurns--;
        if (activeEvent.spikeTurns <= 0) activeEvent.phase = 'decay';
      } else {
        changePercent -= activeEvent.crashed ? EVENT_DECAY : EVENT_CRASH;
        activeEvent.crashed = true;
        activeEvent.decayTurns--;
        if (activeEvent.decayTurns <= 0) { activeEvent = null; eventBanner.classList.add('hidden'); }
      }
    }

    if (activeNews && activeNews.stockIds.includes(s.id)) {
      const src = NEWS_SOURCES[activeNews.src];
      changePercent += activeNews.truth ? activeNews.direction * src.hit : -activeNews.direction * src.miss;
    }

    const newPrice = Math.max(50, Math.round(s.price * (1 + changePercent)));
    s._lastChangeRatio = (newPrice - s.price) / s.price;
    s.price = newPrice;
    priceHistory[i].push(s.price);
    if (priceHistory[i].length > 100) priceHistory[i].shift();

    if (s.price <= s.basePrice * DELIST_THRESHOLD) {
      if (s.quantity > 0) {
        delistRecovered += Math.round(s.avgBuyPrice * s.quantity * delistRecoveryRate);
        s.quantity = 0; s.avgBuyPrice = 0; hadDelistLoss = true;
      }
      s.delisted = true;
      expandedStockIds.delete(s.id);
      delistedNamesThisTurn.push(s.name);
    }
  });

  if (activeEvent) {
    const es = stocks.find(x => x.id === activeEvent.stockId);
    if (!es || es.delisted) { activeEvent = null; eventBanner.classList.add('hidden'); }
  }
  if (activeNews) {
    activeNews.stockIds = activeNews.stockIds.filter(id => {
      const st = stocks.find(x => x.id === id);
      return st && !st.delisted;
    });
    if (activeNews.stockIds.length === 0) finishActiveNews();
  }
  if (activeNews) {
    activeNews.turnsLeft--;
    if (activeNews.turnsLeft <= 0) finishActiveNews();
  }
  // 상장폐지 속보: 해당 턴 신문(팝업 + 소식 탭)에 바로 반영
  if (delistedNamesThisTurn.length > 0) {
    const delistText = delistedNamesThisTurn.length === 1
      ? `${delistedNamesThisTurn[0]}, 상장폐지 확정`
      : `${delistedNamesThisTurn.join(', ')}, 동시 상장폐지 확정`;
    showNewsModal(delistText, false);
    pushNewsItem(delistText, 'negative');
    showEventBanner(`💥 "${delistedNamesThisTurn.join(', ')}" 상장폐지되었습니다!`);
  } else {
    if (!activeNews && Math.random() < NEWS_CHANCE) generateNews();
  }

  if (delistRecovered > 0) {
    cash += delistRecovered;
    showActionToast(`상장폐지 손실 일부 회수 +${delistRecovered.toLocaleString()}원`, 'neutral');
  }

  // 시장 국면 전환
  marketRegime.turnsLeft--;
  if (marketRegime.turnsLeft <= 0) {
    marketRegime = rollRegime(marketRegime.key);
    const next = MARKET_REGIMES[marketRegime.key];
    pushNewsItem(`시장 국면 전환 — ${next.label} 진입. ${next.desc}${describeStrongSectors(marketRegime.key)}`, next.tone);
    showEventBanner(`📊 시장 국면 전환: ${next.label}`);
    updateRegimeChip();
  }

  if (newEventStock && !newEventStock.delisted) {
    const pct = ((newEventStock._lastChangeRatio || 0) * 100).toFixed(1);
    let hint = '추가 상승은 미지수';
    if (hiredEmployees.has('theme_hunter')) {
      const willRiseMore = !!activeEvent && activeEvent.stockId === newEventStock.id && activeEvent.phase === 'spike';
      const saysMore = Math.random() < THEME_HUNTER_HINT_ACCURACY ? willRiseMore : !willRiseMore;
      hint = saysMore ? '테마 헌터: 추가 상승 예상' : '테마 헌터: 곧 차익 실현 매물 예상';
    }
    showEventBanner(`🔥 "${newEventStock.name}" 급등! (+${pct}%) ${hint}`);
  }

  // 펀드매니저: 매턴 보유 현금의 일정 비율 안정 수익
  if (hiredEmployees.has('fund_manager')) {
    cash += Math.round(cash * FUND_MANAGER_RATE);
  }

  // 임대료 징수 (기본 임대료 + 직원 1인당 고정비, 재무팀장 감면, 로비스트 면제)
  if (turnCount % RENT_INTERVAL_TURNS === 0) {
    let rent = computeRentAmount();
    let exempted = false;

    if (hiredEmployees.has('lobbyist')) {
      lobbyistCounter++;
      if (lobbyistCounter >= LOBBYIST_EXEMPT_EVERY) {
        exempted = true;
        lobbyistCounter = 0;
      }
    }

    if (exempted) {
      showEventBanner(`🎉 로비스트 활약으로 이번 턴 임대료가 면제되었습니다!`);
    } else {
      cash -= rent;
      showEventBanner(`🏢 임대료 ${rent.toLocaleString()}원이 청구되었습니다.`);
    }

    rentChargeCount++;
  }

  if (loan) {
    loan.age = (loan.age || 0) + 1;
    loan.turnsLeft = Math.max(0, LOAN_FORCE_TURNS - loan.age);

    // 10턴마다 원금의 5% 이자 가산 (대출 전문가 고용 시 면제)
    if (loan.age > 0 && loan.age % LOAN_INTEREST_EVERY === 0 && loan.age <= LOAN_FORCE_TURNS) {
      const add = Math.round(loan.amount * gameLoanInterestRate);
      loan.interest = (loan.interest || 0) + add;
      showEventBanner(`💳 대출 이자 ${add.toLocaleString()}원이 가산되었습니다. (누적 이자 ${(loan.interest).toLocaleString()}원)`);
    }

    loan.repay = getLoanCurrentRepay();

    // 20턴 경과 시 강제 상환
    if (loan.age >= LOAN_FORCE_TURNS) {
      const due = loan.amount + (loan.interest || 0);
      if (cash < due) {
        netWorthHistory.push(calcNetWorth());
        await gameOver('bankrupt', `대출 강제 상환 기한(20턴)을 넘겼고, 상환액 ${due.toLocaleString()}원을 마련하지 못했습니다!`);
        return;
      }
      cash -= due;
      loan = null;
      loanCooldownUntil = turnCount + LOAN_COOLDOWN_TURNS;
      showEventBanner(`💳 대출 ${due.toLocaleString()}원이 강제 상환되었습니다.`);
    }
  }

  const netWorth = calcNetWorth();
  netWorthHistory.push(netWorth);
  peakNetWorth = Math.max(peakNetWorth, netWorth);
  if (netWorthHistory.length > 100) netWorthHistory.shift();

  if (netWorth > 0 && netWorth <= gameStartCash * NEAR_BANKRUPT_RATIO) hadNearBankruptcy = true;

  if (netWorth <= 0) { await gameOver('bankrupt', '순자산이 0 이하로 떨어졌습니다!'); return; }

  await saveState();
  updateTopBar();
  updateBottomPanel();
  updateProfileLine();
  renderStockPanel();

  if (!hasOfferedRetire && netWorth >= TARGET_NET_WORTH) {
    hasOfferedRetire = true;
    const wantsRetire = await showAppConfirm(
      `🎉 목표 자산(${TARGET_NET_WORTH.toLocaleString()}원)을 달성했습니다!\n지금 은퇴하시겠습니까?`,
      '은퇴하기', '계속하기'
    );
    if (wantsRetire) { await retire(); return; }
  }

  if (isDraftTurn(turnCount)) {
    pendingDraft = rollDraft();
    if (pendingDraft) {
      await saveState();
      showDraftModal();
    }
  }
  if (mainTab === 'employees') renderEmployeesModal();
}

async function gameOver(result, message) {
  if (isGameEnded) return;
  isGameEnded = true;
  const netWorth = calcNetWorth();
  await saveSession(netWorth, result);
  await clearState();

  resultTitle.textContent = { bankrupt: '파산했습니다', settled: '조기 정산', retired: '은퇴 성공!' }[result] || '게임 종료';
  resultDetail.textContent = `${message}\n최종 순자산: ${Math.round(netWorth).toLocaleString()}원\n생존 턴: ${turnCount}턴`;

  resultOverlay.classList.remove('hidden');
  drawNetWorthChart();

  const newlyUnlocked = await checkAchievements();
  newAchievementsBox.innerHTML = '';
  newlyUnlocked.forEach(key => {
    const achv = ACHIEVEMENTS.find(a => a.key === key);
    const div = document.createElement('div');
    div.className = 'new-achv-badge';
    div.textContent = `업적 달성 — ${achv.name} (보상: ${achv.reward})`;
    newAchievementsBox.appendChild(div);
  });

  // 메타 포인트 정산
  const runPoints = computeRunPoints(result);
  const achvPoints = newlyUnlocked.length * POINTS_PER_ACHIEVEMENT;
  await setMeta('points', getMeta('points') + runPoints + achvPoints);
  resultPointsEl.textContent = `+${runPoints + achvPoints}P 획득` +
    (achvPoints > 0 ? ` (업적 ${achvPoints}P 포함)` : '') +
    ` · 보유 ${getMeta('points')}P — 메인 메뉴 '성장'에서 사용`;

  const history = await getResultHistory();
  historyBox.innerHTML = '';
  history.forEach(h => {
    const div = document.createElement('div');
    const label = getResultLabel(h.result);
    div.textContent = `${label}: ${h.cnt}회 (최고 자산 ${h.best.toLocaleString()}원)`;
    historyBox.appendChild(div);
  });
}

function retire() { return gameOver('retired', '목표 수익을 달성하고 은퇴했습니다!'); }

// 조기 정산: 기운 판을 끝까지 끌지 않고, 지금까지 불린 만큼 포인트를 받고 종료
async function settleEarly() {
  if (isTurnProcessing || isGameEnded) return;
  const points = computeRunPoints('settled');
  const ok = await showAppConfirm(
    `이번 판을 여기서 끝내고 정산할까요?\n\n최고 순자산 ${Math.round(Math.max(peakNetWorth, calcNetWorth())).toLocaleString()}원 기준 ${points}P를 받습니다.\n(은퇴 보너스는 없습니다)`,
    '정산하기', '계속하기'
  );
  if (!ok) return;
  await gameOver('settled', '판을 조기 정산했습니다.');
}

// ───────── 매수/매도 ─────────
function getQtyInputValue(stockId) {
  const input = document.getElementById(`qty-${stockId}`);
  if (!input) return 1;
  const val = parseInt(input.value, 10);
  return (!val || val < 1) ? 1 : val;
}

function setQtyInputValue(stockId, qty) {
  const input = document.getElementById(`qty-${stockId}`);
  if (input) input.value = Math.max(1, qty);
}

function getTradeFee(amount) {
  return Math.round(amount * TRADE_FEE_RATE);
}

// 수수료까지 감안해 살 수 있는 최대 수량
function getMaxAffordableQty(stock) {
  return Math.max(0, Math.floor(cash / (stock.price * (1 + TRADE_FEE_RATE))));
}

function applyBuy(stock, qty) {
  const totalPrice = stock.price * qty;
  const totalCost = stock.avgBuyPrice * stock.quantity + totalPrice;
  stock.quantity += qty;
  stock.avgBuyPrice = Math.round(totalCost / stock.quantity);
  cash -= totalPrice + getTradeFee(totalPrice);
  sectorsHeldThisGame.add(stock.sector);
}

function applySell(stock, qty) {
  const profit = (stock.price - stock.avgBuyPrice) * qty;
  const bigWinThreshold = TARGET_NET_WORTH * 0.05; // 2,500,000원
  if (profit >= bigWinThreshold) sessionBigWin = true;
  const proceeds = stock.price * qty;
  cash += proceeds - getTradeFee(proceeds);
  if (profit > 0 && hiredEmployees.has('tax_expert')) cash += Math.round(profit * TAX_REFUND_RATE);
  stock.quantity -= qty;
  if (stock.quantity === 0) stock.avgBuyPrice = 0;
  return profit;
}

function buyStock(stockId) {
  const stock = stocks.find(s => s.id === stockId);
  if (!stock || stock.delisted) return;
  const qty = getQtyInputValue(stockId);
  const totalPrice = stock.price * qty;
  if (cash < totalPrice + getTradeFee(totalPrice)) { showAppAlert('현금이 부족합니다. (수수료 포함)'); return; }
  applyBuy(stock, qty);
  showActionToast(`${stock.name} 매수 (${totalPrice.toLocaleString()}원 · 수수료 ${getTradeFee(totalPrice).toLocaleString()}원)`, 'buy');
  saveState(); renderStockPanel(); updateTopBar();
}

function sellStock(stockId) {
  const stock = stocks.find(s => s.id === stockId);
  if (!stock || stock.delisted) return;
  const qty = getQtyInputValue(stockId);
  if (stock.quantity < qty) { showAppAlert('보유 수량보다 많이 팔 수 없습니다.'); return; }
  applySell(stock, qty);
  showActionToast(`${stock.name} 매도 (${(stock.price * qty).toLocaleString()}원 · 수수료 ${getTradeFee(stock.price * qty).toLocaleString()}원)`, 'sell');
  saveState(); renderStockPanel(); updateTopBar();
}

function maxBuyStock(stockId) {
  const stock = stocks.find(s => s.id === stockId);
  if (!stock || stock.delisted) return;
  const maxQty = getMaxAffordableQty(stock);
  if (maxQty <= 0) { showAppAlert('현금이 부족합니다.'); return; }
  const totalPrice = stock.price * maxQty;
  applyBuy(stock, maxQty);
  showActionToast(`${stock.name} 매수 (${totalPrice.toLocaleString()}원 · 수수료 ${getTradeFee(totalPrice).toLocaleString()}원)`, 'buy');
  saveState(); renderStockPanel(); updateTopBar();
}

function maxSellStock(stockId) {
  const stock = stocks.find(s => s.id === stockId);
  if (!stock || stock.delisted) return;
  if (stock.quantity <= 0) { showAppAlert('보유 중인 주식이 없습니다.'); return; }
  const qty = stock.quantity;
  const total = stock.price * qty;
  applySell(stock, qty);
  showActionToast(`${stock.name} 매도 (${total.toLocaleString()}원 · 수수료 ${getTradeFee(total).toLocaleString()}원)`, 'sell');
  saveState(); renderStockPanel(); updateTopBar();
}

async function sellAllStocks() {
  const holding = stocks.filter(s => s.quantity > 0);
  if (holding.length === 0) { showAppAlert('보유 중인 종목이 없습니다.'); return; }
  const confirmed = await showAppConfirm('보유한 모든 종목을 매도하시겠습니까?');
  if (!confirmed) return;
  let totalAmount = 0;
  holding.forEach(s => {
    totalAmount += s.price * s.quantity;
    applySell(s, s.quantity);
  });
  showActionToast(`전체 매도 (${totalAmount.toLocaleString()}원 · 수수료 차감)`, 'sell');
  saveState(); renderStockPanel(); updateTopBar();
}

// ───────── 대출 ─────────
function getLoanCooldownLeft() {
  return Math.max(0, loanCooldownUntil - turnCount);
}

function getLoanFee(amount) {
  return Math.round(amount * LOAN_FEE_RATE);
}

function openLoanModal() {
  if (loan) return;
  if (getLoanCooldownLeft() > 0) {
    showAppAlert(`최근 대출을 상환해 ${getLoanCooldownLeft()}턴 후에 다시 대출할 수 있습니다.`);
    return;
  }
  selectedLoanAmount = Math.min(LOAN_AMOUNT_MIN, gameLoanMaxCap);
  if (gameLoanMaxCap < LOAN_AMOUNT_MIN) selectedLoanAmount = gameLoanMaxCap;
  loanMaxLabel.textContent = gameLoanMaxCap.toLocaleString();
  updateLoanStepperDisplay();
  loanModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    loanModal.classList.add('visible');
    requestAnimationFrame(() => loanModalBox.classList.add('show'));
  });
}
function hideLoanModal() {
  loanModalBox.classList.remove('show');
  loanModal.classList.remove('visible');
  setTimeout(() => loanModal.classList.add('hidden'), 200);
}
function updateLoanStepperDisplay() {
  loanAmountDisplay.textContent = `${selectedLoanAmount.toLocaleString()}원`;
  loanDecreaseBtn.disabled = selectedLoanAmount <= LOAN_AMOUNT_MIN;
  loanIncreaseBtn.disabled = selectedLoanAmount >= gameLoanMaxCap;

  if (loanRepayPreview) {
    const fee = getLoanFee(selectedLoanAmount);
    const lines = [`실수령 ${(selectedLoanAmount - fee).toLocaleString()}원 (수수료 ${fee.toLocaleString()}원)`];
    if (gameLoanInterestRate < LOAN_INTEREST_RATE) {
      lines.push(gameLoanInterestRate === 0 ? '대출 전문가 효과: 이자 완전 면제' : `대출 전문가 효과: 이자율 ${Math.round(gameLoanInterestRate * 100)}%로 감면`);
    }
    loanRepayPreview.textContent = lines.join('\n');
    loanRepayPreview.classList.remove('hidden');
  }
}
function adjustLoanAmount(delta) {
  selectedLoanAmount = Math.max(LOAN_AMOUNT_MIN, Math.min(gameLoanMaxCap, selectedLoanAmount + delta));
  updateLoanStepperDisplay();
}
function confirmTakeLoan() {
  if (loan || getLoanCooldownLeft() > 0) return;
  const amount = selectedLoanAmount;
  const fee = getLoanFee(amount);
  cash += amount - fee;
  loan = {
    amount,
    interest: 0,
    age: 0,
    repay: amount,
    turnsLeft: LOAN_FORCE_TURNS
  };
  loansTakenCount++;
  hideLoanModal();
  showActionToast(`대출 ${amount.toLocaleString()}원 실행 (수수료 ${fee.toLocaleString()}원 차감)`, 'neutral');
  saveState(); updateTopBar(); updateBottomPanel();
}
function repayLoan() {
  if (!loan) return;
  const due = getLoanCurrentRepay();
  if (cash < due) {
    showAppAlert(`상환에 필요한 현금이 부족합니다.\n필요: ${due.toLocaleString()}원 / 보유: ${Math.round(cash).toLocaleString()}원`);
    return;
  }
  cash -= due;
  const wasEarly = (loan.age || 0) < LOAN_SOFT_TURNS;
  loan = null;
  loanCooldownUntil = turnCount + LOAN_COOLDOWN_TURNS;
  showActionToast(wasEarly ? '대출 원금을 조기 상환했습니다.' : '대출을 전액 상환했습니다.', 'neutral');
  saveState(); updateTopBar(); updateBottomPanel();
}

// ───────── 렌더링 ─────────
function updateTopBar() {
  cashValue.textContent = Math.round(cash).toLocaleString();
  const netWorth = calcNetWorth();
  networthValue.textContent = Math.round(netWorth).toLocaleString();
  turnValue.textContent = turnCount;

  const loanValueEl = document.getElementById('loan-value');
  if (loanValueEl) {
    if (loan) {
      const due = getLoanCurrentRepay();
      loanValueEl.textContent = due.toLocaleString();
      loanValueEl.classList.add('has-loan');
    } else {
      loanValueEl.textContent = '없음';
      loanValueEl.classList.remove('has-loan');
    }
  }

  retireBtn.classList.toggle('hidden', netWorth < TARGET_NET_WORTH);
  settleBtn.classList.toggle('hidden', netWorth >= TARGET_NET_WORTH);

  const remainder = turnCount % RENT_INTERVAL_TURNS;
  const turnsLeft = remainder === 0 ? RENT_INTERVAL_TURNS : RENT_INTERVAL_TURNS - remainder;
  feeTurnsLeftEl.textContent = turnsLeft;
  const rentInfo = computeRentBreakdown();
  nextFeeValue.textContent = formatCompactKRW(rentInfo.total);
  nextSalaryValue.textContent = formatCompactKRW(rentInfo.salaryTotal);
  nextNextFeeValue.textContent = formatCompactKRW(computeRentBreakdown(1).total);
}

function updateBottomPanel() {
  if (loan) {
    const due = getLoanCurrentRepay();
    const age = loan.age || 0;
    const left = Math.max(0, LOAN_FORCE_TURNS - age);
    let extra = '';
    if (age < LOAN_SOFT_TURNS) {
      extra = ' · 원금 상환 가능';
    } else if (loan.interest) {
      extra = ` · 이자 ${(loan.interest).toLocaleString()}원 포함`;
    }
    loanStatus.textContent = `강제상환 D-${left} (상환액 ${due.toLocaleString()}원)${extra}`;
    loanBtn.classList.add('hidden');
    repayBtn.classList.remove('hidden');
    repayAmountSpan.textContent = due.toLocaleString();
  } else {
    const cooldown = getLoanCooldownLeft();
    loanStatus.textContent = cooldown > 0 ? `대출 없음 · ${cooldown}턴 후 재대출 가능` : '대출 없음';
    loanBtn.classList.remove('hidden');
    repayBtn.classList.add('hidden');
  }
  updateLoanButtonLabel();
}

function getSortedVisibleStocks() {
  let list = currentTab === 'holding' ? stocks.filter(s => s.quantity > 0) : [...stocks];
  const dir = sortAscending ? 1 : -1;
  if (currentSort === 'price') list.sort((a, b) => (a.price - b.price) * dir);
  else if (currentSort === 'change') list.sort((a, b) => ((a._lastChangeRatio || 0) - (b._lastChangeRatio || 0)) * dir);
  return list;
}

function updateSortButtonLabels() {
  sortButtons.forEach(btn => {
    const key = btn.dataset.sort;
    if (key === 'default') {
      btn.textContent = '기본순';
      return;
    }
    if (key !== currentSort) {
      btn.textContent = key === 'price' ? '가격순' : '상승률순';
      return;
    }
    const arrow = sortAscending ? '↑' : '↓';
    btn.textContent = (key === 'price' ? '가격순' : '상승률순') + ' ' + arrow;
  });
}

function buildStockRowElement(s) {
  const i = stocks.indexOf(s);
  const prevPrice = priceHistory[i][priceHistory[i].length - 2] || s.price;
  const isUp = s.price >= prevPrice;
  const changeRatio = s._lastChangeRatio || 0;
  const isDelisted = !!s.delisted;
  const isAtRisk = !isDelisted && s.price <= s.basePrice * RISK_THRESHOLD;
  const isExpanded = expandedStockIds.has(s.id);

  let surgeClass = '';
  if (!isDelisted) {
    if (changeRatio >= SURGE_THRESHOLD) surgeClass = 'surge-up';
    else if (changeRatio <= -SURGE_THRESHOLD) surgeClass = 'surge-down';
  }

  let holdingText = `보유: ${s.quantity}주`;
  let holdingClass = '';
  if (s.quantity > 0) {
    const profit = s.price - s.avgBuyPrice;
    const profitPct = s.avgBuyPrice > 0 ? ((s.price - s.avgBuyPrice) / s.avgBuyPrice) * 100 : 0;
    holdingClass = profit >= 0 ? 'profit' : 'loss';
    holdingText += ` (평단 ${s.avgBuyPrice.toLocaleString()} / ${profit >= 0 ? '+' : ''}${profit.toLocaleString()} · ${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(1)}%)`;
  }

  const categoryTag = `<span class="category-tag ${s.category}">${s.category === 'bluechip' ? '우량' : '테마'}</span>`;
  const badge = isDelisted
    ? '<span class="risk-badge delisted-badge">상장폐지</span>'
    : (isAtRisk ? '<span class="risk-badge">위험</span>' : '');

  const maxAffordable = !isDelisted ? getMaxAffordableQty(s) : 0;
  const bodyHtml = isDelisted
    ? `<div class="delisted-msg">거래가 정지된 종목입니다.</div>`
    : `<div class="stock-controls-wrap${isExpanded ? ' expanded' : ''}" id="controls-${s.id}">
         <div class="stock-controls">
           <div class="qty-row">
             <span class="qty-label">수량</span>
             <input type="number" id="qty-${s.id}" class="qty-input" value="1" min="1" inputmode="numeric">
             <span class="qty-affordable">최대 ${maxAffordable.toLocaleString()}주</span>
           </div>
           <div class="qty-quick">
             <button type="button" class="qty-quick-btn" data-action="setqty" data-id="${s.id}" data-qty="1">1</button>
             <button type="button" class="qty-quick-btn" data-action="setqty" data-id="${s.id}" data-qty="10">10</button>
             <button type="button" class="qty-quick-btn" data-action="setqty" data-id="${s.id}" data-qty="100">100</button>
             <button type="button" class="qty-quick-btn" data-action="setqty" data-id="${s.id}" data-qty="${Math.max(1, maxAffordable)}">최대</button>
           </div>
           <div class="stock-buttons">
             <button class="buy-btn" data-action="buy" data-id="${s.id}">매수</button>
             <button class="sell-btn" data-action="sell" data-id="${s.id}">매도</button>
             <button class="max-buy-btn" data-action="maxbuy" data-id="${s.id}">전량매수</button>
             <button class="max-sell-btn" data-action="maxsell" data-id="${s.id}">전량매도</button>
           </div>
         </div>
       </div>`;

  const row = document.createElement('div');
  row.className = `stock-row ${surgeClass} ${isDelisted ? 'delisted' : ''}`;
  row.innerHTML = `
    <div class="stock-clickable" data-action="${isDelisted ? 'history' : 'toggle'}" data-id="${s.id}">
      <div class="stock-top">
        <span class="stock-name">${s.name}${categoryTag}${badge}</span>
        <div class="stock-top-right">
          <span class="stock-price ${isUp ? 'up' : 'down'}">${s.price.toLocaleString()}원 ${isUp ? '▲' : '▼'} (${changeRatio >= 0 ? '+' : ''}${(changeRatio * 100).toFixed(1)}%)</span>
          <button class="mini-chart-btn" data-action="history" data-id="${s.id}">시세</button>
        </div>
      </div>
      <span class="stock-holding ${holdingClass}">${holdingText}</span>
    </div>
    ${bodyHtml}
  `;
  return row;
}

function renderStockPanel() {
  // 다시 그려도 입력해둔 수량이 1로 초기화되지 않도록 보존
  const savedQty = new Map();
  stockPanel.querySelectorAll('.qty-input').forEach(input => savedQty.set(input.id, input.value));

  stockPanel.innerHTML = '';
  const visibleStocks = getSortedVisibleStocks();
  renderStockRows(visibleStocks);

  savedQty.forEach((value, id) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
}

function renderStockRows(visibleStocks) {
  if (currentTab === 'holding' && visibleStocks.length === 0) {
    const msg = document.createElement('div');
    msg.id = 'empty-holding-msg';
    msg.textContent = '보유 중인 종목이 없습니다.';
    stockPanel.appendChild(msg);
    return;
  }

  if (groupBySector) {
    const groups = new Map();
    visibleStocks.forEach(s => {
      if (!groups.has(s.sector)) groups.set(s.sector, []);
      groups.get(s.sector).push(s);
    });
    groups.forEach((list, sector) => {
      const block = document.createElement('div');
      block.className = 'sector-block';
      const header = document.createElement('div');
      header.className = 'sector-header';
      header.textContent = `${sector} (${list.length})`;
      block.appendChild(header);
      list.forEach(s => block.appendChild(buildStockRowElement(s)));
      stockPanel.appendChild(block);
    });
  } else {
    visibleStocks.forEach(s => stockPanel.appendChild(buildStockRowElement(s)));
  }
}

stockPanel.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const id = parseInt(target.dataset.id, 10);
  const action = target.dataset.action;

  if (action === 'history') {
    e.stopPropagation();
    openHistoryModal(id);
    return;
  }

  if (action === 'setqty') {
    e.stopPropagation();
    const qty = parseInt(target.dataset.qty, 10) || 1;
    setQtyInputValue(id, qty);
    return;
  }

  if (action === 'toggle') {
    const wrap = document.getElementById(`controls-${id}`);
    if (!wrap) return;
    if (expandedStockIds.has(id)) expandedStockIds.delete(id); else expandedStockIds.add(id);
    wrap.classList.toggle('expanded');
    return;
  }

  if (action === 'buy') buyStock(id);
  if (action === 'sell') sellStock(id);
  if (action === 'maxbuy') maxBuyStock(id);
  if (action === 'maxsell') maxSellStock(id);
});

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    renderStockPanel();
  });
});
sortButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.sort;
    if (key === 'default') {
      currentSort = 'default';
      sortAscending = false;
    } else if (currentSort === key) {
      sortAscending = !sortAscending;
    } else {
      currentSort = key;
      sortAscending = false; // 첫 선택은 내림차순
    }
    sortButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateSortButtonLabels();
    renderStockPanel();
  });
});
groupToggleBtn.addEventListener('click', () => {
  groupBySector = !groupBySector;
  groupToggleBtn.classList.toggle('active', groupBySector);
  renderStockPanel();
});
sellAllBtn.addEventListener('click', sellAllStocks);

// ───────── 시세 히스토리 모달 ─────────
function openHistoryModal(stockId) {
  const idx = stocks.findIndex(s => s.id === stockId);
  const stock = stocks[idx];
  const history = priceHistory[idx];

  historyModalTitle.textContent = `${stock.name} - 최근 시세`;
  historyListEl.innerHTML = '';
  history.slice(-10).reverse().forEach((price, i) => {
    const turnLabel = i === 0 ? '현재' : `${i}턴 전`;
    const div = document.createElement('div');
    div.innerHTML = `<span>${turnLabel}</span><span>${price.toLocaleString()}원</span>`;
    historyListEl.appendChild(div);
  });

  historyModal.classList.remove('hidden');
  drawLineChart(historyChartCanvas, historyChartCtx, history, stock.color, 25, turnCount);
}
closeHistoryBtn.addEventListener('click', () => historyModal.classList.add('hidden'));

// ───────── 차트 그리기 ─────────
function formatCompactKRW(v) {
  let val, unit;
  if (v >= 10000) { val = v / 10000; unit = '만'; }
  else if (v >= 1000) { val = v / 1000; unit = '천'; }
  else return Math.round(v).toLocaleString();
  let s = val.toFixed(1);
  if (s.endsWith('.0')) s = s.slice(0, -2);
  return s + unit;
}

// data의 마지막 값이 lastTurn 시점의 값
function drawLineChart(canvas, ctx, data, color, maxPoints = 30, lastTurn = data.length) {
  const sliceStart = data.length > maxPoints ? data.length - maxPoints : 0;
  let sliced = data.length > maxPoints ? data.slice(-maxPoints) : data;
  if (sliced.length === 1) sliced = [sliced[0], sliced[0]];

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const padding = { left: 34, right: 6, top: 8, bottom: 16 };
  const chartW = Math.max(1, w - padding.left - padding.right);
  const chartH = Math.max(1, h - padding.top - padding.bottom);

  const min = Math.min(...sliced) * 0.95;
  const max = Math.max(...sliced) * 1.05;
  const range = max - min || 1;

  const points = sliced.map((val, idx) => ({
    x: padding.left + (idx / (sliced.length - 1 || 1)) * chartW,
    y: padding.top + chartH - ((val - min) / range) * chartH
  }));

  ctx.font = '9px sans-serif';
  [min, (min + max) / 2, max].forEach(val => {
    const y = padding.top + chartH - ((val - min) / range) * chartH;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatCompactKRW(val), padding.left - 4, y);
  });

  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, color + '4d');
  gradient.addColorStop(1, color + '00');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((p, idx) => { idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.stroke();

  const lastPoint = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color + '33';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.stroke();

  const tickIdxs = data.length > 1
    ? [...new Set([0, Math.floor((sliced.length - 1) / 2), sliced.length - 1])]
    : [sliced.length - 1];
  ctx.font = '9px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textBaseline = 'top';
  tickIdxs.forEach((idx, i) => {
    const dataIdx = Math.min(sliceStart + idx, data.length - 1);
    const turnNum = lastTurn - (data.length - 1 - dataIdx);
    ctx.textAlign = tickIdxs.length === 1 ? 'right' : (i === 0 ? 'left' : (i === tickIdxs.length - 1 ? 'right' : 'center'));
    ctx.fillText(`${turnNum}턴`, points[idx].x, padding.top + chartH + 3);
  });
}

function drawNetWorthChart() {
  drawLineChart(networthChartCanvas, networthChartCtx, netWorthHistory, '#e8eef2', 100, turnCount);
}

// ───────── 이벤트 바인딩 ─────────
loanBtn.addEventListener('click', openLoanModal);
loanCancelBtn.addEventListener('click', hideLoanModal);
loanConfirmBtn.addEventListener('click', confirmTakeLoan);
loanDecreaseBtn.addEventListener('click', () => adjustLoanAmount(-LOAN_AMOUNT_STEP));
loanIncreaseBtn.addEventListener('click', () => adjustLoanAmount(LOAN_AMOUNT_STEP));
repayBtn.addEventListener('click', repayLoan);
retireBtn.addEventListener('click', () => { if (!isTurnProcessing) retire(); });
settleBtn.addEventListener('click', settleEarly);
nextTurnBtn.addEventListener('click', goToNextTurn);
restartBtn.addEventListener('click', async () => {
  resultOverlay.classList.add('hidden');
  showScreen(mainMenu);
  await updateContinueButtonState();
  await updateMainMenuStats();
});

if (exitGameBtn) {
  exitGameBtn.addEventListener('click', async () => {
    const ok = await showAppConfirm('현재 진행 상황을 저장하고\n메인 메뉴로 이동할까요?', '저장 후 나가기', '취소');
    if (!ok) return;
    await saveState();
    showScreen(mainMenu);
    await updateContinueButtonState();
    await updateMainMenuStats();
  });
}

// ───────── 눌림 즉시 반응 (touchstart 기반, :active 지연 없이) ─────────
// CSS의 :active만 쓰면 브라우저에 따라 반응이 한 박자 늦게 느껴질 수 있어
// touchstart/mousedown 시점에 곧바로 .pressed 클래스를 붙여 즉각적인 피드백을 준다.
const PRESS_FEEDBACK_SELECTOR =
  '.menu-btn, .menu-btn-secondary, .main-tab-btn, #next-turn-btn, .tab-btn, .sort-btn, ' +
  '#group-toggle-btn, .button-row button, .stock-buttons button, .employee-action-btn, ' +
  '.loan-step-btn, #app-alert-ok-btn, #app-alert-cancel-btn, .qty-quick-btn, ' +
  '#sell-all-btn, #close-history-btn, #restart-btn, #exit-game-btn, ' +
  '.draft-option, #draft-skip-btn, .upgrade-buy-btn';

function bindInstantPressFeedback() {
  const press = (e) => {
    const target = e.target.closest(PRESS_FEEDBACK_SELECTOR);
    if (target && !target.disabled) target.classList.add('pressed');
  };
  const release = (e) => {
    const target = e.target.closest(PRESS_FEEDBACK_SELECTOR);
    if (target) target.classList.remove('pressed');
    document.querySelectorAll('.pressed').forEach(el => el.classList.remove('pressed'));
  };
  document.addEventListener('touchstart', press, { passive: true });
  document.addEventListener('touchend', release, { passive: true });
  document.addEventListener('touchcancel', release, { passive: true });
  document.addEventListener('mousedown', press);
  document.addEventListener('mouseup', release);
}

// ───────── 시작 ─────────
document.addEventListener('DOMContentLoaded', async () => {
  bindInstantPressFeedback();
  buildTickerTape();
  await initDB();
  await loadMetaState();
  await updateContinueButtonState();
  await updateMainMenuStats();
  showScreen(mainMenu);
});