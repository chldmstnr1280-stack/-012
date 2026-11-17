/**
 * 셀리의 편지 — a letter now and then, chosen on the device from what the user
 * recorded (never sent anywhere). Most letters are just warm; some answer a
 * moment (cycle, mood, things done with Selly, coming back). A science card
 * (사실 + 왜 + 작게 해 보기 + 출처) or a pattern card from the user's own
 * records is attached to every second or third letter.
 *
 * Writing rules: no diagnosis, no guilt about missed days, no "you seem
 * depressed" — only what the user recorded, and say how Selly knows.
 * ⚠️ Wording pending review by a mental-health professional.
 */
export type LetterGroup = "A" | "B" | "C" | "L" | "D" | "E" | "F" | "G";

export interface LetterTpl {
  id: string;
  group: LetterGroup;
  lines: string[];
  action?: { href: string; label: string };
  /** heavy-hearted letters: at most one a week, and the 109 line is added */
  heavy?: boolean;
  /** science cards that fit this letter, best first */
  cards?: ScienceId[];
}

const T = (id: string, group: LetterGroup, lines: string[], extra: Partial<LetterTpl> = {}): LetterTpl => ({ id, group, lines, ...extra });

export const LETTERS: LetterTpl[] = [
  // A. 그냥 편지
  T("A1", "A", ["오늘 창가에 작은 꽃봉오리가 생겼어.", "아직 안 폈는데, 피면 제일 먼저 너한테 보여 줄게."]),
  T("A2", "A", ["있지, 오늘 물을 주다가 문득 네 생각이 났어.", "너도 오늘 물 한 잔 마셨어? 나만 마시면 좀 미안하니까 ♡"], { cards: ["water"] }),
  T("A3", "A", ["오늘 하루 어땠어?", "대답 안 해도 돼. 그냥 궁금했어."], { cards: ["present"] }),
  T("A4", "A", ["온실 랜턴을 하나 더 켜 뒀어.", "늦게 와도 길 잃지 말라고."]),
  T("A5", "A", ["나 오늘 잎이 1밀리미터쯤 자란 것 같아!", "너도 모르는 사이에 조금씩 자라고 있을 거야. 우리 둘 다."], { action: { href: "/", label: "🌱 셀리 보러 가기" } }),
  T("A6", "A", ["오늘은 특별한 일 없이 지나가도 괜찮은 날이야.", "아무 일 없는 하루도 꽤 좋은 하루래."], { cards: ["present"] }),
  T("A7", "A", ["쿠션 위에서 낮잠 자다가 깼는데, 네가 왔나 해서 두리번거렸어.", "헤헤, 꿈이었나 봐."]),
  T("A8", "A", ["오늘 너에게 꼭 해 주고 싶은 말이 있었는데…", "“오늘도 와 줘서 고마워.” 이거였어."]),
  T("A9", "A", ["온실에 바람이 살짝 들어왔어.", "너한테도 시원한 바람 한 줄기 보내 줄게. 휘이~"]),
  T("A10", "A", ["잘하지 않아도 괜찮아.", "오늘은 그냥 ‘했다’만으로 충분해."]),
  T("A11", "A", ["내가 제일 좋아하는 시간이 언제인지 알아?", "네가 온실 문을 열고 들어오는 순간이야."]),
  T("A12", "A", ["오늘 숨 한 번만 길게 쉬어 볼래?", "후— 나도 같이 쉬었어."], { action: { href: "/?do=breathe", label: "🫁 같이 숨 고르기" }, cards: ["breath"] }),
  T("A13", "A", ["오늘은 꽃들한테 네 이야기를 해 줬어.", "다들 너를 좋아하는 것 같아. 잎이 흔들렸거든!"], { cards: ["connect"] }),
  T("A14", "A", ["혹시 오늘 너무 많이 애썼다면,", "이 편지 읽는 동안만이라도 어깨에 힘 빼고 있어 줘."], { cards: ["breath"] }),
  T("A15", "A", ["밤에 별을 세다가 하나를 네 별이라고 이름 붙였어.", "제일 반짝이는 걸로 골랐어."]),
  T("A16", "A", ["오늘 해야 할 일 중에 하나쯤은 내일로 미뤄도 돼.", "온실 꽃들도 하루에 다 피지 않거든."], { cards: ["notAlone"] }),
  T("A17", "A", ["나 요즘 물뿌리개 소리가 좋아.", "쪼르르— 너는 요즘 좋아하는 소리 있어?"], { cards: ["present"] }),
  T("A18", "A", ["오늘 웃은 일이 하나라도 있었으면 좋겠다.", "없었으면, 이 편지 보고 한 번 웃어 줘. (ㅎㅎ)"]),
  T("A19", "A", ["너는 내가 알기로 꽤 멋진 사람이야.", "그냥 그 말을 하고 싶었어."], { cards: ["kindness"] }),
  T("A20", "A", ["온실 문은 언제나 열려 있어.", "힘들 때도, 심심할 때도, 그냥 생각날 때도."], { cards: ["connect"] }),

  // B. 날씨 · 계절
  T("B1", "B", ["비가 와! 유리창에 빗방울이 또르르 미끄럼 타고 있어.", "빗소리 들으면서 잠깐 쉬다 갈래?"], { action: { href: "/?do=rest", label: "☁️ 같이 쉬기" } }),
  T("B2", "B", ["비 오는 날엔 온실이 더 포근해져.", "우산 챙겼어? 안 챙겼으면… 여기서 비 그칠 때까지 있어도 돼."]),
  T("B3", "B", ["첫눈이야!! 너도 봤어?", "창밖에 작은 눈사람도 하나 만들어 뒀어. ⛄"]),
  T("B4", "B", ["밖은 추운데 온실 안은 따뜻해.", "담요 하나 덮고 코코아 마시고 싶은 날이다."]),
  T("B5", "B", ["저기 봐! 무지개 떴어!", "비 온 다음엔 이렇게 예쁜 게 오기도 하나 봐."]),
  T("B6", "B", ["오늘 햇살이 엄청 포근해.", "잠깐이라도 햇볕 쬐러 나가 볼래? 나도 창가에서 광합성 중이야~"], { action: { href: "/walk", label: "🌿 셀리와 산책하기" }, cards: ["move"] }),
  T("B7", "B", ["오늘은 하늘이 구름 이불을 덮었어.", "흐린 날은 빛이 부드러워서 눈이 편해. 천천히 가자."]),
  T("B8", "B", ["봄이 왔어! 온실에 새싹이 막 올라오고 있어.", "너한테도 작은 새싹 같은 일이 생겼으면 좋겠다."]),
  T("B9", "B", ["여름이야! 잎이 쑥쑥 자라는 계절이래.", "더운 날엔 물 자주 마시기, 약속!"], { cards: ["water"] }),
  T("B10", "B", ["창밖 나무들이 노랗고 빨갛게 물들었어.", "떨어지는 잎도 예쁘다는 걸 가을이 알려 주는 것 같아."]),
  T("B11", "B", ["겨울이 왔어. 온실 랜턴을 조금 더 일찍 켤게.", "추운 날엔 꼭 따뜻하게 입고 다녀."]),

  // C. 주기 — the user's own records and estimate only
  T("C1", "C", ["네 기록으로 예상해 보면, 며칠 뒤부터 생리 전 기간일 수도 있어(예측).", "마음이 출렁이면 나한테 마음껏 징징대러 와. 다 들어 줄게 ♡"], { action: { href: "/whine", label: "🫧 셀리에게 징징대기" }, cards: ["pmsDiary"] }),
  T("C2", "C", ["곧 생리 전 기간이 올 수도 있대(예측).", "미리 좋아하는 간식 하나 챙겨 두는 건 어때? 나는 햇살 챙겨 둘게."], { action: { href: "/pms/care?from=pms", label: "🌷 돌봄 모드" }, cards: ["sleep"] }),
  T("C3", "C", ["요즘 별것 아닌 일에도 마음이 쓰였다면, 그건 네 잘못이 아니야.", "이런 날엔 평소보다 조금 더 너한테 다정하기로 해."], { action: { href: "/?do=kind", label: "💗 마음 전하기" }, cards: ["kindness", "breath"] }),
  T("C4", "C", ["이번 주는 몸이 수고하는 주간이야.", "무리하지 않아도 돼. 따뜻하게, 천천히."], { cards: ["sleep"] }),
  T("C5", "C", ["한 주 동안 정말 수고 많았어!", "오늘은 맛있는 거 먹자. 나는 물 한 컵 원샷할게!"], { cards: ["water"] }),
  T("C6", "C", ["이번 주기를 같이 돌아봐 줘서 고마워.", "기록이 쌓일수록 너를 조금 더 잘 알 수 있을 것 같아."], { cards: ["pmsDiary"] }),
  // L. the expected start passed — never "late" for sure
  T("L1", "L", ["예상했던 날이 지났네.", "생리가 시작됐다면 달력에 남겨 줘. 아직이라면, 기다리는 동안 마음 편히 지내자."], { action: { href: "/calendar", label: "📅 달력에서 확인" } }),

  // D. 마음 기록 — what the user recorded, never a judgement
  T("D1", "D", ["요즘 마음이 무거운 날이 많았지.", "꼭 뭘 하지 않아도 돼. 이렇게 기록해 주고, 여기 와 주는 것만으로도 충분히 잘하고 있어."], { action: { href: "/whine", label: "🫧 셀리에게 징징대기" }, heavy: true, cards: ["talk", "lowTwoWeeks"] }),
  T("D2", "D", ["요즘 신경 쓰이는 일이 많았나 봐.", "그럴 땐 숨 한 번, 길게. 후—"], { action: { href: "/?do=breathe", label: "🫁 같이 숨 고르기" }, heavy: true, cards: ["breath", "count10", "name"] }),
  T("D3", "D", ["요즘 네 기분 꽃이 환하게 피어 있어!", "좋은 날들, 마음에 꼭 저장해 두자."], { cards: ["present"] }),
  T("D4", "D", ["첫 기록 고마워!", "온실에 네 첫 번째 기분 꽃이 피었어. 앞으로 같이 키워 가자."], { cards: ["name"] }),
  T("D5", "D", ["벌써 열 번이나 마음을 들려줬어.", "너의 정원이 조금씩 너를 닮아 가고 있어."], { cards: ["name"] }),
  T("D6", "D", ["요즘 기록 안 해도 괜찮아.", "기록은 숙제가 아니니까. 그냥 셀리 보러 와 줘."]),

  // E. 셀리와 함께한 것
  T("E1", "E", ["어제 이야기해 줘서 고마웠어.", "오늘은 어제보다 조금은 가벼웠으면 좋겠다."], { cards: ["talk"] }),
  T("E2", "E", ["어제 같이 투덜댄 거, 나 좀 재밌었어. 헤헤.", "또 징징대고 싶으면 언제든 와!"], { cards: ["talk", "notAlone"] }),
  T("E3", "E", ["네 소망 별이 또 반짝였어!", "빛은 절대 줄어들지 않아. 천천히 가도 돼."]),
  T("E4", "E", ["어제 빈 소망, 내가 밤새 지켜 줬어.", "오늘의 한 걸음은 아주 작아도 괜찮아."]),
  T("E5", "E", ["소망을 이뤘다니!! 나 아직도 신나서 폴짝폴짝 뛰고 있어.", "이룬 소망 선반에 예쁘게 올려 뒀어. 🏆"]),
  T("E6", "E", ["우리 벌써 세 번이나 같이 걸었어!", "다음엔 어떤 걸 찾게 될까?"], { action: { href: "/walk", label: "🌿 셀리와 산책하기" }, cards: ["move"] }),
  T("E7", "E", ["어제 나한테 다정한 말 해 줘서 고마워.", "그 말, 너한테도 똑같이 돌려줄게. “너는 소중해.”"], { cards: ["kindness"] }),
  T("E8", "E", ["같이 숨 쉰 게 벌써 다섯 번이야.", "숨 쉬는 것도 같이 하면 덜 외로운 것 같아."], { cards: ["breath"] }),
  T("E9", "E", ["일주일 내내 물을 챙겨 마셨네!", "나도 덕분에 잎이 반질반질해. 💧"], { cards: ["water"] }),

  // F. 돌아왔을 때 — never about the missed days
  T("F1", "F", ["보고 싶었어!", "오늘은 그냥 온실 구경만 해도 돼."]),
  T("F2", "F", ["와 줬구나. 온실은 그대로 잘 있었어.", "네 꽃들도 너를 기다렸어."]),
  T("F3", "F", ["오랜만이야. 다시 와 줘서 정말 고마워.", "천천히 다시 시작하자. 아니, 시작 안 해도 돼. 그냥 반가워."]),

  // G. 특별한 날
  T("G1", "G", ["우리가 만난 지 일주일이 됐어!", "일주일 동안 온실에 와 줘서 고마워."]),
  T("G2", "G", ["벌써 한 달이야. 처음 만난 날 기억나?", "그때보다 온실이 훨씬 따뜻해졌어. 네 덕분이야."]),
  T("G3", "G", ["100일이야!! 🎉", "너랑 같이 자란 100일, 나한테는 보물이야."]),
  T("G4", "G", ["나 자랐어! 너랑 같이 보낸 시간이 나를 키웠어.", "앞으로도 같이 자라자."]),
];
export const LETTER_BY_ID = Object.fromEntries(LETTERS.map((l) => [l.id, l])) as Record<string, LetterTpl>;
export const HEAVY_NOTE = "혼자 견디기 어려울 땐 109(24시간)에서 이야기를 들어 줘요.";
export const SIGNATURE = "— 온실에서, 셀리가 🌱";

/* ---------- 셀리의 과학 카드 — every sentence from a cited NHS page (quote kept) ---------- */
export type ScienceId = "name" | "brooding" | "talk" | "breath" | "count10" | "sleep" | "worryList" | "move" | "water" | "connect" | "kindness" | "present" | "notAlone" | "lowTwoWeeks" | "pmsDiary";

export interface ScienceSource {
  title: string;
  url: string;
  reviewed: string;
}
export const SCIENCE_SOURCES = {
  mindfulness: { title: "NHS · Mindfulness", url: "https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/", reviewed: "2026-08-17" },
  stress: { title: "NHS · Stress", url: "https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/", reviewed: "2026-03-06" },
  breathing: { title: "NHS · Breathing exercises for stress", url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/", reviewed: "2026-06-12" },
  anger: { title: "NHS · Anger", url: "https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anger/", reviewed: "2026-08-04" },
  sleep: { title: "NHS Every Mind Matters · How to fall asleep faster and sleep better", url: "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/", reviewed: "—" },
  exercise: { title: "NHS · Benefits of exercise", url: "https://www.nhs.uk/live-well/exercise/exercise-health-benefits/", reviewed: "2024-08-15" },
  fiveSteps: { title: "NHS · 5 steps to mental wellbeing", url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/five-steps-to-mental-wellbeing/", reviewed: "2026-10-14" },
  water: { title: "NHS · Water, drinks and hydration", url: "https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/", reviewed: "2023-05-17 (다음 검토 예정일 2026-05-17 지남 — 재확인 필요)" },
  pms: { title: "NHS · PMS (premenstrual syndrome)", url: "https://www.nhs.uk/conditions/pre-menstrual-syndrome/", reviewed: "2024-06-18" },
} satisfies Record<string, ScienceSource>;
export const SCIENCE_ACCESSED = "2026-11-17";

export interface ScienceCard {
  id: ScienceId;
  title: string;
  fact: string;
  why?: string;
  tryIt: string;
  action?: { href: string; label: string };
  source: keyof typeof SCIENCE_SOURCES;
  quote: string;
}

export const SCIENCE: ScienceCard[] = [
  {
    id: "name",
    title: "마음에 이름 붙이기",
    fact: "생각과 감정을 속으로 이름 붙여 보는 게 도움이 된다는 사람들이 있어요. “이건 불안이야”처럼요.",
    why: "지금 마음을 알아차리면, 스트레스나 불안의 신호를 더 일찍 눈치채고 잘 다루는 데 도움이 될 수 있대요.",
    tryIt: "지금 마음에 단어 하나 붙여 보기.",
    action: { href: "/checkin", label: "🌦️ 몸의 날씨 30초" },
    source: "mindfulness",
    quote: "To develop an awareness of thoughts and feelings, some people find it helpful to silently name them: … \"This is anxiety\". … Awareness of this kind may also help us notice signs of stress or anxiety earlier and deal with them better.",
  },
  {
    id: "brooding",
    title: "같은 생각이 빙빙 돌 때",
    fact: "“이걸 곱씹는 게 도움이 될까, 아니면 생각에 휩쓸리고 있는 걸까?” 하고 스스로 물어보는 것도 방법이래요.",
    why: "생각은 왔다 가는 마음의 일이라서, 꼭 그 생각에 끌려다니지 않아도 된대요. 머릿속이 바쁠 땐 가볍게 걷는 게 더 쉬운 사람도 있어요.",
    tryIt: "5분만 가볍게 걷거나, 창밖 보기.",
    action: { href: "/walk", label: "🌿 셀리와 걷기" },
    source: "mindfulness",
    quote: "We can ask: \"Is trying to solve this by brooding about it helpful, or am I just getting caught up in my thoughts?\" … thoughts are simply mental events that do not have to control us. … Some people find it's easier to cope with an over-busy mind if they are doing gentle yoga or walking.",
  },
  {
    id: "talk",
    title: "털어놓기",
    fact: "스트레스가 있을 땐 친구, 가족, 전문가에게 마음을 이야기해 보라고 권해요.",
    why: "믿는 사람에게 말하거나 걱정을 글로 적는 것이 걱정을 다루는 데 도움이 될 수 있대요.",
    tryIt: "오늘 있었던 일 한 줄만 꺼내 보기.",
    action: { href: "/whine", label: "🫧 셀리에게 징징대기" },
    source: "stress",
    quote: "try talking about your feelings to a friend, family member or health professional",
  },
  {
    id: "breath",
    title: "천천히 세며 숨쉬기",
    fact: "스트레스, 불안에 쓰이는 차분한 호흡법은 몇 분이면 되고 어디서든 할 수 있어요.",
    why: "숨을 억지로 하지 말고, 1부터 5까지 세며 부드럽게 들이쉬고 내쉬어요. 매일 꾸준히 할 때 가장 도움이 된대요.",
    tryIt: "1부터 5까지 세며 숨 들이쉬고, 다시 세며 내쉬기.",
    action: { href: "/?do=breathe", label: "🫁 셀리와 호흡" },
    source: "breathing",
    quote: "This calming breathing technique for stress, anxiety and panic takes just a few minutes and can be done anywhere. You will get the most benefit if you do it regularly, as part of your daily routine. … Breathe in gently and regularly. Some people find it helpful to count steadily from 1 to 5.",
  },
  {
    id: "count10",
    title: "화가 날 땐 10까지",
    fact: "화가 날 땐 반응하기 전에 생각할 시간을 주라고 해요. 10까지 세고, 차분한 호흡을 해 보기.",
    tryIt: "속으로 하나, 둘… 열.",
    source: "anger",
    quote: "give yourself time to think before reacting – try counting to 10 and doing calming breathing exercises",
  },
  {
    id: "sleep",
    title: "잠의 리듬",
    fact: "매일 비슷한 시간에 자고 일어나면 몸이 잠잘 때를 알아서 잠들기 쉬워진대요.",
    why: "자기 한 시간 전엔 휴대폰 화면을 멀리하고, 차·커피 같은 카페인 음료나 술은 잠을 방해할 수 있어요.",
    tryIt: "오늘은 화면을 조금 일찍 내려놓기.",
    action: { href: "/?do=breathe", label: "🌙 잠들기 전 호흡" },
    source: "sleep",
    quote: "going to bed and getting up at similar times each day helps your body know when it's time to sleep. … Try not to use phones, tablets or computers for an hour before bed. … Tea, coffee and some soft drinks contain caffeine, which can make you feel more awake. … Alcohol and nicotine can also have disruptive effects on sleep, so try to avoid them 1 to 2 hours before bed.",
  },
  {
    id: "worryList",
    title: "걱정 때문에 잠이 안 올 때",
    fact: "잠자리에서 걱정이 많다면, 자기 전에 내일 할 일을 적어 두면 머리가 정리되는 데 도움이 될 수 있대요.",
    why: "20분쯤 지나도 잠이 안 오면 억지로 자려 하지 말고, 편한 곳에서 조용한 걸 하다가 졸릴 때 다시 누워요.",
    tryIt: "내일 할 일 세 줄 적기.",
    source: "sleep",
    quote: "If you often worry in bed, try making a list of things you need to do the next day before you go to sleep. Writing things down can help clear your mind before bed. … if you're still awake after around 20 minutes, get up and sit somewhere comfortable.",
  },
  {
    id: "move",
    title: "조금 움직이기",
    fact: "몸을 움직이면 기분, 잠의 질, 에너지에 도움이 되고 스트레스도 줄일 수 있다는 연구가 있어요.",
    why: "적은 활동도 차이를 만들 수 있고, 조금씩 늘려 가면 돼요.",
    tryIt: "5분 산책, 아니면 기지개 한 번.",
    action: { href: "/walk", label: "🌿 셀리와 산책" },
    source: "exercise",
    quote: "Research also shows that physical activity can boost self-esteem, mood, sleep quality and energy, as well as reducing your risk of stress.",
  },
  {
    id: "water",
    title: "물 한 컵",
    fact: "하루에 6~8잔 정도의 마실 것을 권해요. 물, 우유, 차와 커피도 포함돼요.",
    why: "땀을 흘렸거나 몸이 아플 땐 더 마시는 게 좋대요.",
    tryIt: "지금 물 한 컵.",
    source: "water",
    quote: "the government recommends that people should aim to drink 6 to 8 cups or glasses of fluid a day. … drink extra fluids if you've been sweating from physical activity, or if you're unwell",
  },
  {
    id: "connect",
    title: "사람과 연결되기",
    fact: "좋은 관계는 마음 건강에 중요해요. 소속감을 주고, 좋은 일을 나누고, 서로 지지할 수 있게 해 줘요.",
    tryIt: "보고 싶은 사람에게 안부 한 줄.",
    source: "fiveSteps",
    quote: "Good relationships are important for your mental wellbeing. They can: help you to build a sense of belonging and self-worth · give you an opportunity to share positive experiences · provide emotional support and allow you to support others",
  },
  {
    id: "kindness",
    title: "작은 친절",
    fact: "작은 친절은 좋은 기분과 보람을 만들고, 사람들과 연결되게 도와준대요.",
    tryIt: "누군가에게 ‘고마워’ 한마디 — 나에게도 괜찮아.",
    action: { href: "/?do=kind", label: "💗 마음 전하기" },
    source: "fiveSteps",
    quote: "Research suggests that acts of giving and kindness can help improve your mental wellbeing by: creating positive feelings and a sense of reward … helping you connect with other people … saying thank you to someone for something they have done for you",
  },
  {
    id: "present",
    title: "지금 이 순간 알아차리기",
    fact: "지금 이 순간에 — 내 생각과 감정, 몸, 주변에 — 조금 더 주의를 기울이면 마음 건강에 도움이 될 수 있대요.",
    why: "먹는 음식의 맛, 걸을 때 스치는 바람처럼 일상의 감각을 알아차리는 것부터 시작하면 돼요.",
    tryIt: "지금 들리는 소리 세 가지 찾기.",
    source: "mindfulness",
    quote: "Paying more attention to the present moment – to your own thoughts and feelings, and to the world around you – can improve your mental wellbeing. … we can notice the sensations of things, like the food we eat or the air moving past the body as we walk.",
  },
  {
    id: "notAlone",
    title: "나만 그런 게 아니야",
    fact: "대부분의 사람이 살면서 스트레스를 느껴요. 혼자라고 스스로에게 말하지 않으려 해 보래요.",
    tryIt: "“이런 날도 있어” 하고 한 번 말해 보기.",
    source: "stress",
    quote: "try not to tell yourself that you're alone – most people feel stressed at some point in their life and support is available",
  },
  {
    id: "lowTwoWeeks",
    title: "오래 가라앉아 있다면",
    fact: "기분이 2주 넘게 가라앉아 있거나, 스트레스·불안·우울을 감당하기 어렵다면 도움을 받아 보라고 안내해요.",
    tryIt: "믿을 수 있는 사람이나 전문가에게 이야기해 보기. 지금 바로 이야기하고 싶다면 109(24시간).",
    source: "anger",
    quote: "you're struggling to cope with stress, anxiety or depression · you've had a low mood for more than 2 weeks",
  },
  {
    id: "pmsDiary",
    title: "증상 일기의 힘",
    fact: "PMS인지 알아보려면 적어도 두 번의 주기 동안 증상을 기록해 보라고 권해요. 진료받을 때 가져가도 돼요.",
    tryIt: "오늘 증상, 톡 한 번.",
    action: { href: "/record?tab=pms", label: "📝 증상 기록" },
    source: "pms",
    quote: "keep a diary of your symptoms for at least 2 menstrual cycles – you can take this to a GP appointment",
  },
];
export const SCIENCE_BY_ID = Object.fromEntries(SCIENCE.map((s) => [s.id, s])) as Record<ScienceId, ScienceCard>;
