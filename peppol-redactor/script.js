const CONFIG = {

    paymentId: '+++RE/DAC/TED+++',
    blankPdf: "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4gPj4gPj4gL0NvbnRlbnRzIDQgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggNDUgPj4Kc3RyZWFtCkJUIC9CMSA2MCBUZiA1MCA2MDAgVGQgKFJFREFDVEVEKSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI4OCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDUgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjM4NAQlJUVPRg==",


    SUPPLIER: {
        companyName: 'REDACTED SUPPLIER',
        contactName: 'MR REDACTED SUPPLIER',
        street: 'REDACTED AVENUE 404',
        city: 'REDACTED CITY',
        postal: '1000',
        email: 'supplier@test.com',
        phone: '+00000000000',
        website: 'https://www.supplier.test'
    },


    CUSTOMER: {
        companyName: 'REDACTED CUSTOMER',
        contactName: 'MR REDACED CUSTOMER',
        street: 'REDACTED STREET 404',
        city: 'REDACTED TOWN',
        postal: '9999',
        email: 'customer@test.com',
        phone: '+99999999999',
        website: 'https://www.customer.test'
    }
};

// Vars
let currentFile = null;

// File Selection
function handleFileSelection(file) {
    currentFile = file;

    const dropZone = document.getElementById('dropZone');
    const anonymizeBtn = document.getElementById('anonymizeBtn');
    const status = document.getElementById('status');

    // Update Drop Zone
    dropZone.innerText = file.name;
    dropZone.style.borderColor = "#949494";
    dropZone.style.color = "#c4c4c4";
    dropZone.style.fontSize = "1.2em";


    dropZone.style.width = "70%";
    dropZone.style.float = "left";

    // Redact button
    anonymizeBtn.classList.remove('hidden');
    anonymizeBtn.style.width = "25%";
    anonymizeBtn.style.float = "right";

    anonymizeBtn.style.height = "120px";

    anonymizeBtn.style.display = "flex";
    anonymizeBtn.style.alignItems = "center";
    anonymizeBtn.style.justifyContent = "center";

    status.style.clear = "both";

    showStatus("");
}

// 2. Process File
function runAnonymization() {
    if (!currentFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                showStatus("Error: Invalid XML file.", true);
                return;
            }

            // Do the redactions
            performRedactionLogic(xmlDoc, currentFile.name);

        } catch (err) {
            console.error(err);
            showStatus("Error: " + err.message, true);
        }
    };
    reader.readAsText(currentFile);
}


function performRedactionLogic(xmlDoc, originalFileName) {

    const originalNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
    const newId = "REDACTED_" + originalNameWithoutExt;

    const rootIdNode = evaluateXPath("/*[local-name()='Invoice' or local-name()='CreditNote']/*[local-name()='ID']", xmlDoc, xmlDoc)[0];
    if (rootIdNode) rootIdNode.textContent = newId;

    replaceTextIn(xmlDoc, "//*[local-name()='InvoiceDocumentReference']/*[local-name()='ID']", newId, xmlDoc);

    // Parties
    const anonymizeGroup = (paths, dataConfig, type) => {
        paths.forEach(path => {
            const parties = evaluateXPath(path, xmlDoc, xmlDoc);
            parties.forEach(party => {
                // Company Names
                replaceTextIn(party, ".//*[local-name()='Name']", dataConfig.companyName, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='RegistrationName']", dataConfig.companyName, xmlDoc);

                // Address Details
                replaceTextIn(party, ".//*[local-name()='StreetName']", dataConfig.street, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='AdditionalStreetName']", "REDACTED BUILDING", xmlDoc);
                replaceTextIn(party, ".//*[local-name()='CityName']", dataConfig.city, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='PostalZone']", dataConfig.postal, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='CountrySubentity']", dataConfig.city, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='Line']", dataConfig.street, xmlDoc);

                // Contact Details
                replaceTextIn(party, ".//*[local-name()='Contact']/*[local-name()='Name']", dataConfig.contactName, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='ElectronicMail']", dataConfig.email, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='Telephone']", dataConfig.phone, xmlDoc);
                replaceTextIn(party, ".//*[local-name()='URI']", dataConfig.website, xmlDoc);

                // EndpointID logic
                let endpointValue = null;
                const endpointNodes = evaluateXPath(".//*[local-name()='EndpointID']", party, xmlDoc);
                endpointNodes.forEach(node => {
                    applyEasLookup(node, type);
                    endpointValue = node.textContent;
                });

                // Country Code for Prefixing
                let countryCode = "";
                const countryNodes = evaluateXPath(".//*[local-name()='PostalAddress']/*[local-name()='Country']/*[local-name()='IdentificationCode']", party, xmlDoc);
                if (countryNodes.length > 0) countryCode = countryNodes[0].textContent.trim();

                // CompanyID logic
                const companyIdNodes = evaluateXPath(
                    ".//*[local-name()='PartyLegalEntity']/*[local-name()='CompanyID'] | .//*[local-name()='PartyTaxScheme']/*[local-name()='CompanyID']",
                    party, xmlDoc
                );
                companyIdNodes.forEach(node => {
                    if (endpointValue && !endpointValue.includes("FAILED_TO_REDACT")) {
                        let newValue = endpointValue;
                        if (countryCode && !newValue.toUpperCase().startsWith(countryCode.toUpperCase())) {
                            newValue = countryCode + newValue;
                        }
                        node.textContent = newValue;
                    } else if (endpointValue && endpointValue.includes("FAILED_TO_REDACT")) {
                        node.textContent = endpointValue;
                    } else {
                        if (node.textContent) node.textContent = generateFixedId(node.textContent, type);
                    }
                });

                // PartyIdentification
                const partyIdNodes = evaluateXPath(".//*[local-name()='PartyIdentification']/*[local-name()='ID']", party, xmlDoc);
                partyIdNodes.forEach(node => {
                    if (node.textContent) node.textContent = generateFixedId(node.textContent, type);
                });
            });
        });
    };

    // Supplier
    anonymizeGroup([
        "//*[local-name()='AccountingSupplierParty']",
        "//*[local-name()='PayeeParty']",
        "//*[local-name()='TaxRepresentativeParty']"
    ], CONFIG.SUPPLIER, 'supplier');

    // Customer
    anonymizeGroup([
        "//*[local-name()='AccountingCustomerParty']",
        "//*[local-name()='DeliveryParty']"
    ], CONFIG.CUSTOMER, 'customer');

    // Lines
    const invoiceLines = evaluateXPath("//*[local-name()='InvoiceLine'] | //*[local-name()='CreditNoteLine']", xmlDoc, xmlDoc);
    invoiceLines.forEach(line => {
        const idNode = evaluateXPath("./*[local-name()='ID']", line, xmlDoc)[0];
        const lineId = idNode ? idNode.textContent.trim() : "X";

        replaceTextIn(line, ".//*[local-name()='Item']/*[local-name()='Name']", `REDACTED Product ${lineId}`, xmlDoc);
        replaceTextIn(line, ".//*[local-name()='Item']/*[local-name()='Description']", `REDACTED Product ${lineId}`, xmlDoc);
        replaceTextIn(line, ".//*[local-name()='Item']/*[local-name()='SellersItemIdentification']/*[local-name()='ID']", `RED-PROD-${lineId}`, xmlDoc);

        const barcodeNode = evaluateXPath(".//*[local-name()='Item']/*[local-name()='StandardItemIdentification']/*[local-name()='ID']", line, xmlDoc)[0];
        if (barcodeNode && barcodeNode.textContent) {
            barcodeNode.textContent = generateFixedId(barcodeNode.textContent, 'supplier');
        }

        // Line DocumentReference ID
        const lineDocRefNodes = evaluateXPath(".//*[local-name()='DocumentReference']/*[local-name()='ID']", line, xmlDoc);
        lineDocRefNodes.forEach(node => {
            if (node.textContent) node.textContent = "0000000000";
        });
    });

    // Properties
    replaceTextIn(xmlDoc, "//*[local-name()='AdditionalItemProperty']/*[local-name()='Name']", "REDACTED PROPERTY", xmlDoc);
    replaceTextIn(xmlDoc, "//*[local-name()='AdditionalItemProperty']/*[local-name()='Value']", "REDACTED VALUE", xmlDoc);

    // Financials
    replaceTextIn(xmlDoc, "//*[local-name()='PaymentID']", CONFIG.paymentId, xmlDoc);
    replaceTextIn(xmlDoc, "//*[local-name()='BuyerReference']", "REF-123456", xmlDoc);
    replaceTextIn(xmlDoc, "//*[local-name()='AccountingCost']", "REDACTED_COST_CENTER", xmlDoc);

    // Bank Details
    const payeeAccountNodes = evaluateXPath("//*[local-name()='PayeeFinancialAccount']/*[local-name()='ID']", xmlDoc, xmlDoc);
    payeeAccountNodes.forEach(node => { if (node.textContent) node.textContent = generateFixedId(node.textContent, 'supplier'); });

    const mandateNodes = evaluateXPath("//*[local-name()='PaymentMandate']/*[local-name()='ID']", xmlDoc, xmlDoc);
    mandateNodes.forEach(node => { if (node.textContent) node.textContent = generateFixedId(node.textContent, 'customer'); });

    replaceTextIn(xmlDoc, "//*[local-name()='PayeeFinancialAccount']/*[local-name()='Name']", "REDACTED BANK ACCOUNT", xmlDoc);
    replaceTextIn(xmlDoc, "//*[local-name()='FinancialInstitutionBranch']/*[local-name()='ID']", "REDACTED BIC", xmlDoc);

    // Notes
    const notePaths = ["//*[local-name()='Note']", "//*[local-name()='Item']/*[local-name()='Note']"];
    notePaths.forEach(path => replaceTextIn(xmlDoc, path, "REDACTED NOTE", xmlDoc));

    // Document Description
    replaceTextIn(xmlDoc, "//*[local-name()='DocumentDescription']", "REDACTED DESCRIPTION", xmlDoc);

    // References
    const refTags = ["OrderReference", "DespatchDocumentReference", "ReceiptDocumentReference", "ContractDocumentReference", "AdditionalDocumentReference", "OriginatorDocumentReference"];
    refTags.forEach(tag => {
        const idPath = `//*[local-name()='${tag}']/*[local-name()='ID']`;
        const nodes = evaluateXPath(idPath, xmlDoc, xmlDoc);
        nodes.forEach(node => { if (node.textContent) node.textContent = "REDACTED REFERENCE"; });
    });

    // Delivery Locations
    const locationPaths = ["//*[local-name()='DeliveryLocation']", "//*[local-name()='Location']"];
    locationPaths.forEach(locPath => {
        const locs = evaluateXPath(locPath, xmlDoc, xmlDoc);
        locs.forEach(loc => {
            replaceTextIn(loc, ".//*[local-name()='StreetName']", CONFIG.CUSTOMER.street, xmlDoc);
            replaceTextIn(loc, ".//*[local-name()='AdditionalStreetName']", "REDACTED SUITE/FLOOR", xmlDoc);
            replaceTextIn(loc, ".//*[local-name()='CityName']", CONFIG.CUSTOMER.city, xmlDoc);
            replaceTextIn(loc, ".//*[local-name()='PostalZone']", CONFIG.CUSTOMER.postal, xmlDoc);
            replaceTextIn(loc, ".//*[local-name()='CountrySubentity']", CONFIG.CUSTOMER.city, xmlDoc);
            replaceTextIn(loc, ".//*[local-name()='Line']", CONFIG.CUSTOMER.street, xmlDoc);

            const idNodes = evaluateXPath(".//*[local-name()='ID']", loc, xmlDoc);
            idNodes.forEach(idNode => { if (idNode.textContent) idNode.textContent = generateFixedId(idNode.textContent, 'customer'); });
        });
    });

    // Attachments
    replaceTextIn(xmlDoc, "//*[local-name()='EmbeddedDocumentBinaryObject']", CONFIG.blankPdf, xmlDoc);

    // Download
    const serializer = new XMLSerializer();
    const newXmlString = serializer.serializeToString(xmlDoc);

    triggerAutoDownload(newXmlString, newId);
}

// Trigger Download and Reset
function triggerAutoDownload(content, newFileName) {
    const blob = new Blob([content], { type: "text/xml" });
    const url = URL.createObjectURL(blob);

    // Create temporary link and click it
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = newFileName + ".xml";
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    // Clean up URL
    setTimeout(() => {
        URL.revokeObjectURL(url);
        resetUI();
    }, 1500);

    showStatus(`Download started...`);
}

// Reset UI 
function resetUI() {
    currentFile = null;
    document.getElementById('fileInput').value = "";

    const dropZone = document.getElementById('dropZone');
    const anonymizeBtn = document.getElementById('anonymizeBtn');
    const status = document.getElementById('status');

    // Reset Drop Zone styles
    dropZone.innerText = "[ CLICK OR DROP YOUR XML HERE ]";
    dropZone.style.width = "";
    dropZone.style.float = "";
    dropZone.style.borderColor = "";
    dropZone.style.color = "";
    dropZone.style.fontSize = "";

    // Reset Button
    anonymizeBtn.classList.add('hidden');
    anonymizeBtn.style.width = "";
    anonymizeBtn.style.float = "";
    anonymizeBtn.style.height = "";
    anonymizeBtn.style.display = "";

    // Reset Clear
    status.style.clear = "";

    showStatus("");
}

// Helper functions

function evaluateXPath(xpath, contextNode, docRoot) {
    const result = [];
    const nodes = docRoot.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < nodes.snapshotLength; i++) {
        result.push(nodes.snapshotItem(i));
    }
    return result;
}

function replaceTextIn(contextNode, xpath, newValue, docRoot) {
    const nodes = evaluateXPath(xpath, contextNode, docRoot);
    nodes.forEach(node => {
        if (node.textContent && node.textContent.trim() !== "") {
            node.textContent = newValue;
        }
    });
}

function applyEasLookup(node, type) {
    const scheme = node.getAttribute('schemeID');
    let found = false;

    if (scheme && typeof EAS_CODES !== 'undefined' && EAS_CODES[scheme]) {
        const index = (type === 'customer') ? 1 : 0;
        if (EAS_CODES[scheme][index]) {
            node.textContent = EAS_CODES[scheme][index];
            found = true;
        }
    }

    if (!found) {
        node.textContent = "FAILED_TO_REDACT_DUE_TO_INVALID_SHEME_ID";
    }
}

function generateFixedId(originalValue, type) {
    if (!originalValue) return originalValue;
    originalValue = originalValue.trim();
    const match = originalValue.match(/^([A-Za-z]{2})(.*)/);
    let prefix = "";
    let numberPart = originalValue;
    if (match) {
        prefix = match[1];
        numberPart = match[2];
    }
    const fillChar = (type === 'supplier') ? '0' : '9';
    const newNumbers = numberPart.split('').map(() => fillChar).join('');
    return prefix + newNumbers;
}

function showStatus(msg, isError = false) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = isError ? 'error' : '';
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const anonymizeBtn = document.getElementById('anonymizeBtn');

    // Drag & Drop / Click
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileSelection(fileInput.files[0]);
    });

    // Action Button
    anonymizeBtn.addEventListener('click', runAnonymization);
});