import { CRISIS_REPLY, isCrisis } from "./safety";
import type { WhineAnimation, WhineEmotion, WhineMode, WhineReply } from "./types";

/**
 * Built-in replies — used when the AI isn't available (no key, offline, an
 * error) and always in the Toss build. Picked by topic and mode, never the same
 * line twice in a row. Short, no advice, no judging, no "think positive".
 */
type Line = [string, WhineAnimation];

const TOPICS: { id: string; match: RegExp; together: Line[]; listen: Line[] }[] = [
  {
    id: "home",
    match: /집|퇴근|귀가|침대|이불/,
    together: [
      ["으아아아!!! 집!!! 집으로 보내줘라아아!! 😭", "LYING_DOWN"],
      ["집… 집이 부른다… 이불이 나 기다린대!!", "WHINING"],
      ["나도!! 지금 당장 순간이동해서 이불 속으로!!", "ANGRY_CUTE"],
    ],
    listen: [
      ["집에 가고 싶을 만큼 긴 하루였구나.", "LISTENING"],
      ["얼른 편한 곳에서 쉬고 싶겠다. 여기선 잠깐 내려놓아도 돼.", "COMFORTING"],
    ],
  },
  {
    id: "work",
    match: /일하기|일 하기|출근|회사|업무|과제|공부|학교|시험|야근|마감|회의/,
    together: [
      ["으으으!! 오늘은 이불이랑 한 몸이 되고 싶은 날이야!!", "WHINING"],
      ["일이 나를 쫓아온다아아!! 도망쳐!! 🏃", "ANGRY_CUTE"],
      ["마감이라는 단어, 사전에서 지워 버리고 싶어!!", "ANGRY_CUTE"],
    ],
    listen: [
      ["해야 할 일이 많아서 버거웠구나.", "LISTENING"],
      ["오늘 하루 그걸 다 버티고 있었네. 여기선 일 얘기 안 해도 돼.", "COMFORTING"],
    ],
  },
  {
    id: "tired",
    match: /피곤|졸려|졸리|지쳐|지쳤|녹초|기운|잠|힘이 없/,
    together: [
      ["으아아 나도 같이 누울래!! 우리 10초만 바닥이 되자!", "LYING_DOWN"],
      ["배터리 1%… 셀리도 방전… 삐— 💤", "SLEEPY"],
      ["피곤해서 뼈가 녹는 것 같아… 흐물흐물…", "LYING_DOWN"],
    ],
    listen: [
      ["많이 지쳤구나. 지금은 아무것도 안 해도 괜찮아.", "COMFORTING"],
      ["몸이 무거운 날이네. 잠깐 쉬어 가도 돼.", "SLEEPY"],
    ],
  },
  {
    id: "annoyed",
    match: /짜증|화나|화가|열받|빡|억울|어이없|미치겠|죽이고/,
    together: [
      ["으으으!! 진짜 짜증 나!! 셀리 볼 빵빵해졌어!! 😤", "ANGRY_CUTE"],
      ["발 동동동!! 오늘은 우리 같이 투덜대도 되는 날이야!!", "ANGRY_CUTE"],
      ["으아아 열받아!! 베개 퍽퍽 치고 싶다!!", "WHINING"],
    ],
    listen: [
      ["그럴 만했어. 화가 날 만한 일이었네.", "LISTENING"],
      ["억울하고 답답했겠다. 여기선 다 말해도 돼.", "LISTENING"],
    ],
  },
  {
    id: "people",
    match: /사람들|사람 때문|상사|팀장|부장|친구|남친|여친|엄마|아빠|가족|동료|선배|후배|관계/,
    together: [
      ["으으 사람들 너무해!! 셀리가 대신 쿵쾅쿵쾅 해 줄게!!", "ANGRY_CUTE"],
      ["사람 많은 날은 진짜 기 빨려어어… 😵", "WHINING"],
    ],
    listen: [
      ["사람들 사이에서 지내는 게 유난히 힘든 날도 있지. 더 이야기하고 싶어?", "LISTENING"],
      ["그 사람 때문에 마음이 많이 쓰였구나.", "COMFORTING"],
    ],
  },
  {
    id: "sad",
    match: /힘들|우울|슬퍼|슬프|울고|눈물|외로|서러|속상|지친다/,
    together: [
      ["으아아앙 힘들다아… 우리 같이 엉엉 울자 😭", "WHINING"],
      ["힘든 날은 징징대도 돼!! 셀리가 다 들어 줄게!!", "COMFORTING"],
    ],
    listen: [
      ["많이 힘들었구나. 여기서는 천천히 이야기해도 돼.", "COMFORTING"],
      ["그런 마음이 드는 날도 있지. 나 여기 있어.", "COMFORTING"],
    ],
  },
  {
    id: "comfort",
    match: /위로|안아|토닥|달래|칭찬|잘했다고/,
    together: [
      ["이리 와!! 셀리가 꼬옥 안아 줄게!! 🤗", "COMFORTING"],
      ["토닥토닥토닥!! 오늘도 진짜진짜 고생했어!!", "COMFORTING"],
    ],
    listen: [
      ["오늘 정말 애썼어. 토닥토닥.", "COMFORTING"],
      ["여기선 기대도 돼. 천천히 숨 쉬어.", "COMFORTING"],
    ],
  },
  {
    id: "lazy",
    match: /하기 싫|하기싫|귀찮|아무것도|무기력|의욕/,
    together: [
      ["아무것도 하기 싫어어!! 우리 오늘 감자 할래!! 🥔", "LYING_DOWN"],
      ["오늘의 목표: 숨쉬기. 끝!! 헤헤", "HAPPY"],
    ],
    listen: [
      ["그런 날도 있어. 지금 당장 뭘 해야 하는 건 아니야.", "LISTENING"],
      ["아무것도 하기 싫은 날엔, 그냥 그렇게 있어도 돼.", "COMFORTING"],
    ],
  },
  {
    id: "hungry",
    match: /배고|배가 고|먹고 싶|떡볶이|치킨|라면|야식/,
    together: [
      ["배고파아아!! 셀리 배에서도 꼬르륵 소리 나!! 🍜", "WHINING"],
      ["맛있는 거!! 맛있는 거 내놔라아아!!", "ANGRY_CUTE"],
    ],
    listen: [
      ["배가 고프면 마음도 더 지치지.", "LISTENING"],
      ["먹고 싶은 게 떠오르는 날이구나.", "LISTENING"],
    ],
  },
  {
    id: "period",
    match: /생리|배 아파|배아파|pms|PMS|호르몬/,
    together: [
      ["으으 몸이 내 맘대로 안 되는 날이야!! 같이 데굴데굴!!", "LYING_DOWN"],
      ["오늘은 세상이 다 귀찮은 게 당연해!! 으아아!!", "WHINING"],
    ],
    listen: [
      ["몸이 힘든 날이구나. 무리하지 않아도 괜찮아.", "COMFORTING"],
      ["그런 날엔 평소보다 예민한 게 당연해.", "LISTENING"],
    ],
  },
];

const GENERIC: Record<WhineMode, Line[]> = {
  together: [
    ["으아아아!! 그거 진짜 징징댈 만해!!", "WHINING"],
    ["으으으!! 셀리도 같이 투덜투덜!! 😫", "WHINING"],
    ["발 동동!! 오늘은 어른스럽지 않아도 괜찮아!!", "ANGRY_CUTE"],
    ["헉 진짜?! 으아아 나도 소리 질러 줄게!! 으아아!!", "WHINING"],
  ],
  listen: [
    ["응, 듣고 있어. 계속 말해도 돼.", "LISTENING"],
    ["그랬구나.", "LISTENING"],
    ["그런 일이 있었구나. 천천히 말해 줘.", "LISTENING"],
    ["여기선 정리 안 해도 괜찮아.", "COMFORTING"],
  ],
};

/** after a few rounds of whining: lighter lines, so it ends a little brighter */
const LIFT: Record<WhineMode, Line[]> = {
  together: [
    ["으아아 하고 다 쏟아내니까 쪼끔 시원하다!! 헤헤 😆", "HAPPY"],
    ["우리 오늘 징징 국가대표다!! 금메달 줄게 🥇", "HAPPY"],
    ["이만큼 투덜댔으면 오늘 몫은 끝!! 이제 말랑해질 차례야", "HAPPY"],
    ["셀리 볼 빵빵했던 거 이제 좀 쪼그라들었어. 너도?", "HAPPY"],
  ],
  listen: [
    ["많이 꺼내 놓았네. 숨 한 번 크게 쉬어 볼까.", "COMFORTING"],
    ["이야기해 줘서 고마워. 나도 마음이 따뜻해졌어.", "COMFORTING"],
    ["여기까지 말한 것만으로도 충분해.", "COMFORTING"],
  ],
};

const EMOTION_FOR: Record<WhineAnimation, WhineEmotion> = {
  IDLE: "listening",
  LISTENING: "listening",
  WHINING: "whining",
  ANGRY_CUTE: "angry_cute",
  LYING_DOWN: "whining",
  COMFORTING: "comforting",
  HAPPY: "happy",
  SLEEPY: "sleepy",
};

/**
 * Built-in reply. `avoid` = Selly's last line, so she doesn't repeat herself.
 * `round` = how many times Selly has answered already; from the 3rd answer on
 * she sometimes turns things lighter.
 */
export function fallbackReply(text: string, mode: WhineMode, avoid?: string, rand = Math.random, round = 0): WhineReply {
  if (isCrisis(text)) return CRISIS_REPLY;
  const topic = TOPICS.find((t) => t.match.test(text));
  const lift = round >= 2 && rand() < 0.5;
  const pool = (lift ? LIFT[mode] : topic ? topic[mode] : GENERIC[mode]).filter(([m]) => m !== avoid);
  const [message, animation] = pool[Math.floor(rand() * pool.length)] ?? GENERIC[mode][0];
  return { message, animation, emotion: EMOTION_FOR[animation], suggestedAction: null };
}
