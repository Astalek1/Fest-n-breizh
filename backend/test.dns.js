import dns from "node:dns/promises";

try {
  const records = await dns.resolveSrv(
    "_mongodb._tcp.fnb.b1ihhhn.mongodb.net"
  );

  console.log(records);
} catch (err) {
  console.error(err);
}