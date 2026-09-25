import { NotificationBroadcaster, ScanReport } from "./broadcaster";
import { Challenge, Env } from "../types";

export class TelegramBroadcaster implements NotificationBroadcaster {
    private async sendTelegramMessage(env: Env, text: string): Promise<void> {
        if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
        
        const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Telegram returned HTTP ${response.status}: ${errorBody}`);
        }
    }

    async notify(env: Env, challenge: Challenge): Promise<void> {
        const text = `*New Strava Challenge: ${challenge.title}*\n\n${challenge.description}\n\n[Open Challenge](${challenge.url})`;
        await this.sendTelegramMessage(env, text);
    }

    async notifyBatched(env: Env, challenges: Challenge[]): Promise<void> {
        if (challenges.length === 0) return;
        
        let text = `*${challenges.length} new challenges found!*\n\n`;
        challenges.forEach(c => {
            text += `• [${c.title}](${c.url})\n`;
        });
        
        await this.sendTelegramMessage(env, text);
    }

    async sendScanReport(env: Env, result: ScanReport, idsScanned: number): Promise<void> {
        const text = `*Scan Complete*\n\nFound: ${result.found}\nMissing: ${result.missing}\nErrors: ${result.errors}\nChecked: ${idsScanned}`;
        await this.sendTelegramMessage(env, text);
    }
}
