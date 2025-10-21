const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: 'test-user-id',
    email: 'test@test.com',
    role: 'user'
  },
  'super-secret-jwt-key-for-development-only-change-in-production',
  { expiresIn: '1h' }
);

console.log(token);