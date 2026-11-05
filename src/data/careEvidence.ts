import type { SymptomId } from "./pmsSymptoms";

/**
 * PMS care cards (Phase C).
 *
 * Every statement here is a Korean rendering of a sentence in the cited
 * patient-information page; `quote` keeps the original wording so it can be
 * checked. Nothing is added beyond what the sources say. No medicine or
 * supplement doses are given in the app, even where a source mentions one.
 *
 * ⚠️ review: "pending" — not yet reviewed by a Korean clinician. The
 * translation, wording and selection must be reviewed before a public launch.
 */

export interface Source {
  id: "nhs-pms" | "acog-faq057";
  org: string;
  title: string;
  url: string;
  /** the source's own review date, as printed on the page */
  sourceReviewed: string;
  /** when we read the page */
  accessed: string;
}

export const SOURCES: Record<Source["id"], Source> = {
  "nhs-pms": {
    id: "nhs-pms",
    org: "NHS (영국 국민보건서비스)",
    title: "PMS (premenstrual syndrome)",
    url: "https://www.nhs.uk/conditions/pre-menstrual-syndrome/",
    sourceReviewed: "2024-06-18 (다음 검토 2027-06-18)",
    accessed: "2026-11-05",
  },
  "acog-faq057": {
    id: "acog-faq057",
    org: "ACOG (미국산부인과학회)",
    title: "Premenstrual Syndrome (PMS) · FAQ057",
    url: "https://www.acog.org/womens-health/faqs/premenstrual-syndrome",
    sourceReviewed: "2025-11 (최종 수정 2021-05)",
    accessed: "2026-11-05",
  },
};

export interface CareCard {
  id: string;
  title: string;
  /** one line shown on the closed card */
  summary: string;
  tips: string[];
  /** symptoms the source itself names for this measure (empty = general advice) */
  mentions: SymptomId[];
  /** plain-language label of what the source says it may help, if anything specific */
  mentionsNote?: string;
  sources: { id: Source["id"]; quote: string }[];
  /** an in-app way to try it */
  action?: { href: string; label: string };
  review: "pending" | "reviewed";
}

export const CARE_CARDS: CareCard[] = [
  {
    id: "aerobic",
    title: "규칙적인 유산소 운동",
    summary: "증상이 있는 날만이 아니라, 평소에 꾸준히 움직이기",
    tips: [
      "빠르게 걷기, 달리기, 자전거, 수영 같은 유산소 운동이 많은 사람에게 PMS 증상을 덜어 줘요.",
      "증상이 있는 날에만 하기보다 평소에 규칙적으로 하는 게 좋아요.",
      "목표로는 일주일 중 대부분의 날, 30분 이상이 제시돼요.",
    ],
    mentions: ["fatigue", "low_mood"],
    mentionsNote: "피로감과 우울감",
    sources: [
      {
        id: "acog-faq057",
        quote:
          "For many women, regular aerobic exercise lessens PMS symptoms. It may reduce fatigue and depression. … Exercise regularly, not just during the days that you have symptoms. A good goal is at least 30 minutes of exercise most days of the week.",
      },
      { id: "nhs-pms", quote: "exercise regularly" },
    ],
    action: { href: "/walk", label: "셀리와 산책하기" },
    review: "pending",
  },
  {
    id: "relax",
    title: "호흡·명상·요가로 긴장 풀기",
    summary: "스트레스를 줄이는 이완 방법",
    tips: [
      "긴장을 풀고 스트레스를 줄이는 방법이 PMS가 있는 사람에게 도움이 될 수 있어요.",
      "호흡 운동, 명상, 요가가 이완 방법의 예로 소개돼요. 마사지도 그중 하나예요.",
    ],
    mentions: [],
    sources: [
      {
        id: "acog-faq057",
        quote:
          "Finding ways to relax and reduce stress can help women who have PMS. … Relaxation therapy may include breathing exercises, meditation, and yoga. Massage therapy is another form of relaxation therapy that you may want to try.",
      },
      { id: "nhs-pms", quote: "try reducing your stress by doing yoga or meditation" },
    ],
    action: { href: "/?do=breathe", label: "셀리와 호흡하기" },
    review: "pending",
  },
  {
    id: "sleep",
    title: "같은 시간에 자고 일어나기",
    summary: "주말을 포함해 규칙적인 수면 습관",
    tips: [
      "충분히 자는 것이 중요해요.",
      "주말을 포함해 매일 같은 시간에 자고 일어나는 습관이 기분 변화와 피로를 줄이는 데 도움이 될 수 있어요.",
    ],
    mentions: ["mood_swings", "fatigue"],
    mentionsNote: "기분 변화와 피로",
    sources: [
      {
        id: "acog-faq057",
        quote:
          "Getting enough sleep is important. Regular sleeping habits—in which you wake up and go to sleep at the same times every day, including weekends—may help lessen moodiness and fatigue.",
      },
      { id: "nhs-pms", quote: "get plenty of sleep" },
    ],
    review: "pending",
  },
  {
    id: "meals",
    title: "조금씩 자주, 통곡물 위주로 먹기",
    summary: "식사 간격과 복합탄수화물",
    tips: [
      "세 끼를 많이 먹기보다 조금씩 여러 번(예: 2~3시간마다) 먹는 방법이 소개돼요.",
      "통밀빵, 현미, 보리, 콩, 렌틸콩 같은 복합탄수화물이 많은 식단이 기분 증상과 음식 갈망을 줄일 수 있어요.",
      "균형 잡힌 식사를 기본으로 해요.",
    ],
    mentions: ["appetite", "mood_swings", "low_mood", "irritability"],
    mentionsNote: "기분 증상과 음식 갈망",
    sources: [
      {
        id: "acog-faq057",
        quote:
          "Eat a diet rich in complex carbohydrates. A complex carbohydrate-rich diet may reduce mood symptoms and food cravings. … Eat six small meals a day rather than three large ones, or eat slightly less at your three meals and add three light snacks.",
      },
      { id: "nhs-pms", quote: "eat a healthy, balanced diet – you may find eating frequent smaller meals every 2 to 3 hours better" },
    ],
    review: "pending",
  },
  {
    id: "reduce",
    title: "짠 음식·당·카페인·술 줄이기",
    summary: "식단에서 덜어 내면 좋은 것들",
    tips: [
      "지방, 소금, 설탕 섭취를 줄여 보세요.",
      "카페인과 술은 피하는 것이 권해져요.",
      "담배는 피우지 않는 것이 좋아요.",
      "요거트나 잎채소처럼 칼슘이 풍부한 음식을 식단에 더해 보세요.",
    ],
    mentions: [],
    sources: [
      {
        id: "acog-faq057",
        quote: "Add calcium-rich foods, like yogurt and leafy green vegetables, to your diet. Reduce your intake of fat, salt, and sugar. Avoid caffeine and alcohol.",
      },
      { id: "nhs-pms", quote: "do not smoke · do not drink too much alcohol" },
    ],
    review: "pending",
  },
  {
    id: "diary",
    title: "증상 기록 이어 가기",
    summary: "2~3번의 주기 동안 매일 기록하기",
    tips: [
      "적어도 2~3달 동안 매일 느낀 증상과 정도를 적고, 생리 날짜도 함께 기록하는 방법이 권해져요.",
      "이 기록은 진료를 볼 때 가져갈 수 있어요.",
    ],
    mentions: [],
    sources: [
      {
        id: "acog-faq057",
        quote: "Each day for at least 2 to 3 months, write down and rate any symptoms you feel. Record the dates of your periods as well.",
      },
      { id: "nhs-pms", quote: "keep a diary of your symptoms for at least 2 menstrual cycles – you can take this to a GP appointment" },
    ],
    action: { href: "/record?tab=pms", label: "오늘 증상 기록하기" },
    review: "pending",
  },
  {
    id: "supplements",
    title: "영양제·약은 먼저 상담하기",
    summary: "효과가 확인되지 않은 제품이 많아요",
    tips: [
      "PMS에 좋다고 광고하는 제품 대부분은 시험되지 않았거나 효과가 입증되지 않았어요.",
      "영양제나 보조 요법은 근거가 많지 않아요. 다른 약을 먹고 있다면 특히, 시작하기 전에 의사나 약사와 상의하세요.",
      "진통제도 오래 쓰거나 다른 약과 함께 쓸 때는 의사·약사와 먼저 이야기해 주세요.",
    ],
    mentions: [],
    sources: [
      {
        id: "acog-faq057",
        quote:
          "Most of these products have either not been tested or have not been proved to be effective. It is important to talk with your ob-gyn before taking any PMS product or supplement. … Talk with your ob-gyn before taking NSAIDs.",
      },
      {
        id: "nhs-pms",
        quote:
          "Complementary therapies and dietary supplements may help with PMS, but there's not much evidence that they work. … Check with a GP or pharmacist if you're also taking medicines before starting to take regular supplements.",
      },
    ],
    review: "pending",
  },
];

/** When to consider seeing a doctor — shown with every set of cards. */
export const SEE_A_DOCTOR = {
  points: ["생활 습관을 바꿔 봐도 나아지지 않을 때", "증상이 일상생활에 영향을 줄 때"],
  note: "진료에서는 생활 습관 외에 다른 치료 방법을 함께 상담할 수 있어요.",
  sources: [
    { id: "nhs-pms" as const, quote: "See a GP if: … lifestyle changes have not helped · your symptoms are affecting your daily life" },
    { id: "acog-faq057" as const, quote: "If your PMS symptoms begin to interfere with your life, you may decide to seek medical treatment." },
  ],
  review: "pending" as const,
};
