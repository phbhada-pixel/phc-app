// 🟢 JS/REPORT.JS - Multi-Select Reports, Direct Copyable PDF, Auto-Fit & Decimals

function formatNumberDecimals(val) {
    if (val === "" || val === null || val === undefined || val === "-" || String(val).trim() === "") return val;
    let n = Number(val);
    if (!isNaN(n)) { return Number.isInteger(n) ? n : parseFloat(n.toFixed(2)); }
    return val;
}

// 🟢 नवीन: Multi-Select ड्रॉपडाऊनचे फंक्शन्स
function toggleMultiSelect() {
    let dropdown = document.getElementById('multiSelectDropdown');
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

document.addEventListener('click', function(event) {
    let container = document.getElementById('multiSelectContainer');
    if (container && !container.contains(event.target)) {
        document.getElementById('multiSelectDropdown').style.display = 'none';
    }
});

function updateMultiSelectUI() {
    let select = document.getElementById('reportFormSelect');
    let optionsDiv = document.getElementById('multiSelectOptions');
    if(!select || !optionsDiv) return;

    optionsDiv.innerHTML = "";
    Array.from(select.options).forEach(opt => {
        if(opt.value && opt.value !== "ALL" && opt.value !== "") {
            let div = document.createElement('div');
            div.style.padding = "10px";
            div.style.borderBottom = "1px solid #eee";
            div.style.cursor = "pointer";
            div.innerHTML = `<label style="cursor:pointer; display:flex; align-items:center; width:100%; color:#333; font-weight:bold;">
                <input type="checkbox" class="report-chk" value="${opt.value}" checked onchange="checkIndividualReport()" style="transform:scale(1.2); margin-right:10px;"> 
                ${opt.text}
            </label>`;
            optionsDiv.appendChild(div);
        }
    });
    
    document.getElementById('chkAllReports').checked = true;
    updateMultiSelectText();
    toggleReportFortnight();
}

function toggleAllReports(chkAll) {
    let checkboxes = document.querySelectorAll('.report-chk');
    checkboxes.forEach(chk => chk.checked = chkAll.checked);
    updateMultiSelectText();
    toggleReportFortnight();
}

function checkIndividualReport() {
    let checkboxes = document.querySelectorAll('.report-chk');
    let allChecked = true;
    checkboxes.forEach(chk => { if(!chk.checked) allChecked = false; });
    document.getElementById('chkAllReports').checked = allChecked;
    updateMultiSelectText();
    toggleReportFortnight();
}

function updateMultiSelectText() {
    let chkAll = document.getElementById('chkAllReports');
    let textSpan = document.getElementById('multiSelectBtnText');
    if(chkAll && chkAll.checked) {
        textSpan.innerText = "सर्व अहवाल (All Forms)";
        textSpan.style.color = "var(--primary)";
    } else {
        let selected = document.querySelectorAll('.report-chk:checked');
        if(selected.length === 0) {
            textSpan.innerText = "-- कोणताही अहवाल निवडलेला नाही --";
            textSpan.style.color = "red";
        } else if(selected.length === 1) {
            let lbl = selected[0].parentElement.innerText.trim();
            textSpan.innerText = lbl.length > 35 ? lbl.substring(0, 35) + "..." : lbl;
            textSpan.style.color = "#d35400";
        } else {
            textSpan.innerText = `✔️ ${selected.length} अहवाल निवडले`;
            textSpan.style.color = "green";
        }
    }
}

function getSelectedReportIDs() {
    let chkAll = document.getElementById('chkAllReports');
    if(chkAll && chkAll.checked) return ["ALL"];
    let selected = [];
    document.querySelectorAll('.report-chk:checked').forEach(chk => selected.push(chk.value));
    return selected;
}

function toggleReportFortnight() {
    let selectedIDs = getSelectedReportIDs();
    let fnDiv = document.getElementById('reportFortnightDiv');
    if(!fnDiv) return;

    if(selectedIDs.length === 0) { fnDiv.style.display = "none"; return; }

    let showFn = false;
    if(selectedIDs.includes("ALL")) {
        showFn = masterData.forms.some(f => String(f.Frequency).trim().toUpperCase() === "FORTNIGHTLY");
    } else {
        showFn = selectedIDs.some(id => {
            let f = masterData.forms.find(x => x.FormID === id);
            return f && String(f.Frequency).trim().toUpperCase() === "FORTNIGHTLY";
        });
    }
    fnDiv.style.display = showFn ? "block" : "none";
}

// 🟢 PENDING REPORT LOGIC (Multi-Select सह)
function generatePendingReport() {
    const selMonth = document.getElementById('reportMonth').value;
    const selYear = document.getElementById('reportYear').value;
    let selectedIDs = getSelectedReportIDs();
    
    if (selMonth === "सर्व" || selYear === "सर्व") { alert("विशिष्ट 'महिना' आणि 'वर्ष' निवडा!"); return; }
    if (selectedIDs.length === 0) { alert("कृपया किमान एक अहवाल निवडा!"); return; }

    let groupedData = {}; 
    let filterSubCenter = "सर्व";
    if (document.getElementById('reportSubCenterFilter')) { filterSubCenter = document.getElementById('reportSubCenterFilter').value; }

    let formsToCheck = masterData.forms.filter(f => !isFormInactive(f));
    if(!selectedIDs.includes("ALL")) { 
        formsToCheck = formsToCheck.filter(f => selectedIDs.includes(f.FormID)); 
    }

    formsToCheck.forEach(f => {
        let allowedRoles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
        let isAllForm = allowedRoles.includes("ALL");
        groupedData[f.FormName] = [];

        let targetMonth = selMonth;
        if(String(f.Frequency).trim().toUpperCase() === "FORTNIGHTLY") {
            let fn = document.getElementById('reportFortnight').value;
            if(fn !== "सर्व") targetMonth = selMonth + " (" + fn + ")";
        }

        masterData.users.forEach(u => {
            let isAdmin = (user.role === "Admin" || user.role === "VIEWER" || user.role === "MANAGER");
            if (!isAdmin && String(u.mobile).trim() !== String(user.mobile).trim()) return;
            if (isAdmin && filterSubCenter !== "सर्व" && String(u.subcenter).trim() !== filterSubCenter) return;

            if (isAllForm || allowedRoles.includes(u.role)) {
                let userVillages = masterData.villages.filter(v => String(v.SubCenterID).trim().toLowerCase() === String(u.subcenter).trim().toLowerCase());
                userVillages.forEach(v => {
                    let isFilled = masterData.filledStats.some(h => 
                        h.formID === f.FormID && String(h.village).trim() === String(v.VillageName).trim() && 
                        String(h.month).trim() === targetMonth && String(h.year).trim() === selYear
                    );
                    if (!isFilled) { groupedData[f.FormName].push({ sc: u.subcenter, name: u.name, role: u.role, village: v.VillageName }); }
                });
            }
        });
    });

    let container = document.getElementById('reportTableContainer');
    let downArea = document.getElementById('downloadButtonsArea');
    
    downArea.innerHTML = `
        <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
            <button onclick="copyPendingListText()" style="background:#6c757d; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📋 यादी कॉपी करा (WhatsApp साठी)</button>
            <button id="btnPendingPdfDownload" onclick="downloadPendingPDF()" style="background:#e74c3c; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📥 PDF डाउनलोड करा</button>
        </div>
    `;
    
    let displayMonthTitle = selMonth;
    if(!selectedIDs.includes("ALL")) {
        let hasFn = formsToCheck.some(f => String(f.Frequency).trim().toUpperCase() === "FORTNIGHTLY");
        if(hasFn) {
            let fn = document.getElementById('reportFortnight').value;
            if(fn !== "सर्व") displayMonthTitle = selMonth + " (" + fn + ")";
        }
    }

    let phcHeader = filterSubCenter === 'सर्व' ? "प्राथमिक आरोग्य केंद्र भादा" : `प्राथमिक आरोग्य केंद्र भादा (उपकेंद्र: ${filterSubCenter})`;

    let html = `<div id="pdfExportArea" class="pdf-container">
        <div style="text-align:center; border-bottom: 2px solid var(--primary); padding-bottom:10px; margin-bottom:20px;">
            <h2 style="margin:0; color:var(--primary); font-size:24px;">${phcHeader}</h2>
            <h3 style="margin:5px 0 0 0; color:#444; font-size:18px;">अपूर्ण अहवाल यादी - कालावधी: ${displayMonthTitle} ${selYear}</h3>
        </div>`;

    let hasData = false;
    let isFirstPending = true;

    for(let fName in groupedData) {
        if(groupedData[fName].length > 0) {
            hasData = true;
            let pbClass = isFirstPending ? "" : "page-break"; 
            isFirstPending = false;
            
            html += `<div class="${pbClass}">`;
            html += `<div class="pdf-group-header" style="background:#f8f9fa; color:#c0392b; padding:10px; font-weight:bold; font-size:16px; margin-top:10px; border:1px solid #ddd;">📄 फॉर्म: ${fName}</div>`;
            html += `<table class="report-table pending-data-table" style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                <thead style="background:#f4f7f6;"><tr>
                <th style="border: 1px solid #ccc; padding: 8px; width:10%; text-align:center;">अ.क्र.</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align:left;">अहवाल अप्राप्त असणारे कर्मचारी (उपकेंद्र) - अपूर्ण गावे</th>
                </tr></thead><tbody>`;
            
            let empMap = {};
            groupedData[fName].forEach(p => { let key = p.name + "###" + p.sc; if(!empMap[key]) empMap[key] = []; empMap[key].push(p.village); });
            let idx = 1; let sortedKeys = Object.keys(empMap).sort(); 
            sortedKeys.forEach(key => {
                let [empName, scName] = key.split("###"); let villagesStr = empMap[key].join(", ");
                html += `<tr><td style="border: 1px solid #ccc; padding: 8px; text-align:center; font-weight:bold;">${idx++}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:15px;" class="copy-target-cell">
                        <span style="color:#0056b3; font-weight:bold;">${empName}</span> - <span style="color:#d35400; font-weight:bold;">${scName}</span> <span style="color:#28a745; font-weight:bold;">(${villagesStr})</span>
                    </td></tr>`;
            });
            html += `</tbody></table></div>`;
        }
    }

    if(!hasData) { html = `<h3 style="text-align:center; color:green; padding:30px;">🎉 उत्कृष्ट! तुमचे सर्व अहवाल पूर्ण भरले आहेत.</h3>`; downArea.innerHTML = ""; }
    container.innerHTML = html + `</div>`; document.getElementById('reportContentArea').classList.remove('hidden');
}

function copyPendingListText() {
    let textToCopy = `*अपूर्ण अहवाल यादी*\n\n`;
    let tables = document.querySelectorAll('.pending-data-table');
    if(tables.length === 0) { alert("कॉपी करण्यासाठी कोणतीही माहिती नाही."); return; }
    let formHeaders = document.querySelectorAll('.pdf-group-header');
    tables.forEach((table, tableIndex) => {
        let formName = formHeaders[tableIndex] ? formHeaders[tableIndex].innerText.replace('📄 फॉर्म: ', '').trim() : "अहवाल";
        textToCopy += `📌 *${formName}*\n`;
        let rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, rowIndex) => { let cells = row.querySelectorAll('td'); if(cells.length >= 2) { let details = cells[1].innerText.replace(/\n/g, " ").trim(); textToCopy += `${rowIndex + 1}. ${details}\n`; } });
        textToCopy += `\n`;
    });
    navigator.clipboard.writeText(textToCopy).then(() => { alert("✅ यादी यशस्वीरित्या कॉपी झाली!"); });
}

function downloadPendingPDF() {
    let element = document.getElementById('pdfExportArea');
    if (!element) return;
    
    let printDiv = document.createElement('div');
    printDiv.innerHTML = element.innerHTML;
    printDiv.style.background = "#fff";
    printDiv.style.padding = "10px";
    
    let btn = document.getElementById('btnPendingPdfDownload');
    let oldText = btn.innerText;
    btn.innerText = "⏳ PDF डाऊनलोड होत आहे...";
    btn.disabled = true;

    var opt = {
        margin:       0.3,
        filename:     'अपूर्ण_अहवाल_यादी.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(printDiv).save().then(() => {
        btn.innerText = oldText;
        btn.disabled = false;
    }).catch(() => {
        alert("PDF डाऊनलोड करताना त्रुटी आली.");
        btn.innerText = oldText;
        btn.disabled = false;
    });
}

function getTotalsRow(data, headers, showIndices) {
    let totals = Array(headers.length).fill(0); let isNumericCol = Array(headers.length).fill(false);
    for(let c of showIndices) {
        let colName = headers[c] || "";
        if(colName.includes("मोबाईल") || colName.includes("क्रमांक") || colName === "तारीख" || colName === "महिना" || colName === "वर्ष" || colName === "उपकेंद्र" || colName === "गाव" || colName === "ग्रामपंचायत" || colName.includes("नाव") || colName.includes("स्तर")) { continue; }
        let isNum = false; let colSum = 0;
        for(let r=1; r<data.length; r++) { let val = String(data[r][c] || "").trim(); if(val !== "" && val !== "-") { if(!isNaN(val)) { isNum = true; colSum += parseFloat(val); } else { isNum = false; break; } } }
        if(isNum) { isNumericCol[c] = true; totals[c] = formatNumberDecimals(colSum); }
    }
    return { totals, isNumericCol };
}

function getProgressiveTargetMonthsAndYears(selM, selY) {
    const months = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
    const fyStartMonthIdx = 3; let selectedMonthIdx = months.indexOf(selM); let sYear = parseInt(selY); let result = [];
    if (selectedMonthIdx >= fyStartMonthIdx) { for(let i = fyStartMonthIdx; i <= selectedMonthIdx; i++) { result.push({m: months[i], y: String(sYear)}); } } 
    else { for(let i = fyStartMonthIdx; i <= 11; i++) { result.push({m: months[i], y: String(sYear - 1)}); } for(let i = 0; i <= selectedMonthIdx; i++) { result.push({m: months[i], y: String(sYear)}); } }
    return result;
}

function updateReportSubCenterDropdown() {
    let scFilter = document.getElementById('reportSubCenterFilter');
    if(!scFilter || !masterData || !masterData.subCenters) return;
    scFilter.innerHTML = '<option value="सर्व">सर्व उपकेंद्र (All Sub-centers)</option>';
    let uniqueSCs = new Set();
    masterData.subCenters.forEach(sc => uniqueSCs.add(String(sc.SubCenterName).trim()));
    masterData.villages.forEach(v => uniqueSCs.add(String(v.SubCenterID).trim()));
    Array.from(uniqueSCs).filter(s => s && s !== "undefined").sort().forEach(scName => {
        scFilter.innerHTML += `<option value="${scName}">${scName}</option>`;
    });
}

const originalSwitchTab = window.switchTab;
window.switchTab = function(tab) {
    if(originalSwitchTab) originalSwitchTab(tab);
    if(tab === 'reports') { 
        updateReportSubCenterDropdown(); 
        updateMultiSelectUI(); // ड्रॉपडाऊन बनवणे
    }
};

// 🟢 REPORT FETCHING LOGIC (Multi-Select सह)
async function fetchReportData() {
    let selectedIDs = getSelectedReportIDs();
    if(selectedIDs.length === 0) { alert("कृपया किमान एक अहवाल निवडा!"); return; }

    const selMonth = document.getElementById('reportMonth').value; 
    const selYear = document.getElementById('reportYear').value;
    
    let finalMonth = selMonth;
    let hasFn = false;
    if(selectedIDs.includes("ALL")) {
        hasFn = masterData.forms.some(f => String(f.Frequency).trim().toUpperCase() === "FORTNIGHTLY");
    } else {
        hasFn = selectedIDs.some(id => {
            let f = masterData.forms.find(x => x.FormID === id);
            return f && String(f.Frequency).trim().toUpperCase() === "FORTNIGHTLY";
        });
    }

    if(hasFn && selMonth !== "सर्व") {
        let fn = document.getElementById('reportFortnight').value;
        if(fn !== "सर्व") finalMonth = selMonth + " (" + fn + ")";
    }

    let filterSubCenter = "सर्व"; 
    if((user.role === "Admin" || user.role === "VIEWER" || user.role === "MANAGER") && document.getElementById('reportSubCenterFilter')) { 
        filterSubCenter = document.getElementById('reportSubCenterFilter').value; 
    }
    
    document.getElementById('reportLoader').style.display = "block"; document.getElementById('reportContentArea').classList.add('hidden'); document.getElementById('reportTableContainer').innerHTML = "";
    try {
        // डेटाबेसकडे "ALL" पाठवून सगळा डेटा मिळवणे (बॅकएंड कोड बदलू नये म्हणून)
        let backendFormID = selectedIDs.length === 1 && selectedIDs[0] !== "ALL" ? selectedIDs[0] : "ALL";
        
        const payload = { formID: backendFormID, role: user.role, subcenter: user.subcenter, mobileNo: user.mobile, filterSubCenter: filterSubCenter, month: finalMonth, year: selYear };
        const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"getReportData", payload}) });
        const textResponse = await r.text(); const d = JSON.parse(textResponse);
        document.getElementById('reportLoader').style.display = "none";
        
        if(d.success && d.reports) {
            let finalReports = [];
            d.reports.forEach(rep => {
                const formObj = masterData.forms.find(x => x.FormName === rep.formName);
                if(!formObj) return;

                // 🟢 नवीन: निवडलेला अहवाल आहे का ते तपासणे
                if (!selectedIDs.includes("ALL") && !selectedIDs.includes(formObj.FormID)) {
                    return; // जो निवडला नाही तो वगळणे
                }

                let headers = rep.data[0]; if(!headers) return;
                let dateIndices = [];
                headers.forEach((h, idx) => {
                    let hStr = String(h).toLowerCase();
                    if(hStr.includes("तारीख") || hStr.includes("दिनांक") || hStr.includes("date")) dateIndices.push(idx);
                });

                let validData = [headers];
                for(let i=1; i<rep.data.length; i++) { 
                    let isNil = rep.data[i].some(cell => String(cell).includes("निरंक (Nil Report)")); 
                    if(!isNil) {
                        dateIndices.forEach(idx => {
                            if(rep.data[i][idx]) {
                                let dStr = String(rep.data[i][idx]);
                                let dObj = new Date(dStr);
                                if(!isNaN(dObj.getTime()) && dStr.length >= 8 && dStr.match(/[a-zA-Z\-/\\]/)) {
                                    let dd = String(dObj.getDate()).padStart(2, '0');
                                    let mm = String(dObj.getMonth() + 1).padStart(2, '0');
                                    let yyyy = dObj.getFullYear();
                                    rep.data[i][idx] = `${dd}-${mm}-${yyyy}`;
                                }
                            }
                        });
                        validData.push(rep.data[i]); 
                    }
                }
                rep.data = validData;

                let formTypeStr = formObj ? String(formObj.FormType).trim() : "";
                let isProgressive = formTypeStr.includes('ProgressiveStats'); let isVertical = formTypeStr.includes('Vertical'); let isList = formTypeStr.includes('List'); 
                let monthIdx = headers.indexOf("महिना"); let yearIdx = headers.indexOf("वर्ष"); let villageIdx = headers.indexOf("गाव"); if(villageIdx === -1) villageIdx = headers.indexOf("Village"); 
                let fData = []; let dataRows = [];

                if (isProgressive && !isVertical && selMonth !== "सर्व" && selYear !== "सर्व") {
                    let flatFields = extractFieldsFromForm(formObj); let numericLabels = flatFields.filter(f => f.orig.type === 'number' || f.orig.type === 'sum').map(f => f.label);
                    let newHeaders = []; let numMap = {}; headers.forEach((h, i) => { if (numericLabels.includes(h)) { newHeaders.push(`${h} - मासिक`); newHeaders.push(`${h} - प्रगत`); numMap[i] = true; } else { newHeaders.push(h); } });
                    fData.push(newHeaders); let targetPeriods = getProgressiveTargetMonthsAndYears(selMonth, selYear); let villageData = {};
                    for(let i=1; i<rep.data.length; i++) {
                        let row = rep.data[i]; let m = String(row[monthIdx]).trim(); let y = String(row[yearIdx]).trim(); let v = String(row[villageIdx] || "").trim();
                        if(targetPeriods.some(p => p.m === m && p.y === y)) {
                            let sc = headers.indexOf("उपकेंद्र") > -1 ? String(row[headers.indexOf("उपकेंद्र")]).trim() : ""; let mob = headers.indexOf("मोबाईल क्र.") > -1 ? String(row[headers.indexOf("मोबाईल क्र.")]).trim() : ""; let gKey = `${sc}_${mob}_${v}`;
                            if(!villageData[gKey]) { villageData[gKey] = { baseRow: Array(headers.length).fill("-"), progressive: {}, monthly: {} }; headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; }); }
                            if (m === finalMonth && y === selYear) { headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; }); }
                            headers.forEach((_, cIdx) => { if (numMap[cIdx]) { let val = parseFloat(row[cIdx]); if(!isNaN(val)) { villageData[gKey].progressive[cIdx] = (villageData[gKey].progressive[cIdx] || 0) + val; if (m === finalMonth && y === selYear) { villageData[gKey].monthly[cIdx] = val; } } } });
                        }
                    }
                    Object.keys(villageData).forEach(k => { let vData = villageData[k]; let newRow = []; headers.forEach((h, cIdx) => { if (numMap[cIdx]) { newRow.push(vData.monthly[cIdx] || 0); newRow.push(vData.progressive[cIdx] || 0); } else { newRow.push(vData.baseRow[cIdx] || "-"); } }); if(monthIdx > -1) newRow[monthIdx] = finalMonth; if(yearIdx > -1) newRow[yearIdx] = selYear; dataRows.push(newRow); });
                } else if (isProgressive && isVertical && selMonth !== "सर्व" && selYear !== "सर्व") {
                    fData.push(headers); let targetPeriods = getProgressiveTargetMonthsAndYears(selMonth, selYear); let villageData = {}; let flatFields = extractFieldsFromForm(formObj); let numericLabels = flatFields.filter(f => f.orig.type === 'number' || f.orig.type === 'sum').map(f => f.label); let numMap = {}; headers.forEach((h, i) => { if (numericLabels.includes(h)) numMap[i] = true; });
                    for(let i=1; i<rep.data.length; i++) {
                        let row = rep.data[i]; let m = String(row[monthIdx]).trim(); let y = String(row[yearIdx]).trim(); let v = String(row[villageIdx] || "").trim();
                        if(targetPeriods.some(p => p.m === m && p.y === y)) {
                            let sc = headers.indexOf("उपकेंद्र") > -1 ? String(row[headers.indexOf("उपकेंद्र")]).trim() : ""; let mob = headers.indexOf("मोबाईल क्र.") > -1 ? String(row[headers.indexOf("मोबाईल क्र.")]).trim() : ""; let gKey = `${sc}_${mob}_${v}`;
                            if(!villageData[gKey]) { villageData[gKey] = { baseRow: Array(headers.length).fill("-"), progressive: {}, monthly: {} }; headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; }); }
                            if (m === finalMonth && y === selYear) { headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; }); }
                            headers.forEach((_, cIdx) => { if (numMap[cIdx]) { let val = parseFloat(row[cIdx]); if(!isNaN(val)) { villageData[gKey].progressive[cIdx] = (villageData[gKey].progressive[cIdx] || 0) + val; if (m === finalMonth && y === selYear) { villageData[gKey].monthly[cIdx] = val; } } } });
                        }
                    }
                    Object.keys(villageData).forEach(k => { let vData = villageData[k]; let newRow = []; headers.forEach((h, cIdx) => { if (numMap[cIdx]) { newRow.push({ M: vData.monthly[cIdx] || 0, P: vData.progressive[cIdx] || 0 }); } else { newRow.push(vData.baseRow[cIdx] || "-"); } }); if(monthIdx > -1) newRow[monthIdx] = finalMonth; if(yearIdx > -1) newRow[yearIdx] = selYear; dataRows.push(newRow); });
                } else {
                    fData.push(headers); for(let i=1; i<rep.data.length; i++) { let row = rep.data[i]; if((selMonth === "सर्व" || String(row[monthIdx]).trim() === finalMonth) && (selYear === "सर्व" || String(row[yearIdx]).trim() === selYear)) dataRows.push(row); }
                }
                fData = fData.concat(dataRows); finalReports.push({ formName: rep.formName, data: fData, isList: isList }); 
            });
            if(finalReports.length > 0) { currentReports = finalReports; renderMultipleTables(finalReports, finalMonth, selYear); document.getElementById('reportContentArea').classList.remove('hidden'); } else { alert("डेटा उपलब्ध नाही."); }
        }
    } catch(e) { document.getElementById('reportLoader').style.display = "none"; alert("एरर: " + e.message); }
}

function renderMultipleTables(reports, month, year) {
    let container = document.getElementById('reportTableContainer');
    
    let groupType = "Village";
    let filterSubCenter = "सर्व";
    if (user.role === 'Admin' || user.role === 'MANAGER' || user.role === 'VIEWER') {
        groupType = document.getElementById('reportGroupFilter') ? document.getElementById('reportGroupFilter').value : "Village";
        filterSubCenter = document.getElementById('reportSubCenterFilter') ? document.getElementById('reportSubCenterFilter').value : "सर्व";
    }

    let actionBtnsHtml = `<div class="no-print" style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
        <button onclick="downloadConsolidatedExcel()" style="flex:1; min-width:200px; background:#28a745; color:white; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">📥 Excel (.xlsx) डाऊनलोड</button>
        <button id="btnPdfDownload" onclick="downloadConsolidatedPDF()" style="flex:1; min-width:200px; background:#dc3545; color:white; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">📥 PDF (.pdf) थेट डाऊनलोड</button>
    </div>`;
    
    let html = actionBtnsHtml;
    let isFirstReport = true; 
    
    let phcHeader = filterSubCenter === 'सर्व' ? "प्राथमिक आरोग्य केंद्र भादा" : `प्राथमिक आरोग्य केंद्र भादा (उपकेंद्र: ${filterSubCenter})`;
    let periodText = (month === 'सर्व' && year === 'सर्व') ? 'सर्व महिने' : `${month} ${year !== 'सर्व' ? year : ''}`;

    reports.forEach(rep => {
        let data = rep.data; let headers = data[0];
        let showIndices = []; headers.forEach((h, i) => { if(!CONFIG.hiddenColumns.includes(h) && h !== "गाव" && h !== "Village") showIndices.push(i); });
        const formObj = masterData.forms.find(x => x.FormName === rep.formName);
        const formType = formObj ? String(formObj.FormType).trim() : "";
        const isStats = formType.includes('Stats'); const isProgressive = formType.includes('ProgressiveStats'); const isVertical = formType.includes('Vertical'); const isList = formType.includes('List'); 
        let subCenterIdx = headers.indexOf("उपकेंद्र"); let nameIdx = headers.indexOf("कर्मचाऱ्याचे नाव"); let mobIdx = headers.indexOf("मोबाईल क्र."); let villageIdx = headers.indexOf("गाव");
        
        let dataRows = data.slice(1);
        
        if ((groupType === "SubCenter" || groupType === "SubCenterConsolidated") && !isList) {
            let aggregated = {};
            dataRows.forEach(row => {
                let sc = subCenterIdx > -1 ? String(row[subCenterIdx] || "").trim() : "Unknown";
                if (!aggregated[sc]) {
                    aggregated[sc] = Array(headers.length).fill(0);
                    headers.forEach((h, idx) => { if (!showIndices.includes(idx)) aggregated[sc][idx] = row[idx]; });
                    if (villageIdx > -1) aggregated[sc][villageIdx] = "एकत्रित (All Villages)";
                    if (subCenterIdx > -1) aggregated[sc][subCenterIdx] = sc;
                }
                showIndices.forEach(idx => {
                    let val = row[idx];
                    if (typeof val === 'object' && val !== null) {
                        if (typeof aggregated[sc][idx] !== 'object') aggregated[sc][idx] = { M: 0, P: 0 };
                        aggregated[sc][idx].M += parseFloat(val.M || 0);
                        aggregated[sc][idx].P += parseFloat(val.P || 0);
                    } else {
                        let n = parseFloat(val);
                        if (!isNaN(n)) aggregated[sc][idx] = (parseFloat(aggregated[sc][idx]) || 0) + n;
                        else aggregated[sc][idx] = val; 
                    }
                });
            });
            dataRows = Object.values(aggregated);
        }

        let groups = {};
        if(dataRows.length === 0) { groups["All"] = []; } 
        else if (isList || groupType === "SubCenter" || groupType === "SubCenterConsolidated") {
            groups["सर्व उपकेंद्र एकत्रित###एकत्रित अहवाल"] = dataRows;
        } else {
            dataRows.forEach(row => {
                let sc = subCenterIdx > -1 ? String(row[subCenterIdx] || "").trim() : "Unknown";
                let mob = mobIdx > -1 ? String(row[mobIdx] || "").trim() : "Unknown";
                let ename = nameIdx > -1 ? String(row[nameIdx] || "").trim() : mob;
                if(ename === "undefined" || ename === "") ename = mob;
                let key = sc + "###" + ename;
                if(!groups[key]) groups[key] = [];
                groups[key].push(row);
            });
        }

        let groupKeys = Object.keys(groups).sort();
        let pbClass = isFirstReport ? "" : "page-break"; 
        isFirstReport = false;

        html += `<div class="${pbClass}" style="background:white; padding:15px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.1); margin-bottom:20px;">`;
        
        html += `<div class="report-header" style="text-align:center; border-bottom:2px solid var(--primary); padding-bottom:10px; margin-bottom:15px;">
            <h2 style="margin:0; color:var(--primary); font-size:22px;">${phcHeader}</h2>
            <h3 style="margin:5px 0 0 0; color:#555; font-size:16px;">अहवालाचे नाव: ${rep.formName} | कालावधी: ${periodText}</h3>
        </div>`;

        groupKeys.forEach((gKey) => {
            let gRows = groups[gKey]; let [sc, ename] = gKey.split("###");
            if(!isList && villageIdx > -1) { gRows.sort((a, b) => String(a[villageIdx]||"").localeCompare(String(b[villageIdx]||""))); }

            if(isVertical) {
                let baseVariables = []; showIndices.forEach(idx => { baseVariables.push({ name: headers[idx], isProg: isProgressive, idxM: idx, idxP: idx }); });
                let r1Html = "", r2Html = "";

                if (groupType === "SubCenterConsolidated") {
                    r1Html = `<tr><th style="background:#f4b400; color:#000; border:1px solid #ddd; text-align:center; position:sticky; left:0; z-index:2;">अ.क्र.</th><th style="background:#f4b400; color:#000; border:1px solid #ddd; text-align:center; position:sticky; left:45px; z-index:2;">तपशील / प्रश्न</th>`;
                    gRows.forEach((row) => {
                        let vName = row[subCenterIdx] || "-";
                        if (isProgressive) { r1Html += `<th style="background:#ffe082; color:#000; border:1px solid #ddd; text-align:center;">${vName}/मासिक</th><th style="background:#ffe082; color:#000; border:1px solid #ddd; text-align:center;">${vName}/प्रगत</th>`; } 
                        else { r1Html += `<th style="background:#ffe082; color:#000; border:1px solid #ddd; text-align:center;">${vName}</th>`; }
                    });
                    if (isProgressive) { r1Html += `<th style="background:#81c784; color:#000; border:1px solid #ddd; text-align:center;">एकूण/मासिक</th><th style="background:#81c784; color:#000; border:1px solid #ddd; text-align:center;">एकूण/प्रगत</th></tr>`; } 
                    else { r1Html += `<th style="background:#81c784; color:#000; border:1px solid #ddd; text-align:center;">एकूण</th></tr>`; }
                } else {
                    r1Html = `<tr><th ${isProgressive ? 'rowspan="2"' : ''} style="background:#f4b400; color:#000; border:1px solid #ddd; text-align:center; position:sticky; left:0; z-index:2;">अ.क्र.</th><th ${isProgressive ? 'rowspan="2"' : ''} style="background:#f4b400; color:#000; border:1px solid #ddd; text-align:center; position:sticky; left:45px; z-index:2;">तपशील / प्रश्न</th>`;
                    r2Html = isProgressive ? `<tr>` : "";
                    gRows.forEach((row) => {
                        let vName = groupType === "SubCenter" ? row[subCenterIdx] : (row[villageIdx] || "-");
                        r1Html += `<th ${isProgressive ? 'colspan="2"' : ''} style="background:#ffe082; color:#000; border:1px solid #ddd; text-align:center;">${vName}</th>`;
                        if (isProgressive) { r2Html += `<th style="background:#fff3e0; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">मासिक</th><th style="background:#fff3e0; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">प्रगत</th>`; }
                    });
                    r1Html += `<th ${isProgressive ? 'colspan="2"' : ''} style="background:#81c784; color:#000; border:1px solid #ddd; text-align:center;">एकूण</th></tr>`;
                    if (isProgressive) { r2Html += `<th style="background:#c8e6c9; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">मासिक</th><th style="background:#c8e6c9; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">प्रगत</th></tr>`; }
                }

                let tbodyHtml = "";
                baseVariables.forEach((v, vIndex) => {
                    tbodyHtml += `<tr><td class="sticky-col" style="background:#fdfdfd; left:0; z-index:1; text-align:center;">${vIndex+1}</td><td class="sticky-col" style="background:#fdfdfd; left:45px; z-index:1; text-align:left; font-weight:bold;">${v.name}</td>`;
                    let rowTotM = 0; let rowTotP = 0;
                    gRows.forEach(row => {
                        let val = row[v.idxM]; 
                        let m = (typeof val === 'object' && val !== null) ? val.M : val;
                        tbodyHtml += `<td>${m !== undefined && m !== "" ? formatNumberDecimals(m) : "-"}</td>`; if(!isNaN(parseFloat(m))) rowTotM += parseFloat(m);
                        if(isProgressive) { let p = (typeof val === 'object' && val !== null) ? val.P : val; tbodyHtml += `<td>${p !== undefined && p !== "" ? formatNumberDecimals(p) : "-"}</td>`; if(!isNaN(parseFloat(p))) rowTotP += parseFloat(p); }
                    });
                    tbodyHtml += `<td style="font-weight:bold; background:#e8f5e9;">${formatNumberDecimals(rowTotM)}</td>`;
                    if(isProgressive) tbodyHtml += `<td style="font-weight:bold; background:#e8f5e9;">${formatNumberDecimals(rowTotP)}</td>`;
                    tbodyHtml += `</tr>`;
                });
                html += `<div class="table-responsive"><table class="report-table"><thead>${r1Html + r2Html}</thead><tbody>${tbodyHtml}</tbody></table></div>`;
            } else {
                let h1Arr = []; showIndices.forEach(idx => { h1Arr.push(headers[idx].split(" - ")[0]); });
                html += `<div class="table-responsive"><table class="report-table"><thead><tr><th class="sticky-header-col" style="background:#f4b400; color:#000; z-index:2; position:sticky; top:0; left:0;">अ.क्र.</th><th class="sticky-header-col" style="background:#f4b400; color:#000; z-index:2; position:sticky; top:0; left:45px;">${groupType !== 'Village' ? 'उपकेंद्र' : 'गाव'}</th>`;
                showIndices.forEach(idx => html += `<th style="background:#f4b400; color:#000;">${headers[idx]}</th>`);
                html += `</tr></thead><tbody>`;
                gRows.forEach((row, i) => {
                    html += `<tr><td class="sticky-col" style="background:#fdfdfd; left:0;">${i+1}</td><td class="sticky-col" style="background:#fdfdfd; left:45px;">${groupType !== 'Village' ? row[subCenterIdx] : (row[villageIdx] || "-")}</td>`;
                    showIndices.forEach(idx => {
                        let v = row[idx];
                        let cellVal = (typeof v === 'object' && v !== null) ? `${formatNumberDecimals(v.M)} (M) / ${formatNumberDecimals(v.P)} (P)` : formatNumberDecimals(v);
                        html += `<td>${cellVal !== undefined && cellVal !== "" ? cellVal : "-"}</td>`;
                    });
                    html += `</tr>`;
                });
                let { totals, isNumericCol } = getTotalsRow([headers].concat(gRows), headers, showIndices);
                html += `<tr style="background:#d4edda; font-weight:bold; color:#155724;"><td class="sticky-col" style="background:#d4edda; left:0;">#</td><td class="sticky-col" style="background:#d4edda; left:45px;">एकूण (PHC Total)</td>`;
                showIndices.forEach(idx => html += `<td>${isNumericCol[idx] ? totals[idx] : '-'}</td>`);
                html += `</tr></tbody></table></div>`;
            }
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

// 🟢 DIRECT PDF DOWNLOAD (No Print Window)
function downloadConsolidatedPDF() {
    if(currentReports.length === 0) return;

    let groupType = "Village";
    let filterSubCenter = "सर्व";
    
    if (user.role === 'Admin' || user.role === 'MANAGER' || user.role === 'VIEWER') {
        groupType = document.getElementById('reportGroupFilter') ? document.getElementById('reportGroupFilter').value : "Village";
        filterSubCenter = document.getElementById('reportSubCenterFilter') ? document.getElementById('reportSubCenterFilter').value : "सर्व";
    }

    let month = document.getElementById('reportMonth').value; 
    let year = document.getElementById('reportYear').value;
    
    let periodText = (month === 'सर्व' && year === 'सर्व') ? 'सर्व महिने' : `${month} ${year}`;
    let fileName = `अहवाल_${groupType}_${periodText.replace(/ /g, "_")}.pdf`;

    let element = document.getElementById('reportTableContainer');
    
    // PDF बनवण्यासाठी डमी कंटेनर
    let printDiv = document.createElement('div');
    printDiv.innerHTML = element.innerHTML;
    printDiv.style.background = "#fff";
    printDiv.style.padding = "10px";
    
    // अनावश्यक गोष्टी आणि CSS काढून टाकणे
    printDiv.querySelectorAll('.no-print').forEach(el => el.remove());
    printDiv.querySelectorAll('.table-responsive').forEach(t => { 
        t.style.overflow = 'visible'; 
        t.style.maxHeight = 'none'; 
        t.style.border = 'none';
    });
    printDiv.querySelectorAll('.sticky-col, .sticky-header-col').forEach(el => {
        el.style.position = 'static';
    });

    let isLandscape = false;
    let colCount = 0;
    let originalTable = element.querySelector('.report-table');
    if (originalTable) {
        let firstRow = originalTable.querySelector('tr');
        if (firstRow) {
            Array.from(firstRow.children).forEach(th => {
                colCount += parseInt(th.getAttribute('colspan') || 1);
            });
        }
        if (colCount > 7 || originalTable.scrollWidth > 800) { isLandscape = true; }
    }

    let btn = document.getElementById('btnPdfDownload');
    let oldText = btn.innerText;
    btn.innerText = "⏳ PDF डाऊनलोड होत आहे...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    // 🟢 थेट PDF डाऊनलोड करण्यासाठी html2pdf
    var opt = {
        margin:       0.3,
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(printDiv).save().then(() => {
        btn.innerText = oldText;
        btn.style.opacity = "1";
        btn.disabled = false;
    }).catch(() => {
        alert("PDF डाउनलोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
        btn.innerText = oldText;
        btn.style.opacity = "1";
        btn.disabled = false;
    });
}

function downloadConsolidatedExcel() {
    if(currentReports.length === 0) return;
    
    let groupType = "Village";
    let filterSubCenter = "सर्व";
    
    if (user.role === 'Admin' || user.role === 'MANAGER' || user.role === 'VIEWER') {
        groupType = document.getElementById('reportGroupFilter') ? document.getElementById('reportGroupFilter').value : "Village";
        filterSubCenter = document.getElementById('reportSubCenterFilter') ? document.getElementById('reportSubCenterFilter').value : "सर्व";
    }

    let wb = XLSX.utils.book_new();
    let month = document.getElementById('reportMonth').value; 
    let year = document.getElementById('reportYear').value;
    const formID = document.getElementById('reportFormSelect').value;

    let finalMonth = month;
    if(formID !== "ALL") {
        let fObj = masterData.forms.find(x => x.FormID === formID);
        if(fObj && String(fObj.Frequency).trim().toUpperCase() === "FORTNIGHTLY" && month !== "सर्व") {
            let fn = document.getElementById('reportFortnight').value;
            if(fn !== "सर्व") finalMonth = month + " (" + fn + ")";
        }
    }
    
    let periodText = (finalMonth === 'सर्व' && year === 'सर्व') ? 'सर्व महिने' : `${finalMonth} ${year}`;
    let phcHeader = filterSubCenter === 'सर्व' ? "प्राथमिक आरोग्य केंद्र भादा" : `प्राथमिक आरोग्य केंद्र भादा (उपकेंद्र: ${filterSubCenter})`;

    currentReports.forEach((rep, index) => {
        let headers = rep.data[0]; let showIndices = []; 
        headers.forEach((h, i) => { if(!CONFIG.hiddenColumns.includes(h) && h !== "गाव" && h !== "Village") showIndices.push(i); });
        
        let subCenterIdx = headers.indexOf("उपकेंद्र"); let villageIdx = headers.indexOf("गाव");
        let dataRows = rep.data.slice(1);
        const formObj = masterData.forms.find(x => x.FormName === rep.formName);
        const formType = formObj ? String(formObj.FormType).trim() : "";
        const isStats = formType.includes('Stats'); const isProgressive = formType.includes('ProgressiveStats'); const isVertical = formType.includes('Vertical'); const isList = formType.includes('List');

        if ((groupType === "SubCenter" || groupType === "SubCenterConsolidated") && !isList) {
            let aggregated = {};
            dataRows.forEach(row => {
                let sc = subCenterIdx > -1 ? String(row[subCenterIdx] || "").trim() : "Unknown";
                if (!aggregated[sc]) {
                    aggregated[sc] = Array(headers.length).fill(0);
                    headers.forEach((h, idx) => { if (!showIndices.includes(idx)) aggregated[sc][idx] = row[idx]; });
                    if (villageIdx > -1) aggregated[sc][villageIdx] = "एकत्रित (All Villages)";
                    if (subCenterIdx > -1) aggregated[sc][subCenterIdx] = sc;
                }
                showIndices.forEach(idx => {
                    let val = row[idx];
                    if (typeof val === 'object' && val !== null) {
                        if (typeof aggregated[sc][idx] !== 'object') aggregated[sc][idx] = { M: 0, P: 0 };
                        aggregated[sc][idx].M += parseFloat(val.M || 0); aggregated[sc][idx].P += parseFloat(val.P || 0);
                    } else {
                        let n = parseFloat(val); if (!isNaN(n)) aggregated[sc][idx] = (parseFloat(aggregated[sc][idx]) || 0) + n; else aggregated[sc][idx] = val;
                    }
                });
            });
            dataRows = Object.values(aggregated);
        }

        let sheetData = []; let merges = []; let headerRowIndices = [];
        
        let reportHeader = `अहवालाचे नाव: ${rep.formName} | कालावधी: ${periodText}`;
        sheetData.push([phcHeader]); 
        sheetData.push([reportHeader]); 
        sheetData.push([]); 

        let startR = 3;

        if (isVertical) {
            if (groupType === "SubCenterConsolidated") {
                let verticalHeaders = ["अ.क्र.", "तपशील / प्रश्न"];
                dataRows.forEach(r => {
                    let name = r[subCenterIdx] || "-";
                    if (isProgressive) { verticalHeaders.push(`${name}/मासिक`); verticalHeaders.push(`${name}/प्रगत`); } else { verticalHeaders.push(name); }
                });
                if (isProgressive) { verticalHeaders.push("एकूण/मासिक"); verticalHeaders.push("एकूण/प्रगत"); } else { verticalHeaders.push("एकूण"); }
                
                let maxCol = verticalHeaders.length;
                merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxCol - 1 } });
                merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: maxCol - 1 } });
                
                sheetData.push(verticalHeaders); headerRowIndices.push(startR);

                showIndices.forEach((idx, vIndex) => {
                    let rowData = [vIndex + 1, headers[idx]]; let rowTotalM = 0; let rowTotalP = 0;
                    dataRows.forEach(r => {
                        let val = r[idx]; let m = (typeof val === 'object' && val !== null) ? val.M : val;
                        rowData.push(m !== undefined && m !== "" ? formatNumberDecimals(m) : 0); if (!isNaN(parseFloat(m))) rowTotalM += parseFloat(m);
                        if (isProgressive) { let p = (typeof val === 'object' && val !== null) ? val.P : val; rowData.push(p !== undefined && p !== "" ? formatNumberDecimals(p) : 0); if (!isNaN(parseFloat(p))) rowTotalP += parseFloat(p); }
                    });
                    rowData.push(formatNumberDecimals(rowTotalM)); if (isProgressive) rowData.push(formatNumberDecimals(rowTotalP));
                    sheetData.push(rowData);
                });
            } else {
                let verticalColCount = 2 + (dataRows.length * (isProgressive ? 2 : 1)) + (isProgressive ? 2 : 1);
                merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: verticalColCount - 1 } });
                merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: verticalColCount - 1 } });
                
                let r1 = Array(verticalColCount).fill(""); let r2 = isProgressive ? Array(verticalColCount).fill("") : null;
                let currentR = startR; 
                r1[0] = "अ.क्र."; r1[1] = "तपशील / प्रश्न";
                if(isProgressive) { merges.push({ s: { r: currentR, c: 0 }, e: { r: currentR + 1, c: 0 } }); merges.push({ s: { r: currentR, c: 1 }, e: { r: currentR + 1, c: 1 } }); }
                
                let cIndex = 2;
                dataRows.forEach(row => {
                    r1[cIndex] = groupType === "SubCenter" ? row[subCenterIdx] : (row[villageIdx] || "-");
                    if(isProgressive) { merges.push({ s: { r: currentR, c: cIndex }, e: { r: currentR, c: cIndex + 1 } }); r2[cIndex] = "मासिक"; r2[cIndex+1] = "प्रगत"; cIndex += 2; } else { cIndex += 1; }
                });
                r1[cIndex] = "एकूण";
                if(isProgressive) { merges.push({ s: { r: currentR, c: cIndex }, e: { r: currentR, c: cIndex + 1 } }); r2[cIndex] = "मासिक"; r2[cIndex+1] = "प्रगत"; }
                
                sheetData.push(r1); headerRowIndices.push(currentR); currentR++;
                if(isProgressive) { sheetData.push(r2); headerRowIndices.push(currentR); }
                
                showIndices.forEach((idx, vIndex) => {
                    let rowData = Array(verticalColCount).fill(""); rowData[0] = vIndex + 1; rowData[1] = String(headers[idx]).trim();
                    let cc = 2; let rowTotalM = 0; let rowTotalP = 0;
                    dataRows.forEach(r => {
                        let val = r[idx]; let mObj = (typeof val === 'object' && val !== null) ? val.M : val;
                        rowData[cc] = mObj !== undefined && mObj !== "" ? formatNumberDecimals(mObj) : "-"; if(!isNaN(parseFloat(mObj))) rowTotalM += parseFloat(mObj); cc++;
                        if(isProgressive) { let pObj = (typeof val === 'object' && val !== null) ? val.P : val; rowData[cc] = pObj !== undefined && pObj !== "" ? formatNumberDecimals(pObj) : "-"; if(!isNaN(parseFloat(pObj))) rowTotalP += parseFloat(pObj); cc++; }
                    });
                    rowData[cc] = formatNumberDecimals(rowTotalM); cc++; if(isProgressive) rowData[cc] = formatNumberDecimals(rowTotalP);
                    sheetData.push(rowData); 
                });
            }
        } else {
            let modifiedHeaders = ["अ.क्र."];
            if (isList) { if (subCenterIdx > -1) modifiedHeaders.push("उपकेंद्र"); if (villageIdx > -1) modifiedHeaders.push("गाव"); } 
            else { if (groupType !== "Village") modifiedHeaders.push("उपकेंद्र"); else modifiedHeaders.push("गाव"); }
            showIndices.forEach(idx => modifiedHeaders.push(headers[idx]));
            
            merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: modifiedHeaders.length - 1 } });
            merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: modifiedHeaders.length - 1 } });
            sheetData.push(modifiedHeaders); headerRowIndices.push(startR);

            dataRows.forEach((r, rowIndex) => {
                let rowData = [rowIndex + 1];
                if (isList) { if (subCenterIdx > -1) rowData.push(r[subCenterIdx] || "-"); if (villageIdx > -1) rowData.push(r[villageIdx] || "-"); } 
                else { if (groupType !== "Village") rowData.push(r[subCenterIdx] || "-"); else rowData.push(r[villageIdx] || "-"); }
                showIndices.forEach(colIdx => { 
                    let v = r[colIdx]; 
                    let valStr = (typeof v === 'object' && v !== null) ? `${formatNumberDecimals(v.M)} (M) / ${formatNumberDecimals(v.P)} (P)` : formatNumberDecimals(v); 
                    rowData.push(valStr !== undefined && valStr !== "" ? valStr : "-"); 
                });
                sheetData.push(rowData);
            });

            if (isStats && dataRows.length > 0) {
                let totalRow = ["एकूण"]; if (isList) { if (subCenterIdx > -1) totalRow.push("-"); if (villageIdx > -1) totalRow.push("-"); } else { totalRow.push("-"); }
                showIndices.forEach(idx => {
                    let colSumM = 0; let colSumP = 0; let isNum = false;
                    dataRows.forEach(r => { let v = r[idx]; if (typeof v === 'object' && v !== null) { isNum = true; colSumM += parseFloat(v.M || 0); colSumP += parseFloat(v.P || 0); } else { let n = parseFloat(v); if (!isNaN(n)) { isNum = true; colSumM += n; } } });
                    if (isNum) { if (isProgressive) totalRow.push(`${formatNumberDecimals(colSumM)} (M) / ${formatNumberDecimals(colSumP)} (P)`); else totalRow.push(formatNumberDecimals(colSumM)); } else { totalRow.push("-"); }
                });
                sheetData.push(totalRow); headerRowIndices.push(sheetData.length - 1);
            }
        }

        let ws = XLSX.utils.aoa_to_sheet(sheetData); ws["!merges"] = merges;
        for(let R=0; R<sheetData.length; R++) {
            for(let C=0; C<200; C++) { 
                let cellRef = XLSX.utils.encode_cell({r: R, c: C}); if(!ws[cellRef]) continue;
                let cellStyle = { font: { name: "Arial", sz: 11, color: { rgb: "000000" } }, alignment: { vertical: "center", horizontal: "center", wrapText: true } };
                if(R === 0) { cellStyle.fill = { fgColor: { rgb: "00705A" } }; cellStyle.font = { name: "Arial", sz: 14, bold: true, color: { rgb: "FFFFFF" } }; } 
                else if(R === 1) { cellStyle.fill = { fgColor: { rgb: "E8F5E9" } }; cellStyle.font = { name: "Arial", sz: 12, bold: true, color: { rgb: "00705A" } }; } 
                else if(headerRowIndices.includes(R)) { cellStyle.fill = { fgColor: { rgb: "F4B400" } }; cellStyle.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } }; cellStyle.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; } 
                else { cellStyle.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; if (isVertical && C === 1) cellStyle.alignment.horizontal = "left"; }
                ws[cellRef].s = cellStyle;
            }
        }
        let wscols = [{ wch: 8 }]; if (isVertical) { wscols.push({ wch: 45 }); for(let c=2; c<50; c++) wscols.push({ wch: 15 }); } else { wscols.push({ wch: 18 }); if(isList && subCenterIdx > -1 && villageIdx > -1) wscols.push({ wch: 18 }); for(let c=wscols.length; c<50; c++) wscols.push({ wch: 15 }); }
        ws["!cols"] = wscols;
        let safeSheetName = rep.formName.replace(/[\\\/\?\*\[\]\:]/g, "").substring(0, 31); if(!safeSheetName) safeSheetName = "Sheet" + (index + 1);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });
    
    XLSX.writeFile(wb, `मासिक_अहवाल_${groupType}_${periodText.replace(/ /g, "_")}.xlsx`);
}
