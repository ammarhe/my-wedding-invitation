import serverless from 'serverless-http'
import { app } from '../../server/src/index.js'

// Wrap the Express app as a Netlify Function handler.
// The /.netlify/functions/api prefix is stripped by Netlify's redirect rules
// in netlify.toml, so the Express routes see clean paths like /api/content.
export const handler = serverless(app)
