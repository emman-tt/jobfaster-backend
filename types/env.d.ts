declare namespace NodeJS {
  interface ProcessEnv {
    REDIS_URL: string;
    GEMINI_API_KEY: string;
    RESEND_API_KEY: string;
    PORT?: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BETTER_AUTH_URL: string;
    BETTER_AUTH_SECRET: string;
    GROQ_API_KEY: string;
    FRONTEND_URL: string;
    POSTGRES_MIGRATION_CONNECTION: string;
    POSTGRES_CONNECTION: string;
    RAPID_API_KEY:string;
    DEVELOPMENT: "development" | "production" | "testing";
  }
}
