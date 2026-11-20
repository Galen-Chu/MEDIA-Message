/**
 * 金鑰庫單元測試(jsdom:localStorage 可用)。
 * 重點:IA-D8 唯讀契約——本庫的任何寫入操作都不得碰文管庫的金鑰鍵。
 */
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  KEY_SOURCE_STORAGE,
  OWN_KEY_STORAGE,
  PEER_KEY_STORAGE,
  clearOwnKey,
  getKeySource,
  loadOwnKey,
  loadPeerKey,
  resolveActiveKey,
  saveOwnKey,
  setKeySource,
} from './keyStore';

beforeEach(() => {
  localStorage.clear();
});

describe('自有金鑰', () => {
  it('save/load/clear 往返', () => {
    expect(loadOwnKey()).toBe('');
    saveOwnKey('AQ.test-own-key');
    expect(loadOwnKey()).toBe('AQ.test-own-key');
    clearOwnKey();
    expect(loadOwnKey()).toBe('');
  });
});

describe('IA-D8 唯讀契約:文管庫金鑰鍵', () => {
  it('可讀:loadPeerKey 讀得到文管庫寫入的鍵', () => {
    localStorage.setItem(PEER_KEY_STORAGE, 'AIza.peer-key');
    expect(loadPeerKey()).toBe('AIza.peer-key');
  });

  it('不可寫/不可清:本庫所有寫入操作後,文管庫金鑰鍵原封不動', () => {
    localStorage.setItem(PEER_KEY_STORAGE, 'AIza.peer-key');

    saveOwnKey('AQ.own');
    setKeySource('peer');
    setKeySource('own');
    clearOwnKey();

    expect(localStorage.getItem(PEER_KEY_STORAGE)).toBe('AIza.peer-key');
    // 本庫自有鍵與來源鍵都不等於文管庫鍵名(契約:金鑰不進 family:*、不覆寫對方)
    expect(localStorage.getItem(OWN_KEY_STORAGE)).toBeNull();
    expect(localStorage.getItem(KEY_SOURCE_STORAGE)).toBe('own');
  });

  it('文管庫鍵不存在 → 空字串(呼叫端顯示 peer_key_missing)', () => {
    expect(loadPeerKey()).toBe('');
  });
});

describe('來源偏好與解析', () => {
  it('預設 own;壞值防禦式退回 own', () => {
    expect(getKeySource()).toBe('own');
    localStorage.setItem(KEY_SOURCE_STORAGE, 'hacked');
    expect(getKeySource()).toBe('own');
  });

  it('resolveActiveKey:own 來源用本機金鑰', () => {
    saveOwnKey('AQ.own');
    localStorage.setItem(PEER_KEY_STORAGE, 'AIza.peer');
    expect(resolveActiveKey()).toEqual({ key: 'AQ.own', source: 'own' });
  });

  it('resolveActiveKey:peer 來源唯讀文管庫金鑰;對方已清除=空值不誤用本機', () => {
    setKeySource('peer');
    localStorage.setItem(PEER_KEY_STORAGE, 'AIza.peer');
    expect(resolveActiveKey()).toEqual({ key: 'AIza.peer', source: 'peer' });

    localStorage.removeItem(PEER_KEY_STORAGE); // 文管庫端清除
    expect(resolveActiveKey()).toEqual({ key: '', source: 'peer' });
  });
});
