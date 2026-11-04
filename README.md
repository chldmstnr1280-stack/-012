# Dear Selly · 디어셀리

> Held, not healed. — 나를 돌보는, 작은 웰니스 정원

캐릭터 육성형 웰니스 웹앱 MVP. **Phase 1: 인터랙티브 유리온실 홈 화면.**

```bash
npm install
npm run dev   # http://localhost:3000  (모바일 390×844 기준)
```

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion for React · Lucide.
폰트는 `@fontsource`로 셀프 호스팅합니다(Gowun Dodum, Parisienne).

## 1. 레퍼런스 분석

| 항목 | 정리 |
| --- | --- |
| 레이아웃 (390×844) | 로고 + 알림/설정 (y≈76) → 레벨 카드 + 성장 배지 (y≈122–187) → 말풍선 (y≈306–391) → 셀리 + 잔디 섬 (y≈404–636) → 액션 독: 기록하기 / 호흡하기(원형, 핑크) / 셀리 돌보기 (y≈624–752) → 하단 내비 (y≈761–838) |
| 팔레트 | `#FDFBF6` `#F6EEDB` `#E8F3E7` `#D9E8D2` `#B7D4B0` `#8FAF91` + 블러시 `#EFBCBF` `#E6A3A8`, 잉크 `#4A3F36` |
| UI | 반투명 크림 글래스 카드, 큰 라운드(24–30px), 부드러운 그림자, 듀오톤 일러스트 아이콘, 활성 탭 세이지 그린 |
| 셀리 | 크림색 둥근 몸통, 복슬복슬한 외곽, 연두 잎 두 장(V자), 작은 눈·ω 입, 분홍 볼, 배 쪽 따뜻한 발광, 작은 팔·발 |
| 배경 | 돔형 유리 천장(방사형 서까래), 아치 창 격자, 위에서 내려오는 덩굴, 좌측 나무 선반(화분·책·액자), 매달린 랜턴, 우측 테이블, 햇살 광선, 이끼 바닥 |

## 2. 구조

```
src/components/
  greenhouse/  GreenhouseBackground (6개 깊이 레이어 SVG), DustMotes, svg-kit
  selly/       Selly (floater → jumper → breather 레이어), SellyBody, SellyFace, SellyEffects
  home/        HomeScreen, TopBar, LevelCard, SpeechBubble, ActionDock, CareSheet, GrassMound
  breathing/   useBreathingSession (rAF, 4s/4s, 60s), BreathingControls, BreathingSession
  layout/      MobileFrame, BottomNav
  screens/     RecordScreen(임시 UI), ComingSoon, SubPage
src/lib/       selly-store (레벨/경험치, 반응 이벤트, 호흡 MotionValue), assets (에셋 슬롯)
```

모든 텍스트·버튼·캐릭터·이펙트는 독립 컴포넌트입니다. 배경 이미지 위에 투명 버튼을 얹은 방식이 아닙니다.

## 3. 구현된 상호작용

- **Idle**: 천천히 떠오르기, 숨쉬듯 늘어나고 줄어드는 몸, 잎 흔들림, 무작위 눈 깜빡임(가끔 두 번)
- **Greeting**: 접속 시 "오늘도 잘 쉬어가고 있지? ♡" + 인사 동작
- **Touch**: 찌그러짐 → 점프 → 착지 바운스, 웃는 얼굴, 반짝임, 대사 순환, 경험치 +1
- **호흡하기**: 4초 들숨 / 4초 날숨 / 1분. 셀리 크기·잎 벌어짐·후광이 호흡에 맞춰 움직임. 일시정지·재개·종료, 완료 시 +20
- **셀리 돌보기**: 물 주기(물방울 → 잎이 쫑긋), 햇빛 주기(따뜻한 빛), 쓰다듬기(하트)
- **내비게이션**: 홈 / 기록(임시 기록 UI, 저장하지 않음) / 캘린더·리포트(준비 중 화면)
- `prefers-reduced-motion` 지원

## 4. 에셋

원본 아트는 `assets-src/`에 있고, `scripts/extract-assets.py`로 웹용 에셋을 만듭니다.

```bash
pip install pillow numpy opencv-python-headless
python3 scripts/extract-assets.py
```

| 결과물 | 처리 |
| --- | --- |
| `public/assets/selly/selly-body.png` | 캐릭터 시트의 메인 포즈를 알파로 분리, 반투명 글로우 배경 제거, **눈·입 인페인팅 제거**(볼 터치는 유지) |
| `public/assets/selly/selly-leaf-left/right.png` | 잎 두 장을 별도 레이어로 분리 → 흔들림, 호흡 시 벌어짐, 물 주기 반응 |
| `public/assets/greenhouse/greenhouse-bg.webp` | 온실 배경 (하단 흰 여백 제거) |
| `public/assets/greenhouse/grass-island.png` | 배경의 잔디 패치를 잘라 셀리가 앉는 자리로 사용 |

얼굴은 벡터 레이어(`SellyFace`)로 그 위에 올려 눈 깜빡임과 표정(기본/웃음/편안함)을 유지합니다.
스크립트가 출력하는 얼굴 위치·잎 회전축 값은 `src/lib/assets.ts`에 들어 있습니다.
슬롯을 `null`로 바꾸면 벡터 대체 그래픽으로 돌아갑니다.
다음 단계에서 3D(React Three Fiber)로 바꿀 때는 `SellyBody`만 교체하면 됩니다.

![flows](docs/phase1-flows.png)
![screens](docs/phase1-screens.png)
