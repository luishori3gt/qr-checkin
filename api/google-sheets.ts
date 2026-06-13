import { google, type sheets_v4 } from "googleapis";

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets | null {
  if (sheetsClient) return sheetsClient;

  const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!credentials || !spreadsheetId) {
    return null;
  }

  try {
    const parsedCreds = JSON.parse(
      Buffer.from(credentials, "base64").toString("utf-8")
    );

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCreds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheetsClient = google.sheets({ version: "v4", auth });
    return sheetsClient;
  } catch {
    return null;
  }
}

export function isSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SHEETS_CREDENTIALS && process.env.GOOGLE_SPREADSHEET_ID
  );
}

export async function syncAsistenciasToSheet(
  asistencias: Array<{
    id: number;
    personaNombre: string | null;
    transportistaNombre: string | null;
    tipo: string;
    fechaHora: Date;
    notas: string | null;
  }>
): Promise<{ success: boolean; message: string }> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!sheets || !spreadsheetId) {
    return {
      success: false,
      message:
        "Google Sheets no configurado. Configura GOOGLE_SHEETS_CREDENTIALS y GOOGLE_SPREADSHEET_ID.",
    };
  }

  try {
    // Check if sheet exists, if not create it
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    let sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === "Asistencias"
    );

    if (!sheet) {
      // Create the sheet
      const batchUpdateResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Asistencias",
                },
              },
            },
          ],
        },
      });
      sheet = batchUpdateResponse.data.replies?.[0].addSheet;

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Asistencias!A1:F1",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            ["ID", "Persona", "Transportista", "Tipo", "Fecha y Hora", "Notas"],
          ],
        },
      });

      // Format headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheet?.properties?.sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.23, green: 0.51, blue: 0.96 },
                    textFormat: {
                      bold: true,
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                    },
                  },
                },
                fields: "userEnteredFormat(backgroundColor,textFormat)",
              },
            },
          ],
        },
      });
    }

    // Clear existing data (except headers)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "Asistencias!A2:F10000",
    });

    // Sort by date descending
    const sortedAsistencias = [...asistencias].sort(
      (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    );

    // Prepare data rows
    const rows = sortedAsistencias.map((a) => [
      a.id,
      a.personaNombre ?? "N/A",
      a.transportistaNombre ?? "N/A",
      a.tipo === "entrada" ? "Entrada" : "Salida",
      new Date(a.fechaHora).toLocaleString("es-MX"),
      a.notas ?? "",
    ]);

    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Asistencias!A2:F${rows.length + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: rows,
        },
      });
    }

    // Auto-resize columns
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheet?.properties?.sheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: 6,
              },
            },
          },
        ],
      },
    });

    return {
      success: true,
      message: `${rows.length} registros sincronizados exitosamente a Google Sheets`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error al sincronizar: ${error.message}`,
    };
  }
}
