# Validatie van versie 0.1

## Uitgevoerd

- `npm run check`: JavaScript-syntax, JSON en lokale module-imports.
- `npm test`: 14 geslaagde tests voor klokverloop na onderbreking, pauze/hervatten, taak/timerconsistentie, inhoudsvalidatie, versleutelde roundtrip, verkeerde wachtzin, gewijzigde ciphertext, willekeurige IVs, grenscontrole, opeenvolgende saves, schrijffouten, revisieconflicten en voorbeeldstand zonder writes.
- Browsercontrole van de voorbeeldstand: notitie vastleggen, afgevinkte stap met volgende handeling, taak aanpassen, timer starten/pauzeren/hervatten, afzonderlijk focusscherm, notitie zoeken en gekozen steunzin groot tonen.
- De HTTP-preview weigert eigen opslag zonder Web Crypto in plaats van leesbaar te bewaren. De voorbeeldstand werkt daar wel; ook IDs worden met de crypto-randomgenerator gemaakt.

## Nog nodig vóór een pilot

De tests gebruiken voor sessiegedrag een opslagdubbel. De browserpreview is HTTP en daardoor geen veilige Web Crypto-context. Een echte browserproef van aanmaken/openen, fout wachtwoord, IndexedDB-transacties, export/herstel, vergrendeling en gegevens wissen op HTTPS of localhost is nog niet uitgevoerd. Dat moet op de uiteindelijke host gebeuren; de unit-tests vervangen die proef niet.

Controleer vervolgens iPhone/Safari en Android/Chrome op 360–430 px: lange woorden, schermtoetsenbord, ondernavigatie, installatie, offline heropenen, vernieuwen, automatische vergrendeling en herstel na een opslagfout. Test toetsenbord en schermlezer met mensen, naast contrast, labels, focus en aanraakdoelen. De CSS is responsief en verminderd-bewegen wordt gerespecteerd; er is geen volledige toegankelijkheidsaudit uitgevoerd.

Test een release-update vanaf de vorige cache en een offline herstart. Laat de versleuteling en softwareketen onafhankelijk onderzoeken. Laat volwassenen met uiteenlopende ADHD-ervaringen vrijwillig met verzonnen data taakstart en terugvinden proberen; beoordeel ervaren belasting en autonomie voordat er effectclaims worden gemaakt.
