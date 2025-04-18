/**
 * wttr.in服务 - 负责与wttr.in API交互
 */

class WttrService {
    constructor() {
        this.baseUrl = 'https://wttr.in';
        this.cache = {};
        this.cacheTime = 30 * 60 * 1000; // 30分钟缓存
    }

    /**
     * 获取终端格式的天气数据
     * @param {string} city 城市名称
     * @param {string} format 格式选项
     * @param {string} lang 语言
     * @returns {Promise<string>} 终端格式的天气数据
     */
    async getTerminalWeather(city, format = 'default', lang = 'zh') {
        const cacheKey = `terminal-${city}-${format}-${lang}`;
        
        // 检查缓存
        if (this.checkCache(cacheKey)) {
            return this.cache[cacheKey].data;
        }
        
        try {
            let url = `${this.baseUrl}/${encodeURIComponent(city)}`;
            
            // 添加查询参数
            const params = [];
            
            // 语言参数
            if (lang) {
                params.push(`lang=${lang}`);
            }
            
            // 格式参数
            if (format !== 'default') {
                if (format === 'custom' && this.customFormat) {
                    params.push(`format=${encodeURIComponent(this.customFormat)}`);
                } else if (!isNaN(parseInt(format))) {
                    params.push(`format=${format}`);
                } else if (format === '0') {
                    params.push('0');
                } else if (format === '1') {
                    params.push('1');
                } else if (format === '2') {
                    params.push('2');
                }
            }
            
            // 添加查询参数到URL
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            
            console.log('正在获取wttr.in数据:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`获取终端天气数据失败: ${response.statusText}`);
            }
            
            const data = await response.text();
            
            // 保存到缓存
            this.saveToCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('获取终端天气数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取wttr.in图片URL
     * @param {string} city 城市名称
     * @param {Object} options 配置选项
     * @returns {string} 图片URL
     */
    getImageUrl(city, options = {}) {
        const { transparent = false, lang = '' } = options;
        
        let url = `${this.baseUrl}/${encodeURIComponent(city)}.png`;
        
        // 添加选项
        const params = [];
        
        if (transparent) {
            params.push('t');
        }
        
        if (lang) {
            params.push(`lang=${lang}`);
        }
        
        // 添加参数到URL (注意wttr.in的PNG格式使用_而不是?)
        if (params.length > 0) {
            url += '_' + params.join('_');
        }
        
        return url;
    }

    /**
     * 获取月相数据
     * @param {string} lang 语言
     * @returns {Promise<string>} 月相数据
     */
    async getMoonPhase(lang = 'zh') {
        const cacheKey = `moon-${lang}`;
        
        // 检查缓存
        if (this.checkCache(cacheKey)) {
            return this.cache[cacheKey].data;
        }
        
        try {
            let url = `${this.baseUrl}/Moon`;
            
            // 添加语言参数
            if (lang) {
                url += `?lang=${lang}`;
            }
            
            console.log('正在获取月相数据:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`获取月相数据失败: ${response.statusText}`);
            }
            
            const data = await response.text();
            
            // 保存到缓存
            this.saveToCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('获取月相数据失败:', error);
            throw error;
        }
    }

    /**
     * 设置自定义格式
     * @param {string} format 自定义格式字符串
     */
    setCustomFormat(format) {
        this.customFormat = format;
    }

    /**
     * 检查缓存
     * @param {string} key 缓存键
     * @returns {boolean} 是否有效
     */
    checkCache(key) {
        if (key in this.cache) {
            const cacheItem = this.cache[key];
            const now = new Date().getTime();
            
            // 检查缓存是否过期
            if (now - cacheItem.timestamp < this.cacheTime) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 保存到缓存
     * @param {string} key 缓存键
     * @param {any} data 要缓存的数据
     */
    saveToCache(key, data) {
        this.cache[key] = {
            timestamp: new Date().getTime(),
            data: data
        };
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache = {};
    }
}

// 创建全局实例
const wttrService = new WttrService(); 