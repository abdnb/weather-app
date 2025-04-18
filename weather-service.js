/**
 * 天气服务 - 负责与Open-Meteo API交互
 */

class WeatherService {
    constructor() {
        // Open-Meteo API无需密钥
        this.baseUrl = 'https://api.open-meteo.com/v1';
        this.geocodeUrl = 'https://geocoding-api.open-meteo.com/v1/search';
        this.reverseGeocodeUrl = 'https://geocoding-api.open-meteo.com/v1/reverse';
        this.lang = 'zh_cn'; // 中文
        
        // 缓存
        this.cache = {};
        this.cacheTime = 30 * 60 * 1000; // 30分钟缓存
        
        // WMO天气代码映射到emoji图标
        this.wmoToIcon = {
            0: '☀️', // 晴天
            1: '🌤️', // 大部分晴天
            2: '⛅', // 部分多云
            3: '☁️', // 阴天
            45: '🌫️', // 雾
            48: '🌫️', // 雾凇
            51: '🌦️', // 毛毛雨
            53: '🌦️', // 中度毛毛雨
            55: '🌧️', // 浓密毛毛雨
            56: '🌨️', // 冻毛毛雨
            57: '🌨️', // 浓密冻毛毛雨
            61: '🌧️', // 小雨
            63: '🌧️', // 中雨
            65: '🌧️', // 大雨
            66: '🌨️', // 冻雨
            67: '🌨️', // 重度冻雨
            71: '❄️', // 小雪
            73: '❄️', // 中雪
            75: '❄️', // 大雪
            77: '❄️', // 雪粒
            80: '🌦️', // 小阵雨
            81: '🌧️', // 中阵雨
            82: '🌧️', // 大阵雨
            85: '🌨️', // 小阵雪
            86: '🌨️', // 大阵雪
            95: '⛈️', // 雷暴
            96: '⛈️', // 雷暴伴随小冰雹
            99: '⛈️'  // 雷暴伴随大冰雹
        };
        
        // 天气代码对应的中文描述
        this.wmoToText = {
            0: '晴天',
            1: '大部分晴天',
            2: '部分多云',
            3: '阴天',
            45: '雾',
            48: '雾凇',
            51: '毛毛雨',
            53: '中度毛毛雨',
            55: '浓密毛毛雨',
            56: '冻毛毛雨',
            57: '浓密冻毛毛雨',
            61: '小雨',
            63: '中雨',
            65: '大雨',
            66: '冻雨',
            67: '重度冻雨',
            71: '小雪',
            73: '中雪',
            75: '大雪',
            77: '雪粒',
            80: '小阵雨',
            81: '中阵雨',
            82: '大阵雨',
            85: '小阵雪',
            86: '大阵雪',
            95: '雷暴',
            96: '雷暴伴随小冰雹',
            99: '雷暴伴随大冰雹'
        };
    }
    
    /**
     * 根据城市名称获取地理坐标
     * @param {string} cityName - 城市名称
     * @returns {Promise} - 包含经纬度的Promise
     */
    async getCoordinatesByCity(cityName) {
        const cacheKey = `geo-${cityName}`;
        
        // 检查缓存
        if (this.checkCache(cacheKey)) {
            return this.cache[cacheKey].data;
        }
        
        try {
            // 增加返回结果数量，提高查找成功率
            const url = `${this.geocodeUrl}?name=${encodeURIComponent(cityName)}&count=10&language=${this.lang}`;
            
            console.log("搜索城市URL:", url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`获取城市坐标失败: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            console.log("城市搜索结果:", data);
            
            if (!data || !data.results || data.results.length === 0) {
                // 尝试使用备用API
                return await this.getCoordinatesByCityBackup(cityName);
            }
            
            // 找到了结果，使用第一个
            const location = data.results[0];
            const result = {
                lat: location.latitude,
                lon: location.longitude,
                name: location.name
            };
            
            // 保存到缓存
            this.saveToCache(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('获取城市坐标失败:', error);
            // 尝试使用备用方法
            return await this.getCoordinatesByCityBackup(cityName);
        }
    }
    
    /**
     * 使用备用API获取城市坐标
     * @param {string} cityName - 城市名称
     * @returns {Promise} - 包含经纬度的Promise
     */
    async getCoordinatesByCityBackup(cityName) {
        try {
            console.log("使用备用API搜索城市:", cityName);
            
            // 直接尝试中国城市特殊处理，避免API调用
            if (this.isChineseCityName(cityName)) {
                console.log("检测到中文城市名，优先使用中国城市特殊处理");
                return await this.findChineseCity(cityName);
            }
            
            // 使用Nominatim API的超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
            
            try {
            // 使用Nominatim API作为备用
            const backupUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=5&accept-language=zh`;
            
            const response = await fetch(backupUrl, {
                headers: {
                        'User-Agent': 'SimpleWeatherApp/1.0'
                    },
                    signal: controller.signal
            });
                
                clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`备用API获取城市坐标失败: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("备用API城市搜索结果:", data);
            
            if (!data || data.length === 0) {
                    // 如果找不到，尝试通用城市处理
                    return this.handleGenericCity(cityName);
            }
            
            // 使用第一个结果
            const location = data[0];
            const result = {
                lat: parseFloat(location.lat),
                lon: parseFloat(location.lon),
                name: location.display_name.split(',')[0] // 只取地名的第一部分作为城市名
            };
            
            // 保存到缓存
            this.saveToCache(`geo-${cityName}`, result);
            
            return result;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error('备用API请求失败:', fetchError);
                
                // API调用失败，尝试通用城市处理
                return this.handleGenericCity(cityName);
            }
        } catch (error) {
            console.error('备用API获取城市坐标失败:', error);
            return this.handleGenericCity(cityName);
        }
    }
    
    /**
     * 通用城市处理，用于API失败时
     * @param {string} cityName - 城市名称
     * @returns {Object} - 城市坐标对象
     */
    handleGenericCity(cityName) {
        // 常见国际城市坐标，如果中文处理和API都失败时使用
        const worldCities = {
            'london': { lat: 51.5074, lon: -0.1278, name: 'London' },
            'new york': { lat: 40.7128, lon: -74.0060, name: 'New York' },
            'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
            'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
            'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
            'rome': { lat: 41.9028, lon: 12.4964, name: 'Rome' }
        };
        
        // 尝试中文城市特殊处理
            if (this.isChineseCityName(cityName)) {
                return this.findChineseCity(cityName);
            }
            
        // 检查是否匹配常见国际城市
        const lowerCityName = cityName.toLowerCase();
        for (const city in worldCities) {
            if (lowerCityName.includes(city) || city.includes(lowerCityName)) {
                console.log(`找到匹配的国际城市: ${city}`);
                return worldCities[city];
            }
        }
        
        // 如果都找不到，返回一个默认城市（北京）
        console.log(`找不到匹配城市，使用默认城市`);
        return {
            lat: 39.9042, 
            lon: 116.4074, 
            name: `未找到"${cityName}"，显示默认城市`
        };
    }
    
    /**
     * 检查是否是中文城市名
     */
    isChineseCityName(cityName) {
        // 简单检查是否包含中文字符
        return /[\u4e00-\u9fa5]/.test(cityName);
    }
    
    /**
     * 对中国城市名进行特殊处理
     */
    async findChineseCity(cityName) {
        // 常见中国城市的坐标映射
        const commonCities = {
            // 直辖市
            '北京': { lat: 39.9042, lon: 116.4074, name: '北京市' },
            '上海': { lat: 31.2304, lon: 121.4737, name: '上海市' },
            '天津': { lat: 39.3434, lon: 117.3616, name: '天津市' },
            '重庆': { lat: 29.5630, lon: 106.5516, name: '重庆市' },
            
            // 省会城市
            '广州': { lat: 23.1291, lon: 113.2644, name: '广州市' },
            '杭州': { lat: 30.2741, lon: 120.1551, name: '杭州市' },
            '南京': { lat: 32.0603, lon: 118.7969, name: '南京市' },
            '成都': { lat: 30.5723, lon: 104.0665, name: '成都市' },
            '武汉': { lat: 30.5928, lon: 114.3055, name: '武汉市' },
            '西安': { lat: 34.3416, lon: 108.9398, name: '西安市' },
            '郑州': { lat: 34.7466, lon: 113.6253, name: '郑州市' },
            '长沙': { lat: 28.2278, lon: 112.9388, name: '长沙市' },
            '哈尔滨': { lat: 45.8038, lon: 126.5347, name: '哈尔滨市' },
            '沈阳': { lat: 41.8057, lon: 123.4315, name: '沈阳市' },
            '呼和浩特': { lat: 40.8414, lon: 111.7519, name: '呼和浩特市' },
            '太原': { lat: 37.8708, lon: 112.5551, name: '太原市' },
            '石家庄': { lat: 38.0428, lon: 114.5149, name: '石家庄市' },
            '长春': { lat: 43.8971, lon: 125.3245, name: '长春市' },
            '合肥': { lat: 31.8201, lon: 117.2272, name: '合肥市' },
            '南昌': { lat: 28.6820, lon: 115.8579, name: '南昌市' },
            '福州': { lat: 26.0740, lon: 119.2965, name: '福州市' },
            '济南': { lat: 36.6512, lon: 117.1201, name: '济南市' },
            '兰州': { lat: 36.0617, lon: 103.8318, name: '兰州市' },
            '西宁': { lat: 36.6171, lon: 101.7787, name: '西宁市' },
            '拉萨': { lat: 29.6500, lon: 91.1000, name: '拉萨市' },
            '银川': { lat: 38.4864, lon: 106.2318, name: '银川市' },
            '昆明': { lat: 25.0438, lon: 102.7055, name: '昆明市' },
            '贵阳': { lat: 26.6470, lon: 106.6302, name: '贵阳市' },
            '南宁': { lat: 22.8170, lon: 108.3665, name: '南宁市' },
            '海口': { lat: 20.0442, lon: 110.1994, name: '海口市' },
            '乌鲁木齐': { lat: 43.8225, lon: 87.6271, name: '乌鲁木齐市' },
            
            // 新疆主要城市
            '喀什': { lat: 39.4547, lon: 75.9797, name: '喀什市' },
            '克拉玛依': { lat: 45.5809, lon: 84.8891, name: '克拉玛依市' },
            '吐鲁番': { lat: 42.9479, lon: 89.1849, name: '吐鲁番市' },
            '哈密': { lat: 42.8286, lon: 93.5128, name: '哈密市' },
            '阿克苏': { lat: 41.1676, lon: 80.2637, name: '阿克苏市' },
            '库尔勒': { lat: 41.7268, lon: 86.1745, name: '库尔勒市' },
            '伊犁': { lat: 43.9132, lon: 81.3304, name: '伊犁市' },
            '和田': { lat: 37.1107, lon: 79.9300, name: '和田市' },
            
            // 西藏主要城市
            '日喀则': { lat: 29.2678, lon: 88.8825, name: '日喀则市' },
            '林芝': { lat: 29.6491, lon: 94.3624, name: '林芝市' },
            '山南': { lat: 29.2378, lon: 91.7710, name: '山南市' },
            '昌都': { lat: 31.1405, lon: 97.1715, name: '昌都市' },
            '那曲': { lat: 31.4766, lon: 92.0569, name: '那曲市' },
            '阿里': { lat: 32.5007, lon: 80.1055, name: '阿里地区' },
            
            // 其他主要城市
            '深圳': { lat: 22.5431, lon: 114.0579, name: '深圳市' },
            '东莞': { lat: 23.0209, lon: 113.7486, name: '东莞市' },
            '青岛': { lat: 36.0671, lon: 120.3826, name: '青岛市' },
            '苏州': { lat: 31.2990, lon: 120.5853, name: '苏州市' },
            '厦门': { lat: 24.4795, lon: 118.0894, name: '厦门市' },
            '宁波': { lat: 29.8683, lon: 121.5440, name: '宁波市' },
            '珠海': { lat: 22.2710, lon: 113.5767, name: '珠海市' },
            '佛山': { lat: 23.0221, lon: 113.1214, name: '佛山市' },
            '无锡': { lat: 31.5688, lon: 120.2985, name: '无锡市' },
            '大连': { lat: 38.9140, lon: 121.6147, name: '大连市' },
            '烟台': { lat: 37.5382, lon: 121.3826, name: '烟台市' },
            '威海': { lat: 37.5128, lon: 122.1208, name: '威海市' },
            '汕头': { lat: 23.3535, lon: 116.6820, name: '汕头市' },
            '潮州': { lat: 23.6618, lon: 116.6220, name: '潮州市' },
            '汕尾': { lat: 22.7862, lon: 115.3720, name: '汕尾市' },
            '湛江': { lat: 21.2712, lon: 110.3594, name: '湛江市' },
            '茂名': { lat: 21.6632, lon: 110.9192, name: '茂名市' },
            '惠州': { lat: 23.1117, lon: 114.4161, name: '惠州市' },
            '江门': { lat: 22.5784, lon: 113.0823, name: '江门市' },
            '肇庆': { lat: 23.0469, lon: 112.4659, name: '肇庆市' },
            '梅州': { lat: 24.2990, lon: 116.1225, name: '梅州市' },
            '韶关': { lat: 24.8108, lon: 113.5980, name: '韶关市' },
            '河源': { lat: 23.7430, lon: 114.6978, name: '河源市' },
            '清远': { lat: 23.6782, lon: 113.0559, name: '清远市' },
            '中山': { lat: 22.5175, lon: 113.3926, name: '中山市' },
            '衡阳': { lat: 26.8964, lon: 112.5719, name: '衡阳市' },
            '桂林': { lat: 25.2736, lon: 110.2899, name: '桂林市' },
            '三亚': { lat: 18.2525, lon: 109.5120, name: '三亚市' },
            '呼什哈': { lat: 49.2122, lon: 119.7390, name: '呼什哈市' },
            '常州': { lat: 31.8105, lon: 119.9740, name: '常州市' },
            '南通': { lat: 31.9800, lon: 120.8942, name: '南通市' },
            '嘉兴': { lat: 30.7522, lon: 120.7555, name: '嘉兴市' },
            '金华': { lat: 29.0784, lon: 119.6478, name: '金华市' },
            '绍兴': { lat: 30.0299, lon: 120.5854, name: '绍兴市' },
            '温州': { lat: 27.9939, lon: 120.6994, name: '温州市' },
            '台州': { lat: 28.6563, lon: 121.4208, name: '台州市' },
            '沧州': { lat: 38.3037, lon: 116.8388, name: '沧州市' },
            '保定': { lat: 38.8671, lon: 115.4846, name: '保定市' },
            '唐山': { lat: 39.6305, lon: 118.1804, name: '唐山市' },
            '秦皇岛': { lat: 39.9353, lon: 119.5976, name: '秦皇岛市' },
            '邯郸': { lat: 36.6259, lon: 114.5391, name: '邯郸市' },
            '邢台': { lat: 37.0695, lon: 114.5048, name: '邢台市' },
            '张家口': { lat: 40.7670, lon: 114.8838, name: '张家口市' },
            '承德': { lat: 40.9515, lon: 117.9634, name: '承德市' },
            '衡水': { lat: 37.7393, lon: 115.6709, name: '衡水市' },
            '廊坊': { lat: 39.5176, lon: 116.6896, name: '廊坊市' },
            '临汾': { lat: 36.0918, lon: 111.5207, name: '临汾市' },
            '运城': { lat: 35.0225, lon: 111.0077, name: '运城市' },
            '大同': { lat: 40.0764, lon: 113.3001, name: '大同市' },
            '长治': { lat: 36.1953, lon: 113.1173, name: '长治市' },
            '晋城': { lat: 35.4911, lon: 112.8511, name: '晋城市' },
            '晋中': { lat: 37.6869, lon: 112.7526, name: '晋中市' },
            '吕梁': { lat: 37.5194, lon: 111.1414, name: '吕梁市' },
            '呼伦贝尔': { lat: 49.2122, lon: 119.7390, name: '呼伦贝尔市' },
            '包头': { lat: 40.6574, lon: 109.8400, name: '包头市' },
            '赤峰': { lat: 42.2586, lon: 118.8878, name: '赤峰市' },
            '通辽': { lat: 43.6525, lon: 122.2437, name: '通辽市' },
            '鄂尔多斯': { lat: 39.6086, lon: 109.7811, name: '鄂尔多斯市' },
            '乌海': { lat: 39.6547, lon: 106.8293, name: '乌海市' },
            '吉林': { lat: 43.8377, lon: 126.5485, name: '吉林市' },
            '四平': { lat: 43.1667, lon: 124.3500, name: '四平市' },
            '辽源': { lat: 42.9021, lon: 125.1458, name: '辽源市' },
            '通化': { lat: 41.7363, lon: 125.9399, name: '通化市' },
            '白山': { lat: 41.9458, lon: 126.4279, name: '白山市' },
            '松原': { lat: 45.1365, lon: 124.8268, name: '松原市' },
            '白城': { lat: 45.6195, lon: 122.8413, name: '白城市' },
            '齐齐哈尔': { lat: 47.3543, lon: 123.9184, name: '齐齐哈尔市' },
            '牡丹江': { lat: 44.5893, lon: 129.6088, name: '牡丹江市' },
            '佳木斯': { lat: 46.8137, lon: 130.3210, name: '佳木斯市' },
            '大庆': { lat: 46.5959, lon: 125.1035, name: '大庆市' },
            '鸡西': { lat: 45.2952, lon: 130.9692, name: '鸡西市' },
            '双鸭山': { lat: 46.6434, lon: 131.1593, name: '双鸭山市' },
            '伊春': { lat: 47.7277, lon: 128.8993, name: '伊春市' },
            '七台河': { lat: 45.7750, lon: 131.0033, name: '七台河市' },
            '鹤岗': { lat: 47.3493, lon: 130.2982, name: '鹤岗市' },
            '绥化': { lat: 46.6527, lon: 126.9688, name: '绥化市' },
            '黑河': { lat: 50.2454, lon: 127.5297, name: '黑河市' },
            '大兴安岭': { lat: 52.3353, lon: 124.7110, name: '大兴安岭地区' },
            
            // 江苏省更多城市
            '徐州': { lat: 34.2044, lon: 117.2880, name: '徐州市' },
            '连云港': { lat: 34.5966, lon: 119.2215, name: '连云港市' },
            '淮安': { lat: 33.5097, lon: 119.1132, name: '淮安市' },
            '盐城': { lat: 33.3489, lon: 120.1632, name: '盐城市' },
            '扬州': { lat: 32.3943, lon: 119.4125, name: '扬州市' },
            '镇江': { lat: 32.1868, lon: 119.4249, name: '镇江市' },
            '泰州': { lat: 32.4711, lon: 119.9229, name: '泰州市' },
            '宿迁': { lat: 33.9632, lon: 118.2757, name: '宿迁市' },
            
            // 浙江省更多城市
            '湖州': { lat: 30.8929, lon: 120.0879, name: '湖州市' },
            '丽水': { lat: 28.4565, lon: 119.9229, name: '丽水市' },
            '衢州': { lat: 28.9565, lon: 118.8597, name: '衢州市' },
            '舟山': { lat: 30.0361, lon: 122.1069, name: '舟山市' },
            
            // 安徽省更多城市
            '芜湖': { lat: 31.3334, lon: 118.3799, name: '芜湖市' },
            '蚌埠': { lat: 32.9370, lon: 117.3900, name: '蚌埠市' },
            '淮南': { lat: 32.6260, lon: 116.9992, name: '淮南市' },
            '马鞍山': { lat: 31.6696, lon: 118.5052, name: '马鞍山市' },
            '淮北': { lat: 33.9549, lon: 116.7977, name: '淮北市' },
            '铜陵': { lat: 30.9455, lon: 117.8123, name: '铜陵市' },
            '安庆': { lat: 30.5435, lon: 117.0637, name: '安庆市' },
            '黄山': { lat: 29.7147, lon: 118.3375, name: '黄山市' },
            '阜阳': { lat: 32.8897, lon: 115.8141, name: '阜阳市' },
            '宿州': { lat: 33.6461, lon: 116.9641, name: '宿州市' },
            '滁州': { lat: 32.3019, lon: 118.3164, name: '滁州市' },
            '六安': { lat: 31.7350, lon: 116.5225, name: '六安市' },
            '宣城': { lat: 30.9454, lon: 118.7581, name: '宣城市' },
            '池州': { lat: 30.6648, lon: 117.4908, name: '池州市' },
            '亳州': { lat: 33.8693, lon: 115.7784, name: '亳州市' },
            
            // 福建省更多城市
            '莆田': { lat: 25.4539, lon: 119.0078, name: '莆田市' },
            '三明': { lat: 26.2654, lon: 117.6389, name: '三明市' },
            '泉州': { lat: 24.8741, lon: 118.6750, name: '泉州市' },
            '漳州': { lat: 24.5130, lon: 117.6471, name: '漳州市' },
            '南平': { lat: 26.6436, lon: 118.1783, name: '南平市' },
            '龙岩': { lat: 25.0753, lon: 117.0176, name: '龙岩市' },
            '宁德': { lat: 26.6565, lon: 119.5483, name: '宁德市' },
            
            // 四川省更多城市
            '自贡': { lat: 29.3391, lon: 104.7794, name: '自贡市' },
            '攀枝花': { lat: 26.5824, lon: 101.7188, name: '攀枝花市' },
            '泸州': { lat: 28.8916, lon: 105.4422, name: '泸州市' },
            '德阳': { lat: 31.1311, lon: 104.3980, name: '德阳市' },
            '绵阳': { lat: 31.4678, lon: 104.6796, name: '绵阳市' },
            '广元': { lat: 32.4366, lon: 105.8442, name: '广元市' },
            '遂宁': { lat: 30.5332, lon: 105.5932, name: '遂宁市' },
            '内江': { lat: 29.5827, lon: 105.0588, name: '内江市' },
            '乐山': { lat: 29.5522, lon: 103.7661, name: '乐山市' },
            '南充': { lat: 30.8373, lon: 106.1105, name: '南充市' },
            '眉山': { lat: 30.0751, lon: 103.8493, name: '眉山市' },
            '宜宾': { lat: 28.7523, lon: 104.6419, name: '宜宾市' },
            '广安': { lat: 30.4568, lon: 106.6333, name: '广安市' },
            '达州': { lat: 31.2136, lon: 107.4678, name: '达州市' },
            '雅安': { lat: 30.0131, lon: 103.0427, name: '雅安市' },
            '巴中': { lat: 31.8590, lon: 106.7478, name: '巴中市' },
            '资阳': { lat: 30.1222, lon: 104.6419, name: '资阳市' },
            '阿坝': { lat: 31.8994, lon: 102.2212, name: '阿坝藏族羌族自治州' },
            '甘孜': { lat: 30.0498, lon: 101.9651, name: '甘孜藏族自治州' },
            '凉山': { lat: 27.8857, lon: 102.2673, name: '凉山彝族自治州' },
            
            // 广东省更多城市
            '阳江': { lat: 21.8581, lon: 111.9823, name: '阳江市' },
            '云浮': { lat: 22.9154, lon: 112.0444, name: '云浮市' },
            '揭阳': { lat: 23.5493, lon: 116.3729, name: '揭阳市' },
            
            // 港澳台
            '香港': { lat: 22.3193, lon: 114.1694, name: '香港特别行政区' },
            '澳门': { lat: 22.1987, lon: 113.5439, name: '澳门特别行政区' },
            '台北': { lat: 25.0320, lon: 121.5654, name: '台北市' },
            '高雄': { lat: 22.6163, lon: 120.3133, name: '高雄市' },
            '台中': { lat: 24.1477, lon: 120.6736, name: '台中市' },
            '台南': { lat: 22.9908, lon: 120.2133, name: '台南市' },
        };
        
        // 检查是否是完全匹配的城市名
        for (const city in commonCities) {
            if (cityName.includes(city) || city.includes(cityName)) {
                console.log(`找到匹配的中国城市: ${city}`);
                return commonCities[city];
            }
        }
        
        // 模糊匹配
        for (const city in commonCities) {
            // 如果城市名中包含输入的一部分，或输入中包含城市名的一部分
            if (city.length >= 2 && 
                (cityName.includes(city.substring(0, 2)) || 
                 (cityName.length >= 2 && city.includes(cityName.substring(0, 2))))) {
                console.log(`找到模糊匹配的中国城市: ${city}`);
                return {
                    ...commonCities[city],
                    name: `${commonCities[city].name} (可能匹配: ${cityName})`
                };
            }
        }
        
        // 如果都找不到，返回一个默认城市（北京）
        console.log(`找不到匹配城市，使用默认城市: 北京`);
        return {
            ...commonCities['北京'],
            name: `北京市 (未找到: ${cityName})`
        };
    }
    
    /**
     * 根据经纬度获取位置名称
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @returns {Promise<string>} - 包含位置名称的Promise
     */
    async getLocationName(lat, lon) {
        const cacheKey = `revgeo-${lat}-${lon}`;
        
        // 检查缓存
        if (this.checkCache(cacheKey)) {
            return this.cache[cacheKey].data;
        }
        
        try {
            // 使用BigDataCloud API，这个API允许跨域请求
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`获取位置名称失败: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 获取位置信息
            let name = '未知位置';
            
            if (data) {
                // 尝试获取不同级别的位置名称
                if (data.city) {
                    name = data.city;
                } else if (data.locality) {
                    name = data.locality;
                } else if (data.principalSubdivision) {
                    name = data.principalSubdivision;
                } else if (data.countryName) {
                    name = `${data.countryName}区域`;
                }
            }
            
            // 如果没有获取到有效位置名称，使用坐标
            if (name === '未知位置') {
                name = `位置(${lat.toFixed(2)}, ${lon.toFixed(2)})`;
            }
            
            // 保存到缓存
            this.saveToCache(cacheKey, name);
            
            return name;
        } catch (error) {
            console.error('获取位置名称失败:', error);
            
            // 出错时使用备用方案
            try {
                // 备用API方案
                const backupUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=zh`;
                const backupResponse = await fetch(backupUrl, {
                    headers: {
                        'User-Agent': 'SimpleWeatherApp/1.0'  // 必须提供User-Agent
                    }
                });
                
                if (backupResponse.ok) {
                    const backupData = await backupResponse.json();
                    if (backupData && backupData.display_name) {
                        const parts = backupData.display_name.split(', ');
                        // 通常城市名位于前面的部分
                        const cityName = parts.length > 1 ? parts[0] : backupData.display_name;
                        
                        // 保存到缓存
                        this.saveToCache(cacheKey, cityName);
                        return cityName;
                    }
                }
            } catch (backupError) {
                console.error('备用地理编码API也失败:', backupError);
            }
            
            // 所有方法都失败时返回坐标
            return `位置(${lat.toFixed(2)}, ${lon.toFixed(2)})`;
        }
    }
    
    /**
     * 获取当前天气
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @returns {Promise} - 包含当前天气的Promise
     */
    async getCurrentWeather(lat, lon) {
        const cacheKey = `current-${lat}-${lon}`;
        
        // 检查缓存
        if (this.checkCache(cacheKey)) {
            return this.cache[cacheKey].data;
        }
        
        try {
            // 使用支持CORS的API版本
            const url = `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;
            
            console.log('获取当前天气URL:', url);
            
            // 添加超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            
            // 添加CORS模式
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`获取当前天气失败: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('获取到的天气数据:', data);
            
            if (!data || !data.current) {
                throw new Error(`获取当前天气失败: 数据格式错误`);
            }
            
            // 格式化数据
            const current = data.current;
            const weatherCode = current.weather_code || 0; // 默认值为0（晴天）
            
            // 获取天气描述和图标
            const weatherText = this.wmoToText[weatherCode] || '未知';
            const weatherIcon = this.wmoToIcon[weatherCode] || '☀️';
            
            // 格式化为简化的数据结构，直接提供给UI使用
            const formattedData = {
                temp: current.temperature_2m || 0,
                feelsLike: current.apparent_temperature || 0,
                humidity: current.relative_humidity_2m || 0,
                pressure: current.surface_pressure || 1013,
                windSpeed: current.wind_speed_10m || 0,
                windDeg: current.wind_direction_10m || 0,
                weatherCode: weatherCode,
                weatherText: weatherText,
                weatherIcon: weatherIcon,
                dt: new Date(current.time).getTime() / 1000
            };
            
            console.log('格式化后的天气数据:', formattedData);
            
            // 保存到缓存
            this.saveToCache(cacheKey, formattedData);
            
            return formattedData;
        } catch (error) {
            console.error('获取当前天气失败:', error);
            
            // 如果是超时或网络错误，返回默认数据
            if (error.name === 'AbortError' || error.message.includes('network') || error.message.includes('fetch')) {
                console.log('使用默认天气数据');
                return {
                    temp: 20,
                    feelsLike: 20,
                    humidity: 50,
                    pressure: 1013,
                    windSpeed: 2,
                    windDeg: 0,
                    weatherCode: 0,
                    weatherText: '晴天(默认数据)',
                    weatherIcon: '☀️',
                    dt: Math.floor(Date.now() / 1000)
                };
            }
            
            throw error;
        }
    }
    
    /**
     * 获取天气预报
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @returns {Promise} - 包含天气预报的Promise
     */
    async getForecast(lat, lon) {
        const cacheKey = `forecast-${lat}-${lon}`;
        
        // 检查缓存
        if (this.checkCache(cacheKey)) {
            return this.cache[cacheKey].data;
        }
        
        try {
            const url = `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&timezone=auto`;
            
            console.log('获取天气预报URL:', url);
            
            // 添加超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            
            const response = await fetch(url, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`获取天气预报失败: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            console.log('获取到的预报数据:', data);
            
            if (!data || !data.daily) {
                throw new Error(`获取天气预报失败: 数据格式错误`);
            }
            
            const daily = data.daily;
            
            // 创建每日预报数据
            const dailyForecasts = [];
            for (let i = 0; i < daily.time.length; i++) {
                const weatherCode = daily.weather_code[i] || 0;
                const weatherText = this.wmoToText[weatherCode] || '未知';
                const weatherIcon = this.wmoToIcon[weatherCode] || '☀️';
                
                dailyForecasts.push({
                    dt: Math.floor(new Date(daily.time[i]).getTime() / 1000),
                    date: daily.time[i],
                    temp_min: daily.temperature_2m_min[i] || 0,
                    temp_max: daily.temperature_2m_max[i] || 0,
                    feels_like_min: daily.apparent_temperature_min[i] || 0,
                    feels_like_max: daily.apparent_temperature_max[i] || 0,
                    precipitation: daily.precipitation_sum ? daily.precipitation_sum[i] || 0 : 0,
                    weatherCode: weatherCode,
                    weatherText: weatherText,
                    weatherIcon: weatherIcon,
                    weather: [{
                        id: weatherCode,
                        main: weatherText,
                        description: weatherText,
                        icon: weatherCode.toString().padStart(2, '0') + 'd'
                    }]
                });
            }
            
            // 格式化为应用需要的格式
            const formattedData = {
                list: dailyForecasts
            };
            
            console.log('格式化后的预报数据:', formattedData);
            
            // 保存到缓存
            this.saveToCache(cacheKey, formattedData);
            
            return formattedData;
        } catch (error) {
            console.error('获取天气预报失败:', error);
            
            // 如果是超时或网络错误，返回默认数据
            if (error.name === 'AbortError' || error.message.includes('network') || error.message.includes('fetch')) {
                console.log('使用默认天气预报数据');
                
                // 创建未来7天的默认预报
                const defaultForecasts = [];
                const today = new Date();
                
                for (let i = 0; i < 7; i++) {
                    const forecastDate = new Date(today);
                    forecastDate.setDate(today.getDate() + i);
                    
                    defaultForecasts.push({
                        dt: Math.floor(forecastDate.getTime() / 1000),
                        date: forecastDate.toISOString().split('T')[0],
                        temp_min: 15 + Math.floor(Math.random() * 5),
                        temp_max: 22 + Math.floor(Math.random() * 7),
                        feels_like_min: 14 + Math.floor(Math.random() * 5),
                        feels_like_max: 23 + Math.floor(Math.random() * 7),
                        precipitation: Math.random() * 2,
                        weatherCode: i % 3 === 0 ? 1 : (i % 3 === 1 ? 2 : 0),
                        weatherText: i % 3 === 0 ? '多云' : (i % 3 === 1 ? '部分多云' : '晴天'),
                        weatherIcon: i % 3 === 0 ? '🌤️' : (i % 3 === 1 ? '⛅' : '☀️'),
                        weather: [{
                            id: i % 3 === 0 ? 1 : (i % 3 === 1 ? 2 : 0),
                            main: i % 3 === 0 ? '多云' : (i % 3 === 1 ? '部分多云' : '晴天'),
                            description: i % 3 === 0 ? '多云' : (i % 3 === 1 ? '部分多云' : '晴天'),
                            icon: (i % 3 === 0 ? '01' : (i % 3 === 1 ? '02' : '01')) + 'd'
                        }]
                    });
                }
                
                return {
                    list: defaultForecasts
                };
            }
            
            throw error;
        }
    }
    
    /**
     * 获取天气图标
     * @param {string} iconCode - 天气图标代码
     * @returns {string} - 天气图标
     */
    getIconFromCode(iconCode) {
        // iconCode格式通常如："01d", "02n"等
        // 提取数字部分
        const code = parseInt(iconCode.substring(0, 2));
        
        // 简单映射OpenWeatherMap图标代码到WMO代码
        const codeMap = {
            1: 0,  // 晴天
            2: 1,  // 少云
            3: 2,  // 多云
            4: 3,  // 阴天
            9: 61, // 小雨
            10: 63, // 雨
            11: 95, // 雷雨
            13: 71, // 雪
            50: 45  // 雾
        };
        
        const wmoCode = codeMap[code] || 0;
        return this.wmoToIcon[wmoCode] || '☀️';
    }
    
    /**
     * 获取图标URL
     * @param {number} iconCode - 图标代码
     * @param {boolean} large - 是否使用大图标
     * @returns {string} - 图标URL
     */
    getIconUrl(iconCode, large = false) {
        return this.wmoToIcon[iconCode] || '☀️';
    }
    
    /**
     * 检查缓存是否有效
     * @param {string} key - 缓存键
     * @returns {boolean} - 缓存是否有效
     */
    checkCache(key) {
        if (!this.cache[key]) return false;
        
        const now = new Date().getTime();
        const timestamp = this.cache[key].timestamp;
        
        return (now - timestamp) < this.cacheTime;
    }
    
    /**
     * 保存数据到缓存
     * @param {string} key - 缓存键
     * @param {object} data - 数据
     */
    saveToCache(key, data) {
        this.cache[key] = {
            data,
            timestamp: new Date().getTime()
        };
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache = {};
    }
}

// 创建单例实例
const weatherService = new WeatherService(); 