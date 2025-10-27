import { s as supabase } from '../../../chunks/supabase_uscxYbXR.mjs';
import { v as verifyAuth } from '../../../chunks/auth_BUEwRazm.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { data, error } = await supabase.from("produtos").select("*, categoria:categoria_id(id, nome)").order("created_at", { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify({ produtos: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await request.json();
    const { data, error } = await supabase.from("produtos").insert([body]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify({ produto: data }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
