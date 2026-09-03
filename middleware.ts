export { default } from "next-auth/middleware";

// Everything under these application paths requires an active authenticated session.
// Unauthenticated requests are automatically redirected to /login with callbackUrl.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/competencies/:path*",
    "/designations/:path*",
    "/skill-gaps/:path*",
    "/courses/:path*",
    "/my-learning/:path*",
    "/reassessments/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
