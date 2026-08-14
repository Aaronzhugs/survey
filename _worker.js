// Cloudflare Pages _worker.js - 代理腾讯云函数
// 处理 /api/submit 和 /api/qr 请求
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 只处理 /api/ 路径，其他请求透传给静态文件
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const funcName = url.pathname.replace('/api/', '');

    // 尝试多个腾讯云函数调用地址格式
    const candidates = [
      // 格式1: 标准云函数公网访问（无 serviceId）
      'https://cloud1-d7g29ulf838dcd730.ap-shanghai.app.tcloudbase.com/' + funcName,
      // 格式2: 带完整路径
      'https://cloud1-d7g29ulf838dcd730-1464246909.ap-shanghai.app.tcloudbase.com/' + funcName,
      // 格式3: tcb.qcloud.la 域名
      'https://cloud1-d7g29ulf838dcd730.tcb.qcloud.la/' + funcName,
    ];

    // 处理 OPTIONS 预检请求
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

    // 逐个尝试候选地址
    for (const targetUrl of candidates) {
      try {
        const init = {
          method: request.method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (reqBody) init.body = reqBody;

        const resp = await fetch(targetUrl, init);
        const contentType = resp.headers.get('content-type') || '';

        // 只接受 JSON 响应，跳过 HTML 错误页
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
          const data = await resp.json();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
        // 如果返回 HTML，继续试下一个地址
      } catch (e) {
        // 网络错误，继续试下一个
        continue;
      }
    }

    // 所有地址都失败
    return new Response(JSON.stringify({ 
      error: '无法连接到腾讯云函数，请检查函数公网访问是否开启',
      tried: candidates 
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
