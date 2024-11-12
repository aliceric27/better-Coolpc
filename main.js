const { createApp, ref, onMounted} = Vue;

const app = createApp({
    setup() {
        const updataAPI = "https://pcbuybuy-api.aliceric27.workers.dev";
        const componentsData = ref(null);
        const error = ref(null);
        const loading = ref(true);
        const selectedComponents = ref({});
        const updateTime = ref(null);

        const processComponentData = (html, selector, componentType) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const select = doc.querySelector(selector);
            const data = [];
            let currentColorGroup = 0;

            if (!select) {
                console.error(`找不到 ${componentType} 的選擇器`);
                return null;
            }

            // 處理所有子元素
            select.childNodes.forEach(node => {
                if (node.nodeName === 'OPTGROUP') {
                    // 更新顏色組
                    currentColorGroup = (currentColorGroup % 4) + 1;
                    
                    // 添加組標題
                    data.push({
                        id: `group_${node.label}`,
                        name: node.label,
                        price: null,
                        isGroup: true,
                        colorGroup: currentColorGroup
                    });
                    
                    // 處理組內的選項
                    node.querySelectorAll('option').forEach(option => {
                        const value = option.value;
                        if (value === '0' || !value) return;

                        const text = option.textContent;
                        const priceMatch = text.match(/\$([0-9,]+)/);
                        const price = priceMatch ? parseInt(priceMatch[1].replace(',', '')) : null;

                        data.push({
                            id: value,
                            name: text.split(',')[0].trim(),
                            price: price,
                            isGroup: false,
                            colorGroup: currentColorGroup
                        });
                    });
                } else if (node.nodeName === 'OPTION') {
                    const value = node.value;
                    if (value === '0' || !value) return;

                    const text = node.textContent;
                    const priceMatch = text.match(/\$([0-9,]+)/);
                    const price = priceMatch ? parseInt(priceMatch[1].replace(',', '')) : null;

                    data.push({
                        id: value,
                        name: text.split(',')[0].trim(),
                        price: price,
                        isGroup: false,
                        colorGroup: 0  // 非組內選項不設置顏色
                    });
                }
            });
            return { [componentType]: data };
        };

        const fetchData = async () => {
            try {
                loading.value = true;
                error.value = null;
                const apiTime = await checkTime();
                const localTime = localStorage.getItem('updateTime');
                
                if (!apiTime || apiTime !== localTime) {
                    // API時間與本地時間不符,需要更新資料
                    const response = await fetch(`${updataAPI}/main`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const updateTimeText = doc.querySelector('#Mdy').innerText;
                    const dateTimeMatch = updateTimeText.match(/\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2}/);
                    
                    updateTime.value = dateTimeMatch ? `${dateTimeMatch[0]}` : '更新時間格式錯誤';
                    localStorage.clear();
                    localStorage.setItem('updateTime', updateTime.value);
                    await updateData(updateTime.value, doc, html);
                } else {
                    // API時間與本地時間相符,優先使用local資料
                    updateTime.value = localTime;
                    const localData = localStorage.getItem('componentsData');
                    if (localData) {
                        componentsData.value = JSON.parse(localData);
                    } else {
                        const data = await getDatafromKV();
                        localStorage.setItem('componentsData', JSON.stringify(data));
                        componentsData.value = data;
                    }
                }
            } catch (err) {
                error.value = err.message;
                console.error('Error fetching data:', err);
            } finally {
                loading.value = false;
            }
        };

        const checkTime =  async()=>{
            const response = await fetch(`${updataAPI}/updatetime`, {method: 'GET'});
            if(!response.ok) {
                return false;
            }
            const data = await response.text();
            return data;
        }

        const updateData  = async(updatetime, doc, html)=>{
            const response = await fetch(`${updataAPI}/updatetime`, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: updatetime
            });
            try{
                const categories = doc.querySelectorAll('.t');
                const allData = [];    
                for (let i = 0; i < categories.length; i++) {
                    const componentType = categories[i].textContent.trim();
                    const selector = `#tbdy > tr:nth-child(${i+1}) > td:nth-child(3) > select`;
                    const componentData = processComponentData(html, selector, componentType);
                    if(componentData!==null){
                    allData.push({
                        title: componentType,
                        data: componentData[componentType]
                        });
                    }
                }
                const jsonData = JSON.stringify(allData);

                await fetch(`${updataAPI}/setDataToKV`, {method: 'POST', body: jsonData});
                
                componentsData.value = allData;
            } catch (err) {
                error.value = err.message;
                console.error('Error fetching data:', err);
            } finally {
                loading.value = false;
            }
        }

        const getDatafromKV = async()=>{
            const response = await fetch(`${updataAPI}/getDatafromKV`, {method: 'GET'});
            if(!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data;
        }

        onMounted(() => {
            fetchData();
        });

        // 獲取組件的所有選擇
        const getComponentSelections = (componentTitle) => {
            if (!selectedComponents.value[componentTitle]) {
                selectedComponents.value[componentTitle] = [{value: null}];
            }
            return selectedComponents.value[componentTitle];
        };

        // 添加新的選擇欄位
        const addSelection = (componentTitle) => {
            selectedComponents.value[componentTitle].push({value: null});
        };

        // 移除選擇欄位
        const removeSelection = (componentTitle, index) => {
            selectedComponents.value[componentTitle].splice(index, 1);
        };

        // 處理選擇變更
        const handleSelectionChange = (componentTitle, index) => {
            // 可以在這裡添加額外的邏輯
        };

        // 計算單個組件的總金額
        const calculateComponentTotal = (componentTitle) => {
            const selections = selectedComponents.value[componentTitle] || [];
            return selections.reduce((total, selection) => {
                return total + (selection.value?.price || 0);
            }, 0);
        };

        // 計算所有組件的總金額
        const calculateGrandTotal = () => {
            if (!componentsData.value) return 0;
            
            return componentsData.value.reduce((total, component) => {
                return total + calculateComponentTotal(component.title);
            }, 0);
        };

        return {
            componentsData,
            error,
            loading,
            selectedComponents,
            updateTime,
            getComponentSelections,
            addSelection,
            removeSelection,
            handleSelectionChange,
            calculateComponentTotal,
            calculateGrandTotal
        };
    }
});

// 使用 Element Plus
app.use(ElementPlus);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.mount('#app');