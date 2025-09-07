import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  sessionSecret: process.env.SESSION_SECRET,
  nodeEnv: process.env.NODE_ENV || "development"
};

export const auth0 = {
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  audience: process.env.AUTH0_AUDIENCE
};

// Validate required environment variables
const requiredVars = [
  { name: 'JWT_SECRET', value: config.jwtSecret },
  { name: 'SESSION_SECRET', value: config.sessionSecret },
  { name: 'MONGO_URI', value: config.mongoUri },
  { name: 'CORS_ORIGIN', value: config.corsOrigin },
  { name: 'AUTH0_DOMAIN', value: auth0.domain },
  { name: 'AUTH0_CLIENT_ID', value: auth0.clientId },
  { name: 'AUTH0_AUDIENCE', value: auth0.audience }
];

const missingVars = requiredVars.filter(({ value }) => !value);

if (missingVars.length > 0) {
  const missingNames = missingVars.map(({ name }) => name).join(', ');
  throw new Error(`Required environment variables are missing: ${missingNames}`);
}

// Additional security validations
if (config.bcryptRounds < 10) {
  throw new Error("BCRYPT_ROUNDS must be at least 10 for security");
}
