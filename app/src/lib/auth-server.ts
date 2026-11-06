// OAuth 授权（服务端专用）——预留。
// 公网能力源：opendocs.alipay.com /mini/02xtl8（网页授权）、/open/02zl5（唤起）。
// 默认 publicAppAuthorize 服务端跳转拿 auth_code → alipay.system.oauth.token 换 uid。
// 本期 mock uid（localStorage 游客）；OAuth 链路只预留封装，不真配 AppId。

export function buildAuthorizeUrl(redirectUri: string): string {
  const appId = process.env.ALIPAY_APP_ID;
  if (!appId) return "";
  const params = new URLSearchParams({
    app_id: appId,
    scope: "auth_base",
    redirect_uri: redirectUri,
    state: "dandanniao",
  });
  return `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?${params.toString()}`;
}

/** mock 换 uid：真实环境用 auth_code 调 alipay.system.oauth.token */
export function mockExchangeUid(authCode: string | null): string {
  if (!authCode) return "u_guest";
  return `u_${authCode.slice(0, 8)}`;
}