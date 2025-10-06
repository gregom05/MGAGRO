import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    dbUrl: process.env.SUPABASE_DB_URL || '',
  },
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
};

export default config;