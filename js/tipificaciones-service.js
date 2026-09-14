// =====================================================
// TIPIFICA+
// Servicio central del catálogo de tipificaciones
// =====================================================

let TIPIFICACIONES = [];

/**
 * Carga el catálogo JSON.
 */
export async function cargarTipificaciones() {
    try {
        const respuesta = await fetch("./tipificaciones.json", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error(
                `No fue posible cargar tipificaciones.json. HTTP ${respuesta.status}`
            );
        }

        const datos = await respuesta.json();

        TIPIFICACIONES = (datos.tipificaciones || []).filter(
            tipificacion => tipificacion.activo !== false
        );

        console.log(
            `[Tipifica+] ${TIPIFICACIONES.length} tipificaciones cargadas`
        );

        return TIPIFICACIONES;

    } catch (error) {
        console.error("[Tipifica+] Error cargando catálogo:", error);
        TIPIFICACIONES = [];
        throw error;
    }
}


/**
 * Devuelve todas las tipificaciones cargadas.
 */
export function obtenerTipificaciones() {
    return [...TIPIFICACIONES];
}


/**
 * Convierte texto a un formato comparable.
 *
 * Ejemplo:
 * "Sesión Atrapada" -> "sesion atrapada"
 */
export function normalizarTexto(texto = "") {

    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[*_]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// =====================================================
// CANONIZACIÓN DEL CATÁLOGO
// Unifica diferencias de escritura sin modificar
// la tipificación original almacenada.
// =====================================================

const ALIAS_CATALOGO = {

    plantilla: {

        // Mismo concepto escrito de distintas formas
        "persona": "PERSONA",
        "personas": "PERSONA",

        "canalizacion": "CANALIZACION",

        "canal digital": "CANAL DIGITAL",

        "cuenta": "CUENTA",

        "tpv": "TPV"

    },


    operacional1: {

        "asesoria usuario": "ASESORIA USUARIO",
        "asesoría usuario": "ASESORIA USUARIO",

        "aplicacion": "APLICACION",
        "aplicación": "APLICACION",

        "aplicativo": "APLICATIVO",

        "seguridad": "SEGURIDAD",

        "infraestructura": "INFRAESTRUCTURA",

        "direccionamiento": "DIRECCIONAMIENTO"

    },


    operacional2: {

        "base de datos": "BASE DE DATOS",

        "no acceso": "NO ACCESO",

        "subproceso": "SUBPROCESO",

        "credenciales de usuario": "CREDENCIALES DE USUARIO",

        "cancelacion": "CANCELACION",
        "cancelación": "CANCELACION",

        "contratacion": "CONTRATACION",
        "contratación": "CONTRATACION",

        "mantenimiento": "MANTENIMIENTO",

        "dispositivo": "DISPOSITIVO",

        "formulario": "FORMULARIO",

        "dar": "DAR",

        // DAR/JAN se conserva separado por ahora,
        // porque puede representar una ruta distinta.
        "dar/jan": "DAR/JAN",

        "t&c": "T&C",

        "frente de sistemas": "FRENTE DE SISTEMAS",

        "soporte celulares": "SOPORTE CELULARES",

        "buzon funcional": "BUZON FUNCIONAL",
        "buzón funcional": "BUZON FUNCIONAL"

    },


    operacional3: {

        "curp": "CURP",

        "rfc": "RFC",

        "correo": "CORREO",

        "nombre": "NOMBRE",

        "telefono": "TELEFONO",
        "teléfono": "TELEFONO",

        "degradacion": "DEGRADACION",
        "degradación": "DEGRADACION",

        "impresion": "IMPRESION",
        "impresión": "IMPRESION",

        "sesion atrapada": "SESION ATRAPADA",
        "sesión atrapada": "SESION ATRAPADA",

        "no apertura aplicativo": "NO APERTURA APLICATIVO",

        "no reconoce claves de usuario":
            "NO RECONOCE CLAVES DE USUARIO",

        "facultades": "FACULTADES",

        "requerimiento pmo": "REQUERIMIENTO PMO",

        "apertura logica de sucursal":
            "APERTURA LOGICA DE SUCURSAL",

        "apertura lógica de sucursal":
            "APERTURA LOGICA DE SUCURSAL",

        "alta de incidencia":
            "ALTA DE INCIDENCIA",

        "configuracion": "CONFIGURACION",
        "configuración": "CONFIGURACION"

    }

};


/**
 * Devuelve el nombre estándar que verá el asesor.
 *
 * IMPORTANTE:
 * No modifica el JSON original.
 */
export function canonicalizarValor(campo, valor = "") {

    const textoOriginal =
        String(valor || "").trim();

    if (!textoOriginal) {
        return "";
    }


    const clave =
        normalizarTexto(textoOriginal);


    const aliases =
        ALIAS_CATALOGO[campo] || {};


    if (aliases[clave]) {
        return aliases[clave];
    }


    // Si no existe alias, conserva el valor original
    // pero limpia espacios innecesarios.
    return textoOriginal;
}


/**
 * Obtiene valores únicos de cualquier campo.
 *
 * Ejemplo:
 * obtenerValoresUnicos("plantilla")
 */
export function obtenerValoresUnicos(campo, filtros = {}) {

    const resultados = filtrarTipificaciones(filtros);

    const valores = resultados
        .map(item => item[campo])
        .filter(valor =>
            valor !== undefined &&
            valor !== null &&
            String(valor).trim() !== ""
        );

    return [
        ...new Map(
            valores.map(valor => [
                normalizarTexto(valor),
                valor
            ])
        ).values()
    ].sort((a, b) =>
        String(a).localeCompare(String(b), "es")
    );
}


/**
 * Filtra el catálogo usando uno o varios niveles.
 *
 * Ejemplo:
 *
 * filtrarTipificaciones({
 *    plantilla: "CANALIZACION",
 *    operacional1: "DIRECCIONAMIENTO"
 * });
 */
export function filtrarTipificaciones(filtros = {}) {

    return TIPIFICACIONES.filter(tipificacion => {

        return Object.entries(filtros).every(([campo, valor]) => {

            if (
                valor === undefined ||
                valor === null ||
                String(valor).trim() === ""
            ) {
                return true;
            }

            return (
                normalizarTexto(tipificacion[campo]) ===
                normalizarTexto(valor)
            );
        });

    });
}


/**
 * Busca coincidencias generales.
 *
 * Esta función será utilizada posteriormente
 * por el chat.
 */
export function buscarTipificaciones(textoConsulta) {

    const consulta = normalizarTexto(textoConsulta);

    if (!consulta) {
        return [];
    }

    const palabrasConsulta = consulta
        .split(" ")
        .filter(palabra => palabra.length > 1);

    return TIPIFICACIONES
        .map(tipificacion => {

            const textoCompleto = normalizarTexto([
                tipificacion.plantilla,
                tipificacion.operacional1,
                tipificacion.operacional2,
                tipificacion.operacional3,
                tipificacion.producto1,
                tipificacion.producto2,
                tipificacion.producto3,
                tipificacion.caso
            ].join(" "));

            let puntuacion = 0;

            // Coincidencia con la frase completa
            if (textoCompleto.includes(consulta)) {
                puntuacion += 50;
            }

            // Coincidencias por palabra
            palabrasConsulta.forEach(palabra => {

                if (textoCompleto.includes(palabra)) {
                    puntuacion += 5;
                }

            });

            // Dar mayor peso al caso de uso
            const caso = normalizarTexto(tipificacion.caso);

            palabrasConsulta.forEach(palabra => {

                if (caso.includes(palabra)) {
                    puntuacion += 8;
                }

            });

            return {
                tipificacion,
                puntuacion
            };

        })
        .filter(resultado => resultado.puntuacion > 0)
        .sort((a, b) => b.puntuacion - a.puntuacion);
}


/**
 * Busca una ruta exacta.
 */
export function buscarRutaExacta({
    plantilla,
    operacional1,
    operacional2,
    operacional3
}) {

    return filtrarTipificaciones({
        plantilla,
        operacional1,
        operacional2,
        operacional3
    });

}


/**
 * Determina cuál es el siguiente nivel disponible.
 */
export function obtenerSiguienteNivel(seleccion = {}) {

    if (!seleccion.plantilla) {
        return {
            campo: "plantilla",
            etiqueta: "Selecciona el tipo de solicitud"
        };
    }

    if (!seleccion.operacional1) {
        return {
            campo: "operacional1",
            etiqueta: "Categoría Operacional 1"
        };
    }

    if (!seleccion.operacional2) {
        return {
            campo: "operacional2",
            etiqueta: "Categoría Operacional 2"
        };
    }

    if (!seleccion.operacional3) {
        return {
            campo: "operacional3",
            etiqueta: "Categoría Operacional 3"
        };
    }

    return null;
}


/**
 * Devuelve las opciones que corresponden al
 * siguiente nivel de la botonera.
 */
export function obtenerOpcionesSiguienteNivel(seleccion = {}) {

    const siguienteNivel = obtenerSiguienteNivel(seleccion);

    if (!siguienteNivel) {
        return [];
    }

    const filtros = {};

    if (seleccion.plantilla) {
        filtros.plantilla = seleccion.plantilla;
    }

    if (seleccion.operacional1) {
        filtros.operacional1 = seleccion.operacional1;
    }

    if (seleccion.operacional2) {
        filtros.operacional2 = seleccion.operacional2;
    }

    if (seleccion.operacional3) {
        filtros.operacional3 = seleccion.operacional3;
    }

    return obtenerValoresUnicos(
        siguienteNivel.campo,
        filtros
    );
}
