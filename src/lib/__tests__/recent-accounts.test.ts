import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeRecentAccountsForTest,
  parseRecentAccountsJsonForTest,
  getAccountInitials,
  type RecentAccount,
} from '../recent-accounts';

describe('recent-accounts', () => {
  it('parseRecentAccountsJsonForTest returns empty for invalid JSON', () => {
    assert.deepEqual(parseRecentAccountsJsonForTest('not-json'), []);
    assert.deepEqual(parseRecentAccountsJsonForTest('{}'), []);
  });

  it('parseRecentAccountsJsonForTest normalizes valid entries', () => {
    const raw = JSON.stringify([
      { email: 'User@Example.com', name: 'Jane Doe', lastUsedAt: 100 },
      { email: 'bad', lastUsedAt: 'x' },
    ]);
    assert.deepEqual(parseRecentAccountsJsonForTest(raw), [
      { email: 'user@example.com', name: 'Jane Doe', lastUsedAt: 100 },
    ]);
  });

  it('mergeRecentAccountsForTest adds and dedupes by email', () => {
    const existing: RecentAccount[] = [
      { email: 'a@test.com', lastUsedAt: 50 },
      { email: 'b@test.com', lastUsedAt: 40 },
    ];
    const result = mergeRecentAccountsForTest(existing, { email: 'A@test.com', name: 'A' }, 200);
    assert.equal(result[0].email, 'a@test.com');
    assert.equal(result[0].name, 'A');
    assert.equal(result[0].lastUsedAt, 200);
    assert.equal(result.length, 2);
  });

  it('mergeRecentAccountsForTest caps at 5 accounts', () => {
    const existing: RecentAccount[] = Array.from({ length: 5 }, (_, i) => ({
      email: `u${i}@test.com`,
      lastUsedAt: 100 - i,
    }));
    const result = mergeRecentAccountsForTest(existing, { email: 'new@test.com' }, 999);
    assert.equal(result.length, 5);
    assert.equal(result[0].email, 'new@test.com');
    assert.ok(!result.some((a) => a.email === 'u4@test.com'));
  });

  it('getAccountInitials uses name or email local part', () => {
    assert.equal(
      getAccountInitials({ email: 'j@x.com', name: 'Jane Doe', lastUsedAt: 0 }),
      'JD'
    );
    assert.equal(getAccountInitials({ email: 'john@x.com', lastUsedAt: 0 }), 'JO');
  });
});
