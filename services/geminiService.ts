
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Highlight, TermQueryResponse } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const analyzeTranscript = async (transcript: string): Promise<Highlight[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `基于以下播客文字稿，提取核心观点、关键数据和精彩金句。
    必须返回一个 JSON 数组，每个对象包含 "type" (VIEWPOINT, DATA, QUOTE), "content" (原文内容), 和 "timestamp" (该内容在音频中出现的大致秒数)。
    注意：文字稿中可能带有 [mm:ss] 格式的时间戳，请利用它们来确定准确的 timestamp。
    
    文字稿内容:
    ${transcript}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            content: { type: Type.STRING },
            timestamp: { type: Type.NUMBER }
          },
          required: ["type", "content", "timestamp"]
        }
      }
    }
  });

  try {
    const json = JSON.parse(response.text || "[]");
    return json.map((h: any, index: number) => ({
      ...h,
      id: `h-${index}-${Date.now()}`
    }));
  } catch (e) {
    console.error("Gemini 分析失败", e);
    return [];
  }
};

export const queryTerminology = async (term: string): Promise<TermQueryResponse> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请为名词 "${term}" 提供权威定义，并提供 3-5 个高质量学习链接（优先知乎、维基百科、官方文档）。`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text || "未找到定义";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const links = groundingChunks
    .filter(chunk => chunk.web)
    .map(chunk => ({
      title: chunk.web?.title || "参考链接",
      url: chunk.web?.uri || ""
    }))
    .slice(0, 5);

  return {
    definition: text,
    links: links.length > 0 ? links : [
      { title: `在 Google 搜索 ${term}`, url: `https://www.google.com/search?q=${encodeURIComponent(term)}` }
    ]
  };
};

export const performRealTranscription = async (url: string): Promise<{ transcript: string, title: string, duration: number, audioUrl: string }> => {
  const ai = getAI();
  
  // 1. Fetch XYZ Page via Proxy
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const pageResponse = await fetch(proxyUrl);
  if (!pageResponse.ok) throw new Error("无法连接到代理服务器，请稍后重试");
  
  const pageData = await pageResponse.json();
  const html = pageData.contents;
  
  // 2. Extract Data from window.__INITIAL_STATE__ using Regex (more robust than DOM parsing)
  let title = "播客节目";
  let audioUrl = "";
  let duration = 0;

  try {
    // Look for the state object in the HTML
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s) || 
                       html.match(/window\.REDUX_STATE\s*=\s*({.*?});/s);
    
    if (stateMatch) {
      const state = JSON.parse(stateMatch[1]);
      const episode = state.episode || state.props?.pageProps?.episode;
      if (episode) {
        title = episode.title || title;
        audioUrl = episode.mediaUrl || episode.audioUrl;
        duration = episode.duration || 0;
      }
    }

    // Fallback if regex fails to find full state
    if (!audioUrl) {
      const audioMatch = html.match(/"mediaUrl":"(.*?)"/) || html.match(/"audioUrl":"(.*?)"/);
      if (audioMatch) audioUrl = audioMatch[1].replace(/\\u002F/g, '/');
      
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) title = titleMatch[1].replace(' - 小宇宙', '');
    }
  } catch (e) {
    console.warn("解析页面状态失败，尝试备选方案", e);
  }

  if (!audioUrl) {
    // Final fallback to meta tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    audioUrl = doc.querySelector('meta[property="og:audio"]')?.getAttribute('content') || "";
  }

  if (!audioUrl) throw new Error("未能从小宇宙页面解析出音频地址，该节目可能已下架或需要登录");

  // 3. Download Audio
  // Note: For very large files, this might take time.
  const audioResp = await fetch(audioUrl);
  if (!audioResp.ok) throw new Error("音频文件下载失败");
  const audioBlob = await audioResp.blob();
  const base64Audio = await blobToBase64(audioBlob);

  // 4. Gemini Transcription with Timestamp Request
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: audioBlob.type || "audio/mpeg",
          data: base64Audio
        }
      },
      { 
        text: `你是专业的播客记录员。请听这段音频，并生成详细的文字稿。
        要求：
        1. 每隔约 30 秒或在段落切换时，插入一次 [mm:ss] 格式的时间戳。
        2. 识别不同的说话者（如果可能，用 说话者A: 形式）。
        3. 确保文字准确，特别是专有名词。
        4. 只输出转录的文字稿内容，不要有其他废话。` 
      }
    ]
  });

  const transcript = response.text || "转录结果为空";

  return {
    title,
    duration,
    audioUrl,
    transcript
  };
};
