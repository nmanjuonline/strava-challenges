export interface Env {
    DB: any; // Using any for D1Database to avoid global type errors if not imported, or just use D1Database if it's available globally in Cloudflare workers
    START_ID: string;
    EXPO_PUSH_TOKEN: string;
    SCAN_ADMIN_TOKEN: string;
    FETCH_BATCH_SIZE?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
}

export type Challenge = {
    id: number;
    title: string;
    description: string;
    dateInterval: string;
    qualifyingActivities: string;
    url: string;
    imageUrl?: string;
};
