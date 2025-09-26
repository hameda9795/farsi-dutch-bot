/**
 * Keep-Alive Service for Render Free Plan
 * Prevents the service from sleeping by sending periodic requests
 */

const https = require('https');
const http = require('http');

class KeepAliveService {
    constructor(url, options = {}) {
        this.url = url;
        this.interval = options.interval || 10 * 60 * 1000; // 10 minutes default
        this.timeout = options.timeout || 30000; // 30 seconds timeout
        this.retryDelay = options.retryDelay || 5000; // 5 seconds retry delay
        this.maxRetries = options.maxRetries || 3;
        this.isRunning = false;
        this.intervalId = null;
        this.consecutiveFailures = 0;
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
        this.startTime = new Date();
        
        // Bind methods to preserve context
        this.ping = this.ping.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
    }

    // Send ping request to keep service alive
    async ping() {
        return new Promise((resolve, reject) => {
            this.totalRequests++;
            const startTime = Date.now();
            
            console.log(`🏓 Keep-alive ping #${this.totalRequests} at ${new Date().toISOString()}`);
            
            const client = this.url.startsWith('https://') ? https : http;
            const options = {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'KeepAlive-Bot/1.0'
                }
            };

            const req = client.get(this.url, options, (res) => {
                const responseTime = Date.now() - startTime;
                
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    this.successfulRequests++;
                    this.consecutiveFailures = 0;
                    console.log(`✅ Keep-alive success (${res.statusCode}) in ${responseTime}ms`);
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        responseTime
                    });
                } else {
                    this.failedRequests++;
                    this.consecutiveFailures++;
                    console.log(`⚠️  Keep-alive warning: HTTP ${res.statusCode} in ${responseTime}ms`);
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        responseTime
                    });
                }
            });

            req.on('timeout', () => {
                req.destroy();
                this.failedRequests++;
                this.consecutiveFailures++;
                const responseTime = Date.now() - startTime;
                console.log(`⏰ Keep-alive timeout after ${responseTime}ms`);
                reject(new Error('Request timeout'));
            });

            req.on('error', (error) => {
                this.failedRequests++;
                this.consecutiveFailures++;
                const responseTime = Date.now() - startTime;
                console.log(`❌ Keep-alive error: ${error.message} after ${responseTime}ms`);
                reject(error);
            });

            req.setTimeout(this.timeout);
        });
    }

    // Start the keep-alive service
    start() {
        if (this.isRunning) {
            console.log('⚠️  Keep-alive service is already running');
            return;
        }

        this.isRunning = true;
        this.startTime = new Date();
        console.log(`🚀 Starting keep-alive service`);
        console.log(`📡 Target URL: ${this.url}`);
        console.log(`⏰ Ping interval: ${this.interval / 1000 / 60} minutes`);
        console.log(`🔄 Max retries: ${this.maxRetries}`);

        // Send initial ping
        this.ping().catch(error => {
            console.log(`⚠️  Initial ping failed: ${error.message}`);
        });

        // Set up periodic pings
        this.intervalId = setInterval(async () => {
            try {
                await this.ping();
            } catch (error) {
                console.log(`🚫 Keep-alive ping failed: ${error.message}`);
            }
        }, this.interval);

        console.log(`✅ Keep-alive service started successfully`);
    }

    // Stop the keep-alive service
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Keep-alive service is not running');
            return;
        }

        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log('⏹️  Keep-alive service stopped');
        this.displayStats();
    }

    // Display statistics
    displayStats() {
        const uptime = new Date() - this.startTime;
        const uptimeMinutes = Math.round(uptime / 1000 / 60);
        const successRate = this.totalRequests > 0 ? 
            ((this.successfulRequests / this.totalRequests) * 100).toFixed(2) : 0;

        console.log('\n📊 KEEP-ALIVE STATISTICS');
        console.log('=' .repeat(40));
        console.log(`⏰ Service uptime: ${uptimeMinutes} minutes`);
        console.log(`📡 Total pings: ${this.totalRequests}`);
        console.log(`✅ Successful: ${this.successfulRequests}`);
        console.log(`❌ Failed: ${this.failedRequests}`);
        console.log(`📈 Success rate: ${successRate}%`);
        console.log(`🔄 Consecutive failures: ${this.consecutiveFailures}`);
    }

    // Get current status
    getStatus() {
        const uptime = new Date() - this.startTime;
        const uptimeMinutes = Math.round(uptime / 1000 / 60);
        const successRate = this.totalRequests > 0 ? 
            ((this.successfulRequests / this.totalRequests) * 100) : 100;

        return {
            isRunning: this.isRunning,
            uptime: `${uptimeMinutes} minutes`,
            totalRequests: this.totalRequests,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            successRate: `${successRate.toFixed(2)}%`,
            consecutiveFailures: this.consecutiveFailures,
            lastPing: this.totalRequests > 0 ? new Date().toISOString() : null
        };
    }
}

module.exports = KeepAliveService;