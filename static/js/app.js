let partyData = {};
let autoSpeak = true;
let recognition = null;
let isListening = false;

// Elements
const searchInput = document.getElementById('search-input');
const askBtn = document.getElementById('ask-btn');
const autoSpeakBtn = document.getElementById('auto-speak-btn');
const speakBtn = document.getElementById('speak-btn');
const clearBtn = document.getElementById('clear-btn');
const resultContainer = document.getElementById('result-container');
const voiceStatus = document.getElementById('voice-status');

// Load Data
fetch('/data/parties.json')
    .then(res => res.json())
    .then(data => {
        partyData = data;
        console.log("Party data loaded:", partyData);
    })
    .catch(err => console.error("Failed to load party data:", err));

// Voice Check
if (window.speechSynthesis) {
    voiceStatus.textContent = "Voice: available";
} else {
    voiceStatus.textContent = "Voice: unavailable";
}

// Normalize Text
function normalize(text) {
    return (text || "").toLowerCase().trim();
}

// Analyze Logic
function analyze(text) {
    const normalized = normalize(text);
    if (!normalized || Object.keys(partyData).length === 0) {
        renderResult(null);
        return null;
    }

    function detectIntent(n) {
        if (/proposed|proposed cm|proposed chief minister|who.*cm|who.*chief minister|chief minister|\bcm\b/.test(n)) return "ask_cm";
        if (/symbol|which party uses|which symbol|symbol of|uses the|who uses|who has|which.*symbol/.test(n)) return "ask_symbol";

        const allSlogans = Object.values(partyData).flatMap(p => p.slogans || []);
        for (const s of allSlogans) if (n.includes(s.toLowerCase())) return "ask_slogan";

        for (const k in partyData) {
            const p = partyData[k];
            if (n.includes(p.name.toLowerCase()) || n.includes(p.abbrev.toLowerCase())) return "ask_party";
        }
        for (const k in partyData) {
            if (n.includes(normalize(partyData[k].symbol))) return "ask_symbol";
        }
        return "unknown";
    }

    const intent = detectIntent(normalized);
    let out = null;

    if (intent === "ask_cm") {
        if (normalized.includes("tamil nadu") || normalized.includes("tn")) {
            const mapping = {};
            for (const k in partyData) mapping[k] = partyData[k].proposedCM || "N/A";
            out = { type: "proposedCM-list", mapping };
        } else {
            for (const k in partyData) {
                const p = partyData[k];
                if (normalized.includes(p.name.toLowerCase()) || normalized.includes(p.abbrev.toLowerCase()) || normalized.includes(normalize(p.symbol))) {
                    out = { type: "proposedCM", party: p };
                    break;
                }
            }
        }
        if (!out) {
            const mapping = {};
            for (const k in partyData) mapping[k] = partyData[k].proposedCM || "N/A";
            out = { type: "proposedCM-list", mapping };
        }
    } else if (intent === "ask_symbol") {
        const partyQueryRx = /which party|which.*party|who uses|who has|party uses|which.*party/;
        for (const k in partyData) {
            const p = partyData[k];
            if (normalized.includes(p.name.toLowerCase()) || normalized.includes(p.abbrev.toLowerCase())) {
                out = { type: "symbol", party: p };
                break;
            }
        }
        if (!out) {
            for (const k in partyData) {
                const p = partyData[k];
                if (normalized.includes(normalize(p.symbol))) {
                    if (partyQueryRx.test(normalized)) out = { type: "symbol-party", party: p };
                    else out = { type: "symbol", party: p };
                    break;
                }
            }
        }
    } else if (intent === "ask_slogan") {
        for (const key in partyData) {
            for (const slogan of partyData[key].slogans || []) {
                if (normalized.includes(slogan.toLowerCase())) {
                    out = { type: "slogan", party: partyData[key], matched: slogan };
                    break;
                }
            }
            if (out) break;
        }
    } else if (intent === "ask_party") {
        for (const key in partyData) {
            const p = partyData[key];
            if (normalized.includes(p.name.toLowerCase()) || normalized.includes(p.abbrev.toLowerCase())) {
                out = { type: "party", party: p };
                break;
            }
        }
    }

    if (!out) {
        for (const key in partyData) {
            for (const slogan of partyData[key].slogans || []) {
                if (normalized.includes(slogan.toLowerCase())) {
                    out = { type: "slogan", party: partyData[key], matched: slogan };
                    break;
                }
            }
            if (out) break;
        }
    }
    if (!out) {
        for (const key in partyData) {
            if (normalized.includes(normalize(partyData[key].symbol))) {
                out = { type: "symbol", party: partyData[key] };
                break;
            }
        }
    }
    if (!out) {
        for (const key in partyData) {
            const p = partyData[key];
            if (normalized.includes(p.name.toLowerCase()) || normalized.includes(p.abbrev.toLowerCase())) {
                out = { type: "party", party: p };
                break;
            }
        }
    }

    if (!out) out = { type: "unknown" };
    renderResult(out);
    if (autoSpeak) speakResult(out);
    return out;
}

// Rendering Logic
function renderResult(r) {
    if (!r) {
        resultContainer.innerHTML = '<div class="small">No result yet — ask a question above.</div>';
        return;
    }

    let html = '<div class="result-grid">';

    // Symbol Block
    html += '<div class="symbol-block">';
    if (r.party) {
        html += `<div class="symbol-text">${r.type === 'symbol' ? r.party.symbol : r.party.name}</div>`;
    }
    html += '</div>';

    // Party Block
    html += '<div class="party-block">';
    if (r.type === 'slogan') {
        html += `<div><strong>Party:</strong> ${r.party.name} (${r.party.abbrev})</div>`;
    } else if (r.type === 'symbol-party') {
        html += `<div><strong>Party:</strong> ${r.party.name}</div><div class="small" style="margin-top: 6px">${r.party.symbol}</div>`;
    } else if (r.type === 'proposedCM') {
        html += `<div><strong>Proposed CM:</strong> ${r.party.proposedCM}</div>`;
    } else if (r.type === 'proposedCM-list') {
        html += '<div>';
        for (let [k, v] of Object.entries(r.mapping)) {
            html += `<div><strong>${k}:</strong> ${v}</div>`;
        }
        html += '</div>';
    } else if (r.type === 'party') {
        html += `<div><strong>Name:</strong> ${r.party.name}</div>`;
        html += `<div><strong>Abbrev:</strong> ${r.party.abbrev}</div>`;
        html += `<div><strong>Symbol:</strong> ${r.party.symbol}</div>`;
        html += `<div><strong>Proposed CM:</strong> ${r.party.proposedCM}</div>`;
    } else if (r.type === 'unknown') {
        html += '<div>No matching party, slogan, or symbol found.</div>';
    }

    html += `<div class="spokentext" style="margin-top: 12px"><em>Spoken:</em><div>${formatResultText(r)}</div></div>`;
    html += '</div></div>';

    resultContainer.innerHTML = html;
}

// Speech Synthesis
function speakText(text) {
    if (!text || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
}

function formatResultText(r) {
    if (!r) return "";
    if (r.type === "slogan") return r.party.name;
    if (r.type === "symbol") return r.party.symbol;
    if (r.type === "symbol-party") return r.party.name;
    if (r.type === "proposedCM") return r.party.proposedCM;
    if (r.type === "proposedCM-list") return Object.entries(r.mapping).map(([k, v]) => `${k}: ${v}`).join("; ");
    if (r.type === "party") return `${r.party.name}, abbreviation ${r.party.abbrev}. Symbol ${r.party.symbol}. Proposed CM ${r.party.proposedCM}.`;
    return "No matching party, slogan, or symbol found.";
}

function speakResult(r) {
    const text = formatResultText(r);
    speakText(text);
}

// Event Listeners
askBtn.addEventListener('click', () => analyze(searchInput.value));
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyze(searchInput.value);
});

autoSpeakBtn.addEventListener('click', () => {
    autoSpeak = !autoSpeak;
    autoSpeakBtn.textContent = `Auto Speak: ${autoSpeak ? 'On' : 'Off'}`;
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderResult(null);
});

// Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => {
        const t = e.results[0][0].transcript;
        searchInput.value = t;
        analyze(t);
        isListening = false;
        speakBtn.textContent = 'Speak';
    };
    recognition.onend = () => {
        isListening = false;
        speakBtn.textContent = 'Speak';
    };
}

speakBtn.addEventListener('click', () => {
    if (!recognition) return alert("Speech recognition not supported.");
    if (isListening) {
        recognition.stop();
        isListening = false;
        speakBtn.textContent = 'Speak';
    } else {
        recognition.start();
        isListening = true;
        speakBtn.textContent = 'Stop';
    }
});
