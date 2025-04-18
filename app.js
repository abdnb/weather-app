/**
 * 增强版天气应用主逻辑
 */

// DOM元素
const elements = {
    // 通用元素
    citySearch: document.getElementById('city-search'),
    searchBtn: document.getElementById('search-btn'),
    useLocationBtn: document.getElementById('use-location'),
    refreshBtn: document.getElementById('refresh-btn'),
    toggleUnitBtn: document.getElementById('toggle-unit'),
    toggleThemeBtn: document.getElementById('toggle-theme'),
    themeIcon: document.getElementById('theme-icon'),
    loading: document.getElementById('loading'),
    weatherAnimationContainer: document.getElementById('weather-animation-container'),
    
    // 标准视图元素
    welcomeMsg: document.getElementById('welcome'),
    weatherInfo: document.getElementById('weather-info'),
    locationName: document.getElementById('location-name'),
    currentDate: document.getElementById('current-date'),
    currentTime: document.getElementById('current-time'),
    weatherIcon: document.getElementById('weather-icon'),
    temperature: document.getElementById('temperature'),
    weatherDescription: document.getElementById('weather-description'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    pressure: document.getElementById('pressure'),
    forecast: document.getElementById('forecast'),
    
    // 出门建议元素
    adviceContainer: document.getElementById('advice-container'),
    adviceContent: document.getElementById('advice-content'),
    
    // 通知元素
    notification: document.getElementById('notification'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    closeError: document.getElementById('close-error')
};

// 应用状态
const state = {
    unit: 'celsius', // 温度单位: celsius 或 fahrenheit
    theme: 'light', // 主题: light 或 dark
    currentLocation: null, // 当前位置: {lat, lon, name}
    lastCity: null, // 上次查询的城市
    currentWeather: null, // 当前天气数据
    forecast: null, // 天气预报数据
};

// 初始化应用
function initApp() {
    // 从本地存储加载设置
    loadSettings();
    
    // 绑定事件监听器
    bindEvents();
    
    // 显示欢迎信息
    showWelcomeMessage();
    
    // 开始实时时钟
    startRealtimeClock();
    
    // 尝试加载上次查询的城市天气
    if (state.lastCity) {
        searchWeatherByCity(state.lastCity);
    } else {
        // 不再自动获取位置，需要用户点击按钮
        hideLoading();
    }
}

// 从本地存储加载设置
function loadSettings() {
    const settings = getFromLocalStorage('enhanced-weather-settings');
    if (settings) {
        state.unit = settings.unit || 'celsius';
        state.lastCity = settings.lastCity || null;
        state.theme = settings.theme || 'light';
    }
    
    // 应用保存的主题
    applyTheme(state.theme);
}

// 保存设置到本地存储
function saveSettings() {
    saveToLocalStorage('enhanced-weather-settings', {
        unit: state.unit,
        lastCity: state.lastCity,
        theme: state.theme,
    });
}

// 绑定事件监听器
function bindEvents() {
    // 搜索按钮点击
    elements.searchBtn.addEventListener('click', () => {
        const city = elements.citySearch.value.trim();
        if (city) {
            searchWeatherByCity(city);
        }
    });
    
    // 输入框回车搜索
    elements.citySearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = elements.citySearch.value.trim();
            if (city) {
                searchWeatherByCity(city);
            }
        }
    });
    
    // 使用当前位置按钮
    elements.useLocationBtn.addEventListener('click', getCurrentLocation);
    
    // 刷新按钮点击
    elements.refreshBtn.addEventListener('click', refreshWeather);
    
    // 切换温度单位
    elements.toggleUnitBtn.addEventListener('click', toggleTemperatureUnit);
    
    // 切换主题
    elements.toggleThemeBtn.addEventListener('click', toggleTheme);
    
    // 关闭错误提示
    elements.closeError.addEventListener('click', hideErrorMessages);
}

// 显示欢迎信息
function showWelcomeMessage() {
    if (elements.welcomeMsg) {
        elements.welcomeMsg.style.display = 'block';
        elements.welcomeMsg.innerHTML = '欢迎使用天气应用！<br>点击 <i class="fas fa-map-marker-alt"></i> 获取您当前位置的天气<br>或搜索城市名称';
    }
}

/**
 * 根据城市名称搜索天气
 * @param {string} city - 城市名称
 * @returns {Promise} - 返回 Promise 对象
 */
async function searchWeatherByCity(city) {
    // 返回 Promise 对象
    return new Promise(async (resolve, reject) => {
    try {
        // 显示加载中
        showLoading();
        
        // 隐藏欢迎信息
        if (elements.welcomeMsg) {
            elements.welcomeMsg.style.display = 'none';
        }
        
        // 获取城市坐标
        let location;
        try {
            location = await weatherService.getCoordinatesByCity(city);
            console.log('获取到城市坐标:', location);
        } catch (geoError) {
            console.error('获取城市坐标失败:', geoError);
            showNotification(`获取"${city}"坐标失败，使用默认城市`, 'warning');
            
            // 使用默认城市（北京）
            location = {
                lat: 39.9042,
                lon: 116.4074,
                name: `无法找到"${city}",显示默认城市`
            };
        }
        
        // 更新state并保存设置
        state.currentLocation = location;
        state.lastCity = city;
        saveSettings();
        
        // 获取当前天气
        let currentWeather;
        try {
            currentWeather = await weatherService.getCurrentWeather(location.lat, location.lon);
            state.currentWeather = currentWeather;
        } catch (weatherError) {
            console.error('获取当前天气失败:', weatherError);
            showNotification('获取当前天气数据失败，请稍后再试', 'error');
            hideLoading();
                reject(weatherError);
            return;
        }
        
        // 获取天气预报
        let forecast;
        try {
            forecast = await weatherService.getForecast(location.lat, location.lon);
            state.forecast = forecast;
        } catch (forecastError) {
            console.error('获取天气预报失败:', forecastError);
            showNotification('获取天气预报失败，但当前天气可用', 'warning');
            // 继续执行，只显示当前天气
            forecast = { list: [] };
            state.forecast = forecast;
        }
        
        // 更新UI
        updateCurrentWeather(currentWeather, location.name);
        if (forecast.list && forecast.list.length > 0) {
            updateForecast(forecast.list);
        }
        
        // 生成并显示出门建议
        generateAndShowAdvice(currentWeather, forecast);
        
        // 隐藏加载中
        hideLoading();
        
        // 显示天气信息
        elements.weatherInfo.classList.remove('hidden');
        
            // 成功获取天气数据
            resolve();
        
    } catch (error) {
        console.error('搜索天气失败:', error);
        hideLoading();
        
        // 显示错误通知
        showNotification(`搜索天气失败: ${error.message}`, 'error');
            
            // 返回错误
            reject(error);
    }
    });
}

/**
 * 获取当前位置
 */
function getCurrentLocation() {
    // 如果浏览器支持地理位置
    if ('geolocation' in navigator) {
        showLoading();
        
        // 隐藏欢迎信息
        if (elements.welcomeMsg) {
            elements.welcomeMsg.style.display = 'none';
        }
        
        // 获取地理位置
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // 获取位置名称
                const locationName = await weatherService.getLocationName(lat, lon);
                
                // 更新state
                state.currentLocation = {
                    lat,
                    lon,
                    name: locationName
                };
                
                // 清除上次城市
                state.lastCity = locationName;
                saveSettings();
                
                // 获取当前天气
                const currentWeather = await weatherService.getCurrentWeather(lat, lon);
                state.currentWeather = currentWeather;
                
                // 获取天气预报
                const forecast = await weatherService.getForecast(lat, lon);
                state.forecast = forecast;
                
                // 更新UI
                updateCurrentWeather(currentWeather, locationName);
                updateForecast(forecast.list);
                
                // 生成并显示出门建议
                generateAndShowAdvice(currentWeather, forecast);
                
                // 隐藏加载中
                hideLoading();
                
                // 显示天气信息
                elements.weatherInfo.classList.remove('hidden');
                
            } catch (error) {
                console.error('获取当前位置天气失败:', error);
                hideLoading();
                
                // 显示错误通知
                showNotification(`获取当前位置天气失败: ${error.message}`, 'error');
            }
        }, (error) => {
            console.error('获取地理位置失败:', error);
            hideLoading();
            
            // 显示错误通知
            showNotification('获取地理位置失败，请检查位置权限', 'error');
        });
    } else {
        showNotification('您的浏览器不支持地理位置功能', 'error');
    }
}

/**
 * 根据天气情况生成出门建议
 * @param {Object} currentWeather - 当前天气数据
 * @param {Object} forecast - 天气预报数据
 */
function generateAndShowAdvice(currentWeather, forecast) {
    if (!elements.adviceContainer || !elements.adviceContent || !currentWeather) return;
    
    // 显示建议容器
    elements.adviceContainer.classList.remove('hidden');
    
    // 基于当前天气生成建议
    const advice = {
        general: '', 
        clothing: '',
        activity: '',
        health: '',
        transport: ''
    };
    
    const temp = currentWeather.temp;
    const weatherCode = currentWeather.weatherCode;
    const humidity = currentWeather.humidity;
    const windSpeed = currentWeather.windSpeed;
    const timeOfDay = new Date().getHours();
    const isMorning = timeOfDay >= 5 && timeOfDay < 12;
    const isAfternoon = timeOfDay >= 12 && timeOfDay < 18;
    const isEvening = timeOfDay >= 18 || timeOfDay < 5;
    const timePrefix = isMorning ? "早上好！" : isAfternoon ? "下午好！" : "晚上好！";
    
    // 天气状况优先级高于温度建议
    let weatherCondition = "晴好";
    
    // 特殊天气条件判断（按优先级排序）
    if (weatherCode >= 200 && weatherCode < 300) { // 雷雨
        weatherCondition = "雷雨";
        advice.general = `${timePrefix}今天有雷雨天气，建议您尽量减少不必要的外出，保持安全。`;
        advice.clothing = '如必须外出，请穿着防水外套，携带结实的雨伞，选择防滑防水的鞋子。建议随身携带一套替换衣物，以防淋湿。';
        advice.activity = '请避免所有户外活动，尤其是在空旷地带和水域附近的活动。室内是最安全的选择，可以选择在家阅读、看电影或与家人朋友一起享受茶点时光。';
        advice.health = '雷雨天气易引起情绪波动，可以听些舒缓的音乐保持心情平和。保持室内通风但关好门窗，确保安全。';
        advice.transport = '如需驾车，请降低车速，打开雨刷和车灯，与前车保持足够安全距离。尽量避开低洼积水区域，选择安全的路线。公共交通可能会有延误，请预留充足出行时间。';
    } else if (weatherCode >= 600 && weatherCode < 700) { // 雪
        weatherCondition = "雪天";
        advice.general = `${timePrefix}今天有雪，窗外的雪景很美，但请您注意安全和保暖。`;
        advice.clothing = '请穿着保暖的羽绒服或厚外套，配戴保暖帽子、围巾和手套，选择防滑防水的雪地靴。多层次穿搭可以更好地保持体温。';
        advice.activity = '雪天路滑，老人、孕妇和儿童建议减少外出。如果想欣赏雪景，请在安全区域短暂停留，避免在积雪深处或陡坡行走。回家后记得及时更换干燥衣物。';
        advice.health = '雪天气温低，请注意保持手脚温暖，预防感冒和冻伤。室内保持适宜温度和湿度，多喝温水，适当补充维生素C增强免疫力。';
        advice.transport = '道路结冰风险高，如必须驾车，请安装防滑链，降低车速，避免急刹车，与前车保持更大距离。优先选择公共交通，但需预留更多出行时间。';
    } else if (weatherCode >= 500 && weatherCode < 600) { // 雨
        weatherCondition = "雨天";
        advice.general = `${timePrefix}今天有雨，记得带伞出门，注意路面湿滑。`;
        advice.clothing = '建议穿着防水风衣或雨衣，选择防水鞋或靴子。携带一把结实的雨伞，雨量较大时可穿雨披。包包和电子设备最好放在防水袋内保护。';
        advice.activity = '雨天不适合户外运动和远足，可以选择室内活动如博物馆、电影院或购物中心。如有预约的户外活动，建议提前确认是否可改期。';
        advice.health = '雨天湿度大，有关节炎的朋友可能会感到不适，注意保暖。回家后及时更换干燥衣物，避免感冒。保持室内通风但不要让雨水淋到室内。';
        advice.transport = '道路湿滑，驾车需降低速度，保持车距，打开雾灯提高能见度。步行时避开积水和湿滑区域，注意车辆溅水。公共交通可能延误，请预留时间。';
    } else if (weatherCode >= 300 && weatherCode < 400) { // 毛毛雨
        weatherCondition = "毛毛雨";
        advice.general = `${timePrefix}今天有毛毛雨，细雨蒙蒙中也有诗意，但出门别忘了带伞。`;
        advice.clothing = '建议穿着轻薄防水外套或携带折叠伞，选择防滑的鞋子。毛毛雨虽小但持续时间可能较长，衣物最好有一定防水性能。';
        advice.activity = '毛毛雨天气可以进行短时间的户外活动，如散步或拍照，但长时间户外活动不建议。室内咖啡馆、图书馆是不错的去处。';
        advice.health = '湿度较高，请注意保持衣物干爽，避免受凉。有呼吸道疾病的人群建议戴口罩出行，减少湿冷空气对呼吸道的刺激。';
        advice.transport = '路面可能有轻微湿滑，驾车时适当降低速度。雨刷可调至间歇模式。公共交通基本不受影响，但伞具可能会打湿他人，请注意礼让。';
    } else if (weatherCode >= 700 && weatherCode < 800) { // 雾霾
        weatherCondition = "雾霾";
        advice.general = `${timePrefix}今天空气质量不佳，建议减少户外活动时间，保护您的呼吸健康。`;
        advice.clothing = '外出请佩戴专业防护口罩，如N95或KN95，选择容易清洗的衣物，回家后及时更换并洗净暴露在外的衣物。';
        advice.activity = '不建议进行户外运动，尤其是剧烈运动。室内活动是更好的选择，开启空气净化器可改善室内空气质量。';
        advice.health = '儿童、老人、孕妇以及有呼吸系统疾病的人群应尽量待在室内。多喝水，可适量食用梨、银耳等润肺食物。注意室内通风时间应选在空气质量较好的时段。';
        advice.transport = '开车时关闭车窗，使用车内循环和空调过滤系统。能见度可能受影响，请开启雾灯，减速慢行，保持安全距离。';
    } else {
        // 没有特殊天气条件，根据温度给建议
        if (temp <= 0) {
            weatherCondition = "严寒";
            advice.general = `${timePrefix}今天气温非常低，在${temp}℃左右，请做好防寒保暖措施，减少不必要的外出。`;
            advice.clothing = '请穿着厚重保暖的冬季服装，包括保暖内衣、羊毛衫、厚外套或羽绒服。头部、颈部、手部和脚部是热量散失的主要部位，请务必戴帽子、围巾、手套，穿保暖鞋袜。出门前可以先暖身几分钟再出门。';
            advice.activity = '极寒天气不适合长时间户外活动。如必须外出，请将活动时间控制在最短范围内。室内保持适当活动，促进血液循环，也可以做些舒缓的瑜伽或拉伸运动。';
            advice.health = '寒冷天气会增加心脑血管疾病风险，有相关疾病的人群要特别注意保暖，避免情绪激动。多喝热水，少吃生冷食物，可以适当吃些高热量、易消化的食物来增加热量。';
            advice.transport = '道路可能结冰，驾车需格外谨慎，降低车速，延长刹车距离。出发前确保车辆防冻液充足，轮胎气压正常。公共交通可能会因天气延误，请预留充足时间。';
        } else if (temp <= 10) {
            weatherCondition = "寒冷";
            advice.general = `${timePrefix}今天气温较低，在${temp}℃左右，外出时请注意保暖。`;
            advice.clothing = '建议穿着保暖外套、毛衣、长裤和保暖鞋袜。可以采用洋葱式穿搭法，多穿几层薄衣物而非一件厚重外套，更容易调节体温。颈部和手腕等部位特别注意保暖，建议戴围巾和手套。';
            advice.activity = '适合进行轻度户外活动如散步，但时间不宜过长。寒冷天气下进行适当运动可促进血液循环，但请避免大量出汗后在户外逗留，以免着凉。';
            advice.health = '天气寒冷时人体免疫力可能下降，多补充维生素，均衡饮食，保持充足睡眠。老人和儿童对温度变化敏感，需要特别关注他们的保暖需求。热水泡脚可以帮助改善睡眠。';
            advice.transport = '早晚温差大，车辆玻璃可能起雾，出发前预留时间除雾。路面可能有霜冻，驾驶时需谨慎。公共交通是寒冷天气的好选择，但请记得在温暖车厢内不要马上脱掉太多衣物，避免温差过大。';
        } else if (temp <= 18) {
            weatherCondition = "凉爽";
            advice.general = `${timePrefix}今天气温凉爽宜人，在${temp}℃左右，适合外出活动，但早晚温差较大，请适当添加衣物。`;
            advice.clothing = '建议穿着长袖衬衫或轻薄毛衣，外搭轻便外套。衣物宜选择透气、舒适的面料。早晚气温较低，可随身携带一件外套，方便随时增减。';
            advice.activity = '非常适合户外活动，如散步、慢跑、骑行或野餐。这样的天气非常适合远足和郊游，空气清新，阳光不强烈，是户外摄影的好时机。';
            advice.health = '凉爽的温度非常舒适，但昼夜温差大，注意保持颈部和腹部的保暖，尤其是年长者和体弱者。可以适当晒太阳补充维生素D，增强免疫力。';
            advice.transport = '凉爽天气下出行非常舒适，各种交通方式都是不错的选择。自行车和步行都很适合，既环保又健康。驾车时注意早晚可能有雾，保持安全车距。';
        } else if (temp <= 26) {
            weatherCondition = "舒适";
            advice.general = `${timePrefix}今天气温舒适宜人，在${temp}℃左右，是户外活动的好时机，祝您有个愉快的一天！`;
            advice.clothing = '可以穿着轻便舒适的衣物，如短袖T恤、棉质衬衫或薄长袖。下装可选择休闲裤、牛仔裤或舒适的裙装。面料以棉麻等透气材质为佳。';
            advice.activity = '这是进行各种户外活动的理想温度，无论是运动、游览还是户外用餐都很合适。可以考虑去公园散步、骑行、野餐或露营，享受大自然的美好。';
            advice.health = '温度适宜，注意补充足够水分保持身体水分平衡。这种天气下人体状态通常较好，可以适当增加活动量，增强体质。';
            advice.transport = '各种交通方式都很适宜，步行和自行车是健康环保的选择。公共交通和驾车也很舒适，无特殊注意事项。';
        } else if (temp <= 32) {
            weatherCondition = "温暖";
            advice.general = `${timePrefix}今天气温较高，在${temp}℃左右，温暖舒适但需注意防晒和补水。`;
            advice.clothing = '建议穿着轻薄、浅色、透气的衣物，如棉麻质地的短袖、短裤或裙装。外出时可戴宽檐遮阳帽、防晒披肩或使用遮阳伞，涂抹防晒霜保护皮肤。';
            advice.activity = '上午和傍晚是户外活动的较佳时段，中午时分阳光强烈，建议避开。水上活动如游泳是不错的选择，可以有效降温消暑。室内活动如博物馆、电影院等也很适宜。';
            advice.health = '高温天气要特别注意补充水分，建议随身携带水杯，少量多次饮水。饮食宜清淡，多吃蔬果补充维生素和水分。避免长时间暴露在阳光下，预防中暑。';
            advice.transport = '乘车时注意防晒，长时间停放的车辆内温度很高，上车前可先开窗散热。公共交通和出租车都配有空调，是炎热天气的舒适选择。自行车和步行适合清晨和傍晚。';
        } else {
            weatherCondition = "炎热";
            advice.general = `${timePrefix}今天天气炎热，气温在${temp}℃以上，请注意防暑降温，减少在烈日下的活动时间。`;
            advice.clothing = '请穿着轻薄、宽松、浅色的衣物，选择透气性好的面料如棉、麻或速干材质。外出务必做好防晒措施，包括防晒霜（SPF30以上）、遮阳帽、太阳镜和遮阳伞。';
            advice.activity = '高温时段（上午10点至下午4点）请尽量避免户外活动。清晨或傍晚可进行短时间的户外散步。游泳、水上乐园是消暑的好选择，或选择有空调的室内场所如商场、电影院等。';
            advice.health = '炎热天气请特别注意补充水分，每小时至少喝250毫升水，可添加电解质饮料。饮食宜清淡，多吃蔬果。避免饮酒和过量咖啡因，它们会加重脱水。老人、儿童和有慢性病的人群要特别注意防暑。';
            advice.transport = '车内温度可能极高，停车前先开窗通风几分钟，避免立即接触方向盘等高温表面。检查车辆冷却系统和轮胎气压，高温可能导致爆胎。公共交通是炎热天气的舒适选择。';
        }
    }
    
    // 根据天气状况调整其他建议
    if (weatherCode === 800) { // 晴天
        if (weatherCondition !== "炎热" && weatherCondition !== "温暖") {
            advice.general = `${timePrefix}今天阳光明媚，天气${weatherCondition}，是出行的好日子。`;
            advice.activity = advice.activity || '晴天非常适合户外活动，可以去公园散步、远足、野餐或进行各种户外运动。阳光充足，也是拍照的好时机。';
            
            if (temp > 15) {
                advice.health = (advice.health || '') + ' 阳光充足，可以适当晒太阳补充维生素D，但记得做好防晒措施。';
            }
        }
    } else if (weatherCode > 800 && weatherCode < 900) { // 多云
        if (!advice.general.includes("雨") && !advice.general.includes("雪") && !advice.general.includes("雾")) {
            advice.general = `${timePrefix}今天多云，气温${weatherCondition}，气候较为温和。`;
            advice.clothing = advice.clothing + ' 多云天气可能带来温度变化，建议随身携带一件外套以应对天气变化。';
        }
    }
    
    // 基于湿度的补充建议
    if (humidity > 85 && !weatherCondition.includes("雨") && !weatherCondition.includes("雾霾")) {
        advice.health = (advice.health || '') + ' 今日湿度较高，感觉可能比实际温度更闷热。注意保持室内通风，使用除湿设备可以提高居住舒适度。敏感肌肤和过敏体质的人群应注意皮肤保湿并避免过敏原。';
    } else if (humidity < 30 && !weatherCondition.includes("雾霾")) {
        advice.health = (advice.health || '') + ' 今日湿度较低，空气干燥，请多喝水保持身体水分。可使用保湿喷雾或护肤品保护皮肤，使用加湿器改善室内空气。注意眼部保湿，避免长时间使用电子设备导致眼睛干涩。';
    }
    
    // 基于风速的补充建议，避免重复
    if (windSpeed > 10 && !advice.general.includes("风")) {
        advice.general = advice.general + ' 今日风力较大，外出时请注意安全。';
        
        if (!advice.clothing.includes("防风")) {
            advice.clothing = advice.clothing + ' 风大时请穿着防风外套，扣好纽扣，避免帽子、围巾等物品被吹走。';
        }
        
        if (!advice.transport.includes("风")) {
            advice.transport = (advice.transport || '') + ' 大风天气驾车需稳握方向盘，降低车速，尤其在高架桥和开阔地带。骑行自行车或电动车要特别小心，必要时可选择公共交通工具。';
        }
    }
    
    // 添加表情符号到建议中
    // 天气状况表情
    const weatherEmoji = {
        "雷雨": "⚡️ ",
        "雪天": "❄️ ",
        "雨天": "🌧️ ",
        "毛毛雨": "🌦️ ",
        "雾霾": "😷 ",
        "严寒": "🥶 ",
        "寒冷": "❄️ ",
        "凉爽": "🍃 ",
        "舒适": "😊 ",
        "温暖": "☀️ ",
        "炎热": "🔥 "
    };
    
    // 为每种建议类型添加对应表情
    const emojiPrefix = {
        general: weatherEmoji[weatherCondition] || "🌈 ",
        clothing: "👚 ",
        activity: "🚶 ",
        health: "💗 ",
        transport: "🚗 "
    };
    
    // 添加可爱的表情到建议结尾
    const endingEmoji = ["(ᵔᴥᵔ)", "(●'◡'●)", "ヾ(^▽^*)))", "♪(･ω･)ﾉ", "(｡･ω･｡)", "( •̀ ω •́ )✧"];
    const randomEndingEmoji = () => endingEmoji[Math.floor(Math.random() * endingEmoji.length)];
    
    // 组合建议
    let adviceHTML = `<h3>🌟 今日出行建议 🌟</h3>`;
    
    // 添加每个方面的建议
    if (advice.general) adviceHTML += `<p><strong>${emojiPrefix.general}贴心提示：</strong>${advice.general} ${randomEndingEmoji()}</p>`;
    if (advice.clothing) adviceHTML += `<p><strong>${emojiPrefix.clothing}着装建议：</strong>${advice.clothing} ${randomEndingEmoji()}</p>`;
    if (advice.activity) adviceHTML += `<p><strong>${emojiPrefix.activity}活动参考：</strong>${advice.activity} ${randomEndingEmoji()}</p>`;
    if (advice.health) adviceHTML += `<p><strong>${emojiPrefix.health}健康守护：</strong>${advice.health} ${randomEndingEmoji()}</p>`;
    if (advice.transport) adviceHTML += `<p><strong>${emojiPrefix.transport}出行指南：</strong>${advice.transport} ${randomEndingEmoji()}</p>`;
    
    // 显示建议
    elements.adviceContent.innerHTML = adviceHTML;
}

/**
 * 切换温度单位
 */
function toggleTemperatureUnit() {
    // 切换单位
    state.unit = state.unit === 'celsius' ? 'fahrenheit' : 'celsius';
    
    // 更新UI
    if (state.currentWeather) {
        updateTemperatureDisplay(state.currentWeather);
    }
    
    // 保存设置
    saveSettings();
    
    // 显示通知
    showNotification(`温度单位已切换为 ${state.unit === 'celsius' ? '摄氏度' : '华氏度'}`, 'success');
}

/**
 * 切换主题（白天/夜间）
 */
function toggleTheme() {
    // 添加过渡动画类
    document.body.classList.add('theme-transition');
    
    // 切换主题
    if (state.theme === 'light') {
        state.theme = 'dark';
        document.documentElement.classList.add('dark-theme');
        elements.themeIcon.classList.remove('fa-sun');
        elements.themeIcon.classList.add('fa-moon');
    } else {
        state.theme = 'light';
        document.documentElement.classList.remove('dark-theme');
        elements.themeIcon.classList.remove('fa-moon');
        elements.themeIcon.classList.add('fa-sun');
    }
    
    // 保存设置
    saveSettings();
    
    // 动画结束后移除过渡类
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
    
    // 显示通知
    showNotification(`已切换到${state.theme === 'light' ? '白天' : '夜间'}主题`, 'success');
}

/**
 * 应用主题
 * @param {string} theme - 主题名称: 'light' 或 'dark'
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        elements.themeIcon.classList.remove('fa-sun');
        elements.themeIcon.classList.add('fa-moon');
    } else {
        document.documentElement.classList.remove('dark-theme');
        elements.themeIcon.classList.remove('fa-moon');
        elements.themeIcon.classList.add('fa-sun');
    }
}

/**
 * 显示加载中
 */
function showLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'flex';
    }
}

/**
 * 隐藏加载中
 */
function hideLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'none';
    }
}

/**
 * 更新当前天气显示
 * @param {Object} data - 天气数据
 * @param {string} cityName - 城市名称
 */
function updateCurrentWeather(data, cityName) {
    if (!elements.locationName || !data) return;
    
    console.log('更新当前天气UI，数据:', data);
    
    // 更新位置名称
    elements.locationName.textContent = cityName;
    
    // 更新日期
    const now = new Date();
    // 创建日期数组，便于突出显示当天日期
    const weekDayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const dayOfWeek = weekDayNames[now.getDay()];
    elements.currentDate.innerHTML = `${formatDate(now, 'YYYY年MM月DD日')} <span class="highlight-day">${dayOfWeek}</span>`;
    
    // 更新时间由实时时钟更新函数处理
    
    // 更新温度显示
    updateTemperatureDisplay(data);
    
    // 更新天气图标和描述
    elements.weatherIcon.textContent = data.weatherIcon;
    elements.weatherDescription.textContent = data.weatherText;
    
    // 更新详细信息
    elements.humidity.textContent = `${data.humidity}%`;
    elements.windSpeed.textContent = `${data.windSpeed} m/s`;
    elements.pressure.textContent = `${data.pressure} hPa`;
    
    // 显示天气动画效果
    showWeatherAnimation(data.weatherCode);
}

/**
 * 更新温度显示
 * @param {Object} data - 天气数据
 */
function updateTemperatureDisplay(data) {
    if (!elements.temperature || !data) return;
    
    // 根据当前单位显示温度
    const temp = state.unit === 'celsius' ? data.temp : convertTemperature(data.temp, 'celsius', 'fahrenheit');
    const feelsLike = state.unit === 'celsius' ? data.feelsLike : convertTemperature(data.feelsLike, 'celsius', 'fahrenheit');
    
    // 更新显示
    elements.temperature.textContent = `${Math.round(temp)}°${state.unit === 'celsius' ? 'C' : 'F'}`;
    elements.feelsLike.textContent = `${Math.round(feelsLike)}°${state.unit === 'celsius' ? 'C' : 'F'}`;
}

/**
 * 更新天气预报
 * @param {Array} forecastData - 预报数据列表
 */
function updateForecast(forecastData) {
    if (!elements.forecast || !forecastData) return;
    
    console.log('更新天气预报UI，数据:', forecastData);
    
    // 清空预报容器
    elements.forecast.innerHTML = '';
    
    // 获取当前日期，用于判断是否为当天
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 获取 YYYY-MM-DD 格式的日期
    
    // 显示每天的预报卡片（已经是每天一条数据）
    forecastData.slice(0, 7).forEach(item => {
        const date = new Date(item.date);
        const dateStr = date.toISOString().split('T')[0]; // 获取 YYYY-MM-DD 格式的日期
        
        // 转换温度
        const displayMaxTemp = state.unit === 'celsius' ? item.temp_max : convertTemperature(item.temp_max, 'celsius', 'fahrenheit');
        const displayMinTemp = state.unit === 'celsius' ? item.temp_min : convertTemperature(item.temp_min, 'celsius', 'fahrenheit');
        
        // 创建预报卡片
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        // 如果是当天，添加特殊的类名
        if (dateStr === todayStr) {
            forecastItem.classList.add('today-forecast');
        }
        
        // 获取星期几
        const dayOfWeek = getDayOfWeek(date);
        
        forecastItem.innerHTML = `
            <p class="forecast-date">${formatDate(date, 'MM月DD日')}</p>
            <p class="forecast-day">${dayOfWeek}</p>
            <div class="forecast-icon">${item.weatherIcon}</div>
            <p class="forecast-temp">${Math.round(displayMaxTemp)}° / ${Math.round(displayMinTemp)}°</p>
            <p class="forecast-desc">${item.weatherText}</p>
        `;
        
        elements.forecast.appendChild(forecastItem);
    });
}

/**
 * 显示通知消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (info, success, error)
 */
function showNotification(message, type = 'info') {
    elements.notification.className = 'notification';
    elements.notification.classList.add(type);
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     'fa-info-circle';
    
    elements.notification.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    elements.notification.style.display = 'flex';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        elements.notification.style.display = 'none';
    }, 3000);
}

/**
 * 隐藏错误消息
 */
function hideErrorMessages() {
    elements.errorMessage.classList.add('hidden');
}

/**
 * 刷新当前天气数据
 */
function refreshWeather() {
    // 添加旋转动画
    const refreshIcon = elements.refreshBtn.querySelector('i');
    refreshIcon.classList.add('rotating');
    
    // 如果当前有城市数据，刷新该城市的天气
    if (state.lastCity) {
        searchWeatherByCity(state.lastCity)
            .finally(() => {
                // 移除旋转动画
                setTimeout(() => {
                    refreshIcon.classList.remove('rotating');
                }, 1000);
                
                // 显示刷新成功提示
                showNotification('天气数据已更新', 'success');
            });
    } 
    // 如果有位置信息但没有城市名，使用坐标刷新
    else if (state.currentLocation) {
        getCurrentLocationWeather(state.currentLocation.lat, state.currentLocation.lon)
            .finally(() => {
                // 移除旋转动画
                setTimeout(() => {
                    refreshIcon.classList.remove('rotating');
                }, 1000);
                
                // 显示刷新成功提示
                showNotification('天气数据已更新', 'success');
            });
    } 
    // 如果没有任何天气数据，提示用户先搜索或获取位置
    else {
        refreshIcon.classList.remove('rotating');
        showNotification('请先搜索城市或获取当前位置', 'warning');
    }
}

/**
 * 使用坐标获取天气数据
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 */
async function getCurrentLocationWeather(lat, lon) {
    try {
        // 显示加载中
        showLoading();
        
        // 隐藏欢迎信息
        if (elements.welcomeMsg) {
            elements.welcomeMsg.style.display = 'none';
        }
        
        // 获取位置名称
        const locationName = await weatherService.getLocationName(lat, lon);
        
        // 更新state
        state.currentLocation = {
            lat,
            lon,
            name: locationName
        };
        
        // 获取当前天气
        const currentWeather = await weatherService.getCurrentWeather(lat, lon);
        state.currentWeather = currentWeather;
        
        // 获取天气预报
        const forecast = await weatherService.getForecast(lat, lon);
        state.forecast = forecast;
        
        // 更新UI
        updateCurrentWeather(currentWeather, locationName);
        updateForecast(forecast.list);
        
        // 生成并显示出门建议
        generateAndShowAdvice(currentWeather, forecast);
        
        // 隐藏加载中
        hideLoading();
        
        // 显示天气信息
        elements.weatherInfo.classList.remove('hidden');
        
    } catch (error) {
        console.error('获取当前位置天气失败:', error);
        hideLoading();
        
        // 显示错误通知
        showNotification(`获取天气数据失败: ${error.message}`, 'error');
    }
}

/**
 * 开始实时时钟更新
 */
function startRealtimeClock() {
    // 立即更新一次时间
    updateTime();
    
    // 设置定时器，每秒更新一次
    setInterval(updateTime, 1000);
}

/**
 * 更新时间显示
 */
function updateTime() {
    if (!elements.currentTime) return;
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    elements.currentTime.textContent = `${hours}:${minutes}:${seconds}`;
    
    // 每天凌晨更新日期
    if (hours === '00' && minutes === '00' && seconds === '00') {
        const weekDayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const dayOfWeek = weekDayNames[now.getDay()];
        elements.currentDate.innerHTML = `${formatDate(now, 'YYYY年MM月DD日')} <span class="highlight-day">${dayOfWeek}</span>`;
    }
}

/**
 * 显示天气动画效果
 * @param {number} weatherCode - 天气代码
 */
function showWeatherAnimation(weatherCode) {
    if (!elements.weatherAnimationContainer) {
        console.error('天气动画容器元素不存在');
        return;
    }
    
    console.log('显示天气动画，天气代码:', weatherCode);
    
    // 清空容器
    elements.weatherAnimationContainer.innerHTML = '';
    
    // 关闭测试模式，只显示对应天气的动画
    const testMode = false;
    
    if (testMode) {
        // 测试模式代码保留但不执行
        // ...代码省略...
    } else {
        // 正常模式 - 根据天气代码显示对应的动画
        if (weatherCode >= 200 && weatherCode < 300) {
            // 雷雨效果
            console.log('创建雷雨动画');
            createThunderAnimation();
            createRainAnimation(true); // 大雨
        } else if (weatherCode >= 300 && weatherCode < 400) {
            // 毛毛雨效果
            console.log('创建毛毛雨动画');
            createRainAnimation(false); // 小雨
        } else if (weatherCode >= 500 && weatherCode < 600) {
            // 雨效果
            console.log('创建雨动画');
            createRainAnimation(true); // 大雨
        } else if (weatherCode >= 600 && weatherCode < 700) {
            // 雪效果
            console.log('创建雪动画');
            createSnowAnimation();
        } else if (weatherCode >= 700 && weatherCode < 800) {
            // 雾效果
            console.log('创建雾动画');
            createFogAnimation();
        } else if (weatherCode === 800) {
            // 晴天效果
            console.log('创建晴天动画');
            createSunAnimation();
        } else if (weatherCode > 800 && weatherCode < 900) {
            // 多云效果
            console.log('创建多云动画');
            createCloudsAnimation();
        } else {
            console.log('未知天气代码:', weatherCode, '显示默认的多云效果');
            // 默认显示多云效果
            createCloudsAnimation();
        }
    }
}

/**
 * 创建雨滴动画
 * @param {boolean} isHeavy - 是否大雨
 */
function createRainAnimation(isHeavy = false) {
    const rainContainer = document.createElement('div');
    rainContainer.className = 'rain-animation';
    
    const dropCount = isHeavy ? 400 : 200;
    
    for (let i = 0; i < dropCount; i++) {
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        
        // 随机位置和大小
        const left = Math.random() * 100; // 横向位置 (%)
        const delay = Math.random() * 5; // 延迟 (s)
        const duration = isHeavy ? 
            0.3 + Math.random() * 0.4 : // 大雨速度更快：0.3-0.7秒
            0.7 + Math.random() * 0.8; // 小雨速度：0.7-1.5秒
        
        // 设置样式
        raindrop.style.left = `${left}%`;
        raindrop.style.animationDelay = `${delay}s`;
        raindrop.style.animationDuration = `${duration}s`;
        
        // 大雨滴更长一些
        if (isHeavy) {
            raindrop.style.height = `${12 + Math.random() * 18}px`;
            raindrop.style.width = `${2 + Math.random() * 1}px`;
        }
        
        rainContainer.appendChild(raindrop);
    }
    
    elements.weatherAnimationContainer.appendChild(rainContainer);
}

/**
 * 创建雪花动画
 */
function createSnowAnimation() {
    const snowContainer = document.createElement('div');
    snowContainer.className = 'snow-animation';
    
    const flakeCount = 300;
    
    for (let i = 0; i < flakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        // 随机位置、大小和持续时间
        const left = Math.random() * 100; // 横向位置 (%)
        const size = 2 + Math.random() * 6; // 更大的雪花
        const delay = Math.random() * 5; // 延迟 (s)
        const duration = 4 + Math.random() * 8; // 下落时间 (s)
        const horizontalMovement = Math.random() * 20 - 10; // 左右摆动范围增加
        
        // 设置样式
        snowflake.style.left = `${left}%`;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        snowflake.style.animationDelay = `${delay}s`;
        snowflake.style.animationDuration = `${duration}s`;
        
        // 添加一点左右摆动
        snowflake.style.transform = `translateX(${horizontalMovement}px)`;
        
        snowContainer.appendChild(snowflake);
    }
    
    elements.weatherAnimationContainer.appendChild(snowContainer);
}

/**
 * 创建阳光动画
 */
function createSunAnimation() {
    const sunElement = document.createElement('div');
    sunElement.className = 'sun-animation';
    elements.weatherAnimationContainer.appendChild(sunElement);
}

/**
 * 创建云朵动画
 */
function createCloudsAnimation() {
    const cloudsContainer = document.createElement('div');
    cloudsContainer.className = 'clouds-animation';
    
    // 创建3-5个云
    const cloudCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        // 随机位置、大小和速度
        const top = 5 + Math.random() * 30; // 垂直位置 (%)
        const scale = 0.6 + Math.random() * 1; // 云朵大小比例
        const delay = Math.random() * 20; // 延迟 (s)
        const duration = 60 + Math.random() * 60; // 移动时间 (s)
        
        // 设置样式
        cloud.style.top = `${top}%`;
        cloud.style.transform = `scale(${scale})`;
        cloud.style.animationDelay = `${delay}s`;
        cloud.style.animationDuration = `${duration}s`;
        cloud.style.opacity = 0.7 - (scale - 1) * 0.2; // 较大的云朵透明度低一些
        
        cloudsContainer.appendChild(cloud);
    }
    
    elements.weatherAnimationContainer.appendChild(cloudsContainer);
}

/**
 * 创建雷电动画
 */
function createThunderAnimation() {
    const thunderContainer = document.createElement('div');
    thunderContainer.className = 'thunder-animation';
    
    // 创建2-4个闪电
    const lightningCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < lightningCount; i++) {
        const lightning = document.createElement('div');
        lightning.className = 'lightning';
        
        // 随机位置和延迟
        const left = 10 + Math.random() * 80; // 水平位置 (%)
        const delay = Math.random() * 8; // 延迟时间 (s)
        
        // 设置样式
        lightning.style.left = `${left}%`;
        lightning.style.animationDelay = `${delay}s`;
        
        thunderContainer.appendChild(lightning);
    }
    
    elements.weatherAnimationContainer.appendChild(thunderContainer);
}

/**
 * 创建雾气动画
 */
function createFogAnimation() {
    const fogElement = document.createElement('div');
    fogElement.className = 'fog-animation';
    elements.weatherAnimationContainer.appendChild(fogElement);
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp); 