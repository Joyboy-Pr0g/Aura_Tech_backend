import { BlockList, isIP } from 'net';
import { Request } from 'express';

const IPV4_MAPPED_PREFIX = '::ffff:';

const internalNetworks = new BlockList();
internalNetworks.addSubnet('10.0.0.0', 8, 'ipv4');
internalNetworks.addSubnet('172.16.0.0', 12, 'ipv4');
internalNetworks.addSubnet('192.168.0.0', 16, 'ipv4');
internalNetworks.addSubnet('127.0.0.0', 8, 'ipv4');
internalNetworks.addAddress('::1', 'ipv6');

function normalizeIp(ip: string): string {
  return ip.toLowerCase().startsWith(IPV4_MAPPED_PREFIX) ? ip.slice(IPV4_MAPPED_PREFIX.length) : ip;
}

export function isInternalRequest(req: Pick<Request, 'ip'>): boolean {
  if (!req.ip) {
    return false;
  }

  const ip = normalizeIp(req.ip);
  const family = isIP(ip);
  if (family === 0) {
    return false;
  }

  return internalNetworks.check(ip, family === 4 ? 'ipv4' : 'ipv6');
}
