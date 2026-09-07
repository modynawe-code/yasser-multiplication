const VOICE_MODEL='xai/grok-tts';
const VOICE_ID='ara';
const VOICE_LANGUAGE='ar-SA';
const MAX_TEXT_LENGTH=280;

export const NATURAL_TTS_BACKEND=Object.freeze({
  model:VOICE_MODEL,
  voiceId:VOICE_ID,
  language:VOICE_LANGUAGE,
  maxTextLength:MAX_TEXT_LENGTH
});

export function normalizeVoiceRequest(body){
  const text=String(body?.text||'').replace(/\s+/g,' ').trim();
  if(!text||text.length>MAX_TEXT_LENGTH)return null;
  return Object.freeze({text,voiceId:VOICE_ID,language:VOICE_LANGUAGE});
}

function audioUrlFromResult(result){
  return String(result?.result?.audio||result?.audio||'').trim();
}

export async function handleVoiceRequest({request,env,auth,readJson,respond,corsHeaders}){
  const url=new URL(request.url);
  if(url.pathname!=='/v1/voice/synthesize'||request.method!=='POST')return null;
  if(!auth)return respond(401,{error:'unauthorized'});

  const parsed=normalizeVoiceRequest(await readJson(request));
  if(!parsed)return respond(400,{error:'invalid_voice_text'});
  if(!env.AI?.run)return respond(503,{error:'voice_service_unavailable'});

  try{
    const generated=await env.AI.run(VOICE_MODEL,{
      text:parsed.text,
      voice_id:VOICE_ID,
      language:VOICE_LANGUAGE,
      text_normalization:true,
      output_format:{codec:'mp3',sample_rate:44100,bit_rate:128000}
    });
    const audioUrl=audioUrlFromResult(generated);
    if(!audioUrl)return respond(502,{error:'voice_generation_failed'});

    const upstream=await fetch(audioUrl);
    if(!upstream.ok)return respond(502,{error:'voice_audio_unavailable'});
    const audio=await upstream.arrayBuffer();
    return new Response(audio,{
      status:200,
      headers:{
        'content-type':upstream.headers.get('content-type')||'audio/mpeg',
        'cache-control':'private, max-age=86400',
        ...corsHeaders(request,env)
      }
    });
  }catch{
    return respond(502,{error:'voice_generation_failed'});
  }
}
