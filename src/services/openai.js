export const generateUnmixrSpeech = async (text, voice, apiKey, vibe) => {
  let speed = vibe && vibe.speed ? vibe.speed : 1.0;
  
  let finalText = text;
  if (speed !== 1.0) {
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
    const audioUrl = data.url || data.audio_url || data.audio || data.data?.url || (typeof data.data === 'string' && data.data.startsWith('http') ? data.data : null);
    if (audioUrl && typeof audioUrl === 'string') {
      return audioUrl;
    } else {
      throw new Error("Lỗi API Unmixr: " + JSON.stringify(data));
    }
  } else {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
};

export const generateMinimaxSpeech = async (text, voice, apiKey, groupId, vibe) => {
  let speed = vibe && vibe.speed ? vibe.speed : 1.0;
  
  const payload = {
    model: "speech-01-turbo",
    text: text,
    stream: false,
    voice_setting: {
      voice_id: voice,
      speed: speed,
      vol: 1.0,
      pitch: 0
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: "mp3",
      channel: 1
    }
  };

  const response = await fetch(`/minimax-api/v1/t2a_v2?GroupId=${groupId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.base_resp?.status_msg || JSON.stringify(errorData));
    }
    throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
  }

  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (data.base_resp && data.base_resp.status_code === 0 && data.data && data.data.audio) {
      const hex = data.data.audio;
      const typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
      const blob = new Blob([typedArray], { type: 'audio/mpeg' });
      return URL.createObjectURL(blob);
    } else {
      throw new Error("Lỗi từ Minimax: " + (data.base_resp?.status_msg || JSON.stringify(data)));
    }
  } else {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
};

export const cloneMinimaxVoice = async (audioFile, apiKey, groupId, customPrefix = "clone") => {
  // BƯỚC 1: UPLOAD FILE LÊN MINIMAX
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('purpose', 'voice_clone');

  const uploadRes = await fetch(`/minimax-api/v1/files/upload?GroupId=${groupId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData,
  });

  const uploadContentType = uploadRes.headers.get('content-type') || '';
  if (!uploadRes.ok && !uploadContentType.includes('application/json')) {
    const text = await uploadRes.text();
    throw new Error(`Lỗi Upload API (${uploadRes.status}): ${text.substring(0, 100)}...`);
  }

  let uploadData;
  try {
    uploadData = await uploadRes.json();
  } catch (err) {
    throw new Error(`Lỗi parse JSON khi Upload file. URL API sai hoặc Server bảo trì.`);
  }

  if (!uploadData.base_resp || uploadData.base_resp.status_code !== 0) {
    throw new Error("Lỗi Upload Minimax: " + (uploadData.base_resp?.status_msg || JSON.stringify(uploadData)));
  }

  const fileId = uploadData.file?.file_id || uploadData.file_id || uploadData.data?.file_id;
  if (!fileId) {
    throw new Error("Không lấy được file_id từ Minimax: " + JSON.stringify(uploadData));
  }

  // BƯỚC 2: TẠO VOICE CLONE TỪ FILE VỪA UPLOAD
  const voiceId = `${customPrefix}_${Date.now()}`;
  const cloneRes = await fetch(`/minimax-api/v1/voice_clone?GroupId=${groupId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_id: fileId,
      voice_id: voiceId,
      noise_reduction: true
    }),
  });

  const cloneContentType = cloneRes.headers.get('content-type') || '';
  if (!cloneRes.ok && !cloneContentType.includes('application/json')) {
    const text = await cloneRes.text();
    throw new Error(`Lỗi Voice Clone API (${cloneRes.status}): ${text.substring(0, 100)}...`);
  }

  let cloneData;
  try {
    cloneData = await cloneRes.json();
  } catch (err) {
    throw new Error(`Lỗi parse JSON khi Clone. URL API sai hoặc Server bảo trì.`);
  }

  if (cloneData.base_resp && cloneData.base_resp.status_code === 0) {
    return cloneData.voice_id || cloneData.data?.voice_id || voiceId;
  } else {
    throw new Error("Lỗi Clone Minimax: " + (cloneData.base_resp?.status_msg || JSON.stringify(cloneData)));
  }
};
