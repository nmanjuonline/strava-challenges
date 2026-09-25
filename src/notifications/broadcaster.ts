import { Challenge, Env } from "../types";

export interface ScanReport {
    found: number;
    missing: number;
    errors: number;
}

export interface NotificationBroadcaster {
    notify(env: Env, challenge: Challenge): Promise<void>;
    notifyBatched(env: Env, challenges: Challenge[]): Promise<void>;
    sendScanReport(env: Env, result: ScanReport, idsScanned: number): Promise<void>;
}
