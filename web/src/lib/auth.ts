import { base64urlencode } from "$lib/base64";
import { genRandomString } from "$lib/random";

export const CLIENT_ID = "0e2ec2df-ee53-4327-a472-9d78c278bdbb";
export const CALLBACK_URL = "https://sram-auth-poc.pondersource.net/callback";

function sha256(plain: string): Promise<ArrayBuffer> {
  // returns promise ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

async function challengeFromVerifier(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64urlencode(hashed);
}

export async function createAuth() {
  const state = genRandomString(10);
  const verifier = genRandomString(80);
  const challenge = await challengeFromVerifier(verifier);
  return { state, verifier, challenge };
}
