/**
 * 셀리와 소망 빌기 — what Selly offers and says.
 *
 * A wish (a big dream or a small wish of the heart) is broken into one tiny
 * step. Each day Selly asks about that step once, and every answer is met with
 * support: "did it", "couldn't today", "don't want to say", "today is hard".
 * There are no streaks and nothing ever fades. Steps go from tiniest to bigger
 * so they can be made smaller whenever needed.
 *
 * ⚠️ Wording is meant for people who may be feeling low — pending review by a
 * mental-health professional. Selly never diagnoses and doesn't replace care.
 */
export type WishKind = "dream" | "heart";
export type WishCat = "create" | "study" | "business" | "place" | "rest" | "self" | "outside" | "people" | "other";
export type WishAnswer = "did" | "not" | "skip" | "hard";

export const MAX_WISHES = 3;
export const WISH_TEXT_MAX = 60;
export const STEP_TEXT_MAX = 40;
/** lights per star level */
export const LIGHTS_PER_LEVEL = 7;

/** the smallest step of all — always available, always counts */
export const TINIEST = "소망을 한 번 떠올려 보기";

export const KINDS: Record<WishKind, { label: string; hint: string; examples: string[]; made: string }> = {
  dream: {
    label: "✨ 꼭 이루고 싶은 꿈",
    hint: "크고 멀어 보여도 괜찮아.",
    examples: ["작가가 되고 싶어", "내 카페를 열고 싶어", "유학 가고 싶어", "자격증을 따고 싶어", "세계 여행을 하고 싶어"],
    made: "멋진 꿈이다!! 큰 꿈일수록 아주 작은 한 걸음부터 같이 가 보자.",
  },
  heart: {
    label: "🌙 요즘 마음의 소망",
    hint: "작고 조용한 소망도 소중해.",
    examples: ["푹 자고 싶어", "나를 덜 미워하고 싶어", "밖에 조금 나가고 싶어", "누군가와 이야기하고 싶어", "몸이 건강해지고 싶어"],
    made: "소중한 소망이네. 천천히, 아주 조금씩 같이 가 보자.",
  },
};

/** Categories in match order; each has a ladder of steps, tiniest first. */
export const CATS: { id: WishCat; match: RegExp; steps: string[] }[] = [
  {
    id: "rest",
    match: /잠|자고\s*싶|푹|쉬고|쉼|휴식|불면/,
    steps: ["잠들기 전 숨 세 번 길게 쉬기", "따뜻한 물 한 잔 마시기", "자기 전 화면 5분 일찍 끄기", "낮에 햇빛 5분 쬐기", "같은 시간에 불 끄기"],
  },
  {
    id: "self",
    match: /나를|나 자신|자존감|미워|자신감|나를 아끼|나를 사랑/,
    steps: ["나에게 '수고했어' 한마디 하기", "오늘 버틴 것 하나 떠올리기", "내가 좋아하는 것 하나 적기", "나를 위한 작은 선물 하나", "나에게 다정한 편지 세 줄 쓰기"],
  },
  {
    id: "people",
    match: /친구|사람들?과|사람이랑|연락|대화|이야기하고|외롭|연애|가족|만나고/,
    steps: ["보고 싶은 사람 떠올려 보기", "이모티콘 하나 보내기", "안부 한 줄 보내기", "짧게 통화해 보기", "만날 약속 잡아 보기"],
  },
  {
    id: "create",
    match: /작가|글을?\s*쓰|소설|그림|웹툰|음악|노래|작곡|유튜브|영상|사진|디자인|만들고/,
    steps: ["꿈을 한 줄로 적어 보기", "좋아하는 작품 하나 1분 보기", "아이디어 한 줄 메모하기", "5분만 끄적여 보기", "15분 작업해 보기", "만든 걸 한 사람에게 보여 주기"],
  },
  {
    id: "study",
    match: /공부|자격증|시험|합격|취업|이직|유학|영어|외국어|대학|학교|회사|일하고|커리어/,
    steps: ["필요한 것 하나 검색해 보기", "책·자료를 펼쳐만 두기", "5분만 읽거나 풀어 보기", "단어·개념 세 개 익히기", "20분 집중해 보기", "신청할 곳 하나 찾아 두기"],
  },
  {
    id: "business",
    match: /카페|가게|창업|사업|가게를|돈을?\s*모|저축|부자|내 집/,
    steps: ["꿈꾸는 모습 한 줄 적기", "비슷한 곳 하나 찾아보기", "관련 글·영상 하나 보기", "천 원이라도 따로 모아 두기", "그 일 하는 사람 이야기 찾아 읽기"],
  },
  {
    id: "place",
    match: /여행|가\s*보고|가보고|바다|해외|살아\s*보고|떠나고/,
    steps: ["가고 싶은 곳 사진 한 장 보기", "가고 싶은 이유 한 줄 적기", "여행 메모 만들기", "가는 방법 하나 찾아보기", "가까운 곳부터 반나절 다녀오기"],
  },
  {
    id: "outside",
    match: /밖|나가|산책|운동|건강|몸|걷고|햇빛/,
    steps: ["창문 열고 바깥 공기 1분", "현관까지 나가 보기", "집 앞 5분 걷기", "10분 산책하기", "좋아하는 곳까지 걸어가 보기"],
  },
  {
    id: "other",
    match: /$^/,
    steps: ["소망을 한 줄로 적어 보기", "소망을 위한 아주 작은 일 하나 찾기", "5분만 해 보기", "15분 해 보기"],
  },
];

export function catOf(text: string): WishCat {
  return (CATS.find((c) => c.match.test(text)) ?? CATS[CATS.length - 1]).id;
}
export function ladder(cat: WishCat): string[] {
  return (CATS.find((c) => c.id === cat) ?? CATS[CATS.length - 1]).steps;
}

/** `${step}` and `${wish}` are filled in */
export const ASK = [
  "오늘 “${step}”, 해 볼 수 있었어?",
  "“${wish}” 별이 궁금해해. 오늘 “${step}” 어땠어?",
  "오늘의 한 걸음은 “${step}”였지. 어땠어?",
];

export const ANSWERS: { id: WishAnswer; label: string }[] = [
  { id: "did", label: "조금 했어 ✨" },
  { id: "not", label: "오늘은 못 했어" },
  { id: "skip", label: "말하고 싶지 않아" },
];
export const HARD_LABEL = "오늘 많이 힘들어";

export const REPLY: Record<WishAnswer, string[]> = {
  did: ["와, 했구나!! 별이 반짝 빛났어 ✨", "대단해! 작은 한 걸음이 제일 어려운 거래.", "오늘의 너, 멋졌어. 별도 신났나 봐!"],
  not: ["그런 날도 있어. 소망은 그대로 여기서 반짝이고 있어.", "괜찮아. 못 한 날에도 별은 꺼지지 않아.", "대답해 준 것만으로 빛 하나야. 고마워."],
  skip: ["응, 괜찮아. 그냥 와 준 것만으로 충분해.", "알겠어. 오늘은 말 안 해도 돼. 셀리가 별 지키고 있을게."],
  hard: ["많이 힘들었구나. 오늘은 소망 생각 안 해도 돼. 셀리가 대신 지켜 줄게.", "힘든 날이구나. 여기 와 준 것만으로도 정말 잘했어."],
};

export const LINES = {
  hello: "어떤 소망을 빌어 볼까?\n별로 접어서 여기 하늘에 걸어 둘게.",
  idle: ["별들이 오늘도 반짝이고 있어.", "오늘 안부는 다 나눴어. 내일 또 물어볼게 ♡", "소망은 천천히 가도 괜찮아."],
  back: "다시 와 줘서 반가워. 소망은 그대로 잘 있었어.",
  pickStep: "그럼 오늘부터 해 볼 아주 작은 한 걸음을 골라 볼까?\n작을수록 좋아.",
  smaller: "좋아, 더 작게 바꿨어. 이 정도면 어때?",
  bigger: "멋지다! 한 걸음 살짝 늘려 볼게. 버거우면 언제든 다시 줄여도 돼.",
  levelUp: (kind: WishKind) => `별이 한 단계 더 밝아졌어!! 🌟\n${kind === "dream" ? "꿈에 한 뼘 더 가까워졌어." : "소망이 더 또렷해졌어."}`,
  done: "이뤘구나!!! 🎉 셀리 너무 기뻐!\n이 별은 ‘이룬 소망’ 선반에 놓아 둘게.",
  rest: "알겠어. 이 별은 잠깐 쉬게 해 둘게. 언제든 다시 깨워도 돼.",
  wake: "다시 깨웠다! 천천히 또 같이 가 보자.",
  crisis: "그 마음까지 꺼내 줘서 고마워.\n이건 별로 접기 전에, 지금 바로 이야기를 들어 줄 사람이 있으면 좋겠어.",
  hardHelp: "요즘 힘든 날이 이어지고 있구나. 혼자 견디기 어려우면, 지금 바로 이야기를 들어 줄 사람이 있어요.",
};

export const fill = (t: string, v: { step: string; wish: string }) => t.replace("${step}", v.step).replace("${wish}", v.wish);
