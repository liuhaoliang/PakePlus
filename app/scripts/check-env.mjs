#!/usr/bin/env node
// 打印「支付宝第三方纯 H5」能力矩阵 + 一段可粘贴进目标页面控制台的探针。
// 用途：开工前对齐"什么能用/不能用"；真机核对环境。
console.log('=== 支付宝第三方纯 H5 能力矩阵（公网核实,源 opendocs.alipay.com）===');
const rows = [
  ['手机网站支付 alipay.trade.wap.pay','可用','/open/203/107091 服务端生成URL跳转,无需前端SDK'],
  ['OAuth 网页授权/获取用户信息','可用','/mini/02xtl8 服务端 publicAppAuthorize 跳转;可选 ap.getAuthCode'],
  ['PC/H5 唤起支付宝(浏览器→App)','可用','/open/02zlo5 仅服务端SDK + alipays scheme'],
  ['网页&移动应用应用类型','可用','/open/03lo16 服务端接口(支付/资金/营销/安全)'],
  ['小程序内嵌H5(web-view)','可用(变形态)','/mini/tool/h5 想要宿主能力可走此路,H5不再独立被收录'],
  ['ap.getAuthCode (H5半屏授权)','可选(授权增强)','/mini/02xtl8 /open/01zsdu;默认用服务端跳转'],
  ['ap.tradePay（H5前端支付）','勿用/未确认','H5支付走服务端 alipay.trade.wap.pay;ap.tradePay公网只见my.tradePay'],
  ['pushWindow/popWindow 多WebView','不可用','opendocs 0命中;属小程序/私有'],
  ['setTitle 原生标题栏','不可用','用 HTML <title>'],
  ['setShareContent 自定义分享','不可用','外部用OG;App内用URL+scheme'],
  ['私有RPC网关/my.*/离线包/客户端开关','不可用','私有基建'],
  ['Service Worker(WKWebView/Android WebView)','待真机验证','无官方文档'],
];
for (const [k,v,s] of rows) console.log(`- ${k.padEnd(30)}${v.padEnd(12)}${s}`);

console.log('\n=== 浏览器探针(粘贴进目标页面 Console,真机核对) ===');
console.log(`(function probe(){
  var ua = navigator && navigator.userAgent || '';
  var inApp = /AlipayClient|AliApp|Alipay/i.test(ua);
  var hasBridge = typeof window.AlipayJSBridge !== 'undefined';
  console.log('UA:', ua);
  console.log('inAlipay:', inApp);
  console.log('AlipayJSBridge present:', hasBridge); // 存在不代表容器JSAPI对第三方可用
  console.log('ServiceWorker supported:', ('serviceWorker' in navigator));
  console.log('localStorage:', (function(){try{localStorage.setItem('__p_','1');localStorage.removeItem('__p_');return 'OK';}catch(e){return 'ERR '+e.message;}})());
  console.log('viewport:', document.querySelector('meta[name=viewport]') && document.querySelector('meta[name=viewport]').content);
  console.log('title:', document.title);
  return {inApp, hasBridge};
})();`);
