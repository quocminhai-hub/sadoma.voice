export default async function handler(req, res) {
  const urlParam = req.url.split('?url=')[1] || '';
  const targetUrl = 'https://unmixr.com/api' + urlParam;
  
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
      // Vercel parses JSON body automatically
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
    res.status(500).json({ error: err.message });
  }
}
