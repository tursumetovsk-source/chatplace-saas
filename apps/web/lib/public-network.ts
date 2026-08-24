import { isIP } from 'node:net';

export function normalizedHostname(value: string) {
  const hostname = value.toLowerCase().split('%')[0];
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

function mappedIpv4(address: string) {
  if (!address.startsWith('::ffff:')) return null;
  const suffix = address.slice(7);
  if (suffix.includes('.')) return suffix;
  const groups = suffix.split(':');
  if (groups.length !== 2 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  const first = Number.parseInt(groups[0], 16);
  const second = Number.parseInt(groups[1], 16);
  return `${first >> 8}.${first & 255}.${second >> 8}.${second & 255}`;
}

export function isPrivateAddress(value: string): boolean {
  const address = normalizedHostname(value);
  if (isIP(address) === 4) {
    const parts = address.split('.').map(Number);
    const [a, b, c] = parts;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 0 && c === 0) || (a === 192 && b === 0 && c === 2)
      || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19))
      || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)
      || a >= 224;
  }
  if (isIP(address) !== 6) return true;
  const ipv4 = mappedIpv4(address);
  if (ipv4) return isPrivateAddress(ipv4);
  return address === '::' || address === '::1' || address.startsWith('fc') || address.startsWith('fd')
    || /^fe[89ab]/.test(address) || address.startsWith('ff') || address.startsWith('2001:db8:')
    || address.startsWith('64:ff9b:') || address.startsWith('2002:');
}

export function parsePublicHttpsUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Укажите корректный HTTPS URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Разрешены только HTTPS URL без логина, пароля и фрагмента');
  const hostname = normalizedHostname(url.hostname);
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) throw new Error('Локальные адреса запрещены');
  if (isIP(hostname) && isPrivateAddress(hostname)) throw new Error('Приватные и служебные IP-адреса запрещены');
  return url;
}
