import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET || 'your-default-secret-key-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '3600';
  
  return {
    secret,
    expiresIn: parseInt(expiresIn, 10),
  };
});