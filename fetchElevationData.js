const fs = require('fs');
const axios = require('axios');

// Pfad zur Input-JSON
const inputFilePath = "/Users/joshuaalbert/Documents/geolocations_DE_reduced.json";
// Pfad zur Ziel-JSON
const outputFilePath = "/Users/joshuaalbert/Documents/mapped.json";

// Google API-Key
const api_key = "";

// Funktion zum Aufteilen der Orte in Stapel
function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

// Funktion zum Abrufen von Höhendaten für eine Liste von Orten
async function getElevations(api_key, locations) {
    const base_url = "https://maps.googleapis.com/maps/api/elevation/json";

    // Die Orte in Stapel aufteilen
    const locationChunks = chunkArray(locations, 500); // 500 ist die maximale Anzahl von Orten pro Anfrage

    const elevations = [];

    for (const chunk of locationChunks) {
        const locationsParam = chunk.map(point => `${point.latitude},${point.longitude}`).join('|');
        const params = {
            locations: locationsParam,
            key: api_key,
        };

        try {
            const response = await axios.get(base_url, { params });
            const data = response.data;

            if (data.status === 'OK') {
                elevations.push(...data.results.map(result => result.elevation));
            } else {
                console.error(`Fehler bei der Anfrage. API-Status: ${data.status}`);
                console.error(`Antworttext: ${JSON.stringify(data)}`);
                return null;
            }
        } catch (error) {
            console.error(`Fehler bei der Anfrage: ${error.message}`);
            return null;
        }
    }

    return elevations;
}

// Funktion zum Lesen der JSON-Datei
function readJSONFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// Funktion zum Schreiben der JSON-Datei
function writeJSONFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Hauptprogramm
async function main() {
    // Input-JSON-Daten laden
    const locations = readJSONFile(inputFilePath);

    // Elevation-Daten abrufen
    const elevations = await getElevations(api_key, locations);

    if (elevations !== null) {
        // Ergebnisse in das ursprüngliche locations-Array einfügen
        for (let i = 0; i < locations.length; i++) {
            locations[i].elevation = elevations[i];
        }

        // Ergebnisliste in eine neue JSON-Datei schreiben
        writeJSONFile(outputFilePath, locations);

        console.log(`Daten wurden in ${outputFilePath} gespeichert.`);
    } else {
        console.error("Fehler beim Abrufen der Höheninformationen.");
    }
}

// Hauptprogramm ausführen
main();
