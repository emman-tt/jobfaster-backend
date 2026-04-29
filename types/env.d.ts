declare namespace NodeJS {
  interface ProcessEnv {
    REDIS_URL: string;
    GEMINI_API_KEY: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    PORT?: string;
    REFRESH_SECRET: string;
    ACCESS_SECRET: string;
    APIFY_KEY: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BETTER_AUTH_URL: string;
    BETTER_AUTH_SECRET: string;
    GROQ_API_KEY: string;
    FRONTEND_URL: string;
    POSTGRES_MIGRATION_CONNECTION: string;
    POSTGRES_CONNECTION: string;
    RAPID_API_KEY: string;
    EMAIL_SERVICE: string;
    DEVELOPMENT: "development" | "production" | "testing";
  }
}
