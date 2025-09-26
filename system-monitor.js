/**
 * System Monitoring Script for Load Testing
 * Monitors system resources during concurrent user testing
 */

const fs = require('fs');
const path = require('path');

class SystemMonitor {
    constructor() {
        this.data = [];
        this.isMonitoring = false;
        this.interval = null;
        this.startTime = null;
    }

    // Get detailed system metrics
    getSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        return {
            timestamp: new Date().toISOString(),
            memory: {
                rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
                external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024 * 100) / 100
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: Math.round(process.uptime()),
            activeHandles: process._getActiveHandles().length,
            activeRequests: process._getActiveRequests().length
        };
    }

    // Start monitoring system
    startMonitoring(intervalMs = 1000) {
        if (this.isMonitoring) {
            console.log('⚠️  Monitoring already started');
            return;
        }

        this.isMonitoring = true;
        this.startTime = new Date();
        this.data = [];

        console.log('📊 Starting system monitoring...');
        
        // Initial reading
        this.data.push(this.getSystemMetrics());

        this.interval = setInterval(() => {
            const metrics = this.getSystemMetrics();
            this.data.push(metrics);
            
            // Display current metrics
            console.log(`📈 Memory: ${metrics.memory.rss}MB | Heap: ${metrics.memory.heapUsed}MB | Handles: ${metrics.activeHandles}`);
        }, intervalMs);
    }

    // Stop monitoring
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️  Monitoring not started');
            return null;
        }

        clearInterval(this.interval);
        this.isMonitoring = false;
        
        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000;
        
        console.log(`📊 Monitoring stopped after ${duration.toFixed(2)} seconds`);
        
        return this.generateReport(duration);
    }

    // Generate monitoring report
    generateReport(duration) {
        if (this.data.length === 0) {
            return null;
        }

        const initialMetrics = this.data[0];
        const finalMetrics = this.data[this.data.length - 1];
        const peakMemory = Math.max(...this.data.map(d => d.memory.rss));
        const avgMemory = this.data.reduce((sum, d) => sum + d.memory.rss, 0) / this.data.length;

        const report = {
            monitoringPeriod: {
                startTime: this.startTime.toISOString(),
                endTime: new Date().toISOString(),
                duration: `${duration.toFixed(2)} seconds`,
                samples: this.data.length
            },
            memoryAnalysis: {
                initial: `${initialMetrics.memory.rss}MB`,
                final: `${finalMetrics.memory.rss}MB`,
                peak: `${peakMemory.toFixed(2)}MB`,
                average: `${avgMemory.toFixed(2)}MB`,
                increase: `${(finalMetrics.memory.rss - initialMetrics.memory.rss).toFixed(2)}MB`,
                heapGrowth: `${(finalMetrics.memory.heapUsed - initialMetrics.memory.heapUsed).toFixed(2)}MB`
            },
            performanceMetrics: {
                activeHandlesRange: {
                    min: Math.min(...this.data.map(d => d.activeHandles)),
                    max: Math.max(...this.data.map(d => d.activeHandles)),
                    final: finalMetrics.activeHandles
                },
                activeRequestsRange: {
                    min: Math.min(...this.data.map(d => d.activeRequests)),
                    max: Math.max(...this.data.map(d => d.activeRequests)),
                    final: finalMetrics.activeRequests
                }
            },
            renderFreePlanCompatibility: {
                memoryLimit: '512MB',
                peakUsage: `${peakMemory.toFixed(2)}MB`,
                utilizationPeak: `${(peakMemory / 512 * 100).toFixed(2)}%`,
                utilizationFinal: `${(finalMetrics.memory.rss / 512 * 100).toFixed(2)}%`,
                withinLimits: peakMemory < 512,
                safetyMargin: `${(512 - peakMemory).toFixed(2)}MB`,
                recommendation: this.getRecommendation(peakMemory, avgMemory)
            },
            rawData: this.data
        };

        return report;
    }

    // Get recommendation based on memory usage
    getRecommendation(peakMemory, avgMemory) {
        if (peakMemory > 400) {
            return 'HIGH RISK: Memory usage is very high. Consider upgrading to paid plan.';
        } else if (peakMemory > 300) {
            return 'MODERATE RISK: Monitor memory usage closely. May need upgrade for sustained load.';
        } else if (peakMemory > 200) {
            return 'LOW RISK: Good performance. Free plan should handle current load.';
        } else {
            return 'OPTIMAL: Excellent performance. Free plan is more than sufficient.';
        }
    }

    // Save report to file
    saveReport(report, filename = null) {
        if (!report) {
            console.log('❌ No report to save');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `system-monitor-${timestamp}.json`;
        const filepath = path.join(__dirname, filename || defaultFilename);

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`📄 System monitoring report saved to: ${filepath}`);
        
        return filepath;
    }

    // Display real-time summary
    displaySummary() {
        if (this.data.length === 0) return;

        const latest = this.data[this.data.length - 1];
        const initial = this.data[0];
        
        console.clear();
        console.log('🔍 REAL-TIME SYSTEM MONITORING');
        console.log('=' .repeat(50));
        console.log(`⏱️  Monitoring for: ${Math.round((new Date() - this.startTime) / 1000)}s`);
        console.log(`💾 Current Memory: ${latest.memory.rss}MB`);
        console.log(`📈 Memory Growth: +${(latest.memory.rss - initial.memory.rss).toFixed(2)}MB`);
        console.log(`🏠 Heap Used: ${latest.memory.heapUsed}MB`);
        console.log(`🔗 Active Handles: ${latest.activeHandles}`);
        console.log(`📡 Active Requests: ${latest.activeRequests}`);
        console.log(`⚡ Process Uptime: ${latest.uptime}s`);
        
        // Render compatibility
        const renderUsage = (latest.memory.rss / 512 * 100).toFixed(1);
        console.log(`\n🌐 Render Free Plan: ${renderUsage}% of 512MB limit`);
        
        if (latest.memory.rss > 400) {
            console.log('🔴 WARNING: High memory usage!');
        } else if (latest.memory.rss > 300) {
            console.log('🟡 CAUTION: Moderate memory usage');
        } else {
            console.log('🟢 GOOD: Healthy memory usage');
        }
    }
}

// CLI usage
if (require.main === module) {
    const monitor = new SystemMonitor();
    
    // Handle CLI arguments
    const args = process.argv.slice(2);
    const duration = parseInt(args[0]) || 60; // Default 60 seconds
    const interval = parseInt(args[1]) || 1000; // Default 1 second
    
    console.log(`🚀 Starting system monitoring for ${duration} seconds`);
    console.log(`📊 Sampling every ${interval}ms`);
    
    monitor.startMonitoring(interval);
    
    // Auto-stop after duration
    setTimeout(() => {
        const report = monitor.stopMonitoring();
        if (report) {
            monitor.saveReport(report);
            
            console.log('\n📋 MONITORING SUMMARY');
            console.log('=' .repeat(50));
            console.log(`🏁 Duration: ${report.monitoringPeriod.duration}`);
            console.log(`📊 Samples: ${report.monitoringPeriod.samples}`);
            console.log(`💾 Peak Memory: ${report.memoryAnalysis.peak}`);
            console.log(`📈 Memory Growth: ${report.memoryAnalysis.increase}`);
            console.log(`🌐 Render Usage: ${report.renderFreePlanCompatibility.utilizationPeak}`);
            console.log(`💡 Recommendation: ${report.renderFreePlanCompatibility.recommendation}`);
        }
        
        process.exit(0);
    }, duration * 1000);
    
    // Display live updates
    const displayInterval = setInterval(() => {
        monitor.displaySummary();
    }, 2000);
    
    // Handle interrupt
    process.on('SIGINT', () => {
        clearInterval(displayInterval);
        console.log('\n⏹️  Monitoring interrupted by user');
        const report = monitor.stopMonitoring();
        if (report) {
            monitor.saveReport(report);
        }
        process.exit(0);
    });
}

module.exports = SystemMonitor;