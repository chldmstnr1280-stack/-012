/**
 * 생리 지연 돌봄 — information cards the user opens herself.
 *
 * Every sentence is a Korean rendering of a sentence on the cited NHS page;
 * `quote` keeps the original wording so it can be checked. Nothing is added
 * beyond what the sources say, nothing is guessed about the user (pregnancy is
 * never inferred or shown unless she opens that card), and nothing here is a
 * diagnosis. Read 2026-11-17.
 *
 * ⚠️ review: "pending" — not yet reviewed by a Korean clinician. Two of the NHS
 * pages are past their own "next review" date (marked below); re-check them
 * before a public launch.
 */
export interface LateSource {
  id: "nhs-missed" | "nhs-test" | "nhs-ectopic" | "nhs-pain" | "nhs-irregular" | "nhs-pms";
  org: string;
  title: string;
  url: string;
  sourceReviewed: string;
  accessed: string;
}

export const LATE_SOURCES: Record<LateSource["id"], LateSource> = {
  "nhs-missed": { id: "nhs-missed", org: "NHS (영국 국민보건서비스)", title: "Missed or late periods", url: "https://www.nhs.uk/symptoms/missed-or-late-periods/", sourceReviewed: "2026-06-12 (다음 검토 2029-06-12)", accessed: "2026-11-17" },
  "nhs-test": { id: "nhs-test", org: "NHS", title: "Doing a pregnancy test", url: "https://www.nhs.uk/pregnancy/trying-for-a-baby/doing-a-pregnancy-test/", sourceReviewed: "2022-02-09 (다음 검토 예정일 2025-02-09 지남 — 재확인 필요)", accessed: "2026-11-17" },
  "nhs-ectopic": { id: "nhs-ectopic", org: "NHS", title: "Ectopic pregnancy · Symptoms", url: "https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/", sourceReviewed: "2022-08-23 (다음 검토 예정일 2025-08-23 지남 — 재확인 필요)", accessed: "2026-11-17" },
  "nhs-pain": { id: "nhs-pain", org: "NHS", title: "Period pain", url: "https://www.nhs.uk/symptoms/period-pain/", sourceReviewed: "2026-03-18 (다음 검토 2029-03-18)", accessed: "2026-11-17" },
  "nhs-irregular": { id: "nhs-irregular", org: "NHS", title: "Irregular periods", url: "https://www.nhs.uk/symptoms/irregular-periods/", sourceReviewed: "2026-06-26", accessed: "2026-11-17" },
  "nhs-pms": { id: "nhs-pms", org: "NHS", title: "PMS (premenstrual syndrome)", url: "https://www.nhs.uk/conditions/pre-menstrual-syndrome/", sourceReviewed: "2024-06-18 (다음 검토 2027-06-18)", accessed: "2026-11-05" },
};

export interface InfoCard {
  id: "reasons" | "pregnancy" | "doctor" | "care";
  title: string;
  /** shown above the points, plainly */
  lead?: string;
  points: string[];
  /** a calm, clearly separated "get help now" block (never shown on the closed card) */
  urgent?: { title: string; points: string[]; after: string };
  sources: { id: LateSource["id"]; quote: string }[];
  action?: { href: string; label: string };
  review: "pending" | "reviewed";
}

export const LATE_CARDS: InfoCard[] = [
  {
    id: "reasons",
    title: "생리가 늦어지는 일반적인 이유",
    lead: "생리가 늦거나 건너뛰는 일은 많은 사람에게 한 번쯤 있어요. 대부분은 걱정할 일이 아니지만, 혹시 모르니 진료를 받아 보라고 안내해요.",
    points: [
      "흔한 이유로는 스트레스, 갑작스러운 체중 감소, 과체중, 지나친 운동, 일부 호르몬 피임법(피임약·피임 주사·자궁 내 장치 등), 모유 수유, 임신, 완경 전환기(보통 45~55세), 다낭성 난소 증후군 등이 소개돼요.",
      "생리 사이 간격이 매번 달라서 조금 일찍 또는 늦게 올 수도 있어요. 이것을 불규칙한 생리라고 해요.",
    ],
    sources: [
      {
        id: "nhs-missed",
        quote:
          "Late or missed periods can be caused by many things. Most of the time it's nothing to worry about, but see a doctor about them just in case. … Common causes of a missed or late period include: being pregnant · stress · the start of menopause (perimenopause), usually between the ages of 45 and 55 · polyendocrine metabolic ovarian syndrome (PMOS) – which used to be called polycystic ovary syndrome (PCOS) · sudden weight loss · being overweight · doing too much exercise · using certain hormonal methods of contraception … · breastfeeding. Sometimes the gap between your periods may just vary each time. Your periods might come early or late.",
      },
    ],
    review: "pending",
  },
  {
    id: "pregnancy",
    title: "임신 가능성이 있을 때 확인할 사항",
    lead: "이 카드는 직접 열었을 때만 보여요. 디어셀리는 임신 가능성을 짐작하거나 기록하지 않아요.",
    points: [
      "대부분의 임신 테스트는 생리 예정일이 지난 첫날부터 할 수 있어요.",
      "생리 예정일을 알기 어렵다면, 마지막으로 피임 없이 관계한 날로부터 최소 21일 뒤에 검사하라고 안내해요.",
      "양성 결과는 거의 정확하지만, 음성 결과는 덜 확실해요. 너무 일찍 검사하면 결과가 정확하지 않을 수 있어요.",
      "음성이 나왔는데도 임신일 것 같다면 며칠 기다렸다가 다시 검사해 보세요. 두 번째 검사도 음성인데 생리가 오지 않으면 의사와 상담하세요.",
      "피임약을 먹고 있어도 임신 테스트는 정상적으로 작동해요.",
    ],
    urgent: {
      title: "임신 가능성이 있는데 이런 증상이 함께 있다면",
      points: ["갑자기 찌르듯 심한 배 통증(보통 아랫배 한쪽)", "몹시 어지럽거나 쓰러질 것 같음", "평소 생리와 다른 출혈(멈췄다 났다 하거나 묽고 짙은 갈색)", "어깨 끝(어깨와 팔이 만나는 곳)의 낯선 통증"],
      after: "갑작스럽고 심한 배 통증과 심한 어지럼·실신이 함께 오면 바로 119에 연락하거나 응급실로 가 주세요. 다른 증상도 임신 가능성이 있다면 진료를 받아 보세요.",
    },
    sources: [
      { id: "nhs-test", quote: "You can carry out most pregnancy tests from the first day of a missed period. If you don't know when your next period is due, do the test at least 21 days after you last had unprotected sex." },
      { id: "nhs-test", quote: "A positive test result is almost certainly correct. However, a negative test result is less reliable. The result may not be reliable if you: … take the test too early … If you get a negative result and still think you're pregnant, wait a few days and try again. Speak to your GP if you get a negative result after a second test but your period has not arrived." },
      { id: "nhs-test", quote: "Some methods of contraception, such as the contraceptive pill, contain hormones, but these hormones will not stop a pregnancy test working." },
      {
        id: "nhs-ectopic",
        quote:
          "Vaginal bleeding … often starts and stops, and may be watery and dark brown in colour. … You may experience tummy pain, typically low down on one side. … Shoulder tip pain … you should get medical advice right away if you experience it. … Signs of a rupture include a combination of: a sharp, sudden and intense pain in your tummy · feeling very dizzy or fainting · feeling sick. Call 999 for an ambulance or go to your nearest accident and emergency (A&E) department immediately if you experience these symptoms.",
      },
    ],
    review: "pending",
  },
  {
    id: "doctor",
    title: "병원 상담이 필요할 수 있는 경우",
    lead: "아래에 해당하면 산부인과 진료를 받아 보라고 안내해요. 급하지 않은 상담이에요.",
    points: [
      "생리를 3번 연속 건너뛰었을 때",
      "생리가 불규칙해졌거나, 원래 패턴이 달라졌을 때",
      "생리를 건너뛰면서 체중 변화, 피로, 얼굴의 털, 건조하거나 기름진 피부 같은 증상이 함께 있을 때",
      "생리가 7일보다 길게 이어지거나, 생리 사이에 출혈이 있을 때",
      "생리통이 더 심해졌거나 평소 일상을 못 할 정도일 때 — 통증이 심하거나 평소보다 심한데 진통제로도 나아지지 않으면 빨리 진료를 받으세요.",
      "생리 전 증상이 생활 습관을 바꿔도 나아지지 않거나, 일상생활에 영향을 줄 때",
    ],
    sources: [
      { id: "nhs-missed", quote: "See a GP if: you've missed your period 3 times in a row · … · you've missed your period and have other symptoms like weight gain or weight loss, tiredness, hair growth on your face, and dry or oily skin · your periods have become irregular" },
      { id: "nhs-irregular", quote: "speak to a GP if your periods are irregular or your normal pattern of periods changes. … See a GP if: … your periods last longer than 7 days · … · you have bleeding between periods" },
      { id: "nhs-pain", quote: "Ask for an urgent GP appointment or get help from NHS 111 if: your pelvic pain or period pain is severe or worse than usual, and painkillers have not helped … See a GP if: your periods become more painful, heavier or irregular · your period pain is stopping you doing your usual daily activities" },
      { id: "nhs-pms", quote: "See a GP if: … lifestyle changes have not helped · your symptoms are affecting your daily life" },
    ],
    action: { href: "/report/clinical", label: "진료용 요약 만들기" },
    review: "pending",
  },
  {
    id: "care",
    title: "지금의 불안과 피로 돌보기",
    lead: "기다리는 동안 마음이 쓰이는 건 자연스러워요. 정답은 없으니, 지금 끌리는 것 하나만 골라도 충분해요.",
    points: ["숨을 길게 내쉬며 1분 쉬어 가기", "몸과 마음의 신호를 30초 동안 살펴보기", "불안한 마음을 셀리에게 털어놓기", "오늘은 일찍 쉬기"],
    sources: [],
    action: { href: "/?do=breathe", label: "셀리와 1분 호흡" },
    review: "pending",
  },
];

export const LATE_LINES = {
  title: "예상했던 생리 시작일이 지났어요.",
  body: "생리주기는 스트레스나 건강 상태 등에 따라 달라질 수 있어요.",
  ask: "생리가 시작됐는지 알려 줄래요? 기록을 못 한 거라면 지금 남겨도 괜찮아요.",
  notYet: "아직 생리가 시작되지 않았다면, 지금의 몸과 마음 상태를 함께 살펴볼까요?",
  later: "알겠어요. 나중에 편할 때 기록해 주세요.",
};
