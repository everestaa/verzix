
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return responder({ error: "Método no permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Faltan variables de entorno de Supabase.");
      return responder({ error: "Configuración del servidor incompleta." }, 500);
    }

    // Verificar la sesión real de quien llama a la función.
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return responder({ error: "Sesión no válida." }, 401);
    }

    const token = authorization.replace("Bearer ", "");

    const supabaseAuth = createClient(supabaseUrl, anonKey);

    const { data: usuarioSesion, error: errorSesion } =
      await supabaseAuth.auth.getUser(token);

    if (errorSesion || !usuarioSesion.user) {
      return responder({ error: "No se pudo verificar tu sesión." }, 401);
    }

    // Cliente administrativo: nunca se utiliza en el frontend.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Comprobar que el usuario sea super_admin.
    const { data: rol, error: errorRol } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", usuarioSesion.user.id)
      .maybeSingle();

    if (errorRol || rol?.role !== "super_admin") {
      return responder(
        { error: "No tenés permisos para crear propietarios." },
        403
      );
    }

    const body = await req.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    const negocioId = Number(body.negocio_id);

    if (
      !email ||
      !email.includes("@") ||
      !Number.isSafeInteger(negocioId) ||
      negocioId <= 0 ||
      password.length < 8
    ) {
      return responder(
        {
          error:
            "Datos inválidos. Revisá el correo, el negocio y la contraseña (mínimo 8 caracteres).",
        },
        400
      );
    }

    // Comprobar que el negocio existe y todavía no tiene propietario.
    const { data: negocio, error: errorNegocio } = await admin
      .from("negocios")
      .select("id, email_propietario, propietario_id")
      .eq("id", negocioId)
      .maybeSingle();

    if (errorNegocio || !negocio) {
      return responder({ error: "No se encontró el negocio." }, 404);
    }

    if (negocio.propietario_id) {
      return responder(
        { error: "Este negocio ya tiene una cuenta de propietario vinculada." },
        409
      );
    }

    if (negocio.email_propietario?.trim().toLowerCase() !== email) {
      return responder(
        { error: "El correo no coincide con el correo registrado en el negocio." },
        400
      );
    }

    // Crear una cuenta nueva. No se reutilizan cuentas existentes.
    const { data: nuevaCuenta, error: errorCrearCuenta } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (errorCrearCuenta || !nuevaCuenta.user) {
      console.error("No se pudo crear la cuenta:", errorCrearCuenta?.message);

      return responder(
        {
          error:
            "No se pudo crear la cuenta. Puede que ese correo ya esté registrado. Revisá el correo o utilizá otro.",
        },
        400
      );
    }

    const nuevoUsuarioId = nuevaCuenta.user.id;

    // Asignar el rol owner.
    const { error: errorAsignarRol } = await admin
      .from("user_roles")
      .upsert(
        {
          user_id: nuevoUsuarioId,
          role: "owner",
        },
        { onConflict: "user_id" }
      );

    if (errorAsignarRol) {
      console.error("Error al asignar rol:", errorAsignarRol.message);
      await admin.auth.admin.deleteUser(nuevoUsuarioId);

      return responder(
        { error: "No se pudo asignar el rol. La cuenta creada fue cancelada." },
        500
      );
    }

    // Vincular la cuenta con el negocio, siempre que siga sin propietario.
    const { data: negocioActualizado, error: errorVincular } = await admin
      .from("negocios")
      .update({ propietario_id: nuevoUsuarioId })
      .eq("id", negocioId)
      .is("propietario_id", null)
      .select("id")
      .maybeSingle();

    if (errorVincular || !negocioActualizado) {
      console.error("Error al vincular negocio:", errorVincular?.message);

      // Revertir la cuenta si no se pudo completar la vinculación.
      await admin.auth.admin.deleteUser(nuevoUsuarioId);

      return responder(
        {
          error:
            "No se pudo vincular el propietario. La cuenta creada fue cancelada.",
        },
        500
      );
    }

return responder({
  success: true,
  message: "Propietario creado y vinculado correctamente.",
  email,
  negocio_id: negocioId,
  propietario_id: nuevoUsuarioId,
});
  } catch (error) {
    console.error("Error inesperado:", error);
    return responder({ error: "Ocurrió un error interno del servidor." }, 500);
  }
});
