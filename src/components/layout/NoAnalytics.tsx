/** Toss build stand-in for @vercel/analytics(/next): no Vercel analytics in Toss. */
export function Analytics(_props: { beforeSend?: unknown }) {
  void _props;
  return null;
}
export function track(_name: string, _props?: unknown) {
  void _name;
  void _props;
}
