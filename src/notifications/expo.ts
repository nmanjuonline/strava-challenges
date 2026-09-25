import { NotificationBroadcaster, ScanReport } from "./broadcaster";
import { Challenge, Env } from "../types";

export class ExpoBroadcaster implements NotificationBroadcaster {
    async notify(env: Env, challenge: Challenge): Promise<void> {
        if (!env.EXPO_PUSH_TOKEN) return;
        const message = {
            to: env.EXPO_PUSH_TOKEN,
            sound: 'default',
            channelId: 'default',
            title: `Strava Challenge: ${challenge.title}`,
            body: challenge.description,
            data: { url: challenge.url, id: challenge.id, imageUrl: challenge.imageUrl },
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Expo Push returned HTTP ${response.status}: ${errorBody}`);
        }
    }

    async notifyBatched(env: Env, challenges: Challenge[]): Promise<void> {
        if (!env.EXPO_PUSH_TOKEN || challenges.length === 0) return;
        
        let title = `${challenges.length} new challenges found!`;
        if (challenges.length === 1) {
            title = `Strava Challenge: ${challenges[0].title}`;
        }
        
        let body = challenges.map(c => c.title).slice(0, 3).join(", ");
        if (challenges.length > 3) {
            body += `... and ${challenges.length - 3} more!`;
        }
        
        const message = {
            to: env.EXPO_PUSH_TOKEN,
            sound: 'default',
            channelId: 'default',
            title: title,
            body: body,
            data: { type: 'new_challenges', ids: challenges.map(c => c.id) },
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Expo Push returned HTTP ${response.status}: ${errorBody}`);
        }
    }

    async sendScanReport(env: Env, result: ScanReport, idsScanned: number): Promise<void> {
        if (!env.EXPO_PUSH_TOKEN) return;
        const message = {
            to: env.EXPO_PUSH_TOKEN,
            sound: 'default',
            channelId: 'default',
            title: 'Scan Complete',
            body: `Found: ${result.found}, Missing: ${result.missing}, Errors: ${result.errors}, Checked: ${idsScanned}`,
            data: { type: 'report' },
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Expo Push returned HTTP ${response.status}: ${errorBody}`);
        }
    }
}
