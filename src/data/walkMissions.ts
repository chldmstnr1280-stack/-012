/**
 * Walk missions — one small thing to notice on a walk. Every mission can be
 * "completed" whatever happens (not finding a four-leaf clover still counts:
 * looking slowly at the ground was the point). Photo missions ask the user to
 * stop first; photos stay on the device.
 */
export type MissionKind = "photo" | "find" | "sense" | "heart";

export interface WalkMission {
  id: string;
  kind: MissionKind;
  emoji: string;
  title: string;
  /** Selly, when the mission is chosen */
  intro: string;
  /** how to do it (shown in the mission sheet) */
  guide: string;
  /** Selly, when it's done (found / done) */
  done: string;
  /** find missions: Selly when it wasn't found — still a success */
  notFound?: string;
  /** needs daylight (sky, shadow …) */
  daylight?: boolean;
}

export const WALK_MISSIONS: WalkMission[] = [
  { id: "sky", kind: "photo", emoji: "☁️", title: "오늘의 하늘 찍기", intro: "오늘 하늘은 어떤 색일까?\n멈춰 서서 한 장 찍어 줘.", guide: "잠깐 멈춰 서서, 고개를 들고 하늘을 찍어 봐요.", done: "와, 오늘 하늘 예쁘다!\n온실에 걸어 둘게.", daylight: true },
  { id: "green", kind: "photo", emoji: "🌿", title: "오늘의 초록 찾기", intro: "길에서 제일 예쁜 초록을\n찾아서 찍어 줄래?", guide: "나뭇잎, 풀, 이끼… 마음에 드는 초록을 찾아 멈춰서 찍어요.", done: "싱그럽다!\n나도 초록이 좋아." },
  { id: "round", kind: "photo", emoji: "⚪", title: "동그란 것 찾기", intro: "길에서 동그란 걸\n찾아볼까?", guide: "맨홀, 바퀴, 꽃, 돌… 동그란 걸 찾으면 멈춰서 찍어요.", done: "찾았다! 눈이 반짝반짝하네." },
  { id: "shadow", kind: "photo", emoji: "👤", title: "내 그림자 찍기", intro: "오늘 네 그림자는\n얼마나 길까?", guide: "해를 등지고 서서 발밑의 그림자를 찍어 봐요.", done: "그림자도 같이 산책했네!", daylight: true },
  { id: "flower", kind: "photo", emoji: "🌼", title: "길가의 꽃 찍기", intro: "작은 꽃을 찾아볼까?\n아주 작아도 좋아.", guide: "보도블록 틈, 화단 가장자리… 작은 꽃을 찾으면 멈춰서 찍어요.", done: "작은 꽃 발견!\n오늘의 행운이야." },
  { id: "clover", kind: "find", emoji: "🍀", title: "네잎클로버 찾기", intro: "네잎클로버를 찾아볼까?\n못 찾아도 괜찮아!", guide: "클로버가 모인 풀밭이 보이면 천천히 들여다봐요.", done: "네잎클로버!!\n행운이 가득할 거야 ✨", notFound: "괜찮아! 천천히 땅을 본\n그 시간이 미션이었어 🍀" },
  { id: "red", kind: "find", emoji: "🔴", title: "빨간 것 세 가지", intro: "빨간 걸 세 개\n찾아볼까?", guide: "간판, 열매, 신호등… 빨간 걸 세 가지 찾아요.", done: "세 개 다 찾았구나!\n눈썰미 최고야.", notFound: "두 개도, 하나도 좋아.\n주변을 본 게 중요해." },
  { id: "cloud", kind: "find", emoji: "🐑", title: "구름에 이름 붙이기", intro: "구름 하나 골라서\n무슨 모양인지 말해 줄래?", guide: "하늘의 구름 하나를 골라, 무엇을 닮았는지 떠올려 봐요.", done: "와, 정말 그렇게 보여!", notFound: "오늘은 맑은 하늘이구나.\n그것도 좋아.", daylight: true },
  { id: "sounds", kind: "sense", emoji: "👂", title: "들리는 소리 세 가지", intro: "잠깐 귀 기울여 볼까?\n소리 세 가지를 찾아 줘.", guide: "걸음을 늦추고, 들리는 소리를 하나씩 세어 봐요. (새, 바람, 발소리…)", done: "세상이 조금 더\n가까이 느껴지지?" },
  { id: "wind", kind: "sense", emoji: "🍃", title: "바람 느끼기", intro: "바람이 어디서 오는지\n느껴 볼까?", guide: "멈춰서 눈을 살짝 감고, 바람이 얼굴 어느 쪽에 닿는지 느껴요.", done: "시원하다…\n바람도 같이 걷는 것 같아." },
  { id: "smell", kind: "sense", emoji: "🌸", title: "냄새 하나 찾기", intro: "코로 산책해 볼까?\n냄새 하나만 찾아 줘.", guide: "풀, 빵집, 비 냄새… 숨을 천천히 들이쉬며 냄새 하나를 찾아요.", done: "냄새로도 계절을\n느낄 수 있구나." },
  { id: "steps", kind: "sense", emoji: "👣", title: "발걸음 열 번 세기", intro: "발걸음을 천천히\n열 번 세어 볼까?", guide: "발바닥이 땅에 닿는 느낌을 느끼며 하나, 둘… 열까지 세어요.", done: "천천히 걸으니까\n마음도 같이 느려졌지?" },
  { id: "thanks", kind: "heart", emoji: "💗", title: "고마운 것 하나", intro: "걸으면서 고마운 것\n하나만 떠올려 줄래?", guide: "오늘 고마웠던 사람, 물건, 순간 하나를 마음속으로 떠올려요.", done: "그 마음, 참 따뜻하다 ♡" },
  { id: "smile", kind: "heart", emoji: "😊", title: "웃게 한 것 떠올리기", intro: "요즘 너를 웃게 한 게\n뭐였는지 떠올려 볼까?", guide: "작은 것이라도 좋아요. 떠올리면서 살짝 웃어 봐요.", done: "헤헤, 나도 덩달아\n웃음이 나!" },
];

export const MISSION_BY_ID = Object.fromEntries(WALK_MISSIONS.map((m) => [m.id, m])) as Record<string, WalkMission>;

/** Today's suggestion: the same all day (so it doesn't feel random), skipping daylight ones at night. */
export function missionOfTheDay(dateKey: string, night: boolean, offset = 0): WalkMission {
  const pool = WALK_MISSIONS.filter((m) => !(night && m.daylight));
  let h = 0;
  for (const c of dateKey) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[(h + offset) % pool.length];
}
