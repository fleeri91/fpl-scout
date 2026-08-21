// Shared between the login/logout/me/my-team route handlers. The cookie
// holds only the FPL `pl_profile` session token (never the password) and is
// httpOnly so client-side JS can't read it.
export const FPL_SESSION_COOKIE = 'fpl_session'
