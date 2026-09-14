// =====================================================
// TIPIFICA+ - MOTOR DE CONSULTA
// Interpreta preguntas escritas por los asesores
// =====================================================

import {
    obtenerTipificaciones,
    normalizarTexto
} from "./tipificaciones-service.js";


// -----------------------------------------------------
// PALABRAS QUE NO APORTAN MUCHO A LA BÚSQUEDA
// -----------------------------------------------------

const STOP_WORDS = new Set([
    "el", "la", "los", "las",
    "un", "una", "unos", "unas",
    "de", "del", "al",
    "que", "se", "me", "mi",
    "su", "sus",
    "en", "con", "por", "para",
    "y", "o", "a",
    "es", "esta", "este",
    "tengo", "tiene",
    "usuario", "ejecutivo",
    "reporta", "indica",
    "apoyo", "ayuda",
    "como", "tipifico",
    "tipificacion"
]);


// -----------------------------------------------------
// SINÓNIMOS / FORMAS DE HABLAR DE LOS ASESORES
// -----------------------------------------------------

const SINONIMOS = {

    // Terminal Financiero
    "terminal financiero": ["tf"],
    "terminal": ["tf"],

    // Estados de acceso
    "no entra": ["no acceso", "no apertura aplicativo"],
    "no ingresa": ["no acceso", "no apertura aplicativo"],
    "no puede entrar": ["no acceso", "no apertura aplicativo"],
    "no puede ingresar": ["no acceso", "no apertura aplicativo"],

    // Sesión atrapada
    "ya esta logueado": ["sesion atrapada"],
    "ya se encuentra logueado": ["sesion atrapada"],
    "logueado en otro puesto": ["sesion atrapada"],
    "sesion abierta": ["sesion atrapada"],

    // Degradación
    "esta lento": ["degradacion"],
    "esta lenta": ["degradacion"],
    "lentitud": ["degradacion"],
    "lento": ["degradacion"],

    // Impresión
    "no imprime": ["impresion"],
    "no puede imprimir": ["impresion"],
    "problema impresora": ["impresion"],

    // Credenciales
    "bloqueado": ["bloqueo", "credenciales"],
    "bloqueada": ["bloqueo", "credenciales"],
    "clave bloqueada": ["credenciales"],

    // Windows
    "computadora": ["windows"],
    "laptop": ["windows"],
    "lap top": ["windows"],
    "tableta hibrida": ["windows"],

    // EECC
    "estados de cuenta": ["eecc"],

    // Base de datos
    "actualizar": ["actualizacion"],
    "actualizacion": ["base de datos"],

    // Datos personales
    "correo electronico": ["correo"],
    "telefono cliente": ["telefono"],
    "curp cliente": ["curp"],
    "rfc cliente": ["rfc"],

    // Canalización
    "canalizar": ["canalizacion", "direccionamiento"],
    "canalizacion": ["direccionamiento"],

    // DAR / JAN
    "facultad": ["facultades"],
    "validar facultades": ["facultades", "dar", "jan"],

    // Apertura lógica
    "sucursal cerrada": ["apertura logica de sucursal"],
    "cr cerrado": ["apertura logica de sucursal"],
    "qg94": ["apertura logica de sucursal"],

    // Formación
    "bloqueo formacion": ["bloqueo por formacion"],
    "bloqueado por formacion": ["bloqueo por formacion"]
};


// -----------------------------------------------------
// NORMALIZACIÓN DE CONSULTA
// -----------------------------------------------------

function prepararConsulta(texto) {

    let consulta = normalizarTexto(texto);

    Object.entries(SINONIMOS).forEach(([frase, equivalencias]) => {

        const fraseNormalizada = normalizarTexto(frase);

        if (consulta.includes(fraseNormalizada)) {

            consulta += " " + equivalencias.join(" ");

        }

    });

    return consulta;
}


// -----------------------------------------------------
// EXTRAER PALABRAS IMPORTANTES
// -----------------------------------------------------

function obtenerPalabrasImportantes(texto) {

    return prepararConsulta(texto)
        .split(/\s+/)
        .filter(palabra =>
            palabra.length >= 2 &&
            !STOP_WORDS.has(palabra)
        );
}


// -----------------------------------------------------
// CALCULAR PUNTUACIÓN DE UNA TIPIFICACIÓN
// -----------------------------------------------------

function calcularPuntuacion(tipificacion, consultaOriginal) {

    const consulta = prepararConsulta(consultaOriginal);

    const palabras = obtenerPalabrasImportantes(consultaOriginal);

    let puntuacion = 0;

    const plantilla = normalizarTexto(
        tipificacion.plantilla
    );

    const op1 = normalizarTexto(
        tipificacion.operacional1
    );

    const op2 = normalizarTexto(
        tipificacion.operacional2
    );

    const op3 = normalizarTexto(
        tipificacion.operacional3
    );

    const prod1 = normalizarTexto(
        tipificacion.producto1
    );

    const prod2 = normalizarTexto(
        tipificacion.producto2
    );

    const prod3 = normalizarTexto(
        tipificacion.producto3
    );

    const caso = normalizarTexto(
        tipificacion.caso
    );

    const textoCompleto = [
        plantilla,
        op1,
        op2,
        op3,
        prod1,
        prod2,
        prod3,
        caso
    ].join(" ");


    // -------------------------------------------------
    // COINCIDENCIA EXACTA DE CAMPOS
    // -------------------------------------------------

    if (consulta.includes(plantilla) && plantilla.length > 2) {
        puntuacion += 20;
    }

    if (consulta.includes(op1) && op1.length > 2) {
        puntuacion += 15;
    }

    if (consulta.includes(op2) && op2.length > 2) {
        puntuacion += 18;
    }

    if (consulta.includes(op3) && op3.length > 2) {
        puntuacion += 25;
    }

    if (consulta.includes(prod2) && prod2.length > 1) {
        puntuacion += 20;
    }

    if (consulta.includes(prod3) && prod3.length > 2) {
        puntuacion += 20;
    }


    // -------------------------------------------------
    // COINCIDENCIA POR PALABRAS
    // -------------------------------------------------

    palabras.forEach(palabra => {

        if (textoCompleto.includes(palabra)) {
            puntuacion += 3;
        }

        // El caso de uso tiene mayor importancia
        if (caso.includes(palabra)) {
            puntuacion += 7;
        }

        if (op3.includes(palabra)) {
            puntuacion += 5;
        }

        if (prod3.includes(palabra)) {
            puntuacion += 4;
        }

    });


    // -------------------------------------------------
    // REGLAS ESPECIALES DE NEGOCIO
    // -------------------------------------------------

    // SESIÓN ATRAPADA
    if (
        consulta.includes("logueado") &&
        op3.includes("sesion atrapada")
    ) {
        puntuacion += 60;
    }


    // DEGRADACIÓN
    if (
        (
            consulta.includes("degradacion") ||
            consulta.includes("lento") ||
            consulta.includes("lentitud")
        ) &&
        op3.includes("degradacion")
    ) {
        puntuacion += 55;
    }


    // IMPRESIÓN TF
    if (
        consulta.includes("impresion") &&
        op3.includes("impresion")
    ) {
        puntuacion += 55;
    }


    // BLOQUEO WINDOWS
    if (
        consulta.includes("windows") &&
        prod3.includes("windows")
    ) {
        puntuacion += 50;
    }


    // TERMINAL FINANCIERO
    if (
        consulta.includes("tf") &&
        prod2 === "tf"
    ) {
        puntuacion += 35;
    }


    // EECC
    if (
        consulta.includes("eecc") &&
        prod2 === "eecc"
    ) {
        puntuacion += 35;
    }


    // CURP
    if (
        consulta.includes("curp") &&
        op3.includes("curp")
    ) {
        puntuacion += 50;
    }


    // RFC
    if (
        consulta.includes("rfc") &&
        op3.includes("rfc")
    ) {
        puntuacion += 50;
    }


    // CORREO
    if (
        consulta.includes("correo") &&
        op3.includes("correo")
    ) {
        puntuacion += 50;
    }


    // APERTURA LÓGICA
    if (
        (
            consulta.includes("qg94") ||
            consulta.includes("cr cerrado") ||
            consulta.includes("apertura logica")
        ) &&
        op3.includes("apertura logica")
    ) {
        puntuacion += 80;
    }


    // FACULTADES DAR/JAN
    if (
        consulta.includes("facultades") &&
        op3.includes("facultades")
    ) {
        puntuacion += 70;
    }


    return puntuacion;
}


// -----------------------------------------------------
// ANALIZAR MENSAJE DEL ASESOR
// -----------------------------------------------------

export function analizarMensaje(mensaje) {

    if (!mensaje || mensaje.trim().length < 2) {

        return {
            tipo: "vacio",
            mensaje:
                "Describe brevemente el motivo de la llamada."
        };

    }

    const tipificaciones = obtenerTipificaciones();

    if (!tipificaciones.length) {

        return {
            tipo: "error",
            mensaje:
                "El catálogo de tipificaciones todavía no está disponible."
        };

    }


    const resultados = tipificaciones
        .map(tipificacion => ({
            tipificacion,
            puntuacion: calcularPuntuacion(
                tipificacion,
                mensaje
            )
        }))
        .filter(resultado =>
            resultado.puntuacion > 0
        )
        .sort((a, b) =>
            b.puntuacion - a.puntuacion
        );


    if (!resultados.length) {

        return {
            tipo: "sin_resultado",

            mensaje:
                "No encontré una tipificación suficientemente relacionada. Agrega más información sobre el aplicativo, error o solicitud."
        };

    }


    const mejor = resultados[0];

    const segundo = resultados[1];


    // -------------------------------------------------
    // NIVEL DE CONFIANZA
    // -------------------------------------------------

    let confianza = "baja";

    if (mejor.puntuacion >= 80) {
        confianza = "alta";
    }

    else if (mejor.puntuacion >= 45) {
        confianza = "media";
    }


    // -------------------------------------------------
    // POSIBLE AMBIGÜEDAD
    // -------------------------------------------------

    const alternativasCercanas = resultados
        .filter(resultado =>
            resultado.puntuacion >=
            mejor.puntuacion * 0.82
        )
        .slice(0, 5);


    if (
        segundo &&
        alternativasCercanas.length > 1
    ) {

        return {

            tipo: "ambiguo",

            mensaje:
                "Encontré más de una tipificación posible. Selecciona el caso que mejor corresponda:",

            confianza,

            opciones: alternativasCercanas.map(
                resultado => ({
                    ...resultado.tipificacion,
                    puntuacion: resultado.puntuacion
                })
            )
        };

    }


    // -------------------------------------------------
    // RESPUESTA ÚNICA
    // -------------------------------------------------

    return {

        tipo: "resultado",

        mensaje:
            "Encontré esta tipificación como la más relacionada con el caso:",

        confianza,

        puntuacion: mejor.puntuacion,

        tipificacion: mejor.tipificacion

    };
}


// -----------------------------------------------------
// FORMATEAR RUTA PARA MOSTRARLA EN PANTALLA
// -----------------------------------------------------

export function obtenerRutaTipificacion(tipificacion) {

    return {

        plantilla:
            tipificacion.plantilla || "N/A",

        operacional1:
            tipificacion.operacional1 || "N/A",

        operacional2:
            tipificacion.operacional2 || "N/A",

        operacional3:
            tipificacion.operacional3 || "N/A",

        producto1:
            tipificacion.producto1 || "N/A",

        producto2:
            tipificacion.producto2 || "N/A",

        producto3:
            tipificacion.producto3 || "N/A",

        caso:
            tipificacion.caso || ""

    };

}
