/**
 * 通用工具函数
 */

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 日期格式
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // 替换格式字符串
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 获取星期几
 * @param {Date} date - 日期对象
 * @param {string} lang - 语言 (zh或en)
 * @returns {string} 星期几
 */
function getDayOfWeek(date, lang = 'zh') {
    const days = {
        zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    
    return days[lang][date.getDay()];
}

/**
 * 转换温度
 * @param {number} temp - 温度值
 * @param {string} from - 源单位 ('celsius'或'fahrenheit')
 * @param {string} to - 目标单位 ('celsius'或'fahrenheit')
 * @returns {number} 转换后的温度
 */
function convertTemperature(temp, from = 'celsius', to = 'fahrenheit') {
    if (from === to) return temp;
    
    if (from === 'celsius' && to === 'fahrenheit') {
        return (temp * 9/5) + 32;
    } else if (from === 'fahrenheit' && to === 'celsius') {
        return (temp - 32) * 5/9;
    }
    
    return temp;
}

/**
 * 从本地存储获取数据
 * @param {string} key - 存储键名
 * @returns {any} 存储的数据
 */
function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('从本地存储获取数据失败:', error);
        return null;
    }
}

/**
 * 保存数据到本地存储
 * @param {string} key - 存储键名
 * @param {any} data - 要存储的数据
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('保存数据到本地存储失败:', error);
    }
}

/**
 * 将文本复制到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 复制是否成功
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // 兼容老浏览器
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    } catch (error) {
        console.error('复制到剪贴板失败:', error);
        return false;
    }
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} 防抖函数
 */
function debounce(func, delay = 300) {
    let timer = null;
    
    return function(...args) {
        if (timer) {
            clearTimeout(timer);
        }
        
        timer = setTimeout(() => {
            func.apply(this, args);
            timer = null;
        }, delay);
    };
}

/**
 * 导出为JSON文件
 * @param {Object} data - 要导出的数据
 * @param {string} filename - 文件名
 */
function exportAsJson(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
} 