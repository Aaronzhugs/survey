// Cloudflare Pages _worker.js - 代理腾讯云函数（调试版）
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 只处理 /api/ 路径，其他请求透传给静态文件
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const funcName = url.pathname.replace('/api/', '');

    // OPTIONS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const reqBody = request.method === 'POST' ? await request.text() : null;

    // 用格式2（带serviceId的那个）——之前测试这个能拿到JSON响应
    const targetUrl = 'https://cloud1-d7g29ulf838dcd730-1464246909.ap-shanghai.app.tcloudbase.com/' + funcName;

    try {
      const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };
      if (reqBody) init.body = reqBody;

      const resp = await fetch(targetUrl, init);
      
      // 读取原始响应（不管是什么格式）
      const respText = await resp.text();
      const contentType = resp.headers.get('content-type') || '';

      // 把腾讯云的原始状态码、内容类型、响应体全部返回，方便调试
      return new Response(JSON.stringify({
        _debug: {
          targetUrl,
          tcbStatus: resp.status,
          tcbContentType: contentType,
          tcbBody: respText.substring(0, 2000), // 截断防止太大
        }
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: e.message,
        targetUrl 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
