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

        // Send each challenge as a separate message sequentially to avoid rate limits
        // and await them so Cloudflare Workers doesn't terminate early.
        for (const c of challenges) {
            await this.notify(env, c);
            // Delay 100ms between messages to respect Telegram's rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async sendScanReport(env: Env, result: ScanReport, idsScanned: number): Promise<void> {
        const text = `*Scan Complete*\n\nFound: ${result.found}\nMissing: ${result.missing}\nErrors: ${result.errors}\nChecked: ${idsScanned}`;
        await this.sendTelegramMessage(env, text);
    }
}
