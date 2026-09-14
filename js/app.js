// =====================================================
// TIPIFICA+
// CONTROL PRINCIPAL DE LA INTERFAZ
// =====================================================

import {
    cargarTipificaciones,
    filtrarTipificaciones,
    obtenerOpcionesSiguienteNivel,
    obtenerSiguienteNivel
} from "./tipificaciones-service.js";


import {
    analizarMensaje
} from "./chat-engine.js";


// =====================================================
// ESTADO
// =====================================================

const seleccion = {

    plantilla: null,
    operacional1: null,
    operacional2: null,
    operacional3: null

};


// =====================================================
// ELEMENTOS
// =====================================================

const modeButtons =
    document.querySelectorAll(".mode-button");


const buttonsMode =
    document.getElementById("buttonsMode");


const chatMode =
    document.getElementById("chatMode");


const wizardQuestion =
    document.getElementById("wizardQuestion");


const wizardOptions =
    document.getElementById("wizardOptions");


const wizardEmpty =
    document.getElementById("wizardEmpty");


const wizardResults =
    document.getElementById("wizardResults");


const currentRoute =
    document.getElementById("currentRoute");


const routeChips =
    document.getElementById("routeChips");


const stepNumber =
    document.getElementById("stepNumber");


const resetButton =
    document.getElementById("resetButton");


const chatForm =
    document.getElementById("chatForm");


const chatInput =
    document.getElementById("chatInput");


const chatMessages =
    document.getElementById("chatMessages");


const detailModal =
    document.getElementById("detailModal");


const modalTitle =
    document.getElementById("modalTitle");


const modalContent =
    document.getElementById("modalContent");


const closeModal =
    document.getElementById("closeModal");


// =====================================================
// CAMBIO DE MODO
// =====================================================

modeButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            modeButtons.forEach(
                item =>
                    item.classList.remove("active")
            );

            button.classList.add("active");


            const mode =
                button.dataset.mode;


            buttonsMode.classList.toggle(
                "active",
                mode === "buttons"
            );


            chatMode.classList.toggle(
                "active",
                mode === "chat"
            );

        }
    );

});


// =====================================================
// BOTONERA
// =====================================================

function renderWizard() {

    const siguiente =
        obtenerSiguienteNivel(seleccion);


    renderRuta();


    wizardOptions.innerHTML = "";

    wizardResults.innerHTML = "";

    wizardEmpty.classList.add("hidden");


    if (!siguiente) {

        mostrarResultadoSeleccion();

        return;

    }


    wizardQuestion.textContent =
        siguiente.etiqueta;


    const niveles = [
        "plantilla",
        "operacional1",
        "operacional2",
        "operacional3"
    ];


    stepNumber.textContent =
        niveles.indexOf(siguiente.campo) + 1;


    const opciones =
        obtenerOpcionesSiguienteNivel(seleccion);


    if (!opciones.length) {

        wizardEmpty.classList.remove("hidden");

        return;

    }


    opciones.forEach(opcion => {

        const button =
            document.createElement("button");


        button.type = "button";

        button.className =
            "option-button";


        button.innerHTML = `
            <strong>${escapeHTML(opcion)}</strong>

            <span>
                Seleccionar
            </span>
        `;


        button.addEventListener(
            "click",
            () => {

                seleccionarOpcion(
                    siguiente.campo,
                    opcion
                );

            }
        );


        wizardOptions.appendChild(button);

    });

}


// =====================================================
// SELECCIONAR
// =====================================================

function seleccionarOpcion(campo, valor) {

    const niveles = [
        "plantilla",
        "operacional1",
        "operacional2",
        "operacional3"
    ];


    const index =
        niveles.indexOf(campo);


    seleccion[campo] = valor;


    // Borra niveles posteriores
    for (
        let i = index + 1;
        i < niveles.length;
        i++
    ) {

        seleccion[
            niveles[i]
        ] = null;

    }


    renderWizard();

}


// =====================================================
// RUTA VISUAL
// =====================================================

function renderRuta() {

    const valores = [
        {
            label: "Plantilla",
            value: seleccion.plantilla
        },

        {
            label: "Op. 1",
            value: seleccion.operacional1
        },

        {
            label: "Op. 2",
            value: seleccion.operacional2
        },

        {
            label: "Op. 3",
            value: seleccion.operacional3
        }
    ].filter(
        item => item.value
    );


    if (!valores.length) {

        currentRoute.classList.add("hidden");

        resetButton.classList.add("hidden");

        return;

    }


    currentRoute.classList.remove("hidden");

    resetButton.classList.remove("hidden");


    routeChips.innerHTML =
        valores.map(item => `

            <span class="route-chip">

                ${escapeHTML(item.label)}:
                ${escapeHTML(item.value)}

            </span>

        `).join("");

}


// =====================================================
// RESULTADOS DE LA BOTONERA
// =====================================================

function mostrarResultadoSeleccion() {

    wizardQuestion.textContent =
        "Tipificaciones encontradas";


    stepNumber.textContent = "✓";


    const resultados =
        filtrarTipificaciones(seleccion);


    wizardOptions.innerHTML = "";


    if (!resultados.length) {

        wizardResults.innerHTML = `

            <div class="empty-state">

                <strong>
                    No encontré coincidencias.
                </strong>

                <p>
                    Reinicia la consulta e intenta
                    una ruta diferente.
                </p>

            </div>
        `;

        return;

    }


    wizardResults.innerHTML =
        resultados.map(
            (tipificacion, index) =>
                crearTarjetaResultado(
                    tipificacion,
                    `wizard-${index}`
                )
        ).join("");


    registrarBotonesDetalle(
        resultados,
        "wizard"
    );

}


// =====================================================
// TARJETA DE RESULTADO
// =====================================================

function crearTarjetaResultado(
    tipificacion,
    id
) {

    return `

        <article class="result-card">

            <div class="result-card-header">

                <div>

                    <span class="step-label">
                        TIPIFICACIÓN
                    </span>

                    <h4>
                        ${escapeHTML(
                            tipificacion.plantilla
                        )}
                    </h4>

                </div>


                <button
                    class="detail-button"
                    data-detail-id="${id}"
                    type="button"
                >
                    Ver detalle
                </button>

            </div>


            <div class="case-box">

                <span>
                    CASO DE USO
                </span>

                ${escapeHTML(
                    tipificacion.caso ||
                    "Sin descripción"
                )}

            </div>

        </article>

    `;

}


// =====================================================
// REINICIAR
// =====================================================

resetButton.addEventListener(
    "click",
    () => {

        Object.keys(seleccion)
            .forEach(
                key =>
                    seleccion[key] = null
            );


        renderWizard();

    }
);


// =====================================================
// CHAT
// =====================================================

chatForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const mensaje =
            chatInput.value.trim();


        if (!mensaje) {

            return;

        }


        agregarMensajeUsuario(
            mensaje
        );


        chatInput.value = "";


        consultarChat(
            mensaje
        );

    }
);


// =====================================================
// EJEMPLOS
// =====================================================

document
    .querySelectorAll(
        ".example-prompt"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const mensaje =
                    button.textContent.trim();


                agregarMensajeUsuario(
                    mensaje
                );


                consultarChat(
                    mensaje
                );

            }
        );

    });


// =====================================================
// MENSAJE DEL USUARIO
// =====================================================

function agregarMensajeUsuario(texto) {

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message user-message";


    wrapper.innerHTML = `

        <div class="message-bubble">

            <p>
                ${escapeHTML(texto)}
            </p>

        </div>

    `;


    chatMessages.appendChild(wrapper);


    scrollChat();

}


// =====================================================
// CONSULTAR CHAT
// =====================================================

function consultarChat(mensaje) {

    const respuesta =
        analizarMensaje(mensaje);


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message assistant-message";


    let contenido = "";


    // ---------------------------------------------
    // RESULTADO ÚNICO
    // ---------------------------------------------

    if (
        respuesta.tipo ===
        "resultado"
    ) {

        const t =
            respuesta.tipificacion;


        contenido = `

            <p>
                ${escapeHTML(
                    respuesta.mensaje
                )}
            </p>

            ${crearDetalleTipificacion(t)}

        `;

    }


    // ---------------------------------------------
    // AMBIGUO
    // ---------------------------------------------

    else if (
        respuesta.tipo ===
        "ambiguo"
    ) {

        contenido = `

            <p>
                ${escapeHTML(
                    respuesta.mensaje
                )}
            </p>

            <div class="results-container">

                ${
                    respuesta.opciones
                        .map(
                            (tipificacion, index) =>
                                crearTarjetaChat(
                                    tipificacion,
                                    index
                                )
                        )
                        .join("")
                }

            </div>

        `;

    }


    // ---------------------------------------------
    // OTROS
    // ---------------------------------------------

    else {

        contenido = `

            <p>
                ${escapeHTML(
                    respuesta.mensaje
                )}
            </p>

        `;

    }


    wrapper.innerHTML = `

        <div class="message-avatar">
            T+
        </div>

        <div class="message-bubble">

            ${contenido}

        </div>

    `;


    chatMessages.appendChild(
        wrapper
    );


    scrollChat();

}


// =====================================================
// TARJETA CHAT
// =====================================================

function crearTarjetaChat(
    tipificacion,
    index
) {

    return `

        <div class="result-card">

            <strong>
                ${escapeHTML(
                    tipificacion.plantilla
                )}
            </strong>

            <p>
                ${escapeHTML(
                    tipificacion.caso
                )}
            </p>

            ${crearDetalleTipificacion(
                tipificacion
            )}

        </div>

    `;

}


// =====================================================
// DETALLE
// =====================================================

function crearDetalleTipificacion(t) {

    return `

        <div class="tipification-grid">

            ${crearCampo(
                "Operacional 1",
                t.operacional1
            )}

            ${crearCampo(
                "Operacional 2",
                t.operacional2
            )}

            ${crearCampo(
                "Operacional 3",
                t.operacional3
            )}

            ${crearCampo(
                "Producto 1",
                t.producto1
            )}

            ${crearCampo(
                "Producto 2",
                t.producto2
            )}

            ${crearCampo(
                "Producto 3",
                t.producto3
            )}

        </div>

        <div class="case-box">

            <span>
                CUÁNDO SE UTILIZA
            </span>

            ${escapeHTML(
                t.caso ||
                "Sin información"
            )}

        </div>

    `;

}


// =====================================================
// CAMPO
// =====================================================

function crearCampo(
    label,
    value
) {

    return `

        <div class="tipification-field">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(
                    value || "N/A"
                )}
            </strong>

        </div>

    `;

}


// =====================================================
// BOTONES DETALLE
// =====================================================

function registrarBotonesDetalle(
    resultados,
    prefix
) {

    resultados.forEach(
        (tipificacion, index) => {

            const button =
                document.querySelector(
                    `[data-detail-id="${prefix}-${index}"]`
                );


            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                () =>
                    abrirModal(
                        tipificacion
                    )
            );

        }
    );

}


// =====================================================
// MODAL
// =====================================================

function abrirModal(tipificacion) {

    modalTitle.textContent =
        tipificacion.plantilla;


    modalContent.innerHTML =
        crearDetalleTipificacion(
            tipificacion
        );


    detailModal.classList.remove(
        "hidden"
    );

}


function cerrarModal() {

    detailModal.classList.add(
        "hidden"
    );

}


closeModal.addEventListener(
    "click",
    cerrarModal
);


document
    .querySelector(
        ".modal-backdrop"
    )
    .addEventListener(
        "click",
        cerrarModal
    );


// =====================================================
// CHAT SCROLL
// =====================================================

function scrollChat() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


// =====================================================
// SEGURIDAD HTML
// =====================================================

function escapeHTML(value = "") {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// INICIO
// =====================================================

async function iniciarAplicacion() {

    try {

        await cargarTipificaciones();

        renderWizard();

    }

    catch (error) {

        console.error(error);


        wizardQuestion.textContent =
            "No fue posible cargar el catálogo";


        wizardOptions.innerHTML = `

            <div class="empty-state">

                <strong>
                    Error al cargar tipificaciones.json
                </strong>

                <p>
                    Revisa que el archivo se encuentre
                    en la raíz del repositorio.
                </p>

            </div>

        `;

    }

}


iniciarAplicacion();
