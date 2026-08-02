import { request } from 'undici';
import { createLogger } from '../utils/logger.js';
import eventBus from '../core/eventBus.js';
import dns from 'dns/promises';
import tls from 'tls';
import net from 'net';

// ── SSRF Protection: Block internal/private IPs ─────────────────────
const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1',
  'metadata.google.internal', '169.254.169.254',
  'metadata.google.com', 'metadata'
];

const PRIVATE_IP_RANGES = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^0\.0\.0\.0/, /^fc00:/, /^fe80:/, /^::1$/, /^fd/
];

function isBlockedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block known internal hostnames
    if (BLOCKED_HOSTS.includes(hostname)) return true;
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return true;
    
    // Block raw IPs in private ranges
    for (const pattern of PRIVATE_IP_RANGES) {
      if (pattern.test(hostname)) return true;
    }
    
    // Block non-HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) return true;
    
    // Block custom ports commonly used for internal services
    const port = parseInt(parsed.port);
    if (port && (port === 22 || port === 3306 || port === 5432 || port === 6379 || port === 27017)) return true;
    
    return false;
  } catch {
    return true; // Invalid URL = blocked
  }
}

// ── DNS resolution check (resolves hostname, blocks private IPs) ────
async function resolvesPrivately(hostname) {
  try {
    const addresses = await dns.resolve4(hostname).catch(() => []);
    const addresses6 = await dns.resolve6(hostname).catch(() => []);
    const all = [...addresses, ...addresses6];
    for (const ip of all) {
      for (const pattern of PRIVATE_IP_RANGES) {
        if (pattern.test(ip)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ── Scoring constants ───────────────────────────────────────────────
const HEADER_RULES = [
  { name: 'Content-Security-Policy', weight: 25, critical: true },
  { name: 'Strict-Transport-Security', weight: 20, critical: true },
  { name: 'X-Content-Type-Options', weight: 10, expected: 'nosniff' },
  { name: 'X-Frame-Options', weight: 10, expected: ['DENY', 'SAMEORIGIN'] },
  { name: 'Referrer-Policy', weight: 8 },
  { name: 'Permissions-Policy', weight: 7 },
  { name: 'Cross-Origin-Opener-Policy', weight: 5 },
  { name: 'Cross-Origin-Embedder-Policy', weight: 3 },
  { name: 'Cross-Origin-Resource-Policy', weight: 3 },
  { name: 'X-XSS-Protection', weight: 0, deprecated: true }
];

function calculateGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

// ── TECH DETECTION SIGNATURES ───────────────────────────────────────
const HEADER_SIGNATURES = {
  'server': {
    'nginx': { name: 'Nginx', category: 'Server' },
    'apache': { name: 'Apache', category: 'Server' },
    'cloudflare': { name: 'Cloudflare', category: 'CDN' },
    'microsoft-iis': { name: 'IIS', category: 'Server' },
    'gunicorn': { name: 'Gunicorn', category: 'Server' },
    'vercel': { name: 'Vercel', category: 'Platform' },
    'netlify': { name: 'Netlify', category: 'Platform' },
    'gws': { name: 'Google Web Server', category: 'Server' },
    'openresty': { name: 'OpenResty', category: 'Server' },
    'litespeed': { name: 'LiteSpeed', category: 'Server' }
  },
  'x-powered-by': {
    'express': { name: 'Express.js', category: 'Framework' },
    'next.js': { name: 'Next.js', category: 'Framework' },
    'php': { name: 'PHP', category: 'Runtime' },
    'asp.net': { name: 'ASP.NET', category: 'Framework' },
    'django': { name: 'Django', category: 'Framework' },
    'flask': { name: 'Flask', category: 'Framework' },
    'ruby': { name: 'Ruby on Rails', category: 'Framework' }
  }
};

const HTML_SIGNATURES = [
  { pattern: /<meta[^>]+generator[^>]+wordpress/i, name: 'WordPress', category: 'CMS' },
  { pattern: /<meta[^>]+generator[^>]+drupal/i, name: 'Drupal', category: 'CMS' },
  { pattern: /<meta[^>]+generator[^>]+joomla/i, name: 'Joomla', category: 'CMS' },
  { pattern: /<meta[^>]+generator[^>]+hugo/i, name: 'Hugo', category: 'SSG' },
  { pattern: /<meta[^>]+generator[^>]+gatsby/i, name: 'Gatsby', category: 'SSG' },
  { pattern: /\/_next\/static\//i, name: 'Next.js', category: 'Framework' },
  { pattern: /\/__nuxt\//i, name: 'Nuxt.js', category: 'Framework' },
  { pattern: /\/wp-content\//i, name: 'WordPress', category: 'CMS' },
  { pattern: /\/wp-includes\//i, name: 'WordPress', category: 'CMS' },
  { pattern: /cdn\.shopify\.com/i, name: 'Shopify', category: 'E-Commerce' },
  { pattern: /window\.__NEXT_DATA__/i, name: 'Next.js', category: 'Framework' },
  { pattern: /window\.__NUXT__/i, name: 'Nuxt.js', category: 'Framework' },
  { pattern: /react/i, name: 'React', category: 'Library' },
  { pattern: /vue\.js|vue\.min\.js|vue\.global/i, name: 'Vue.js', category: 'Library' },
  { pattern: /angular\.min\.js|ng-app|ng-controller/i, name: 'Angular', category: 'Framework' },
  { pattern: /jquery\.min\.js|jquery-\d/i, name: 'jQuery', category: 'Library' },
  { pattern: /bootstrap\.min\.(css|js)/i, name: 'Bootstrap', category: 'CSS Framework' },
  { pattern: /tailwindcss|tailwind\.min\.css/i, name: 'Tailwind CSS', category: 'CSS Framework' },
  { pattern: /google-analytics\.com|gtag/i, name: 'Google Analytics', category: 'Analytics' },
  { pattern: /googletagmanager\.com/i, name: 'Google Tag Manager', category: 'Analytics' },
  { pattern: /fonts\.googleapis\.com/i, name: 'Google Fonts', category: 'Font Service' },
  { pattern: /cdnjs\.cloudflare\.com/i, name: 'cdnjs', category: 'CDN' },
  { pattern: /unpkg\.com/i, name: 'unpkg', category: 'CDN' },
  { pattern: /jsdelivr\.net/i, name: 'jsDelivr', category: 'CDN' }
];

const COOKIE_SIGNATURES = {
  'phpsessid': { name: 'PHP', category: 'Runtime' },
  'laravel_session': { name: 'Laravel', category: 'Framework' },
  'csrftoken': { name: 'Django', category: 'Framework' },
  '_shopify_s': { name: 'Shopify', category: 'E-Commerce' },
  'wp-settings': { name: 'WordPress', category: 'CMS' },
  'rack.session': { name: 'Ruby/Rack', category: 'Framework' },
  'connect.sid': { name: 'Express.js', category: 'Framework' },
  'ajs_anonymous_id': { name: 'Segment', category: 'Analytics' },
  '__stripe_mid': { name: 'Stripe', category: 'Payment' },
  '_ga': { name: 'Google Analytics', category: 'Analytics' }
};

// ── Main Scanner ────────────────────────────────────────────────────

/**
 * Scans a website for security vulnerabilities (passive only)
 * @param {string} targetUrl - The URL to scan
 * @param {string} sessionId - Active session ID
 * @param {Object} failoverPipeline - LLM pipeline for AI recommendations
 * @returns {Promise<Object>} Scan results with grade, score, findings
 */
export async function scanWebsite(targetUrl, sessionId, failoverPipeline) {
  const logger = createLogger(sessionId);
  const findings = [];
  let score = 100;
  const techStack = new Map(); // name -> { name, category, source }

  // ── SSRF Protection ────────────────────────────────────────────────
  if (isBlockedUrl(targetUrl)) {
    eventBus.emitError(sessionId, 'Blocked: Cannot scan internal/private addresses', 'VALIDATION', true);
    throw new Error('SSRF_BLOCKED: Target URL resolves to a blocked address');
  }

  const parsed = new URL(targetUrl);
  const isHttps = parsed.protocol === 'https:';

  // DNS resolution SSRF check
  const dnsBlocked = await resolvesPrivately(parsed.hostname);
  if (dnsBlocked) {
    eventBus.emitError(sessionId, 'Blocked: Hostname resolves to a private/internal IP address', 'VALIDATION', true);
    throw new Error('SSRF_BLOCKED: DNS resolves to private IP');
  }

  logger.info('WEB_SCAN', `Starting passive security scan for: ${targetUrl}`);

  // ═══════════════════════════════════════════════════════════════════
  // MODULE 1: HTTP Security Headers Analysis
  // ═══════════════════════════════════════════════════════════════════
  eventBus.emitEvent('WEB_SCAN_STAGE', sessionId, { data: { stage: 'HEADERS' } });
  logger.info('WEB_SCAN', 'Analyzing HTTP security headers...');

  let responseHeaders = {};
  let responseBody = '';
  let statusCode = 0;
  let redirectChain = [];
  let responseCookies = [];

  try {
    // Follow redirects manually to track the chain
    let currentUrl = targetUrl;
    let hops = 0;
    const MAX_REDIRECTS = 5;

    while (hops < MAX_REDIRECTS) {
      const resp = await request(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'AEGIS-PATCH Security Scanner/1.0 (Passive; +https://github.com/Jaimin2687/aegis-patch)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        maxRedirections: 0, // Handle redirects manually
        headersTimeout: 15000,
        bodyTimeout: 15000
      });

      statusCode = resp.statusCode;

      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        const location = resp.headers.location;
        redirectChain.push({ from: currentUrl, to: location, status: statusCode });
        
        // Consume body to free connection
        await resp.body.text().catch(() => {});
        
        if (!location) break;
        currentUrl = new URL(location, currentUrl).href;
        
        // SSRF check on redirect target
        if (isBlockedUrl(currentUrl)) {
          findings.push({
            module: 'Headers',
            severity: 'CRITICAL',
            title: 'Redirect to Internal Address',
            description: 'The website redirects to an internal/private address — potential open redirect vulnerability.',
            current: currentUrl,
            expected: 'Public URL only'
          });
          score -= 20;
          break;
        }
        hops++;
      } else {
        // Final destination reached
        responseHeaders = resp.headers;
        responseCookies = Array.isArray(resp.headers['set-cookie'])
          ? resp.headers['set-cookie']
          : resp.headers['set-cookie'] ? [resp.headers['set-cookie']] : [];
        
        // Read only first 50KB of body for tech detection
        const chunks = [];
        let bytesRead = 0;
        for await (const chunk of resp.body) {
          chunks.push(chunk);
          bytesRead += chunk.length;
          if (bytesRead > 50000) break;
        }
        responseBody = Buffer.concat(chunks).toString('utf-8').substring(0, 50000);
        break;
      }
    }

    if (redirectChain.length > 0) {
      findings.push({
        module: 'Headers',
        severity: 'INFO',
        title: 'Redirect Chain Detected',
        description: `Site uses ${redirectChain.length} redirect(s) before reaching final destination.`,
        current: redirectChain.map(r => `${r.status}: ${r.from} → ${r.to}`).join('\n'),
        expected: 'Minimal redirects (≤ 2)'
      });
    }

    // Check HTTP vs HTTPS
    if (!isHttps) {
      findings.push({
        module: 'Headers',
        severity: 'CRITICAL',
        title: 'Site Not Using HTTPS',
        description: 'The website is served over unencrypted HTTP. All data transmitted between the user and server can be intercepted.',
        current: 'HTTP',
        expected: 'HTTPS'
      });
      score -= 25;
    }

    // Analyze each security header
    for (const rule of HEADER_RULES) {
      const headerName = rule.name.toLowerCase();
      const value = responseHeaders[headerName];
      
      if (rule.deprecated) {
        // X-XSS-Protection — flag if set to "1" (can cause issues)
        if (value && value.includes('1')) {
          findings.push({
            module: 'Headers',
            severity: 'LOW',
            title: `Deprecated Header: ${rule.name}`,
            description: `${rule.name} is deprecated and can introduce vulnerabilities in older browsers. Consider removing it or setting to "0".`,
            current: value,
            expected: 'Omit or set to "0"'
          });
          score -= 2;
        }
        continue;
      }

      if (!value) {
        findings.push({
          module: 'Headers',
          severity: rule.critical ? 'HIGH' : 'MEDIUM',
          title: `Missing Header: ${rule.name}`,
          description: `The ${rule.name} header is not set. This leaves the site vulnerable to ${getHeaderRisk(rule.name)}.`,
          current: 'Not set',
          expected: getHeaderRecommendation(rule.name)
        });
        score -= rule.weight;
      } else {
        // Check for weak configurations
        const weaknesses = checkHeaderWeakness(rule.name, value);
        if (weaknesses) {
          findings.push({
            module: 'Headers',
            severity: 'MEDIUM',
            title: `Weak ${rule.name} Configuration`,
            description: weaknesses.description,
            current: value.length > 200 ? value.substring(0, 200) + '...' : value,
            expected: weaknesses.recommended
          });
          score -= Math.floor(rule.weight / 2);
        } else {
          // Header present and properly configured
          findings.push({
            module: 'Headers',
            severity: 'PASS',
            title: `${rule.name}`,
            description: `Properly configured.`,
            current: value.length > 150 ? value.substring(0, 150) + '...' : value,
            expected: 'Present ✓'
          });
        }
      }
    }

    eventBus.emitLog(sessionId, 'WEB_SCAN', 'INFO', `Headers analysis complete. ${findings.length} findings so far.`);

  } catch (err) {
    findings.push({
      module: 'Headers',
      severity: 'CRITICAL',
      title: 'Failed to Connect',
      description: `Could not reach ${targetUrl}: ${err.message}`,
      current: 'Connection failed',
      expected: 'Successful HTTP response'
    });
    score -= 30;
    eventBus.emitLog(sessionId, 'WEB_SCAN', 'ERROR', `Connection failed: ${err.message}`);
  }

  // Emit findings so far
  for (const f of findings) {
    if (f.severity !== 'PASS' && f.severity !== 'INFO') {
      eventBus.emitEvent('WEB_SCAN_FINDING', sessionId, { data: f });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // MODULE 2: SSL/TLS Analysis
  // ═══════════════════════════════════════════════════════════════════
  eventBus.emitEvent('WEB_SCAN_STAGE', sessionId, { data: { stage: 'SSL' } });
  logger.info('WEB_SCAN', 'Analyzing SSL/TLS configuration...');

  if (isHttps) {
    try {
      const sslFindings = await analyzeSSL(parsed.hostname, parsed.port || 443);
      for (const f of sslFindings) {
        findings.push(f);
        if (f.severity === 'CRITICAL') score -= 15;
        else if (f.severity === 'HIGH') score -= 10;
        else if (f.severity === 'MEDIUM') score -= 5;
        if (f.severity !== 'PASS' && f.severity !== 'INFO') {
          eventBus.emitEvent('WEB_SCAN_FINDING', sessionId, { data: f });
        }
      }
    } catch (err) {
      logger.warn('WEB_SCAN', `SSL analysis error: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // MODULE 3: Technology Stack Detection
  // ═══════════════════════════════════════════════════════════════════
  eventBus.emitEvent('WEB_SCAN_STAGE', sessionId, { data: { stage: 'TECH' } });
  logger.info('WEB_SCAN', 'Detecting technology stack...');

  // From headers
  for (const [headerKey, signatures] of Object.entries(HEADER_SIGNATURES)) {
    const headerVal = (responseHeaders[headerKey] || '').toLowerCase();
    if (headerVal) {
      for (const [keyword, techInfo] of Object.entries(signatures)) {
        if (headerVal.includes(keyword)) {
          techStack.set(techInfo.name, { ...techInfo, source: `${headerKey}: ${headerVal}` });
        }
      }
    }
  }

  // From HTML body
  for (const sig of HTML_SIGNATURES) {
    if (sig.pattern.test(responseBody)) {
      if (!techStack.has(sig.name)) {
        techStack.set(sig.name, { name: sig.name, category: sig.category, source: 'HTML content' });
      }
    }
  }

  // From cookies
  for (const cookieStr of responseCookies) {
    const cookieName = cookieStr.split('=')[0].trim().toLowerCase();
    for (const [sig, techInfo] of Object.entries(COOKIE_SIGNATURES)) {
      if (cookieName.includes(sig)) {
        if (!techStack.has(techInfo.name)) {
          techStack.set(techInfo.name, { ...techInfo, source: `Cookie: ${cookieName}` });
        }
      }
    }
  }

  const detectedTech = Array.from(techStack.values());
  eventBus.emitLog(sessionId, 'WEB_SCAN', 'INFO', `Detected ${detectedTech.length} technologies.`);

  // ═══════════════════════════════════════════════════════════════════
  // MODULE 4: Cookie Security Audit
  // ═══════════════════════════════════════════════════════════════════
  eventBus.emitEvent('WEB_SCAN_STAGE', sessionId, { data: { stage: 'COOKIES' } });
  logger.info('WEB_SCAN', 'Auditing cookie security...');

  const cookieAudit = [];
  for (const cookieStr of responseCookies) {
    const parts = cookieStr.split(';').map(p => p.trim());
    const nameValue = parts[0];
    const cookieName = nameValue.split('=')[0].trim();
    const flags = parts.slice(1).map(f => f.toLowerCase());

    const hasSecure = flags.some(f => f === 'secure');
    const hasHttpOnly = flags.some(f => f === 'httponly');
    const hasSameSite = flags.some(f => f.startsWith('samesite'));
    const sameSiteValue = flags.find(f => f.startsWith('samesite'))?.split('=')[1]?.trim() || 'not set';

    const issues = [];
    if (isHttps && !hasSecure) { issues.push('Missing Secure flag'); score -= 3; }
    if (!hasHttpOnly) { issues.push('Missing HttpOnly flag'); score -= 2; }
    if (!hasSameSite) { issues.push('Missing SameSite attribute'); score -= 1; }

    cookieAudit.push({
      name: cookieName,
      secure: hasSecure,
      httpOnly: hasHttpOnly,
      sameSite: sameSiteValue,
      issues
    });

    if (issues.length > 0) {
      findings.push({
        module: 'Cookies',
        severity: !hasSecure && isHttps ? 'HIGH' : 'MEDIUM',
        title: `Insecure Cookie: ${cookieName}`,
        description: issues.join(', '),
        current: issues.join('; '),
        expected: 'Secure; HttpOnly; SameSite=Strict'
      });
      eventBus.emitEvent('WEB_SCAN_FINDING', sessionId, { data: findings[findings.length - 1] });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // MODULE 5: Information Disclosure
  // ═══════════════════════════════════════════════════════════════════
  eventBus.emitEvent('WEB_SCAN_STAGE', sessionId, { data: { stage: 'INFO_DISCLOSURE' } });
  logger.info('WEB_SCAN', 'Checking for information disclosure...');

  // Server version exposure
  const serverHeader = responseHeaders['server'] || '';
  if (/\d+\.\d+/.test(serverHeader)) {
    findings.push({
      module: 'Information',
      severity: 'MEDIUM',
      title: 'Server Version Exposed',
      description: `The Server header reveals the exact software version: "${serverHeader}". Attackers can use this to find known exploits for this version.`,
      current: serverHeader,
      expected: 'Generic server identifier without version (e.g., "nginx")'
    });
    score -= 5;
    eventBus.emitEvent('WEB_SCAN_FINDING', sessionId, { data: findings[findings.length - 1] });
  }

  // X-Powered-By exposure
  if (responseHeaders['x-powered-by']) {
    findings.push({
      module: 'Information',
      severity: 'MEDIUM',
      title: 'X-Powered-By Header Exposed',
      description: `The X-Powered-By header reveals the backend technology: "${responseHeaders['x-powered-by']}". This helps attackers fingerprint your stack.`,
      current: responseHeaders['x-powered-by'],
      expected: 'Header should be removed in production'
    });
    score -= 5;
    eventBus.emitEvent('WEB_SCAN_FINDING', sessionId, { data: findings[findings.length - 1] });
  }

  // Check robots.txt
  try {
    const robotsResp = await request(`${parsed.origin}/robots.txt`, {
      method: 'GET',
      headers: { 'User-Agent': 'AEGIS-PATCH Security Scanner/1.0' },
      headersTimeout: 10000,
      bodyTimeout: 10000,
      maxRedirections: 3
    });
    if (robotsResp.statusCode === 200) {
      const robotsContent = await robotsResp.body.text();
      const disallowEntries = robotsContent.match(/Disallow:\s*(.+)/gi) || [];
      const sensitivePatterns = disallowEntries.filter(d =>
        /admin|login|wp-admin|dashboard|api|config|backup|\.env|\.git/i.test(d)
      );
      if (sensitivePatterns.length > 0) {
        findings.push({
          module: 'Information',
          severity: 'LOW',
          title: 'Sensitive Paths in robots.txt',
          description: `robots.txt reveals potentially sensitive directories: ${sensitivePatterns.slice(0, 5).join(', ')}. While this prevents crawling, it also maps your admin paths for attackers.`,
          current: sensitivePatterns.slice(0, 5).join(', '),
          expected: 'Avoid listing sensitive admin paths in robots.txt'
        });
        eventBus.emitEvent('WEB_SCAN_FINDING', sessionId, { data: findings[findings.length - 1] });
      }
    }
  } catch {}

  // Check security.txt
  try {
    const secTxtResp = await request(`${parsed.origin}/.well-known/security.txt`, {
      method: 'GET',
      headers: { 'User-Agent': 'AEGIS-PATCH Security Scanner/1.0' },
      headersTimeout: 10000,
      bodyTimeout: 10000,
      maxRedirections: 3
    });
    if (secTxtResp.statusCode !== 200) {
      await secTxtResp.body.text().catch(() => {});
      findings.push({
        module: 'Information',
        severity: 'LOW',
        title: 'No security.txt Found',
        description: 'No /.well-known/security.txt file was found. This file provides security researchers with contact information for responsible vulnerability disclosure.',
        current: 'Not found',
        expected: 'security.txt with Contact and Expires fields (RFC 9116)'
      });
      score -= 3;
      eventBus.emitEvent('WEB_SCAN_FINDING', sessionId, { data: findings[findings.length - 1] });
    } else {
      await secTxtResp.body.text().catch(() => {});
      findings.push({
        module: 'Information',
        severity: 'PASS',
        title: 'security.txt Present',
        description: 'A security.txt file exists for responsible vulnerability disclosure.',
        current: 'Found ✓',
        expected: 'Present ✓'
      });
    }
  } catch {}

  // ═══════════════════════════════════════════════════════════════════
  // MODULE 6: LLM-Powered Recommendations
  // ═══════════════════════════════════════════════════════════════════
  eventBus.emitEvent('WEB_SCAN_STAGE', sessionId, { data: { stage: 'AI_ANALYSIS' } });
  logger.info('WEB_SCAN', 'Generating AI-powered security recommendations...');

  let recommendations = [];
  const criticalFindings = findings.filter(f => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity));

  if (failoverPipeline && criticalFindings.length > 0) {
    try {
      const findingsSummary = criticalFindings.slice(0, 10).map(f =>
        `[${f.severity}] ${f.title}: ${f.description} (Current: ${f.current})`
      ).join('\n');

      const prompt = [
        {
          role: 'system',
          content: `You are a web security consultant API. You MUST respond with ONLY a valid JSON array — no explanations, no markdown, no thinking tags, no prose before or after. Do NOT use <think> tags. Output ONLY the raw JSON array.

Format: [{"title": "string", "priority": "CRITICAL|HIGH|MEDIUM", "description": "string", "fix": "string"}]

Rules:
- Return at most 5 recommendations ordered by priority
- Each "fix" must contain an exact config snippet (nginx directive, meta tag, or HTTP header value)
- Return ONLY the JSON array, nothing else`
        },
        {
          role: 'user',
          content: `Website: ${targetUrl}\nTech: ${detectedTech.map(t => t.name).join(', ') || 'Unknown'}\n\nFindings:\n${findingsSummary}\n\nReturn JSON array of remediation recommendations:`
        }
      ];

      const { content } = await failoverPipeline.generate(prompt, { format: 'json' });
      try {
        // The pipeline already extracts and validates JSON, but double-check
        const parsed = JSON.parse(content);
        recommendations = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Final fallback: try regex extraction
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            recommendations = JSON.parse(jsonMatch[0]);
          } catch {
            logger.warn('WEB_SCAN', 'All JSON extraction attempts failed for recommendations');
          }
        }
      }
    } catch (err) {
      logger.warn('WEB_SCAN', `LLM recommendation failed: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Final Score & Grade
  // ═══════════════════════════════════════════════════════════════════
  score = Math.max(0, Math.min(100, score));
  const grade = calculateGrade(score);

  const result = {
    url: targetUrl,
    grade,
    score,
    findings: findings.filter(f => f.severity !== 'PASS'),
    passes: findings.filter(f => f.severity === 'PASS'),
    techStack: detectedTech,
    cookies: cookieAudit,
    recommendations,
    redirectChain,
    scanTime: new Date().toISOString()
  };

  logger.info('WEB_SCAN', `Scan complete. Grade: ${grade} (${score}/100). ${findings.length} findings.`);
  eventBus.emitEvent('WEB_SCAN_COMPLETE', sessionId, { data: result });

  return result;
}

// ── SSL/TLS Analysis Helper ─────────────────────────────────────────
function analyzeSSL(hostname, port) {
  return new Promise((resolve) => {
    const findings = [];
    const timeout = setTimeout(() => {
      resolve([{
        module: 'SSL',
        severity: 'MEDIUM',
        title: 'SSL Analysis Timeout',
        description: 'SSL/TLS handshake timed out after 10 seconds.',
        current: 'Timeout',
        expected: 'Successful TLS handshake'
      }]);
    }, 10000);

    try {
      const socket = tls.connect({
        host: hostname,
        port: parseInt(port),
        servername: hostname,
        rejectUnauthorized: false,  // We want to inspect even invalid certs
        timeout: 10000
      }, () => {
        clearTimeout(timeout);
        const cert = socket.getPeerCertificate(true);
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();
        const authorized = socket.authorized;

        // Certificate validity
        if (!authorized) {
          findings.push({
            module: 'SSL',
            severity: 'CRITICAL',
            title: 'Invalid SSL Certificate',
            description: `The SSL certificate is not trusted: ${socket.authorizationError}`,
            current: socket.authorizationError || 'Not authorized',
            expected: 'Valid, trusted certificate'
          });
        } else {
          findings.push({
            module: 'SSL',
            severity: 'PASS',
            title: 'Valid SSL Certificate',
            description: 'Certificate is trusted by the system CA store.',
            current: 'Valid ✓',
            expected: 'Valid ✓'
          });
        }

        // Certificate expiry
        if (cert.valid_to) {
          const expiryDate = new Date(cert.valid_to);
          const daysLeft = Math.floor((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            findings.push({
              module: 'SSL',
              severity: 'CRITICAL',
              title: 'SSL Certificate Expired',
              description: `Certificate expired ${Math.abs(daysLeft)} days ago on ${cert.valid_to}.`,
              current: `Expired: ${cert.valid_to}`,
              expected: 'Valid certificate with >30 days until expiry'
            });
          } else if (daysLeft < 30) {
            findings.push({
              module: 'SSL',
              severity: 'HIGH',
              title: 'SSL Certificate Expiring Soon',
              description: `Certificate expires in ${daysLeft} days on ${cert.valid_to}.`,
              current: `${daysLeft} days remaining`,
              expected: '>30 days until expiry'
            });
          } else {
            findings.push({
              module: 'SSL',
              severity: 'PASS',
              title: 'Certificate Expiry',
              description: `Certificate valid for ${daysLeft} more days.`,
              current: `${daysLeft} days remaining`,
              expected: '>30 days ✓'
            });
          }
        }

        // Protocol version
        if (protocol) {
          const weakProtocols = ['SSLv3', 'TLSv1', 'TLSv1.1'];
          if (weakProtocols.includes(protocol)) {
            findings.push({
              module: 'SSL',
              severity: 'HIGH',
              title: 'Deprecated TLS Protocol',
              description: `Server is using ${protocol}, which is deprecated and has known vulnerabilities.`,
              current: protocol,
              expected: 'TLSv1.2 or TLSv1.3'
            });
          } else {
            findings.push({
              module: 'SSL',
              severity: 'PASS',
              title: 'TLS Protocol Version',
              description: `Using ${protocol}.`,
              current: protocol,
              expected: 'TLSv1.2+ ✓'
            });
          }
        }

        // Cipher strength
        if (cipher) {
          const weakCiphers = ['RC4', 'DES', '3DES', 'MD5', 'NULL', 'EXPORT'];
          const isWeak = weakCiphers.some(w => cipher.name.toUpperCase().includes(w));
          if (isWeak) {
            findings.push({
              module: 'SSL',
              severity: 'HIGH',
              title: 'Weak Cipher Suite',
              description: `Server supports a weak cipher: ${cipher.name}`,
              current: cipher.name,
              expected: 'AES-256-GCM or CHACHA20-POLY1305'
            });
          }
        }

        // Issuer info
        if (cert.issuer) {
          findings.push({
            module: 'SSL',
            severity: 'INFO',
            title: 'Certificate Issuer',
            description: `Issued by: ${cert.issuer.O || cert.issuer.CN || 'Unknown'}`,
            current: cert.issuer.O || cert.issuer.CN || 'Unknown',
            expected: 'Trusted CA'
          });
        }

        socket.end();
        resolve(findings);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        resolve([{
          module: 'SSL',
          severity: 'CRITICAL',
          title: 'SSL Connection Failed',
          description: `Could not establish TLS connection: ${err.message}`,
          current: err.message,
          expected: 'Successful TLS handshake'
        }]);
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve([{
        module: 'SSL',
        severity: 'CRITICAL',
        title: 'SSL Analysis Error',
        description: err.message,
        current: 'Error',
        expected: 'Successful analysis'
      }]);
    }
  });
}

// ── Header Risk Descriptions ────────────────────────────────────────
function getHeaderRisk(name) {
  const risks = {
    'Content-Security-Policy': 'cross-site scripting (XSS), data injection, and clickjacking attacks',
    'Strict-Transport-Security': 'protocol downgrade attacks and cookie hijacking',
    'X-Content-Type-Options': 'MIME-type sniffing attacks that can execute malicious files',
    'X-Frame-Options': 'clickjacking attacks via iframe embedding',
    'Referrer-Policy': 'leaking sensitive URL parameters to third-party sites',
    'Permissions-Policy': 'unauthorized access to browser features (camera, mic, geolocation)',
    'Cross-Origin-Opener-Policy': 'Spectre-class side-channel attacks',
    'Cross-Origin-Embedder-Policy': 'unauthorized cross-origin resource access',
    'Cross-Origin-Resource-Policy': 'cross-origin data leaks'
  };
  return risks[name] || 'various web attacks';
}

function getHeaderRecommendation(name) {
  const recs = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
  return recs[name] || 'Set appropriate value';
}

function checkHeaderWeakness(name, value) {
  const val = value.toLowerCase();
  if (name === 'Content-Security-Policy') {
    if (val.includes("'unsafe-inline'") || val.includes("'unsafe-eval'")) {
      return {
        description: `CSP contains 'unsafe-inline' or 'unsafe-eval', significantly weakening XSS protection.`,
        recommended: "Remove 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts."
      };
    }
    if (val.includes('*') && !val.includes('*.')) {
      return {
        description: `CSP contains wildcard (*) source, allowing scripts from any origin.`,
        recommended: "Replace wildcard with specific trusted domains."
      };
    }
  }
  if (name === 'Strict-Transport-Security') {
    const maxAgeMatch = val.match(/max-age=(\d+)/);
    if (maxAgeMatch && parseInt(maxAgeMatch[1]) < 15768000) {
      return {
        description: `HSTS max-age is less than 6 months (${maxAgeMatch[1]}s). Should be at least 1 year.`,
        recommended: 'max-age=31536000; includeSubDomains; preload'
      };
    }
  }
  return null;
}
