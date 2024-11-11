const { createApp, ref, onMounted} = Vue;

const app = createApp({
    setup() {
        const updataAPI = "https://pcbuybuy-api.aliceric27.workers.dev";
        const componentsData = ref(null);
        const error = ref(null);
        const loading = ref(true);
        const selectedComponents = ref({});
        const updateTime = ref(null);

        const fetchData = async () => {
            try {
                loading.value = true;
                error.value = null;

                // 檢查 API 更新時間
                const apiTime = await checkTime();
                const localTime = localStorage.getItem('updateTime');

                // 更新本地資料
                const updateLocalData = async () => {
                    const data = await getDatafromKV();
                    localStorage.setItem('componentsData', JSON.stringify(data));
                    localStorage.setItem('updateTime', apiTime);
                    componentsData.value = data;
                    updateTime.value = apiTime;
                };

                // 如果 API 時間不存在或與本地時間不同,則更新資料
                if (!apiTime || apiTime !== localTime) {
                    if (!apiTime) {
                        updateTime.value = '更新時間格式錯誤';
                        return;
                    }
                    localStorage.clear();
                    await updateLocalData();
                } else {
                    // 使用本地快取資料
                    updateTime.value = localTime;
                    const localData = localStorage.getItem('componentsData');
                    if (localData) {
                        componentsData.value = JSON.parse(localData);
                    } else {
                        await updateLocalData();
                    }
                }
            } catch (err) {
                error.value = err.message;
                console.error('獲取資料錯誤:', err);
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
