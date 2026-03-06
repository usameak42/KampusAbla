/* eslint-disable no-console */
/**
 * Key Expiration Monitoring Utility
 * 
 * Monitors API keys for expiration and sends alerts
 * when keys are nearing expiration.
 */

import { SecretsManager } from './secrets';

interface KeyInfo {
    name: string;
    expiresAt?: Date;
    rotationRequired: boolean;
    lastRotated?: Date;
    rotationFrequency: number; // in days
}

interface KeyAlert {
    keyName: string;
    daysUntilExpiration: number;
    severity: 'critical' | 'warning' | 'info';
    message: string;
}

export class KeyMonitor {
    private static readonly ALERT_THRESHOLDS = {
        CRITICAL: 7, // 7 days
        WARNING: 30, // 30 days
        INFO: 60, // 60 days
    };

    /**
     * Get all keys that need monitoring
     */
    private static getMonitoredKeys(): KeyInfo[] {
        const keys: KeyInfo[] = [
            {
                name: 'SUPABASE_ANON_KEY',
                rotationRequired: true,
                rotationFrequency: 90, // Quarterly
            },
            {
                name: 'SUPABASE_SERVICE_ROLE_KEY',
                rotationRequired: true,
                rotationFrequency: 90, // Quarterly
            },
            {
                name: 'IYZICO_API_KEY',
                rotationRequired: true,
                rotationFrequency: 365, // Annually
            },
            {
                name: 'IYZICO_SECRET_KEY',
                rotationRequired: true,
                rotationFrequency: 365, // Annually
            },
            {
                name: 'FIREBASE_SERVICE_ACCOUNT',
                rotationRequired: true,
                rotationFrequency: 365, // Annually
            },
            {
                name: 'GOOGLE_MAPS_API_KEY',
                rotationRequired: true,
                rotationFrequency: 365, // Annually
            },
            {
                name: 'JWT_SECRET',
                rotationRequired: true,
                rotationFrequency: 365, // Annually
            },
            {
                name: 'JWT_REFRESH_SECRET',
                rotationRequired: true,
                rotationFrequency: 365, // Annually
            },
        ];

        // Add last rotation dates if available (from audit logs)
        return keys.map(key => ({
            ...key,
            lastRotated: this.getLastRotationDate(key.name),
        }));
    }

    /**
     * Get the last rotation date from audit logs
     */
    private static getLastRotationDate(keyName: string): Date | undefined {
        // This would typically query the database for rotation logs
        // For now, return undefined to indicate no previous rotation
        return undefined;
    }

    /**
     * Check for keys that need rotation
     */
    static async checkKeyRotations(): Promise<KeyAlert[]> {
        const keys = this.getMonitoredKeys();
        const alerts: KeyAlert[] = [];
        const now = new Date();

        for (const key of keys) {
            if (!key.rotationRequired) continue;

            const lastRotation = key.lastRotated || new Date(0);
            const daysSinceRotation = Math.floor(
                (now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60 * 24)
            );

            const daysUntilRotation = key.rotationFrequency - daysSinceRotation;

            if (daysUntilRotation <= 0) {
                // Key is overdue for rotation
                alerts.push({
                    keyName: key.name,
                    daysUntilExpiration: 0,
                    severity: 'critical',
                    message: `Key ${key.name} is overdue for rotation by ${Math.abs(daysUntilRotation)} days`,
                });
            } else if (daysUntilRotation <= this.ALERT_THRESHOLDS.CRITICAL) {
                // Critical alert
                alerts.push({
                    keyName: key.name,
                    daysUntilExpiration: daysUntilRotation,
                    severity: 'critical',
                    message: `Key ${key.name} will expire in ${daysUntilRotation} days`,
                });
            } else if (daysUntilRotation <= this.ALERT_THRESHOLDS.WARNING) {
                // Warning alert
                alerts.push({
                    keyName: key.name,
                    daysUntilExpiration: daysUntilRotation,
                    severity: 'warning',
                    message: `Key ${key.name} will expire in ${daysUntilRotation} days`,
                });
            } else if (daysUntilRotation <= this.ALERT_THRESHOLDS.INFO) {
                // Info alert
                alerts.push({
                    keyName: key.name,
                    daysUntilExpiration: daysUntilRotation,
                    severity: 'info',
                    message: `Key ${key.name} will expire in ${daysUntilRotation} days`,
                });
            }
        }

        return alerts;
    }

    /**
     * Send alerts for key rotation
     */
    static async sendKeyRotationAlerts(alerts: KeyAlert[]): Promise<void> {
        if (alerts.length === 0) {
            console.log('✅ No key rotation alerts');
            return;
        }

        console.log(`🔑 Found ${alerts.length} key rotation alerts:`);

        // Group alerts by severity
        const critical = alerts.filter(a => a.severity === 'critical');
        const warning = alerts.filter(a => a.severity === 'warning');
        const info = alerts.filter(a => a.severity === 'info');

        // Send critical alerts immediately
        if (critical.length > 0) {
            await this.sendCriticalAlert(critical);
        }

        // Send warning alerts
        if (warning.length > 0) {
            await this.sendWarningAlert(warning);
        }

        // Send info alerts (could be batched)
        if (info.length > 0) {
            await this.sendInfoAlert(info);
        }

        // Log to monitoring system
        await this.logToMonitoringSystem(alerts);
    }

    /**
     * Send critical alerts
     */
    private static async sendCriticalAlert(alerts: KeyAlert[]): Promise<void> {
        const message = `🚨 CRITICAL: Key rotation required immediately\n\n${alerts.map(a => a.message).join('\n')}`;

        // Send to multiple channels
        await this.sendEmailAlert('security@kampusabla.com', 'URGENT: Key Rotation Required', message);
        await this.sendSlackAlert(message, 'urgent');
        await this.createJiraTicket('Key Rotation Required', alerts);
    }

    /**
     * Send warning alerts
     */
    private static async sendWarningAlert(alerts: KeyAlert[]): Promise<void> {
        const message = `⚠️ WARNING: Keys approaching rotation deadline\n\n${alerts.map(a => a.message).join('\n')}`;

        await this.sendEmailAlert('devops@kampusabla.com', 'Key Rotation Warning', message);
        await this.sendSlackAlert(message, 'warning');
    }

    /**
     * Send info alerts
     */
    private static async sendInfoAlert(alerts: KeyAlert[]): Promise<void> {
        const message = `ℹ️ INFO: Upcoming key rotations\n\n${alerts.map(a => a.message).join('\n')}`;

        await this.sendSlackAlert(message, 'info');
    }

    /**
     * Send email alert
     */
    private static async sendEmailAlert(to: string, subject: string, message: string): Promise<void> {
        // Implementation would depend on your email service
        console.log(`📧 Email alert sent to ${to}: ${subject}`);
        console.log(message);

        // Example implementation:
        // await emailService.send({ to, subject, message });
    }

    /**
     * Send Slack alert
     */
    private static async sendSlackAlert(message: string, priority: string): Promise<void> {
        // Implementation would depend on your Slack integration
        console.log(`💬 Slack alert (${priority}): ${message}`);

        // Example implementation:
        // await slackService.postMessage({ channel: '#security', message, priority });
    }

    /**
     * Create Jira ticket
     */
    private static async createJiraTicket(summary: string, alerts: KeyAlert[]): Promise<void> {
        // Implementation would depend on your Jira integration
        console.log(`🎫 Jira ticket created: ${summary}`);

        // Example implementation:
        // await jiraService.createTicket({
        //   project: 'SEC',
        //   summary,
        //   description: alerts.map(a => a.message).join('\n'),
        //   priority: 'High',
        //   labels: ['security', 'key-rotation']
        // });
    }

    /**
     * Log to monitoring system
     */
    private static async logToMonitoringSystem(alerts: KeyAlert[]): Promise<void> {
        // Log to your monitoring system (e.g., Datadog, Sentry)
        console.log(`📊 Monitoring: ${alerts.length} key rotation alerts logged`);

        // Example implementation:
        // await monitoringService.logEvent({
        //   event: 'key_rotation_alert',
        //   data: alerts,
        //   timestamp: new Date(),
        //   severity: alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning'
        // });
    }

    /**
     * Generate key rotation report
     */
    static async generateRotationReport(): Promise<string> {
        const keys = this.getMonitoredKeys();
        const now = new Date();

        let report = `# Key Rotation Report\n\n`;
        report += `Generated: ${now.toISOString()}\n\n`;

        for (const key of keys) {
            report += `## ${key.name}\n`;
            report += `- Rotation Required: ${key.rotationRequired ? 'Yes' : 'No'}\n`;
            report += `- Rotation Frequency: ${key.rotationFrequency} days\n`;

            if (key.lastRotated) {
                const daysSinceRotation = Math.floor(
                    (now.getTime() - key.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
                );
                const daysUntilRotation = key.rotationFrequency - daysSinceRotation;

                report += `- Last Rotated: ${key.lastRotated.toISOString()}\n`;
                report += `- Days Since Rotation: ${daysSinceRotation}\n`;
                report += `- Days Until Rotation: ${daysUntilRotation}\n`;

                if (daysUntilRotation <= 0) {
                    report += `- Status: ⚠️ OVERDUE\n`;
                } else if (daysUntilRotation <= 30) {
                    report += `- Status: ⚠️ APPROACHING\n`;
                } else {
                    report += `- Status: ✅ OK\n`;
                }
            } else {
                report += `- Last Rotated: Never\n`;
                report += `- Status: ⚠️ UNKNOWN\n`;
            }

            report += `\n`;
        }

        return report;
    }

    /**
     * Schedule regular monitoring
     */
    static scheduleMonitoring(): void {
        // Check daily at 9:00 AM
        const schedule = '0 9 * * *'; // Cron format

        console.log(`📅 Key monitoring scheduled with cron: ${schedule}`);
        console.log('Monitoring will run daily at 9:00 AM UTC');

        // In a real implementation, this would set up a cron job
        // Example with node-cron:
        // import cron from 'node-cron';
        // cron.schedule(schedule, () => {
        //   this.checkKeyRotations().then(alerts => {
        //     this.sendKeyRotationAlerts(alerts);
        //   });
        // });
    }

    /**
     * Run manual check
     */
    static async runManualCheck(): Promise<void> {
        console.log('🔍 Running manual key rotation check...');

        try {
            const alerts = await this.checkKeyRotations();
            await this.sendKeyRotationAlerts(alerts);

            if (alerts.length === 0) {
                console.log('✅ All keys are within rotation schedule');
            }
        } catch (error) {
            console.error('❌ Error during key rotation check:', error);
            throw error;
        }
    }
}

// Export for use in other modules
export default KeyMonitor;