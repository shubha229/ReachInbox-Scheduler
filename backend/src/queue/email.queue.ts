import {Queue} from 'bullmq';
import {redisConnection} from "../config/redis.js";

export interface ScheduleEmailJob {
    emailId: string;
}

export const emailQueue = new Queue<ScheduleEmailJob>(
    "email-scheduler",
    {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
            removeOnComplete: false,
            removeOnFail: false,
        },
    }
)