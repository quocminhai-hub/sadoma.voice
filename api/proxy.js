export default async function handler(req, res) {
  let targetPath = req.query.url;
  
  if (!targetPath) {
    return res.status(400).json({ 
      error: "Missing url parameter", 
      reqUrl: req.url,
      query: req.query 
    });
  }

  // Vercel parses query string into req.query. We need to reconstruct it except for 'url'.
  const queryParams = new URLSearchParams(req.query);
  queryParams.delete('url');
  const qs = queryParams.toString();
  
  let targetUrl = 'https://unmixr.com/api' + targetPath;
  if (qs) {
    targetUrl += (targetPath.includes('?') ? '&' : '?') + qs;
  }

  try {
    const options = {
      method: req.method,
      headers: {}
    };

    if (req.headers.authorization) {
      options.headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['content-type']) {
      options.headers['Content-Type'] = req.headers['content-type'];
    }

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    const contentType = response.headers.get('content-type') || '';
    
    res.setHeader('Content-Type', contentType);
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const buffer = await response.arrayBuffer();
      res.status(response.status).send(Buffer.from(buffer));
    }
  } catch (err) {
    res.status(500).json({ error: err.message, targetUrl });
  }
}
