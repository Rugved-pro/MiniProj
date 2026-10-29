import { SignJWT, jwtVerify } from "jose";

const textEncoder = new TextEncoder();

export async function signJwt(payload, secret, expiresIn) {
    if (!secret) {
        throw new Error("JWT signing secret is not configured.");
    }

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(textEncoder.encode(secret));
}

export async function verifyJwt(token, secret) {
    if (!secret) {
        throw new Error("JWT verification secret is not configured.");
    }

    const { payload } = await jwtVerify(token, textEncoder.encode(secret), {
        algorithms: ["HS256"],
    });
    return payload;
}
