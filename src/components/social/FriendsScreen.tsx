"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Copy, LogOut, MoreHorizontal, Pencil, Send, UserPlus, X } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { GIFT_INFO, GIFT_KINDS, GIFT_MESSAGES, type GiftKind } from "@/data/gifts";
import { useAppData } from "@/lib/data-store";
import { useToday } from "@/lib/date";
import { plantedFlowers } from "@/lib/garden";
import { readGame, updateGame } from "@/lib/game/gameStore";
import { encodeSnapshot } from "@/lib/share/snapshot";
import { addFriend, blockFriend, deleteMyAccount, listFriends, myProfile, sendGift, updateProfile, type Friend, type Profile } from "@/lib/social/api";
import { signInWithKakao, signOut, useSession } from "@/lib/social/useAuth";
import { useSelly } from "@/lib/selly-store";

const PENDING_KEY = "dear-selly:pending-invite";

export function FriendsScreen() {
  const session = useSession();
  return (
    <SubPage title="친구">
      {session === undefined ? <div className="h-[420px]" /> : session ? <SignedIn uid={session.user.id} kakaoName={kakaoNickname(session.user.user_metadata)} /> : <SignedOut />}
    </SubPage>
  );
}

function kakaoNickname(meta: Record<string, unknown> | undefined): string | null {
  const n = (meta?.name ?? meta?.nickname ?? meta?.full_name ?? meta?.user_name) as string | undefined;
  return n ? n.slice(0, 12) : null;
}

/* ───────────── signed out ───────────── */
function SignedOut() {
  const [busy, setBusy] = useState(false);
  // keep an invite code from the link across the Kakao round trip
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("add");
    if (code) {
      try {
        sessionStorage.setItem(PENDING_KEY, code);
      } catch {
        // ignore
      }
    }
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <section className="glass rounded-[26px] p-5 text-center">
        <p className="text-[18px] font-bold text-ink-700">친구의 셀리를 만나러 가요</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
          친구와 서로의 온실을 구경하고,
          <br />
          물이나 씨앗을 선물할 수 있어요.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const { error } = await signInWithKakao();
            if (error) setBusy(false);
          }}
          className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] text-[15px] font-bold text-[#191919] shadow-[0_8px_20px_-12px_rgba(120,100,0,0.6)] active:scale-[0.98] disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z" fill="#191919" />
          </svg>
          카카오로 시작하기
        </button>
      </section>
      <div className="rounded-2xl bg-white/55 px-4 py-3 text-[12px] leading-relaxed text-ink-500">
        <p className="font-bold text-ink-700">서버에 저장되는 것</p>
        <p>닉네임, 친구 초대 코드, 친구에게 보여줄 온실 모습, 친구 목록, 주고받은 선물</p>
        <p className="mt-1 font-bold text-ink-700">저장되지 않는 것</p>
        <p>기분·컨디션 기록, 생리주기, 걸음 수, 메모 — 이 기록은 지금처럼 이 기기에만 있어요.</p>
        <Link href="/privacy" className="mt-1 inline-block text-sage-700 underline underline-offset-4">
          개인정보 처리방침
        </Link>
      </div>
    </div>
  );
}

/* ───────────── signed in ───────────── */
function SignedIn({ uid, kakaoName }: { uid: string; kakaoName: string | null }) {
  const { showToast } = useSelly();
  const data = useAppData();
  const today = useToday();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [nick, setNick] = useState("");
  const [code, setCode] = useState("");
  const [shareFlowers, setShareFlowers] = useState(false);
  const [giftTo, setGiftTo] = useState<Friend | null>(null);
  const [menuFor, setMenuFor] = useState<Friend | null>(null);

  const refresh = useCallback(async () => {
    const [p, f] = await Promise.all([myProfile(uid), listFriends(uid)]);
    setProfile(p);
    setFriends(f);
    return p;
  }, [uid]);

  // first load: profile, Kakao nickname on first sign-in, pending invite
  useEffect(() => {
    let alive = true;
    (async () => {
      let p = await refresh();
      if (!alive || !p) return;
      setShareFlowers(!!readGame().shareFlowers);
      if (p.nickname === "셀리 친구" && kakaoName) {
        await updateProfile(uid, { nickname: kakaoName });
        p = await refresh();
      }
      let pending: string | null = null;
      try {
        pending = sessionStorage.getItem(PENDING_KEY) ?? new URLSearchParams(window.location.search).get("add");
        sessionStorage.removeItem(PENDING_KEY);
      } catch {
        pending = new URLSearchParams(window.location.search).get("add");
      }
      if (pending && pending !== p?.invite_code) {
        const name = await addFriend(pending);
        if (name) {
          showToast(`${name}님과 친구가 되었어요 🌿`);
          refresh();
        }
        window.history.replaceState(null, "", "/friends");
      }
    })();
    return () => {
      alive = false;
    };
  }, [uid, kakaoName, refresh, showToast]);

  // keep the greenhouse friends see up to date (flowers only if allowed)
  useEffect(() => {
    if (!profile || !today) return;
    const flowers = shareFlowers ? plantedFlowers(data, today).slice(-7).map((f) => ({ e: f.emotion, s: f.stage })) : [];
    const snap = encodeSnapshot({ level: data.progress.level, deco: readGame().deco ?? {}, flowers, tod: "day", msg: 0 });
    if (profile.greenhouse?.code !== snap) updateProfile(uid, { greenhouse: { code: snap } }).then((ok) => ok && setProfile((p) => (p ? { ...p, greenhouse: { code: snap } } : p)));
  }, [profile, shareFlowers, data, today, uid]);

  const inviteUrl = profile ? `${typeof window !== "undefined" ? window.location.origin : ""}/friends?add=${profile.invite_code}` : "";

  const shareInvite = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "디어셀리 친구 초대", text: "내 셀리랑 친구 할래? 🌿", url: inviteUrl });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast("초대 링크를 복사했어요");
    } catch {
      showToast("복사하지 못했어요");
    }
  };

  if (!profile) return <div className="glass h-40 animate-pulse rounded-[26px]" />;

  return (
    <div className="flex flex-col gap-3">
      {/* me */}
      <section className="glass rounded-[26px] p-4">
        <div className="flex items-center gap-2">
          {editing ? (
            <form
              className="flex flex-1 gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const v = nick.trim().slice(0, 12);
                if (!v) return;
                if (await updateProfile(uid, { nickname: v })) {
                  setProfile({ ...profile, nickname: v });
                  setEditing(false);
                }
              }}
            >
              <input
                autoFocus
                value={nick}
                maxLength={12}
                onChange={(e) => setNick(e.target.value)}
                aria-label="닉네임"
                className="h-10 min-w-0 flex-1 rounded-xl border border-[#e6dccb] bg-white px-3 text-[15px] text-ink-700 outline-none focus:border-sage-300"
              />
              <button type="submit" className="h-10 rounded-xl bg-sage-500 px-3 text-[13px] font-bold text-white">
                저장
              </button>
            </form>
          ) : (
            <>
              <p className="flex-1 text-[18px] font-bold text-ink-700">{profile.nickname}</p>
              <button
                type="button"
                aria-label="닉네임 바꾸기"
                onClick={() => {
                  setNick(profile.nickname);
                  setEditing(true);
                }}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-500 active:bg-sage-50"
              >
                <Pencil size={16} />
              </button>
            </>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3">
          <div className="flex-1">
            <p className="text-[11.5px] text-ink-500">내 초대 코드</p>
            <p className="text-[20px] font-bold tracking-[0.12em] tabular-nums text-ink-700">{profile.invite_code}</p>
          </div>
          <button
            type="button"
            aria-label="초대 코드 복사"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(profile.invite_code);
                showToast("초대 코드를 복사했어요");
              } catch {
                // ignore
              }
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-sage-50 text-sage-700"
          >
            <Copy size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={shareInvite}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[14.5px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(90,130,85,0.8)]"
        >
          <Send size={16} /> 초대 링크 보내기
        </button>
        <label className="mt-3 flex items-center justify-between gap-3 px-1">
          <span className="text-[12.5px] text-ink-500">친구에게 내 기분 꽃도 보여주기</span>
          <button
            type="button"
            role="switch"
            aria-checked={shareFlowers}
            aria-label="친구에게 내 기분 꽃도 보여주기"
            onClick={() => {
              const v = !shareFlowers;
              setShareFlowers(v);
              updateGame(() => ({ shareFlowers: v }));
            }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${shareFlowers ? "bg-sage-500" : "bg-[#e5ded2]"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${shareFlowers ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </label>
      </section>

      {/* add by code */}
      <form
        className="glass flex items-center gap-2 rounded-[22px] p-2 pl-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const c = code.trim();
          if (!c) return;
          const name = await addFriend(c);
          if (name) {
            showToast(`${name}님과 친구가 되었어요 🌿`);
            setCode("");
            refresh();
          } else showToast("코드를 다시 확인해 주세요");
        }}
      >
        <UserPlus size={18} className="shrink-0 text-sage-700" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 8))}
          placeholder="친구 초대 코드"
          aria-label="친구 초대 코드"
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] tracking-[0.08em] text-ink-700 outline-none placeholder:tracking-normal placeholder:text-ink-300"
        />
        <button type="submit" className="h-10 rounded-full bg-sage-500 px-4 text-[13.5px] font-bold text-white">
          추가
        </button>
      </form>

      {/* friends */}
      <SectionCard icon={<SproutLeafIcon />} title="친구" aside={<span className="text-[12px] tabular-nums text-ink-500">{friends?.length ?? 0}명</span>}>
        {!friends?.length ? (
          <p className="py-3 text-center text-[13px] leading-relaxed text-ink-500">
            아직 친구가 없어요.
            <br />
            초대 링크를 보내 셀리 친구를 만들어 보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-2xl bg-white/70 py-2 pl-4 pr-2">
                <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink-700">{f.nickname}</p>
                {f.greenhouse?.code && (
                  <Link href={`/visit#${f.greenhouse.code}`} className="rounded-full bg-sage-50 px-3 py-2 text-[12.5px] font-bold text-sage-700">
                    🏡 구경
                  </Link>
                )}
                <button type="button" onClick={() => setGiftTo(f)} className="rounded-full bg-[#fdf1f2] px-3 py-2 text-[12.5px] font-bold text-[#b9727b]">
                  🎁 선물
                </button>
                <button type="button" aria-label={`${f.nickname} 더보기`} onClick={() => setMenuFor(f)} className="grid h-9 w-8 place-items-center text-ink-300">
                  <MoreHorizontal size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="mt-1 flex items-center justify-center gap-4 text-[12.5px] text-ink-500">
        <button
          type="button"
          onClick={async () => {
            await signOut();
            showToast("로그아웃했어요");
          }}
          className="flex items-center gap-1.5"
        >
          <LogOut size={14} /> 로그아웃
        </button>
        <Link href="/privacy" className="underline underline-offset-4">
          개인정보 처리방침
        </Link>
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm("계정을 삭제할까요?\n친구 목록, 주고받은 선물, 닉네임이 서버에서 지워져요. 이 기기의 기록은 그대로 남아요.")) return;
            showToast((await deleteMyAccount()) ? "계정을 삭제했어요" : "삭제하지 못했어요. 잠시 후 다시 시도해 주세요");
          }}
          className="text-ink-300 underline underline-offset-4"
        >
          계정 삭제
        </button>
      </div>

      <GiftSheet friend={giftTo} onClose={() => setGiftTo(null)} />
      <FriendMenu
        friend={menuFor}
        onClose={() => setMenuFor(null)}
        onBlock={async (f) => {
          setMenuFor(null);
          if (await blockFriend(f.id)) {
            showToast(`${f.nickname}님과 친구를 끊었어요`);
            refresh();
          }
        }}
      />
    </div>
  );
}

/* ───────────── gift sheet ───────────── */
function GiftSheet({ friend, onClose }: { friend: Friend | null; onClose: () => void }) {
  const { showToast } = useSelly();
  const [kind, setKind] = useState<GiftKind>("water");
  const [msg, setMsg] = useState(0);
  const [busy, setBusy] = useState(false);
  return (
    <AnimatePresence>
      {friend && (
        <motion.div className="fixed inset-0 z-[70] flex items-end sm:absolute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-[rgba(52,44,32,0.32)]" />
          <motion.div
            role="dialog"
            aria-label={`${friend.nickname}에게 선물하기`}
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            className="relative mx-3 mb-[calc(env(safe-area-inset-bottom)+12px)] w-full rounded-[28px] bg-cream-50 p-5 shadow-[0_-12px_40px_-16px_rgba(80,60,40,0.5)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[17px] font-bold text-ink-700">{friend.nickname}에게 선물하기</p>
              <button type="button" onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-500">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="선물">
              {GIFT_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11.5px] ${kind === k ? "bg-white font-bold text-ink-700 shadow-[0_0_0_2px_#8faf91]" : "bg-white/60 text-ink-500"}`}
                >
                  <span className="text-[24px] leading-none">{GIFT_INFO[k].emoji}</span>
                  {GIFT_INFO[k].label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="한 마디">
              {GIFT_MESSAGES.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={msg === i}
                  onClick={() => setMsg(i)}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] ${msg === i ? "bg-sage-500 font-bold text-white" : "bg-white text-ink-500"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const r = await sendGift(friend.id, kind, msg);
                setBusy(false);
                if (r === "sent") {
                  showToast(`${friend.nickname}에게 ${GIFT_INFO[kind].label}을(를) 보냈어요 ${GIFT_INFO[kind].emoji}`);
                  onClose();
                } else if (r === "already") showToast("오늘은 이미 보냈어요. 다른 선물은 어때요?");
                else showToast("보내지 못했어요");
              }}
              className="mt-4 h-12 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white disabled:opacity-60"
            >
              보내기
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-300">같은 선물은 친구 한 명에게 하루 한 번 보낼 수 있어요</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FriendMenu({ friend, onClose, onBlock }: { friend: Friend | null; onClose: () => void; onBlock: (f: Friend) => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <AnimatePresence>
      {friend && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center px-8 sm:absolute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => {
              setConfirm(false);
              onClose();
            }}
            className="absolute inset-0 bg-[rgba(52,44,32,0.32)]"
          />
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative w-full max-w-[320px] rounded-[26px] bg-cream-50 p-5 text-center">
            <p className="text-[16px] font-bold text-ink-700">{friend.nickname}</p>
            {confirm ? (
              <>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-500">친구를 끊으면 서로의 온실을 볼 수 없고, 이 친구가 다시 초대 코드로 추가할 수 없어요.</p>
                <button type="button" onClick={() => onBlock(friend)} className="mt-4 h-11 w-full rounded-2xl bg-[#e3707e] text-[14px] font-bold text-white">
                  친구 끊기
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="mt-4 h-11 w-full rounded-2xl border border-[#f0cfd3] bg-[#fdf3f4] text-[14px] font-bold text-[#b4505e]">
                친구 끊기 · 차단
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setConfirm(false);
                onClose();
              }}
              className="mt-2 h-10 w-full text-[13.5px] text-ink-500"
            >
              취소
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
