# Privacy, lokale gegevens en herstel

## Blijft de inhoud lokaal?

Ja. In deze versie gaan taken, stappen, notities, afspraken, timer en voorkeuren niet naar een applicatieserver. De browser bewaart één versleutelde envelop in IndexedDB. Er is geen account, analytics SDK, advertentiemeting, cloud-AI of synchronisatie. De voorbeeldstand bewaart geen inhoud op schijf. Het apparaat of de browser kan zelf wel back-ups of synchronisatiefuncties hebben buiten de app.

| Gegeven | Locatie en duur | Regie |
|---|---|---|
| Inhoud en voorkeuren | Versleutelde IndexedDB-kluis, tot wissen/browseropruiming | In app aanpassen/verwijderen; volledige kopie exporteren |
| Wachtzin | Tijdens openen kort in het formulier; geen appopslag of verzending | Zelf bewaren; geen herstel door aanbieder |
| Ontsleutelde inhoud en sleutel | Geheugen van het geopende tabblad | Handmatig sluiten/vergrendelen, of na ingestelde inactiviteit |
| Versleutelde export | Downloads of eigen gekozen opslagplek | Zelf bewaren/verplaatsen/wissen; niet gekoppeld aan appwissen |
| Programmabestanden | HTTPS-host en service-worker-cache | Browser kan cache wissen; apprelease levert nieuwe bestanden |
| Bezoekmetadata | Eventuele hostinglogs, bijvoorbeeld IP-adres en user-agent | Hostingkeuze, contract en privacyverklaring vóór publicatie |

Geen inhoudsaccount betekent niet dat een websitebezoek anoniem is. De app kan ook geen belofte doen over apparaatback-ups, browserextensies, schermopnamen of andere software op het apparaat.

## Technische bescherming

- AES-GCM met een 256-bit niet-exporteerbare Web Crypto-sleutel. Iedere save en export krijgt een nieuwe willekeurige 96-bit IV.
- Sleutelafleiding uit de NFC-genormaliseerde wachtzin via PBKDF2-SHA-256, 600.000 iteraties en een willekeurig 128-bit salt. Wachtzin bij aanmaak minimaal 12 tekens; een lange unieke zin blijft belangrijk tegen offline raden.
- Het envelopformaat bindt versie/algoritme en aanvullende authenticatiedata. Ongeldige parameters, fout wachtwoord en gewijzigde ciphertext worden geweigerd. Inhoud wordt na decryptie gevalideerd; onbekende modelversies worden niet ingelezen.
- Geen leesbare fallback naar localStorage. Formulieren maken tekstnodes, geen HTML uit gebruikersinvoer. Externe scripts zijn door de HTML-CSP uitgesloten.
- Bewaren gebruikt een IndexedDB-transactie met verwachte revisie. Een tweede tabblad kan een verouderde kopie niet over de nieuwe kopie schrijven.

Dit is geen onafhankelijke cryptografische audit. Versleuteling beschermt de gesloten opgeslagen kluis; een geopend tabblad kan de inhoud lezen. Kwaadaardige appupdates, een kwetsbaarheid in eigen JavaScript, extensies of een gecompromitteerd apparaat vallen buiten die bescherming. De code kan geheugenreferenties loslaten bij vergrendelen, maar garandeert geen fysieke geheugenwissing.

## Vergrendelen en onvoltooide invoer

Na 5, 15 of 30 minuten zonder bediening probeert de app te vergrendelen. Open taak-, notitie- en afspraakconcepten en het snelle invoerveld worden dan als notitie(s) opgeslagen. Wachtwoord- en bestandsvelden worden nooit als concept bewaard. Concepten zijn pas duurzaam nadat deze save is geslaagd; sluiten van het tabblad vóór bewaren kan invoer verliezen. Achtergrondtabs kunnen timers vertragen: een terugkeer triggert opnieuw een controle, geen OS-brede vergrendeling.

Een opslagfout houdt de sessie open en toont een melding. Maak dan een versleutelde kopie voordat je het tabblad sluit. Het downloaden van een kopie maakt lokale fouten niet automatisch ongedaan. Een volledig crashend of door het OS beëindigd tabblad kan RAM-inhoud verliezen.

## Reservekopie terugzetten

1. Download eerst een kopie van de huidige gegevens als die belangrijk zijn.
2. Kies *Reservekopie terugzetten*, selecteer het JSON-bestand en voer de wachtzin van die kopie in.
3. Bij een geopende sessie vraagt de app of vervangen de bedoeling is. Het is vervangen, geen samenvoegen.
4. De app controleert formaat, decryptie, model en lokale revisie vóór het bijwerken van de kluis. Een fout laat de bestaande kluis staan.

De kopie gebruikt dezelfde wachtzin als de kluis waaruit zij is gemaakt. Een kopie met een andere wachtzin vervangt bij herstel dus ook de wachtzin van deze lokale plek. Er is in deze versie geen afzonderlijke functie om de wachtzin te wijzigen. Verlies van zowel wachtzin als bruikbare herstelmogelijkheid is onherstelbaar.

## Grenzen van wissen en lokaal bewaren

Losse onderdelen verwijderen gebeurt na een bevestiging. *Wis mijn lokale gegevens* vereist het typen van `WISSEN` en verwijdert het lokale kluisrecord. Gedownloade kopieën, OS-back-ups en eventuele bestanden elders worden hierdoor niet verwijderd. De app biedt geen prullenbak; een eerder gemaakte reservekopie is de herstelroute.

Browsers kunnen opslag opruimen, vooral in privémodus of bij ruimtegebrek. De app vraagt nog geen persistente opslagstatus aan en controleert geen periodieke back-updiscipline. De volledige kluis heeft grenzen: 500 taken, 1.000 notities, 100 afspraken en 30 stappen per taak. Voor grotere hoeveelheden is een ander opslagmodel nodig.

## Vóór een publieke pilot

Bepaal doelgroep en verantwoordelijke partij, toets de feitelijke gegevensstromen inclusief hosting, beoordeel of een DPIA nodig is en laat privacy- en beveiligingskeuzes professioneel beoordelen. Lokale verwerking betekent niet automatisch dat alle AVG-verplichtingen vervallen. Deze versie richt zich op zelfstandige volwassenen; begeleiding van minderjarigen, dossiers, medische claims en delen met professionals vereisen een eigen ontwerp en beoordeling. Dit document is een technische beschrijving, geen verklaring van juridische conformiteit.
