// Cloudflare Pages Functions - 代理腾讯云函数
// 处理 /api/submit 和 /api/qr 请求
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 只处理 /api/ 路径
  if (!url.pathname.startsWith('/api/')) {
    return new Response('Not Found', { status: 404 });
  }

  const funcName = url.pathname.replace('/api/', '');
  
  // 腾讯云函数 HTTP 访问地址
  const targetUrl = `https://cloud1-d7g29ulf838dcd730-1464246909.ap-shanghai.app.tcloudbase.com/${funcName}`;

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

  try {
    const init = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-CloudBase-EnvId': 'cloud1-d7g29ulf838dcd730',
      },
    };

    if (request.method === 'POST') {
      init.body = await request.text();
    }

    const response = await fetch(targetUrl, init);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
