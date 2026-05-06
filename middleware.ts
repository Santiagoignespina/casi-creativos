import { NextResponse, type NextRequest } from "next/server";
import { checkBasicAuth } from "./lib/basic-auth";

export function middleware(req: NextRequest) {
  if (!checkBasicAuth(req.headers.get("authorization"))) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Casi Creativos Admin"' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/pedidos/:id/acreditar",
  ],
};
