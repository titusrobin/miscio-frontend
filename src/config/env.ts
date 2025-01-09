interface EnvConfig {
    API_URL: string;
    ENVIRONMENT: string;
  }
  
  const env: EnvConfig = {
    API_URL: typeof window !== 'undefined' ? '/api' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  };
  
  export default env;