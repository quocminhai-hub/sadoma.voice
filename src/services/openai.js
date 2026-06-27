export const generateSpeech = async (text, voice, apiKey, vibe) => {
  let speed = vibe && vibe.speed ? vibe.speed : 1.0;
  
  // Create payload. Unmixr API might support speaking_rate or speed directly,
  // or we can wrap the text in SSML to control prosody rate.
  // We'll try sending speaking_rate first (similar to speaking_volume in docs).
  // Some versions of their API also parse SSML if you pass XML tags.
  // Let's wrap in SSML if speed is not 1.0 to ensure the engine catches it, 
  // OR we can just pass the parameter. Let's pass the parameter `speaking_rate`.
  
  let finalText = text;
  if (speed !== 1.0) {
    // Wrap in SSML prosody tag to enforce speed change across most TTS engines
    finalText = `<speak><prosody rate="${speed}">${text}</prosody></speak>`;
  }

  const response = await fetch('/api/proxy?url=/v1/short-tts/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: finalText,
      voice_id: voice,
      language: "en-US",
      response_type: "url",
      speaking_rate: speed
    }),
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || JSON.stringify(errorData));
    }
    throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
  }

  if (contentType.includes('application/json')) {
    const data = await response.json();
    console.log("Unmixr JSON Response:", data);
    
    // Thử trích xuất URL theo nhiều cấu trúc có thể có của Unmixr
    const audioUrl = data.url || data.audio_url || data.audio || data.data?.url || (typeof data.data === 'string' && data.data.startsWith('http') ? data.data : null);
    
    if (audioUrl && typeof audioUrl === 'string') {
      return audioUrl;
    } else {
      // Nếu là JSON nhưng không tìm thấy URL, có thể API yêu cầu tham số khác hoặc trả về lỗi mềm
      throw new Error("API trả về thành công nhưng không tìm thấy URL âm thanh: " + JSON.stringify(data));
    }
  } else {
    // Nếu Content-Type không phải JSON, giả định đó là file âm thanh (audio/mpeg, audio/wav, v.v.)
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
};

export const cloneVoice = async (file, name, description, apiKey) => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('name', name);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch('/api/clone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      // Do not set Content-Type here, browser sets it with boundary for FormData automatically
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || data.status !== 'SUCCESS') {
    throw new Error(data.error || data.message || JSON.stringify(data));
  }

  return data;
};
