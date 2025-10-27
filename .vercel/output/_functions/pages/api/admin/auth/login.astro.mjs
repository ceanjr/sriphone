import { l as login } from '../../../../chunks/auth_BUEwRazm.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const POST = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const data = await login(email, password);
    if (data.session) {
      cookies.set("sb-access-token", data.session.access_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        // 7 days
        httpOnly: true,
        secure: true,
        sameSite: "lax"
      });
      cookies.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        // 7 days
        httpOnly: true,
        secure: true,
        sameSite: "lax"
      });
    }
    return new Response(JSON.stringify({
      success: true,
      user: data.user,
      session: data.session
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
