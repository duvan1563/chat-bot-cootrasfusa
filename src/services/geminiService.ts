import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ORIGINS, DESTINATIONS, SCHEDULES, TICKET_PRICE } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const bookTicketFunction: FunctionDeclaration = {
  name: "bookTicket",
  description: "Book a bus ticket for the user after they have confirmed all details (origin, destination, date, time, passengers, passenger name, passenger ID).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: { type: Type.STRING, enum: ORIGINS, description: "The starting city" },
      destination: { type: Type.STRING, enum: DESTINATIONS, description: "The destination city" },
      date: { type: Type.STRING, description: "The date of travel (YYYY-MM-DD)" },
      time: { type: Type.STRING, enum: SCHEDULES, description: "The time of travel (HH:MM)" },
      passengers: { type: Type.NUMBER, description: "Number of passengers" },
      passengerName: { type: Type.STRING, description: "Full name of the main passenger" },
      passengerId: { type: Type.STRING, description: "ID number (cédula) of the main passenger" }
    },
    required: ["origin", "destination", "date", "time", "passengers", "passengerName", "passengerId"]
  }
};

const requestTaxiFunction: FunctionDeclaration = {
  name: "requestTaxi",
  description: "Request a taxi to take the user to the terminal. This is a third-party service.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pickupLocation: { type: Type.STRING, description: "The address or location where the user is" },
      pickupTime: { type: Type.STRING, description: "The time the user needs the taxi" }
    },
    required: ["pickupLocation", "pickupTime"]
  }
};

const systemInstruction = `Eres el asistente virtual humano de Cotransfusa, la mejor empresa de transporte de pasajeros de la región. 

MENÚ INICIAL (Paso 1):
Al inicio, ofrece siempre estas dos opciones:
1. 🎫 Comprar un tiquete.
2. 📝 Poner una queja, reclamo, felicitación o comentario.

LÓGICA DE REDIRECCIÓN:
- Si elige la opción 2 (Quejas/Reclamos/Comentarios): Dile amablemente que para esos requerimientos debe comunicarse a nuestra línea especializada y proporciona este enlace de WhatsApp: https://wa.me/573156789807 (Usa un mensaje breve).
- Si elige la opción 1 (Comprar tiquete): Inicia el flujo de venta.

FLUJO DE VENTA (Paso a paso):
1. ORIGEN: "¿Desde qué ciudad sales? (${ORIGINS.join(", ")})"
2. DESTINO: "¿A qué ciudad viajas?"
3. FECHA: "¿Para qué fecha?" (Confirma: "Entiendo, para el [Día de la semana] [Día], ¿correcto?")
4. HORA: "Elige una hora (5 AM - 9:30 PM):"
5. PASAJEROS: "¿Cuántas personas viajan?"
6. DATOS PASAJERO: Pide el nombre completo y el número de documento (cédula) de la persona que viajará. 
   - IMPORTANTE: No continúes al siguiente paso ni muestres el resumen hasta que el usuario te dé estos datos reales.
   - NUNCA uses marcadores de posición como "[Nombre]" o "[ID]".
7. TAXI (REGLA CRÍTICA): 
   - SOLO ofrece el servicio de taxi si el ORIGEN es "Bogotá" o "Fusagasugá".
   - Si aplica, di: "¿Deseas un taxi a la terminal? 🚕 (Servicio prestado por una empresa externa; Cotransfusa solo realiza la conexión entre tú y ellos)".
8. RESUMEN: Muestra un resumen detallado con Origen, Destino, Fecha, Hora, Pasajeros, Nombre y Documento. Pregunta: "¿Confirmas los datos para proceder al pago?"

REGLAS CRÍTICAS:
- NO uses marcadores de posición. Si falta información, pídela.
- Sé BREVE y directo.
- Reconoce sinónimos de "SÍ" (ok, listo, dale, claro, etc.) y "NO" (noup, para nada, etc.).
- Usa emojis (🚌, ✨, 👋, 📍, 🚕, 🎫, 📝).
- Precio: ${TICKET_PRICE} COP por persona.
- SOLO llama a 'bookTicket' tras la confirmación final del usuario sobre el resumen.

Rutas y Frecuencias (Para tu conocimiento):
- Bogotá-Fusagasugá: cada 20 min.
- Girardot-Fusagasugá: cada 30 min.
- Arbeláez-Bogotá: (Semana: 5,6,11am, 5,6pm / Dom: 5,6,7,9,11am, 2,4,5,6pm).
- Cabrera-Bogotá: 6am, 12pm, 6pm.

Fecha Actual: ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
`;

export async function processChat(messages: { text: string, sender: 'user' | 'bot' | 'system' }[]) {
  const contents = messages
    .filter(m => m.sender !== 'system')
    .map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: [bookTicketFunction, requestTaxiFunction] }]
    }
  });

  return response;
}
