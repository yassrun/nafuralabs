import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';

import { authorizeUrl, codeChallenge, logoutUrl, sha256 } from './oidc.ts';

test('the fallback SHA-256 matches the standard digest on every padding boundary', () => {
  for (const size of [0, 1, 55, 56, 63, 64, 65, 119, 120, 1000]) {
    const bytes = randomBytes(size);
    assert.equal(Buffer.from(sha256(new Uint8Array(bytes))).toString('hex'), createHash('sha256').update(bytes).digest('hex'));
  }
});

test('the PKCE challenge is base64url(SHA-256(verifier)), as in RFC 7636 appendix B', async () => {
  const verifier = 'dBjftJeZ4CVP-mB92K9uhvYwJHcWJ9mGhhb3bP1MiE';
  const expected = createHash('sha256').update(verifier).digest('base64url');
  assert.equal(await codeChallenge(verifier), expected);
  assert.equal(Buffer.from(sha256(new TextEncoder().encode(verifier))).toString('base64url'), expected);
});

test('authorize and logout URLs target the realm endpoints of the product client', () => {
  const client = { issuer: 'https://iam.example.com/realms/iam-portal/', clientId: 'acme' };
  const authorize = new URL(authorizeUrl(client, 'https://acme.example.com/auth/callback', 'st', 'ch'));
  assert.equal(authorize.origin + authorize.pathname, 'https://iam.example.com/realms/iam-portal/protocol/openid-connect/auth');
  assert.equal(authorize.searchParams.get('client_id'), 'acme');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(authorize.searchParams.get('response_type'), 'code');

  const logout = new URL(logoutUrl(client, 'https://acme.example.com/login', 'idt'));
  assert.equal(logout.pathname, '/realms/iam-portal/protocol/openid-connect/logout');
  assert.equal(logout.searchParams.get('id_token_hint'), 'idt');
});
