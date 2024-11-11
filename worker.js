export default {
    async scheduled(event, env, ctx) {
      console.log(event.scheduledTime)
      const url = "https://www.coolpc.com.tw/evaluate.php"
      const response = await fetch(url)
      
      if (!response.ok) {
        console.log("Failed to fetch data");
        return;
      }
    
      let updateTime = null; // 用於存儲提取的更新時間
    
      // 使用 HTMLRewriter 處理頁面中的 #Mdy 元素，並提取 innerText
      await new HTMLRewriter()
        .on("#Mdy", {
          text(text) {
            const updateTimeText = text.text.trim();
            const dateTimeMatch = updateTimeText.match(/\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2}/);
            if (dateTimeMatch) {
              updateTime = dateTimeMatch[0];
            }
          }
        })
        .transform(response).text(); // 確保 HTMLRewriter 完成處理
    
      // 檢查 updateTime 是否符合格式
      if (updateTime) {
        // 如果符合格式的更新時間存在，將其存入 KV
        console.log('Success')
        await env.pcbuydata.put("lastUpdateTime", updateTime);
        console.log("Update time stored successfully:", updateTime);
      } else {
        // 格式錯誤時，僅記錄錯誤日誌，不更新 KV
        console.log("Update time format error");
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