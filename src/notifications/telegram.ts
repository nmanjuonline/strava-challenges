import { NotificationBroadcaster, ScanReport } from "./broadcaster";
import { Challenge, Env } from "../types";

export class TelegramBroadcaster implements NotificationBroadcaster {
    private async sendTelegramMessage(env: Env, text: string, replyMarkup?: any): Promise<void> {
        if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
            console.error("Telegram bot token or chat ID is not set");
            return;
        }

        const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const body: any = {
            chat_id: env.TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: "MarkdownV2",
            link_preview_options: {
                is_disabled: true
            }
        };
        
        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }
       
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });


        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Telegram returned HTTP ${response.status}: ${errorBody}`);
        }
    }

    async notify(env: Env, challenge: Challenge): Promise<void> {
        const esc = (s: string) => s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
        const text = [
            `*[${challenge.id}: ${esc(challenge.title)}](${challenge.url})*`,
            ``,
            `_${esc(challenge.description)}_`,
            ``,
            `*${esc(challenge.dateInterval)}*`,
            ``,
            `*Activities:* _${esc(challenge.qualifyingActivities)}_`,
        ].join("\n");

        const replyMarkup = {
            inline_keyboard: [[
                { text: "View Challenge", url: challenge.url }
            ]]
        };

        await this.sendTelegramMessage(env, text, replyMarkup);
    }

    async notifyBatched(env: Env, challenges: Challenge[]): Promise<void> {
        if (challenges.length === 0) return;

        let text = `*${challenges.length} new challenges found!*\n\n`;
        challenges.forEach(c => {
            this.notify(env, c); // Send each challenge as a separate message
        });
        // Note: The batched notification doesn't send a single message, but rather individual messages for each challenge
    }

    async sendScanReport(env: Env, result: ScanReport, idsScanned: number): Promise<void> {
        const text = `*Scan Complete*\n\nFound: ${result.found}\nMissing: ${result.missing}\nErrors: ${result.errors}\nChecked: ${idsScanned}`;
        await this.sendTelegramMessage(env, text);
    }
}
