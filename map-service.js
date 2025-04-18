/**
 * 地图服务 - 负责处理天气地图功能
 */

class MapService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.layers = {
            temperature: null,
            wind: null,
            precipitation: null
        };
        this.currentLocation = null;
    }

    /**
     * 初始化地图
     * @param {string} elementId - 地图容器元素ID
     */
    async initMap(elementId) {
        if (!window.L) {
            await this.loadLeaflet();
        }

        this.map = L.map(elementId).setView([30, 104], 4); // 初始视图为中国
        
        // 使用OpenStreetMap作为底图
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        return this.map;
    }

    /**
     * 加载Leaflet库
     * @returns {Promise} 加载完成的Promise
     */
    loadLeaflet() {
        return new Promise((resolve, reject) => {
            // 检查是否已经加载
            if (window.L) {
                resolve();
                return;
            }
            
            // 加载CSS
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
            document.head.appendChild(linkElement);
            
            // 加载JS
            const scriptElement = document.createElement('script');
            scriptElement.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
            scriptElement.onload = resolve;
            scriptElement.onerror = reject;
            document.head.appendChild(scriptElement);
        });
    }

    /**
     * 设置当前位置并更新地图视图
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @param {string} name - 位置名称
     */
    setCurrentLocation(lat, lon, name) {
        if (!this.map) {
            console.error('地图尚未初始化');
            return;
        }
        
        // 清除现有标记
        this.clearMarkers();
        
        // 保存当前位置
        this.currentLocation = { lat, lon, name };
        
        // 更新地图视图
        this.map.setView([lat, lon], 10);
        
        // 添加位置标记
        const marker = L.marker([lat, lon])
            .addTo(this.map)
            .bindPopup(`<b>${name}</b><br>纬度: ${lat}<br>经度: ${lon}`)
            .openPopup();
            
        this.markers.push(marker);
        
        // 加载天气图层
        this.loadWeatherLayers(lat, lon);
    }

    /**
     * 加载天气图层
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     */
    loadWeatherLayers(lat, lon) {
        // 清除现有图层
        this.clearLayers();
        
        // 加载温度图层
        this.loadTemperatureLayer();
        
        // 加载风力图层
        this.loadWindLayer();
        
        // 加载降水图层
        this.loadPrecipitationLayer();
    }

    /**
     * 加载温度图层
     */
    loadTemperatureLayer() {
        if (!this.map) return;
        
        // 使用OpenWeatherMap温度图层
        this.layers.temperature = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_OPENWEATHERMAP_KEY', {
            attribution: 'Map data &copy; OpenWeatherMap',
            maxZoom: 18,
            opacity: 0.5
        });
        
        // 模拟温度图层，实际项目中需要使用真实API
        this.simulateTemperatureLayer();
    }

    /**
     * 模拟温度图层（演示用）
     */
    simulateTemperatureLayer() {
        if (!this.map || !this.currentLocation) return;
        
        const { lat, lon } = this.currentLocation;
        
        // 添加一个简单的温度热区
        const circle = L.circle([lat, lon], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.3,
            radius: 30000
        }).addTo(this.map);
        
        this.layers.temperature = circle;
    }

    /**
     * 加载风力图层
     */
    loadWindLayer() {
        if (!this.map) return;
        
        // 使用OpenWeatherMap风力图层
        this.layers.wind = L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=YOUR_OPENWEATHERMAP_KEY', {
            attribution: 'Map data &copy; OpenWeatherMap',
            maxZoom: 18,
            opacity: 0.5
        });
        
        // 模拟风力图层，实际项目中需要使用真实API
        this.simulateWindLayer();
    }

    /**
     * 模拟风力图层（演示用）
     */
    simulateWindLayer() {
        if (!this.map || !this.currentLocation) return;
        
        const { lat, lon } = this.currentLocation;
        
        // 添加一个简单的风向箭头
        const windMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                html: '↑',
                className: 'wind-icon',
                iconSize: [20, 20]
            })
        }).addTo(this.map);
        
        this.layers.wind = windMarker;
    }

    /**
     * 加载降水图层
     */
    loadPrecipitationLayer() {
        if (!this.map) return;
        
        // 使用OpenWeatherMap降水图层
        this.layers.precipitation = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_OPENWEATHERMAP_KEY', {
            attribution: 'Map data &copy; OpenWeatherMap',
            maxZoom: 18,
            opacity: 0.5
        });
        
        // 模拟降水图层，实际项目中需要使用真实API
        this.simulatePrecipitationLayer();
    }

    /**
     * 模拟降水图层（演示用）
     */
    simulatePrecipitationLayer() {
        if (!this.map || !this.currentLocation) return;
        
        const { lat, lon } = this.currentLocation;
        
        // 添加一个简单的降水区域
        const precipCircle = L.circle([lat, lon], {
            color: 'blue',
            fillColor: '#0033ff',
            fillOpacity: 0.2,
            radius: 25000
        }).addTo(this.map);
        
        this.layers.precipitation = precipCircle;
    }

    /**
     * 清除所有标记
     */
    clearMarkers() {
        if (!this.map) return;
        
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        
        this.markers = [];
    }

    /**
     * 清除所有图层
     */
    clearLayers() {
        if (!this.map) return;
        
        Object.values(this.layers).forEach(layer => {
            if (layer && this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });
    }

    /**
     * 切换图层可见性
     * @param {string} layerName - 图层名称
     * @param {boolean} visible - 是否可见
     */
    toggleLayer(layerName, visible) {
        if (!this.map || !this.layers[layerName]) return;
        
        const layer = this.layers[layerName];
        
        if (visible && !this.map.hasLayer(layer)) {
            this.map.addLayer(layer);
        } else if (!visible && this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
        }
    }
}

// 创建全局实例
const mapService = new MapService(); 