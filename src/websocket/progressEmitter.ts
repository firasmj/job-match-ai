import { EventEmitter } from 'events';

export const PROGRESS_EVENT = 'progress-update';

export type JobProgressStage =
    | 'resume_received'
    | 'extracting_text'
    | 'generating_job_titles'
    | 'job_titles_ready'
    | 'scraping_started'
    | 'scraping_site'
    | 'scraping_site_complete'
    | 'scraping_complete'
    | 'scraping_error'
    | 'ai_filtering'
    | 'analysis_ready'
    | 'finalizing'
    | 'completed'
    | 'testing'
    | 'error';

export interface JobProgressMessage {
    progressId?: string;
    stage: JobProgressStage;
    message: string;
    timestamp?: string;
    meta?: Record<string, unknown>;
}

class ProgressEmitter extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(0);
    }

    emitProgress(update: JobProgressMessage): void {
        const payload: JobProgressMessage & { timestamp: string } = {
            ...update,
            timestamp: update.timestamp ?? new Date().toISOString()
        };
        this.emit(PROGRESS_EVENT, payload);
    }
}

export const progressEmitter = new ProgressEmitter();
