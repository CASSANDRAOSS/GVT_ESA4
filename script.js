// START AUFGABE_4_PARAMETRISCHE_FLAECHEN

// ------------------------------------------------------------
// 1. Elemente aus der HTML-Seite holen
// ------------------------------------------------------------

const linienButton = document.getElementById("linienButton");
const ansichtButton = document.getElementById("ansichtButton");
const webglStatus = document.getElementById("webglStatus");

let linienSichtbar = true;
let nurLinien = false;

const zeichnungen = [];


// ------------------------------------------------------------
// 2. Die drei mathematischen Flächen
// ------------------------------------------------------------

// START AUFGABE_4_ZWEI_RECHERCHIERTE_FLAECHEN

// Quelle: https://mathworld.wolfram.com/Seashell.html
function muschel(u, v) {
    const wachstum = Math.exp(u / (6 * Math.PI));
    const rundung = Math.cos(v / 2) ** 2;

    return [
        2 * (1 - wachstum) * Math.cos(u) * rundung,
        2 * (wachstum - 1) * Math.sin(u) * rundung,
        1 - Math.exp(u / (3 * Math.PI))
            - Math.sin(v)
            + wachstum * Math.sin(v)
    ];
}


// Quelle: https://mathworld.wolfram.com/EnnepersMinimalSurface.html
function koralle(u, v) {
    return [
        u - u ** 3 / 3 + u * v ** 2,
        -v - u ** 2 * v + v ** 3 / 3,
        u ** 2 - v ** 2
    ];
}

// END AUFGABE_4_ZWEI_RECHERCHIERTE_FLAECHEN

// START AUFGABE_4_EIGENE_PARAMETRISIERUNG_QUALLE

// Eigene Formel für den Schirm der Qualle.
// u läuft einmal um die Qualle herum.
// v läuft von der Mitte zum äußeren Rand.
function qualle(u, v) {
    const radius =
        v * (1 + 0.16 * v * v * Math.cos(12 * u + 2 * v));

    const x = radius * Math.cos(u);
    const y = radius * Math.sin(u);

    const z =
        0.8 * (1 - v * v)
        + 0.12 * v ** 3 * Math.sin(15 * u + 3 * v);

    return [x, y, z];
}

// END AUFGABE_4_EIGENE_PARAMETRISIERUNG_QUALLE

// ------------------------------------------------------------
// 3. Farben für die einzelnen Flächen
// ------------------------------------------------------------

function farbeBerechnen(name, anteilU, anteilV) {
    if (name === "muschel") {
        return [
            0.95,
            0.52 + 0.27 * anteilV,
            0.37 + 0.38 * anteilU
        ];
    }

    if (name === "koralle") {
        return [
            0.95,
            0.35 + 0.34 * anteilU,
            0.44 + 0.35 * anteilV
        ];
    }

    // Türkis und Blau für den Quallenschirm.
    return [
        0.25 + 0.20 * anteilV,
        0.68 + 0.22 * anteilU,
        0.82 + 0.12 * (1 - anteilV)
    ];
}


// ------------------------------------------------------------
// 4. Punkte, Dreiecke und Linien berechnen
// ------------------------------------------------------------

function geometrieErstellen(einstellung) {
    const punkte = [];
    const farben = [];
    const dreiecke = [];
    const linien = [];

    const spalten = einstellung.spalten;
    const zeilen = einstellung.zeilen;

    // Alle Punkte der Fläche berechnen.
    for (let zeile = 0; zeile <= zeilen; zeile++) {
        const anteilV = zeile / zeilen;

        const v =
            einstellung.vMin
            + anteilV * (einstellung.vMax - einstellung.vMin);

        for (let spalte = 0; spalte <= spalten; spalte++) {
            const anteilU = spalte / spalten;

            const u =
                einstellung.uMin
                + anteilU * (einstellung.uMax - einstellung.uMin);

            const punkt = einstellung.formel(u, v);

            const farbe = farbeBerechnen(
                einstellung.name,
                anteilU,
                anteilV
            );

            punkte.push(...punkt);
            farben.push(...farbe);
        }
    }

    // Kleinste und größte Koordinate jeder Achse finden.
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < punkte.length; i += 3) {
        for (let achse = 0; achse < 3; achse++) {
            minimum[achse] = Math.min(
                minimum[achse],
                punkte[i + achse]
            );

            maximum[achse] = Math.max(
                maximum[achse],
                punkte[i + achse]
            );
        }
    }

    // Die Fläche verkleinern, damit sie vollständig sichtbar ist.
    const groessteAusdehnung = Math.max(
        maximum[0] - minimum[0],
        maximum[1] - minimum[1],
        maximum[2] - minimum[2]
    );

    const skalierung = 1.55 / groessteAusdehnung;

    // Die Fläche mittig platzieren.
    for (let i = 0; i < punkte.length; i += 3) {
        for (let achse = 0; achse < 3; achse++) {
            const mitte =
                (minimum[achse] + maximum[achse]) / 2;

            punkte[i + achse] =
                (punkte[i + achse] - mitte) * skalierung;
        }
    }

    // Vier benachbarte Punkte bilden zwei Dreiecke.
    for (let zeile = 0; zeile < zeilen; zeile++) {
        for (let spalte = 0; spalte < spalten; spalte++) {
            const obenLinks =
                zeile * (spalten + 1) + spalte;

            const obenRechts = obenLinks + 1;
            const untenLinks = obenLinks + spalten + 1;
            const untenRechts = untenLinks + 1;

            dreiecke.push(
                obenLinks,
                untenLinks,
                obenRechts,

                obenRechts,
                untenLinks,
                untenRechts
            );
        }
    }

    // Waagerechte Linien des Netzes.
    for (let zeile = 0; zeile <= zeilen; zeile++) {
        for (let spalte = 0; spalte < spalten; spalte++) {
            const start =
                zeile * (spalten + 1) + spalte;

            linien.push(start, start + 1);
        }
    }

    // Senkrechte Linien des Netzes.
    for (let zeile = 0; zeile < zeilen; zeile++) {
        for (let spalte = 0; spalte <= spalten; spalte++) {
            const start =
                zeile * (spalten + 1) + spalte;

            linien.push(start, start + spalten + 1);
        }
    }

    return {
        punkte: new Float32Array(punkte),
        farben: new Float32Array(farben),
        dreiecke: new Uint16Array(dreiecke),
        linien: new Uint16Array(linien)
    };
}


// ------------------------------------------------------------
// 5. WebGL vorbereiten
// ------------------------------------------------------------

function shaderErstellen(gl, typ, quelltext) {
    const shader = gl.createShader(typ);

    gl.shaderSource(shader, quelltext);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
}


function programmErstellen(gl) {
    const vertexShader = shaderErstellen(
        gl,
        gl.VERTEX_SHADER,
        `
        attribute vec3 position;
        attribute vec3 farbe;

        varying vec3 vertexFarbe;

        void main() {
            // Die Fläche etwas drehen, damit ihre Tiefe
            // besser zu erkennen ist.
            float winkelY = 0.55;
            float winkelX = -0.35;

            float x =
                position.x * cos(winkelY)
                + position.z * sin(winkelY);

            float z =
                -position.x * sin(winkelY)
                + position.z * cos(winkelY);

            float y =
                position.y * cos(winkelX)
                - z * sin(winkelX);

            float gedrehtesZ =
                position.y * sin(winkelX)
                + z * cos(winkelX);

            gl_Position = vec4(
                x * 0.92,
                y * 0.92,
                gedrehtesZ * 0.55,
                1.0
            );

            vertexFarbe = farbe;
        }
        `
    );

    const fragmentShader = shaderErstellen(
        gl,
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;

        varying vec3 vertexFarbe;
        uniform bool zeichneLinien;

        void main() {
            if (zeichneLinien) {
                gl_FragColor = vec4(0.08, 0.20, 0.29, 1.0);
            } else {
                gl_FragColor = vec4(vertexFarbe, 1.0);
            }
        }
        `
    );

    const programm = gl.createProgram();

    gl.attachShader(programm, vertexShader);
    gl.attachShader(programm, fragmentShader);
    gl.linkProgram(programm);

    if (!gl.getProgramParameter(programm, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(programm));
    }

    return programm;
}


function bufferErstellen(gl, ziel, daten) {
    const buffer = gl.createBuffer();

    gl.bindBuffer(ziel, buffer);
    gl.bufferData(ziel, daten, gl.STATIC_DRAW);

    return buffer;
}


// ------------------------------------------------------------
// 6. Fläche  Canvas vorbereiten
// ------------------------------------------------------------

function flaecheVorbereiten(einstellung) {
    const canvas = document.getElementById(einstellung.canvasId);
    const gl = canvas.getContext("webgl");

    if (!gl) {
        throw new Error(
            "WebGL ist für " + einstellung.name
            + " nicht verfügbar."
        );
    }

    const geometrie = geometrieErstellen(einstellung);
    const programm = programmErstellen(gl);

    const positionBuffer = bufferErstellen(
        gl,
        gl.ARRAY_BUFFER,
        geometrie.punkte
    );

    const farbBuffer = bufferErstellen(
        gl,
        gl.ARRAY_BUFFER,
        geometrie.farben
    );

    const dreieckBuffer = bufferErstellen(
        gl,
        gl.ELEMENT_ARRAY_BUFFER,
        geometrie.dreiecke
    );

    const linienBuffer = bufferErstellen(
        gl,
        gl.ELEMENT_ARRAY_BUFFER,
        geometrie.linien
    );

    return {
        gl,
        canvas,
        programm,
        geometrie,
        positionBuffer,
        farbBuffer,
        dreieckBuffer,
        linienBuffer
    };
}


// ------------------------------------------------------------
// 7. Die Flächen zeichnen
// ------------------------------------------------------------

function flaecheZeichnen(zeichnung) {
    const {
        gl,
        canvas,
        programm,
        geometrie
    } = zeichnung;

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.96, 0.99, 0.98, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(programm);

    const positionOrt = gl.getAttribLocation(
        programm,
        "position"
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, zeichnung.positionBuffer);
    gl.enableVertexAttribArray(positionOrt);

    gl.vertexAttribPointer(
        positionOrt,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );

    const farbOrt = gl.getAttribLocation(
        programm,
        "farbe"
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, zeichnung.farbBuffer);
    gl.enableVertexAttribArray(farbOrt);

    gl.vertexAttribPointer(
        farbOrt,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );

    const linienSchalter = gl.getUniformLocation(
        programm,
        "zeichneLinien"
    );

    // Im normalen Modus zuerst die Farbflächen zeichnen.
    // In der reinen Linienansicht entfällt dieser Schritt.
    if (!nurLinien) {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);

        gl.uniform1i(linienSchalter, 0);

        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            zeichnung.dreieckBuffer
        );

        gl.drawElements(
            gl.TRIANGLES,
            geometrie.dreiecke.length,
            gl.UNSIGNED_SHORT,
            0
        );

        gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    // In der reinen Linienansicht bleiben Linien immer sichtbar.
    if (linienSichtbar || nurLinien) {
        gl.uniform1i(linienSchalter, 1);

        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            zeichnung.linienBuffer
        );

        gl.drawElements(
            gl.LINES,
            geometrie.linien.length,
            gl.UNSIGNED_SHORT,
            0
        );
    }
}


function alleFlaechenZeichnen() {
    for (const zeichnung of zeichnungen) {
        flaecheZeichnen(zeichnung);
    }
}


// ------------------------------------------------------------
// 8. Buttons und Taste B
// ------------------------------------------------------------

// START AUFGABE_4_LINIEN_UND_FARBFLAECHEN_UMSCHALTEN

function linienUmschalten() {
    linienSichtbar = !linienSichtbar;

    linienButton.textContent = linienSichtbar
        ? "Linien ausblenden"
        : "Linien einblenden";

    linienButton.setAttribute(
        "aria-pressed",
        String(linienSichtbar)
    );

    alleFlaechenZeichnen();
}


function ansichtUmschalten() {
    nurLinien = !nurLinien;

    ansichtButton.textContent = nurLinien
        ? "Farbflächen zeigen"
        : "Nur Linien zeigen";

    ansichtButton.setAttribute(
        "aria-pressed",
        String(nurLinien)
    );

    alleFlaechenZeichnen();
}


linienButton.addEventListener("click", linienUmschalten);
ansichtButton.addEventListener("click", ansichtUmschalten);

document.addEventListener("keydown", function (event) {
    if (
        event.key.toLowerCase() === "b"
        && !event.repeat
    ) {
        linienUmschalten();
    }
});

// END AUFGABE_4_LINIEN_UND_FARBFLAECHEN_UMSCHALTEN

// ------------------------------------------------------------
// 9. Slideshow mit Fortschrittsbildern
// ------------------------------------------------------------

// START EIGENE_ERWEITERUNG_SLIDESHOW
const fortschrittsbilder = [
    {
        datei: "fortschritt/schritt_01.png",
        beschreibung:
            "Muschel, Koralle und Qualle sind farbig dargestellt. "
            + "Die Linien zeigen den Aufbau der Flächen."
    },
    {
        datei: "fortschritt/schritt_02.png",
        beschreibung:
            "Ohne Farbflächen sieht man, wie die drei Formen "
            + "aus berechneten Punkten und Linien aufgebaut sind."
    },
    {
        datei: "fortschritt/schritt_04.png",
        beschreibung:
            "Rekonstruierter Zwischenstand: Die Qualle hat noch "
            + "einen glatten Rand. Danach habe ich Wellen "
            + "in ihre Formel aufgenommen."
    },
    {
        datei: "fortschritt/schritt_03.png",
        beschreibung:
            "Die fertige Unterwasserwelt mit geöffneter "
            + "Entwicklerkonsole zur Funktionsprüfung."
    }
];

const slideshow = document.querySelector(".entstehung");

const schrittPunkte =
    document.getElementById("schrittPunkte");

const schrittBild =
    document.getElementById("schrittBild");

const schrittZaehler =
    document.getElementById("schrittZaehler");

const schrittBeschreibung =
    document.getElementById("schrittBeschreibung");

const zurueckButton =
    document.getElementById("zurueckButton");

const weiterButton =
    document.getElementById("weiterButton");

let aktuellerSchritt = 0;


// Für jedes Bild einen anklickbaren Punkt erzeugen.
function punkteErstellen() {
    fortschrittsbilder.forEach(function (bild, index) {
        const punkt = document.createElement("button");

        punkt.type = "button";
        punkt.className = "schrittpunkt";

        punkt.setAttribute(
            "aria-label",
            "Bild " + (index + 1) + " anzeigen"
        );

        punkt.addEventListener("click", function () {
            aktuellerSchritt = index;
            schrittAnzeigen();
        });

        schrittPunkte.appendChild(punkt);
    });
}


// Bild, Beschreibung, Zähler und aktiven Punkt aktualisieren.
function schrittAnzeigen() {
    const schritt = fortschrittsbilder[aktuellerSchritt];

    schrittBild.src = schritt.datei;
    schrittBild.alt = schritt.beschreibung;

    schrittZaehler.textContent =
        "Bild " + (aktuellerSchritt + 1)
        + " von " + fortschrittsbilder.length;

    schrittBeschreibung.textContent =
        schritt.beschreibung;

    zurueckButton.disabled =
        aktuellerSchritt === 0;

    weiterButton.disabled =
        aktuellerSchritt === fortschrittsbilder.length - 1;

    const punkte =
        schrittPunkte.querySelectorAll(".schrittpunkt");

    punkte.forEach(function (punkt, index) {
        punkt.setAttribute(
            "aria-current",
            String(index === aktuellerSchritt)
        );
    });
}


// Slideshow nur starten, wenn der Abschnitt vorhanden ist.
if (slideshow && fortschrittsbilder.length > 0) {
    slideshow.hidden = false;

    // Erst die Punkte erzeugen, dann den ersten markieren.
    punkteErstellen();
    schrittAnzeigen();

    zurueckButton.addEventListener("click", function () {
        aktuellerSchritt--;
        schrittAnzeigen();
    });

    weiterButton.addEventListener("click", function () {
        aktuellerSchritt++;
        schrittAnzeigen();
    });
}

// END EIGENE_ERWEITERUNG_SLIDESHOW

// ------------------------------------------------------------
// 10. Alle drei Flächen starten
// ------------------------------------------------------------

try {
    const flaechen = [
        {
            name: "muschel",
            canvasId: "muschelCanvas",
            formel: muschel,
            uMin: 0,
            uMax: 6 * Math.PI,
            vMin: 0,
            vMax: 2 * Math.PI,
            spalten: 80,
            zeilen: 30
        },

        {
            name: "koralle",
            canvasId: "koralleCanvas",
            formel: koralle,
            uMin: -1.1,
            uMax: 1.1,
            vMin: -1.1,
            vMax: 1.1,
            spalten: 42,
            zeilen: 42
        },

        {
            name: "qualle",
            canvasId: "qualleCanvas",
            formel: qualle,
            uMin: 0,
            uMax: 2 * Math.PI,
            vMin: 0,
            vMax: 1,
            spalten: 80,
            zeilen: 30
        }
    ];

    for (const flaeche of flaechen) {
        zeichnungen.push(flaecheVorbereiten(flaeche));
    }

    alleFlaechenZeichnen();

    webglStatus.textContent =
        "Alle drei Flächen wurden mit WebGL dargestellt.";

} catch (fehler) {
    console.error(fehler);

    webglStatus.textContent =
        "Die Flächen konnten nicht dargestellt werden. "
        + "Bitte prüfe die Entwicklerkonsole.";
}

// END AUFGABE_4_PARAMETRISCHE_FLAECHEN
