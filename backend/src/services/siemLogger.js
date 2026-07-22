const DEFAULT_SIEM_URL = 'http://localhost:4000';
const DEFAULT_SIEM_API_KEY = 'demo-key';

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim();

  return forwardedIp || req.ip || req.socket?.remoteAddress || 'unknown';
}

export function requestContext(req) {
  return {
    sourceIp: getClientIp(req),
    http: {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('user-agent') || 'unknown',
    },
  };
}

export async function sendSecurityEvent(event) {
  const siemUrl = process.env.SIEM_URL || DEFAULT_SIEM_URL;
  const apiKey = process.env.SIEM_API_KEY || DEFAULT_SIEM_API_KEY;

  try {
    const response = await fetch(`${siemUrl}/api/logs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'novaauth-backend',
        service: 'novaauth-api',
        host: process.env.COMPUTERNAME || 'local-computer',
        sourceType: 'application',
        ...event,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`SIEM rejected security event with status ${response.status}.`);
    }
  } catch (error) {
    // Monitoring must never make authentication or administration unavailable.
    console.error('Could not send security event to SIEM:', error.message);
  }
}
