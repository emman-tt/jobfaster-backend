// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    REDIS_URL: string;
    GEMINI_API_KEY: string;
    RESEND_API_KEY: string;
    PORT?: string;
    DEVELOPMENT: 'development' | 'production' | 'testing';
  }
}