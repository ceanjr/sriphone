import { s as supabase } from '../../../chunks/supabase_uscxYbXR.mjs';
import { v as verifyAuth } from '../../../chunks/auth_BUEwRazm.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        error: "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        error: "Arquivo muito grande. Tamanho máximo: 5MB"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `produtos/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("imagens").upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false
    });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({
        error: "Erro ao fazer upload da imagem"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { data: { publicUrl } } = supabase.storage.from("imagens").getPublicUrl(filePath);
    return new Response(JSON.stringify({
      url: publicUrl,
      path: filePath,
      fileName
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { path } = await request.json();
    if (!path) {
      return new Response(JSON.stringify({ error: "Path da imagem não informado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { error } = await supabase.storage.from("imagens").remove([path]);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), {
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
