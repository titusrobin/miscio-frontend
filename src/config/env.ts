interface EnvConfig {
    API_URL: string;
    ENVIRONMENT: string;
  }
  
  const env: EnvConfig = {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
};
  
  export default env;