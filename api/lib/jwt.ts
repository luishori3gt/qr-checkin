import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const secret = new TextEncoder().encode(env.appSecret);

export async function sign(payload: object): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verify(token: string): Promise<unknown> {
  const { payload } = await jwtVerify(token, secret, {
    clockTolerance: 60,
  });
  return payload;
}
