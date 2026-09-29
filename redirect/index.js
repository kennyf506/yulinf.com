// 舊網址 yulin.lighthousecc.tw 全部 301 轉到 yulinf.com，保留路徑與查詢字串
export default {
  fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(`https://yulinf.com${url.pathname}${url.search}`, 301);
  },
};
