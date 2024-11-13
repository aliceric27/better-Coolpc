export default {
  async scheduled(event, env, ctx) {
    console.log(event.scheduledTime)
    const url = "https://www.coolpc.com.tw/evaluate.php"
  //   await getUpdateTime(url, env);

    await getUpdateTime(url, env);
    async function getUpdateTime(url, env){
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
        await env.pcbuydata.put("lastUpdateTime", getTime(updateTime));
        console.log("Update time stored successfully:", getTime(updateTime));
      } else {
        // 格式錯誤時，僅記錄錯誤日誌，不更新 KV
        console.log("Update time format error");
      }
    }


    function getTime(time){
      return new Date(time).getTime();
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
          const currentTime = await env.pcbuydata.get("lastUpdateTime");
           const data = await env.pcbuydata.get(`pcbuydata-${currentTime}`);
           if (data) {
             return new Response(data, { status: 200 , headers: JSONcorsHeaders });
           } else{
            return new Response("請求資料格式錯誤", { status: 400, headers: corsHeaders });
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
          const data = await request.json(); // data 已經是解析後的物件
          if (data && data.time && data.data) {
            const list = await env.pcbuydata.list({prefix: 'pcbuydata-'});
            for(const key of list.keys){
                await env.pcbuydata.delete(key.name);
            }
            await env.pcbuydata.put('lastUpdateTime', data.time);
            // 將 data.data 轉換為字串後再存入
            await env.pcbuydata.put(`pcbuydata-${data.time}`, JSON.stringify(data.data));
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
  }

};