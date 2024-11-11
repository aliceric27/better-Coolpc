export default {
  async scheduled(event, env, ctx) {
    console.log(event.scheduledTime)
    const url = "https://www.coolpc.com.tw/evaluate.php"
    await updateDataToKV(url, env);
    async function updateDataToKV(url, env) {
      // 获取原始HTML
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
      const allData = [];
      let currentCategory = null;
    
      // 创建HTML重写器
      const rewriter = new HTMLRewriter()
        // 处理类别标题
        .on('.t', {
          element(element) {
            currentCategory = {
              title: element.textContent.trim(),
              data: []
            };
            allData.push(currentCategory);
          }
        })
        // 处理select元素
        .on('select', {
          element(element) {
            if (!currentCategory) return;
            
            let currentColorGroup = 0;
            const data = [];
    
            // 处理optgroup和option
            element.onEndTag(() => {
              if (data.length > 0) {
                currentCategory.data = data;
              }
            });
          }
        })
        // 处理optgroup
        .on('optgroup', {
          element(element) {
            if (!currentCategory) return;
            
            const label = element.getAttribute('label');
            currentColorGroup = (currentColorGroup % 4) + 1;
            
            currentCategory.data.push({
              id: `group_${label}`,
              name: label,
              price: null,
              isGroup: true,
              colorGroup: currentColorGroup
            });
          }
        })
        // 处理option
        .on('option', {
          element(element) {
            if (!currentCategory) return;
    
            const value = element.getAttribute('value');
            if (value === '0' || !value) return;
    
            const text = element.textContent;
            const priceMatch = text.match(/\$([0-9,]+)/);
            const price = priceMatch ? parseInt(priceMatch[1].replace(',', '')) : null;
    
            currentCategory.data.push({
              id: value,
              name: text.split(',')[0].trim(),
              price: price,
              isGroup: false,
              colorGroup: currentColorGroup || 0
            });
          }
        });
    try{
 // 转换响应
 const transformedResponse = rewriter.transform(response);
 await transformedResponse.text(); // 需要等待转换完成

 // 将数据存储到KV
 await env.pcbuydata.put('pcbuydata', JSON.stringify(allData));
 
 // 更新时间戳
 const timestamp = new Date().toISOString();
 await env.pcbuydata.put('lastUpdateTime', timestamp);
 console.log('Update time stored successfully:', timestamp);
    }catch(error){
      console.log(error)
    }
    }


  },
  async fetch(request, env, ctx, ) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': 'Content-Type',       // 允許 Content-Type 標頭
      'Content-Type': 'text/html;charset=utf-8',
    };

    const JSONcorsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*', 
      'Access-Control-Allow-Headers': 'Content-Type',       // 允許 Content-Type 標頭
      'Content-Type': 'application/json;charset=utf-8',
    };
    const url = new URL(request.url);

    if(request.method === 'OPTIONS') {
      return new Response('', { headers:corsHeaders })
    }
    if (request.method === 'GET') {

      if (url.pathname === '/main') {
        try {
          // 檢查緩存是否存在
          const cachedContent = await env.pcbuydata.get("mainPageCache");
          const cacheTime = await env.pcbuydata.get("mainPageCacheTime");
          const now = Date.now();
          
          // 如果緩存存在且未過期（30分鐘），直接返回
          if (cachedContent && cacheTime && (now - parseInt(cacheTime)) < 1800000) {
            return new Response(cachedContent, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/html; charset=utf-8',
                'X-Cache': 'HIT'
              }
            });
          }
    
          // 如果沒有緩存或已過期，從原始網站獲取
          const response = await fetch('https://www.coolpc.com.tw/evaluate.php', {
            cf: {
              // 啟用 Cloudflare 的自動編碼轉換
              cacheTtl: 300,
              cacheEverything: true,
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            }
          });
    
          // 使用 stream 來處理回應
          const reader = response.body.getReader();
          const chunks = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          // 合併 chunks 並解碼
          const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
          }
          
          const text = new TextDecoder('big5').decode(concatenated);
          
          // 儲存到 KV
          ctx.waitUntil(Promise.all([
            env.pcbuydata.put("mainPageCache", text),
            env.pcbuydata.put("mainPageCacheTime", now.toString())
          ]));
    
          return new Response(text, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/html; charset=utf-8',
              'X-Cache': 'MISS'
            }
          });
        } catch (error) {
          // 如果發生錯誤但有緩存，返回緩存
          if (cachedContent) {
            return new Response(cachedContent, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/html; charset=utf-8',
                'X-Cache': 'STALE'
              }
            });
          }
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
          });
        }
      }
      }

      if(url.pathname === '/updatetime'){
       // 取得 pcbuyupdatetime 資料
        try {
          const data = await env.pcbuydata.get("lastUpdateTime");
          if (data) {
            return new Response(data, { status: 200 , headers: corsHeaders });
          } else {
            return new Response("尚未有更新記錄。", { status: 404, headers: corsHeaders });
          }
        } catch (err) {
          return new Response(`取得資料失敗：${err}`, { status: 500, headers: corsHeaders });
        }
      }

      if(url.pathname === '/getDatafromKV'){
        // 取得 pcbuyupdatetime 資料
         try {
           const data = await env.pcbuydata.get("pcbuydata");
           if (data) {
             return new Response(data, { status: 200 , headers: JSONcorsHeaders });
           } else {
             return new Response("尚未有更新記錄。", { status: 404, headers: corsHeaders });
           }
         } catch (err) {
           return new Response(`取得資料失敗：${err}`, { status: 500, headers: corsHeaders });
         }
       }  
     else if (request.method === 'POST') {

      if(url.pathname === '/updatetime'){
              // 更新 pcbuyupdatetime 資料
      try {
        const data = await request.text();
        if (data) {
          await env.pcbuydata.put("lastUpdateTime", data);
          return new Response('更新時間已成功儲存到 KV 中', { status: 200, headers: corsHeaders });
        } else {
          return new Response("請求資料格式錯誤，缺少 updateTime 欄位", { status: 400, headers: corsHeaders });
        }
  
      } catch (err) {
        return new Response(`資料儲存失敗：${err}`, { status: 500, headers: corsHeaders });
      }

      }

      if(url.pathname === '/setDataToKV'){
        try {
          const data = await request.json();
          const jsonString = JSON.stringify(data);
          if (jsonString) {
            await env.pcbuydata.put("pcbuydata", jsonString);
            return new Response('完整資料已成功儲存到 KV 中', { status: 200, headers: corsHeaders });
          } else {
            return new Response("請求資料格式錯誤", { status: 400, headers: corsHeaders });
          }
    
        } catch (err) {
          return new Response(`資料儲存失敗：${err}`, { status: 500, headers: corsHeaders });
        }
      }
  
    }
    else {
      // 若路徑或方法不符合，回傳 405 Method Not Allowed
      return new Response("方法不允許", { status: 405, headers: corsHeaders });
    }
  },
};