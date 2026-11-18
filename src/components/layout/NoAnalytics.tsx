/** Toss build stand-in for @vercel/analytics/next: no visit counting in Toss. */
export function Analytics(_props: { beforeSend?: unknown }) {
  void _props;
  return null;
}
