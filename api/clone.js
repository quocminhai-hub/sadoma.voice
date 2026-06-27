export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = 'https://unmixr.com/api/v1/clone-voice/';

  try {
    const options = {
      method: 'POST',
      headers: {
        'Authorization': req.headers.authorization
      },
      body: req,
      duplex: 'half'
    };

    if (req.headers['content-type']) {
      options.headers['Content-Type'] = req.headers['content-type'];
    }

    const response = await fetch(targetUrl, options);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Clone Voice Proxy Error:', err);
    res.status(500).json({ error: err.message, targetUrl });
  }
}
