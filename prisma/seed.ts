import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

void (async function () {
  const passwordHash = await bcryptjs.hash("password123", 10);

  const michielId = "dd74961a-c348-4471-98a5-19fc3c5b5079";
  const jason = await prisma.user.upsert({
    where: { id: michielId },
    update: { passwordHash },
    create: {
      id: michielId,
      email: "michiel@unhosted.org",
      createdIP: "127.0.0.1",
      passwordHash,
    },
  });

  const clientId = "0e2ec2df-ee53-4327-a472-9d78c278bdbb";
  const client = await prisma.oAuthClient.upsert({
    where: { id: clientId },
    update: {},
    create: {
      id: clientId,
      name: "Sample Client",
      secret: null,
      allowedGrants: ["authorization_code", "client_credentials", "refresh_token"],
      redirectUris: ["https://sram-auth-poc.pondersource.net/callback"],
    },
  });

  const clientId2 = "9aeb7ebf-09e9-4e96-88a7-b3cf9f9739a2";
  const client2 = await prisma.oAuthClient.upsert({
    where: { id: clientId },
    update: {},
    create: {
      id: clientId,
      name: "WebDAV Mounter",
      secret: null,
      allowedGrants: ["authorization_code", "client_credentials", "refresh_token"],
      redirectUris: ["http://sram-auth-poc.pondersource.net/callback"],
    },
  });

  const scopeId = "c3d49dba-53c8-4d08-970f-9c567414732e";
  const scope = await prisma.oAuthScope.upsert({
    where: { id: scopeId },
    update: {},
    create: {
      id: scopeId,
      name: "contacts.read",
    },
  });

  const scopeId2 = "22861a6c-dd8d-47b3-be1f-a3e7b67943bc";
  const scope2 = await prisma.oAuthScope.upsert({
    where: { id: scopeId2 },
    update: {},
    create: {
      id: scopeId2,
      name: "contacts.write",
    },
  });
})();
