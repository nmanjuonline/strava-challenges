import { NotificationBroadcaster, ScanReport } from "./broadcaster";
import { ExpoBroadcaster } from "./expo";
import { TelegramBroadcaster } from "./telegram";
import { EmailBroadcaster } from "./email";
import { Challenge, Env } from "../types";

export class NotificationDispatcher implements NotificationBroadcaster {
    private broadcasters: NotificationBroadcaster[];

    constructor() {
        this.broadcasters = [
            new ExpoBroadcaster(),
            new TelegramBroadcaster(),
            new EmailBroadcaster(),
        ];
    }

    async notify(env: Env, challenge: Challenge): Promise<void> {
        await Promise.allSettled(this.broadcasters.map(b => b.notify(env, challenge)));
    }

    async notifyBatched(env: Env, challenges: Challenge[]): Promise<void> {
        await Promise.allSettled(this.broadcasters.map(b => b.notifyBatched(env, challenges)));
    }

    async sendScanReport(env: Env, result: ScanReport, idsScanned: number): Promise<void> {
        await Promise.allSettled(this.broadcasters.map(b => b.sendScanReport(env, result, idsScanned)));
    }
}

export const notifications = new NotificationDispatcher();
