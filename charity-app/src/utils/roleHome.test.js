import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roleHome, roleMismatchNotice, roleDeniedNotice } from './roleHome.js';

describe('roleHome', () => {
  it('sends every account type to its own area', () => {
    assert.equal(roleHome('se'), '/feed');
    assert.equal(roleHome('np_admin'), '/np/home');
    assert.equal(roleHome('platform_admin'), '/admin/dashboard');
    assert.equal(roleHome('guest_lead'), '/guest/feed');
  });

  it('falls back to the public feed for unknown roles', () => {
    assert.equal(roleHome('something_else'), '/guest/feed');
    assert.equal(roleHome(undefined), '/guest/feed');
  });
});

describe('roleMismatchNotice', () => {
  it('is silent when the picked card matches the account', () => {
    assert.equal(roleMismatchNotice('np', 'np_admin'), null);
    assert.equal(roleMismatchNotice('admin', 'platform_admin'), null);
    assert.equal(roleMismatchNotice('se', 'se'), null);
  });

  it('explains the redirect when an nonprofit admin picks the Admin card', () => {
    const msg = roleMismatchNotice('admin', 'np_admin');
    assert.match(msg, /nonprofit admin/);
  });

  it('explains the redirect when a platform admin picks the SE card', () => {
    assert.match(roleMismatchNotice('se', 'platform_admin'), /Charity Hub admin/);
  });
});

describe('roleDeniedNotice', () => {
  it('names the account type', () => {
    assert.match(roleDeniedNotice('np_admin'), /nonprofit admin/);
  });
});
