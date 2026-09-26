import { NotificationBroadcaster, ScanReport } from "./broadcaster";
import { Challenge, Env } from "../types";

export class EmailBroadcaster implements NotificationBroadcaster {
    private async getSubscribers(env: Env): Promise<string[]> {
        try {
            const { results } = await env.DB.prepare("SELECT email FROM email_subscribers").all<{ email: string }>();
            return (results || []).map(r => r.email);
        } catch (error) {
            console.error("Failed to fetch email subscribers:", error);
            return [];
        }
    }

    private async sendGoogleScriptEmail(env: Env, toList: string[], subject: string, html: string): Promise<void> {
        if (!env.GOOGLE_SCRIPT_URL) {
            console.error("GOOGLE_SCRIPT_URL is not set");
            return;
        }

        if (toList.length === 0) return;

        // Google Apps Script accepts BCC as a comma-separated string.
        // We'll chunk to 50 recipients per request to be safe with execution times.
        const chunkSize = 50;
        
        for (let i = 0; i < toList.length; i += chunkSize) {
            const chunk = toList.slice(i, i + chunkSize);
            
            // To ensure 100% privacy, we send the email 'to' a dummy address
            // and place ALL actual subscribers in the BCC field.
            // Bcc recipients cannot see who is in the To field if it's a dummy, and cannot see each other.
            const bcc = chunk.join(",");

            const body = {
                to: "noreply@stravascout.app",
                bcc: bcc,
                subject: subject,
                html: html
            };

            const response = await fetch(env.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Google Script returned HTTP ${response.status}: ${errorBody}`);
            }
        }
    }

    async notify(env: Env, challenge: Challenge): Promise<void> {
        const subscribers = await this.getSubscribers(env);
        if (subscribers.length === 0) return;

        const subject = `New Strava Challenge: ${challenge.title}`;
        
        let html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #fc4c02; margin: 0;">Strava Scout</h1>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">A new challenge was just discovered!</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        `;
        
        html += `
                <div style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                        <tr>
                            <td valign="top" style="padding-right: 15px;">
                                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 22px; line-height: 1.2;">${challenge.title}</h2>
                                <p style="color: #555; line-height: 1.5; font-size: 15px; margin: 0;">${challenge.description}</p>
                            </td>`;
                            
        if (challenge.imageUrl) {
            html += `
                            <td width="80" valign="top">
                                <img src="${challenge.imageUrl}" style="width: 80px; height: 80px; display: block;" alt="Icon" />
                            </td>`;
        }
        
        html += `
                        </tr>
                    </table>
                    
                    <div style="background-color: #f5f5f5; padding: 12px; border-radius: 6px; margin: 15px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #444;">📅 <strong>Dates:</strong> ${challenge.dateInterval}</p>
                        <p style="margin: 0; font-size: 14px; color: #444;">🏃 <strong>Activities:</strong> ${challenge.qualifyingActivities}</p>
                    </div>
                    
                    <a href="${challenge.url}" style="display: block; text-align: center; background-color: #fc4c02; color: #ffffff; padding: 12px 0; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                        View on Strava
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px; margin: 0;">You're receiving this because you subscribed to Strava Scout notifications.</p>
            </div>
        </div>`;

        await this.sendGoogleScriptEmail(env, subscribers, subject, html);
    }

    async notifyBatched(env: Env, challenges: Challenge[]): Promise<void> {
        if (challenges.length === 0) return;
        const subscribers = await this.getSubscribers(env);
        if (subscribers.length === 0) return;

        const subject = `New Strava Challenges (${challenges.length})`;
        
        let html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #fc4c02; margin: 0;">Strava Scout</h1>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">${challenges.length} new challenges were just discovered!</p>
            </div>
        `;
        
        for (const challenge of challenges) {
            html += `
            <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            `;
            html += `
                <div style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                        <tr>
                            <td valign="top" style="padding-right: 15px;">
                                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 22px; line-height: 1.2;">${challenge.title}</h2>
                                <p style="color: #555; line-height: 1.5; font-size: 15px; margin: 0;">${challenge.description}</p>
                            </td>`;
                            
            if (challenge.imageUrl) {
                html += `
                            <td width="80" valign="top">
                                <img src="${challenge.imageUrl}" style="width: 80px; height: 80px; display: block;" alt="Icon" />
                            </td>`;
            }
            
            html += `
                        </tr>
                    </table>
                    
                    <div style="background-color: #f5f5f5; padding: 12px; border-radius: 6px; margin: 15px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #444;">📅 <strong>Dates:</strong> ${challenge.dateInterval}</p>
                        <p style="margin: 0; font-size: 14px; color: #444;">🏃 <strong>Activities:</strong> ${challenge.qualifyingActivities}</p>
                    </div>
                    
                    <a href="${challenge.url}" style="display: block; text-align: center; background-color: #fc4c02; color: #ffffff; padding: 12px 0; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                        View on Strava
                    </a>
                </div>
            </div>`;
        }
        
        html += `
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px; margin: 0;">You're receiving this because you subscribed to Strava Scout notifications.</p>
            </div>
        </div>`;

        await this.sendGoogleScriptEmail(env, subscribers, subject, html);
    }

    async sendScanReport(env: Env, result: ScanReport, idsScanned: number): Promise<void> {
        // Optional: Implement scan report for email admins
    }
}
