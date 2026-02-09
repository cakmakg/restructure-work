🤖 RAG-Basierter KI-Chat-Assistent (MERN + AWS S3)
Cloud-Native, skalierbarer und KI-gestützter Dokumenten-Assistent

Dieses Projekt ist eine moderne RAG (Retrieval-Augmented Generation) Anwendung, die es Benutzern ermöglicht, PDF-Dokumente in die Cloud (AWS S3) hochzuladen und mithilfe von Künstlicher Intelligenz (LLM) mit diesen Dokumenten zu chatten.

Im Gegensatz zu herkömmlichen Chatbots speichert dieses System die Daten nicht nur als Vektoren, sondern behält die Originaldateien sicher im S3 Object Storage, nutzt fortschrittliche Metadaten-Filterung und liefert dank MongoDB Atlas Vector Search präzise Antworten.

🚀 Hauptmerkmale (Key Features)
☁️ AWS S3 Integration (LocalStack): Hochgeladene Dateien werden nicht auf dem Server-Datenträger, sondern in einer sicheren und skalierbaren Object-Storage-Architektur gespeichert.

🧠 RAG Architektur & Vektorsuche: Dokumente werden in semantische Vektoren umgewandelt. MongoDB Atlas findet mittels "Cosine Similarity" die relevantesten Inhalte.

🎯 Metadaten-Filterung: Wählt der Benutzer eine Kategorie (z.B. "Finanzen"), generiert die KI Antworten ausschließlich aus Dokumenten mit diesem Tag (MongoDB Atlas Search Indexing).

⚡ Streaming Response: Dank der Groq (Llama-3) Integration erscheinen die Antworten ohne Verzögerung, Token für Token (Schreibmaschinen-Effekt), auf dem Bildschirm.

🔒 Sichere Datenverarbeitung: Eine professionelle Pipeline: Datei-Upload -> S3 Backup -> Vektorisierung -> Datenbank-Speicherung.

🛠️ Tech Stack
Dieses Projekt wurde nach Microservices- und Event-Driven-Architekturprinzipien entwickelt:

Backend & Cloud
Node.js & Express: RESTful API Management.

AWS SDK v3: S3 Bucket Management und Dateitransfer.

LocalStack (Docker): Simulation von AWS-Diensten für die lokale Entwicklung.

MongoDB Atlas: Metadaten- und Vektor-Datenbank.

Groq SDK (Llama-3): Ultra-schnelle LLM Engine.

LangChain / Transformers.js: Embedding-Prozesse (Text-zu-Zahl).

Frontend
React (Vite): Hochperformante Benutzeroberfläche.

Fetch Streams: Auslesen von Datenströmen (ähnlich Server-Side Events).

CSS Modules: Saubere und modulare Strukturierung der Styles.

🧠 Architektur-Flow (Wie es funktioniert)
Das System arbeitet nach dem "Source of Truth" Prinzip:

Upload: Der Benutzer lädt ein PDF hoch und wählt eine Kategorie (z.B. "Verträge").

Storage (S3): Die Datei wird im Rohformat in den AWS S3 Bucket hochgeladen und erhält einen eindeutigen s3Key.

Vectorization: Der Inhalt wird gelesen, in kleine Stücke zerlegt (Chunking) und durch ein Embedding-Modell gejagt.

Indexing (MongoDB): Vektoren + s3Key + Category werden in MongoDB gespeichert.

Retrieval (RAG): Wenn der Benutzer eine Frage stellt:

Wird die Frage in einen Vektor umgewandelt.

Findet MongoDB die ähnlichsten Vektoren nur innerhalb der gewählten Kategorie.

Generation: Der gefundene Inhalt + die Frage werden an Groq AI gesendet und die Antwort wird generiert.

🔮 Roadmap (Zukunftspläne)
[x] AWS S3 Integration (Erledigt ✅)

[x] Kategorien-basierte Filterung (Erledigt ✅)

[ ] Docker Compose für One-Command-Setup.

[ ] Speicherung des Chat-Verlaufs (History) in der Datenbank.

[ ] Vorschau der hochgeladenen Dateien direkt über S3.

👨‍💻 Entwickler
Gökhan Cakmak