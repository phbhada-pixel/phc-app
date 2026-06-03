// 🟢 JS/ADMIN.JS - Field IDs, Frequency (पंधरवाडी/मासिक), Date Field आणि Saving Logic सह

function openNewFormBuilder() {
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "नवीन फॉर्म तयार करा";
    document.getElementById('editFormID').value = "";
    document.getElementById('newFormName').value = "";
    document.getElementById('newFormType').value = "Stats";
    document.getElementById('newFormLayout').value = "Horizontal";
    
    // 🟢 नवीन: डिफॉल्ट 'मासिक' कालावधी निवडणे
    if(document.getElementById('newFormFrequency')) {
        document.getElementById('newFormFrequency').value = "Monthly";
    }

    document.getElementById('formIsActive').checked = true;
    document.getElementById('roleAll').checked = true;
    document.getElementById('specificRoles').style.display = "none";
    document.querySelectorAll('.form-role').forEach(cb => cb.checked = false);
    document.getElementById('fieldsList').innerHTML = "";
    document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा";
    
    globalFieldCounter = 1; 
    toggleLayoutOption();
    addField(); 
}

function toggleLayoutOption() {
    const type = document.getElementById('newFormType').value;
    const layoutDiv = document.getElementById('layoutDiv');
    if(type === 'ProgressiveStats') { layoutDiv.style.display = "block"; } 
    else { layoutDiv.style.display = "none"; }
}

function toggleRoles(checkbox) {
    const rolesDiv = document.getElementById('specificRoles');
    if (checkbox.checked) { rolesDiv.style.display = "none"; } 
    else { rolesDiv.style.display = "block"; }
}

function renderFormsListForEdit() {
    const area = document.getElementById('formsEditList');
    if(!area) return;
    area.innerHTML = "";
    if(!masterData || !masterData.forms) return;
    masterData.forms.forEach(f => {
        let btn = document.createElement('button');
        btn.innerText = `✏️ ${f.FormName} ${isFormInactive(f) ? '(Inactive)' : ''}`;
        btn.className = "btn-edit-tab";
        btn.style.margin = "5px";
        btn.onclick = () => loadFormForEdit(f);
        area.appendChild(btn);
    });
}

function loadFormForEdit(f) {
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "फॉर्म एडिट करा: " + f.FormName;
    document.getElementById('editFormID').value = f.FormID;
    document.getElementById('newFormName').value = f.FormName;
    
    let typeStr = String(f.FormType).trim();
    if(typeStr.includes('Vertical')) { document.getElementById('newFormType').value = "ProgressiveStats"; document.getElementById('newFormLayout').value = "Vertical"; } 
    else if(typeStr.includes('ProgressiveStats')) { document.getElementById('newFormType').value = "ProgressiveStats"; document.getElementById('newFormLayout').value = "Horizontal"; } 
    else if(typeStr.includes('List')) { document.getElementById('newFormType').value = "List"; document.getElementById('newFormLayout').value = "Horizontal"; } 
    else { document.getElementById('newFormType').value = "Stats"; document.getElementById('newFormLayout').value = "Horizontal"; }
    
    toggleLayoutOption();

    // 🟢 नवीन: सेव्ह केलेला कालावधी ड्रॉपडाऊनमध्ये दाखवणे
    if(document.getElementById('newFormFrequency')) {
        document.getElementById('newFormFrequency').value = f.Frequency || "Monthly";
    }

    if (f.IsActive !== undefined) { document.getElementById('formIsActive').checked = f.IsActive; } 
    else { document.getElementById('formIsActive').checked = true; }

    let roles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>r.trim().toUpperCase()) : ["ALL"];
    if (roles.includes("ALL")) {
        document.getElementById('roleAll').checked = true;
        document.getElementById('specificRoles').style.display = "none";
        document.querySelectorAll('.form-role').forEach(cb => cb.checked = false);
    } else {
        document.getElementById('roleAll').checked = false;
        document.getElementById('specificRoles').style.display = "block";
        document.querySelectorAll('.form-role').forEach(cb => { cb.checked = roles.includes(cb.value.toUpperCase()); });
    }

    document.getElementById('fieldsList').innerHTML = "";
    document.getElementById('mainActionBtn').innerText = "बदल सेव्ह करा (Update)";

    globalFieldCounter = 1;
    let structure = [];
    try { structure = JSON.parse(f.StructureJSON); } catch(e) {}
    
    function updateMaxFid(fld) {
        if(fld.fid && fld.fid.startsWith('f_')) {
            let num = parseInt(fld.fid.split('_')[1]);
            if(!isNaN(num) && num >= globalFieldCounter) { globalFieldCounter = num + 1; }
        }
        if(fld.subFields) fld.subFields.forEach(updateMaxFid);
    }
    structure.forEach(updateMaxFid);

    if(structure.length === 0) { addField(); } 
    else { structure.forEach(field => addFieldToUI(field)); }
}

function toggleAdv(btn) {
    let div = btn.nextElementSibling;
    if(div.style.display === "none") {
        div.style.display = "flex";
        btn.innerText = "🔽 प्रगत सेटिंग्ज लपवा";
    } else {
        div.style.display = "none";
        btn.innerText = "⚙️ प्रगत सेटिंग्ज (Formula, Default Value...)";
    }
}

// 🟢 मुख्य प्रश्न ॲड करणे
function addFieldToUI(fieldData = null) {
    const list = document.getElementById('fieldsList');
    const fDiv = document.createElement('div');
    fDiv.className = "field-builder";
    fDiv.style.border = "2px solid #17a2b8";
    fDiv.style.padding = "15px";
    fDiv.style.marginBottom = "15px";
    fDiv.style.borderRadius = "8px";
    fDiv.style.background = "#fff";

    let fid = (fieldData && fieldData.fid) ? fieldData.fid : ('f_' + (globalFieldCounter++));
    let isReqChecked = (fieldData && fieldData.isRequired) ? "checked" : "";
    let selType = fieldData ? fieldData.type : 'number';

    fDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #eee; padding-bottom:8px; margin-bottom:12px;">
            <div>
                <label style="font-weight:bold; color:#17a2b8; font-size:16px;">मुख्य प्रश्न</label>
                <span style="background:#00705a; color:white; padding:3px 8px; border-radius:4px; font-size:13px; margin-left:10px; font-weight:bold;">ID: ${fid}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="color:white; background:#dc3545; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">✖ काढा</button>
        </div>
        
        <input type="hidden" class="f-fid" value="${fid}">
        
        <div style="display:flex; flex-direction:column; gap:10px;">
            <input type="text" class="f-label" placeholder="प्रश्नाचे नाव (उदा. एकूण गावे)" value="${fieldData ? fieldData.label : ''}" style="padding:10px; border:1px solid #ccc; border-radius:4px; font-weight:bold;">
            <select class="f-type" style="padding:10px; border:1px solid #ccc; border-radius:4px;" 
                onchange="this.parentElement.parentElement.querySelector('.add-sub-btn').style.display = (this.value === 'group' ? 'block' : 'none'); if(this.value !== 'group') this.parentElement.parentElement.querySelector('.sub-fields').innerHTML='';">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="mobile" ${selType === 'mobile' ? 'selected' : ''}>Mobile (१० अंकी नंबर)</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown (यादी)</option>
                <option value="date" ${selType === 'date' ? 'selected' : ''}>तारीख (Date)</option> <option value="group" ${selType === 'group' ? 'selected' : ''}>Group (सब-प्रश्न गट)</option>
            </select>
            <label style="font-size:14px; color:#d35400; font-weight:bold; margin-top:5px;">
                <input type="checkbox" class="f-req" ${isReqChecked} style="transform: scale(1.2); margin-right:8px;"> हा प्रश्न भरणे सक्तीचे (Required) आहे
            </label>
        </div>

        <button type="button" onclick="toggleAdv(this)" style="margin-top:10px; background:none; border:none; color:#0056b3; font-weight:bold; cursor:pointer; font-size:13px; text-align:left; padding:0;">⚙️ प्रगत सेटिंग्ज (Formula, Default Value...)</button>
        <div class="adv-settings" style="display:none; background:#f8f9fa; padding:10px; border:1px dashed #0056b3; border-radius:4px; margin-top:5px; flex-direction:column; gap:8px;">
            <div><label style="font-size:12px; font-weight:bold;">Default Value:</label> <input type="text" class="f-def" placeholder="उदा. 0" value="${fieldData && fieldData.defaultValue ? fieldData.defaultValue : ''}" style="padding:6px; width:100%; box-sizing:border-box; border:1px solid #ccc;"></div>
            <div><label style="font-size:12px; font-weight:bold;">Formula (+, -, *, /):</label> <input type="text" class="f-form" placeholder="उदा. f_1 + f_2" value="${fieldData && fieldData.formula ? fieldData.formula : ''}" style="padding:6px; width:100%; box-sizing:border-box; border:1px solid #ccc;"></div>
            <div><label style="font-size:12px; font-weight:bold;">Condition (अटी):</label> <input type="text" class="f-cond" placeholder="उदा. f_1>10:'[red]High'" value="${fieldData && fieldData.dependency ? fieldData.dependency : ''}" style="padding:6px; width:100%; box-sizing:border-box; border:1px solid #ccc;"></div>
            <div><label style="font-size:12px; font-weight:bold;">Range (मर्यादा):</label> <input type="text" class="f-range" placeholder="उदा. 0-100 किंवा <=50" value="${fieldData && fieldData.range ? fieldData.range : ''}" style="padding:6px; width:100%; box-sizing:border-box; border:1px solid #ccc;"></div>
        </div>

        <div class="sub-fields" style="margin-left:10px; border-left:3px solid #17a2b8; padding-left:10px; margin-top:15px;"></div>
        <button type="button" class="add-sub-btn" onclick="addSubField(this.parentElement)" style="display:${selType === 'group' ? 'block' : 'none'}; width:100%; background:#e0f7fa; border:1px solid #00acc1; color:#00838f; font-weight:bold; padding:10px; margin-top:12px; border-radius:4px; cursor:pointer;">➕ या गटात सब-प्रश्न जोडा</button>
    `;
    list.appendChild(fDiv);

    if (fieldData && fieldData.type === 'group' && fieldData.subFields) {
        fieldData.subFields.forEach(sf => addSubFieldToUI(fDiv, sf));
    }
}

function addSubFieldToUI(parentDiv, sfData = null) {
    const subList = parentDiv.querySelector('.sub-fields');
    const sDiv = document.createElement('div');
    sDiv.style.marginBottom = "15px";
    sDiv.style.padding = "10px";
    sDiv.style.background = "#f4f7f6";
    sDiv.style.border = "1px solid #ced4da";
    sDiv.style.borderRadius = "5px";

    let fid = (sfData && sfData.fid) ? sfData.fid : ('f_' + (globalFieldCounter++));
    let isReqChecked = (sfData && sfData.isRequired) ? "checked" : "";
    let selType = sfData ? sfData.type : 'number';

    sDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:5px; margin-bottom:10px;">
            <div>
                <label style="font-weight:bold; color:#0056b3; font-size:14px;">सब-प्रश्न</label>
                <span style="background:#0056b3; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:10px; font-weight:bold;">ID: ${fid}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="color:#d32f2f; background:none; border:none; font-weight:bold; cursor:pointer;">✖ काढा</button>
        </div>

        <input type="hidden" class="sf-fid" value="${fid}">

        <div style="display:flex; flex-direction:column; gap:8px;">
            <input type="text" class="sf-label" placeholder="सब-प्रश्नाचे नाव" value="${sfData ? sfData.label : ''}" style="padding:8px; border:1px solid #bbb; border-radius:4px;">
            <select class="sf-type" style="padding:8px; border:1px solid #bbb; border-radius:4px;"
                onchange="this.parentElement.parentElement.querySelector('.add-sub-sub-btn').style.display = (this.value === 'group' ? 'block' : 'none'); if(this.value !== 'group') this.parentElement.parentElement.querySelector('.sub-sub-fields').innerHTML='';">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="mobile" ${selType === 'mobile' ? 'selected' : ''}>Mobile (१० अंकी नंबर)</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown (यादी)</option>
                <option value="date" ${selType === 'date' ? 'selected' : ''}>तारीख (Date)</option> <option value="group" ${selType === 'group' ? 'selected' : ''}>Group (3rd Level)</option>
            </select>
            <label style="font-size:13px; color:#d35400; margin-top:3px;"><input type="checkbox" class="sf-req" ${isReqChecked}> आवश्यक आहे (*)</label>
        </div>

        <button type="button" onclick="toggleAdv(this)" style="margin-top:8px; background:none; border:none; color:#0056b3; font-weight:bold; cursor:pointer; font-size:12px; text-align:left; padding:0;">⚙️ प्रगत सेटिंग्ज</button>
        <div class="adv-settings" style="display:none; background:#e9ecef; padding:8px; border:1px dashed #6c757d; border-radius:4px; margin-top:5px; flex-direction:column; gap:5px;">
            <input type="text" class="sf-def" placeholder="Default Value" value="${sfData && sfData.defaultValue ? sfData.defaultValue : ''}" style="padding:5px; border:1px solid #ccc; font-size:12px;">
            <input type="text" class="sf-form" placeholder="Formula (उदा. f_1 - f_2)" value="${sfData && sfData.formula ? sfData.formula : ''}" style="padding:5px; border:1px solid #ccc; font-size:12px;">
            <input type="text" class="sf-cond" placeholder="Condition" value="${sfData && sfData.dependency ? sfData.dependency : ''}" style="padding:5px; border:1px solid #ccc; font-size:12px;">
            <input type="text" class="sf-range" placeholder="Range" value="${sfData && sfData.range ? sfData.range : ''}" style="padding:5px; border:1px solid #ccc; font-size:12px;">
        </div>

        <div class="sub-sub-fields" style="margin-left:10px; border-left:2px dotted #ff9800; padding-left:10px; margin-top:10px;"></div>
        <button type="button" class="add-sub-sub-btn" onclick="addSubSubField(this.parentElement)" style="display:${selType === 'group' ? 'block' : 'none'}; width:100%; background:#fff3e0; border:1px solid #ffb74d; color:#e65100; font-size:13px; font-weight:bold; padding:8px; margin-top:10px; cursor:pointer; border-radius:4px;">➕ तिसरी लेव्हल जोडा</button>
    `;
    subList.appendChild(sDiv);

    if (sfData && sfData.type === 'group' && sfData.subFields) {
        sfData.subFields.forEach(ssf => addSubSubFieldToUI(sDiv, ssf));
    }
}

function addSubSubFieldToUI(parentDiv, ssfData = null) {
    const subSubList = parentDiv.querySelector('.sub-sub-fields');
    const ssDiv = document.createElement('div');
    ssDiv.style.marginBottom = "10px";
    ssDiv.style.padding = "8px";
    ssDiv.style.background = "#fff";
    ssDiv.style.border = "1px solid #eee";
    ssDiv.style.borderRadius = "4px";
    
    let fid = (ssfData && ssfData.fid) ? ssfData.fid : ('f_' + (globalFieldCounter++));
    let isReqChecked = (ssfData && ssfData.isRequired) ? "checked" : "";
    let selType = ssfData ? ssfData.type : 'number';

    ssDiv.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <input type="text" class="ssf-label" placeholder="तिसरी लेव्हल नाव" value="${ssfData ? ssfData.label : ''}" style="width:100%; padding:6px; border:1px solid #aaa; border-radius:4px; font-size:13px; box-sizing:border-box;">
                    <span style="background:#e65100; color:white; padding:2px 5px; border-radius:3px; font-size:10px; font-weight:bold; display:inline-block; margin-top:4px;">ID: ${fid}</span>
                </div>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="color:#d32f2f; background:none; border:none; font-weight:bold; font-size:16px; margin-left:10px; cursor:pointer;">✖</button>
            </div>
            
            <input type="hidden" class="ssf-fid" value="${fid}">

            <select class="ssf-type" style="padding:6px; border:1px solid #aaa; border-radius:4px; font-size:13px;">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="mobile" ${selType === 'mobile' ? 'selected' : ''}>Mobile (१० अंकी नंबर)</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown (यादी)</option>
                <option value="date" ${selType === 'date' ? 'selected' : ''}>तारीख (Date)</option> </select>
            <label style="font-size:12px; color:#d35400;"><input type="checkbox" class="ssf-req" ${isReqChecked}> सक्तीचे (*)</label>

            <button type="button" onclick="toggleAdv(this)" style="margin-top:2px; background:none; border:none; color:#0056b3; font-weight:bold; cursor:pointer; font-size:11px; text-align:left; padding:0;">⚙️ प्रगत सेटिंग्ज</button>
            <div class="adv-settings" style="display:none; background:#fdfdfe; padding:6px; border:1px dashed #ccc; border-radius:4px; flex-direction:column; gap:4px;">
                <input type="text" class="ssf-def" placeholder="Default Value" value="${ssfData && ssfData.defaultValue ? ssfData.defaultValue : ''}" style="padding:4px; border:1px solid #ccc; font-size:11px;">
                <input type="text" class="ssf-form" placeholder="Formula" value="${ssfData && ssfData.formula ? ssfData.formula : ''}" style="padding:4px; border:1px solid #ccc; font-size:11px;">
                <input type="text" class="ssf-cond" placeholder="Condition" value="${ssfData && ssfData.dependency ? ssfData.dependency : ''}" style="padding:4px; border:1px solid #ccc; font-size:11px;">
                <input type="text" class="ssf-range" placeholder="Range" value="${ssfData && ssfData.range ? ssfData.range : ''}" style="padding:4px; border:1px solid #ccc; font-size:11px;">
            </div>
        </div>
    `;
    subSubList.appendChild(ssDiv);
}

function addField() { addFieldToUI(); }
function addSubField(parentDiv) { addSubFieldToUI(parentDiv); }
function addSubSubField(parentDiv) { addSubSubFieldToUI(parentDiv); }

async function saveFullForm() {
    let fId = document.getElementById('editFormID').value;
    let fName = document.getElementById('newFormName').value;
    let baseType = document.getElementById('newFormType').value;
    let layout = document.getElementById('newFormLayout').value;
    let isActive = document.getElementById('formIsActive').checked;
    
    // 🟢 नवीन: 'अहवाल कालावधी' (Frequency) घेणे
    let frequency = "Monthly";
    if(document.getElementById('newFormFrequency')) {
        frequency = document.getElementById('newFormFrequency').value;
    }
    
    let isAllRoles = document.getElementById('roleAll').checked;
    let allowedRoles = "ALL";
    if (!isAllRoles) {
        let checkedRoles = [];
        document.querySelectorAll('.form-role').forEach(cb => { if(cb.checked) checkedRoles.push(cb.value); });
        if(checkedRoles.length > 0) allowedRoles = checkedRoles.join(',');
    }

    let finalType = baseType;
    if(baseType === 'ProgressiveStats' && layout === 'Vertical') finalType = 'ProgressiveStats_Vertical';

    if(!fName) { alert("फॉर्मचे नाव आवश्यक आहे!"); return; }

    let structure = [];
    document.querySelectorAll('.field-builder').forEach(fDiv => {
        let l = fDiv.querySelector('.f-label').value;
        let t = fDiv.querySelector('.f-type').value;
        let r = fDiv.querySelector('.f-req').checked;
        let fid = fDiv.querySelector('.f-fid').value;
        
        let def = fDiv.querySelector('.f-def').value.trim();
        let form = fDiv.querySelector('.f-form').value.trim();
        let cond = fDiv.querySelector('.f-cond').value.trim();
        let rng = fDiv.querySelector('.f-range').value.trim();

        if(l) {
            let fieldObj = { label: l, type: t, isRequired: r, fid: fid };
            if(def) fieldObj.defaultValue = def;
            if(form) fieldObj.formula = form;
            if(cond) fieldObj.dependency = cond;
            if(rng) fieldObj.range = rng;

            if(t === 'group') {
                fieldObj.subFields = [];
                fDiv.querySelectorAll('.sub-fields > div').forEach(sDiv => {
                    let sl = sDiv.querySelector('.sf-label').value;
                    let st = sDiv.querySelector('.sf-type').value;
                    let sr = sDiv.querySelector('.sf-req').checked;
                    let sf_fid = sDiv.querySelector('.sf-fid').value;
                    
                    let s_def = sDiv.querySelector('.sf-def').value.trim();
                    let s_form = sDiv.querySelector('.sf-form').value.trim();
                    let s_cond = sDiv.querySelector('.sf-cond').value.trim();
                    let s_rng = sDiv.querySelector('.sf-range').value.trim();

                    if(sl) {
                        let subFieldObj = { label: sl, type: st, isRequired: sr, fid: sf_fid };
                        if(s_def) subFieldObj.defaultValue = s_def;
                        if(s_form) subFieldObj.formula = s_form;
                        if(s_cond) subFieldObj.dependency = s_cond;
                        if(s_rng) subFieldObj.range = s_rng;

                        if(st === 'group') {
                            subFieldObj.subFields = [];
                            sDiv.querySelectorAll('.sub-sub-fields > div').forEach(ssDiv => {
                                let ssl = ssDiv.querySelector('.ssf-label').value;
                                let sst = ssDiv.querySelector('.ssf-type').value;
                                let ssr = ssDiv.querySelector('.ssf-req').checked;
                                let ssf_fid = ssDiv.querySelector('.ssf-fid').value;
                                
                                let ss_def = ssDiv.querySelector('.ssf-def').value.trim();
                                let ss_form = ssDiv.querySelector('.ssf-form').value.trim();
                                let ss_cond = ssDiv.querySelector('.ssf-cond').value.trim();
                                let ss_rng = ssDiv.querySelector('.ssf-range').value.trim();

                                if(ssl) {
                                    let subSubFieldObj = { label: ssl, type: sst, isRequired: ssr, fid: ssf_fid };
                                    if(ss_def) subSubFieldObj.defaultValue = ss_def;
                                    if(ss_form) subSubFieldObj.formula = ss_form;
                                    if(ss_cond) subSubFieldObj.dependency = ss_cond;
                                    if(ss_rng) subSubFieldObj.range = ss_rng;

                                    subFieldObj.subFields.push(subSubFieldObj);
                                }
                            });
                        }
                        fieldObj.subFields.push(subFieldObj);
                    }
                });
            }
            structure.push(fieldObj);
        }
    });

    if(structure.length === 0) { alert("कमीत कमी १ प्रश्न आवश्यक आहे!"); return; }

    // 🟢 Payload मध्ये Frequency जोडले
    let formPayload = {
        FormID: fId ? fId : "F_" + Date.now(),
        FormName: fName,
        FormType: finalType,
        AllowedRoles: allowedRoles,
        Frequency: frequency,
        StructureJSON: JSON.stringify(structure),
        IsActive: isActive,
        isActive: isActive, 
        Status: isActive ? "ACTIVE" : "INACTIVE"
    };

    document.getElementById('mainActionBtn').innerText = "सेव्ह करत आहे...";
    document.getElementById('mainActionBtn').disabled = true;

    try {
        const r = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ action: "saveForm", payload: formPayload })
        });
        const textResponse = await r.text();
        if(textResponse.trim().startsWith("<")) throw new Error("Google Blocked Request");
        
        const d = JSON.parse(textResponse);
        if(d.success) {
            alert("✅ फॉर्म यशस्वीरित्या सेव्ह झाला!");
            document.getElementById('formBuilder').classList.add('hidden');
            await fetchData(); 
        } else {
            alert("⚠️ एरर: " + d.message);
        }
    } catch (error) {
        console.error("Form Save Error:", error);
        alert("एरर: इंटरनेट किंवा सर्व्हर कनेक्शनमध्ये अडचण. फॉर्म सेव्ह होऊ शकला नाही.");
    } finally {
        document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा";
        document.getElementById('mainActionBtn').disabled = false;
    }
}
// 🟢 JS/ADMIN.JS - कारणे दाखवा नोटीस (Show Cause Notice) जनरेटर

function generateShowCauseNotices() {
    const selMonth = prompt("कोणत्या महिन्यासाठी नोटीस काढायची आहे? (उदा. एप्रिल)", "एप्रिल");
    const selYear = prompt("वर्ष कोणते? (उदा. 2026)", "2026");

    if(!selMonth || !selYear) return;

    let empPendingList = {};

    masterData.forms.forEach(f => {
        if(isFormInactive(f)) return;
        let allowedRoles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
        let isAllForm = allowedRoles.includes("ALL");

        masterData.users.forEach(u => {
            if(u.role === "Admin" || u.role === "VIEWER" || u.role === "MANAGER") return;

            if (isAllForm || allowedRoles.includes(u.role)) {
                let userVillages = masterData.villages.filter(v => String(v.SubCenterID).trim().toLowerCase() === String(u.subcenter).trim().toLowerCase());
                let pendingVillages = [];

                userVillages.forEach(v => {
                    let isFilled = masterData.filledStats.some(h => 
                        h.formID === f.FormID && String(h.village).trim() === String(v.VillageName).trim() && 
                        String(h.month).trim().startsWith(selMonth) && String(h.year).trim() === selYear
                    );
                    if (!isFilled) { pendingVillages.push(v.VillageName); }
                });

                if(pendingVillages.length > 0) {
                    let mob = String(u.mobile).trim();
                    if(!empPendingList[mob]) {
                        empPendingList[mob] = { name: u.name, sc: u.subcenter, role: u.role, pendingForms: [] };
                    }
                    empPendingList[mob].pendingForms.push(`<b>${f.FormName}</b> (गावे: ${pendingVillages.join(", ")})`);
                }
            }
        });
    });

    let keys = Object.keys(empPendingList);
    if(keys.length === 0) {
        alert("🎉 उत्कृष्ट! सर्व कर्मचाऱ्यांचे अहवाल प्राप्त आहेत. कोणतीही नोटीस काढण्याची आवश्यकता नाही.");
        return;
    }

    let today = new Date();
    let formattedDate = today.getDate() + "/" + (today.getMonth()+1) + "/" + today.getFullYear();
    let printHtml = "";

    keys.forEach((mob, index) => {
        let emp = empPendingList[mob];
        let pbClass = index > 0 ? 'page-break-before: always;' : '';

        printHtml += `<div style="${pbClass} padding: 30px; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #000; font-size: 16px;">`;
        
        printHtml += `<div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">`;
        printHtml += `<h2 style="margin: 0; font-size: 24px; color: #000;">महाराष्ट्र शासन</h2>`;
        printHtml += `<h3 style="margin: 5px 0; font-size: 20px; color: #000;">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</h3>`;
        printHtml += `</div>`;

        printHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-weight: bold;">`;
        printHtml += `<span>जावक क्र.: प्राआकें/भादा/आस्था/नोटीस/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/२०२६</span>`;
        printHtml += `<span>दिनांक: ${formattedDate}</span>`;
        printHtml += `</div>`;

        printHtml += `<div style="margin-bottom: 30px; font-size: 18px;">`;
        printHtml += `<b>प्रति,</b><br>`;
        printHtml += `<b>श्री / श्रीमती ${emp.name}</b><br>`;
        printHtml += `पद: ${emp.role} (उपकेंद्र: ${emp.sc})<br>`;
        printHtml += `प्राथमिक आरोग्य केंद्र भादा.`;
        printHtml += `</div>`;

        printHtml += `<div style="margin-bottom: 25px; padding-left: 40px;">`;
        printHtml += `<b>विषय:</b> <u>मासिक व पंधरवाडी अहवाल विहित वेळेत सादर न केल्याबाबत - <b>कारणे दाखवा नोटीस.</b></u><br><br>`;
        printHtml += `<b>संदर्भ:</b> १. या कार्यालयाचे वेळोवेळचे लेखी व तोंडी आदेश.<br>`;
        printHtml += `</div>`;

        printHtml += `<p style="text-indent: 40px; text-align: justify; margin-bottom: 15px;">`;
        printHtml += `उपरोक्त संदर्भीय विषयास अनुसरून आपणास या नोटीसीद्वारे कळविण्यात येते की, आपण आपल्या उपकेंद्राच्या कार्यक्षेत्रातील <b>${selMonth} ${selYear}</b> या महिन्याचे खालील नमूद केलेले अत्यंत महत्त्वाचे शासकीय अहवाल आजतागायत ऑनलाईन प्रणालीमध्ये सादर केलेले नाहीत.`;
        printHtml += `</p>`;

        printHtml += `<ul style="margin-left: 20px; margin-bottom: 20px; padding: 15px; background: #fdfdfd; border: 1px solid #ccc; border-radius: 5px;">`;
        emp.pendingForms.forEach(pf => { printHtml += `<li style="margin-bottom: 8px;">${pf}</li>`; });
        printHtml += `</ul>`;

        printHtml += `<p style="text-indent: 40px; text-align: justify; margin-bottom: 15px;">`;
        printHtml += `शासकीय व सार्वजनिक आरोग्याच्या कामात हलगर्जीपणा करणे, वरिष्ठांच्या आदेशाचे वारंवार उल्लंघन करणे ही बाब <b>महाराष्ट्र नागरी सेवा (वर्तणूक) नियम १९७९</b> मधील तरतुदींचा भंग करणारी आहे. सदर अहवाल अप्राप्त असल्यामुळे तालुकास्तरावर माहिती पाठविण्यास विलंब होत आहे व त्यामुळे कार्यालयाच्या कामकाजात अडथळा निर्माण होत आहे.`;
        printHtml += `</p>`;

        printHtml += `<p style="text-indent: 40px; text-align: justify; margin-bottom: 50px;">`;
        printHtml += `तरी, सदर अहवाल प्रलंबित ठेवल्याबाबतचा आपला लेखी खुलासा ही नोटीस प्राप्त झाल्यापासून <b>४८ तासांच्या आत</b> या कार्यालयास सादर करावा व प्रलंबित अहवाल तत्काळ ऑनलाईन भरावेत. विहित मुदतीत समाधानकारक खुलासा न आल्यास, आपल्यावर शिस्तभंगाची व प्रशासकीय कारवाई का करण्यात येऊ नये? याचा प्रस्ताव वरिष्ठांकडे (तालुका आरोग्य अधिकारी, औसा) पाठविण्यात येईल, याची गांभीर्याने नोंद घ्यावी.`;
        printHtml += `</p>`;

        printHtml += `<div style="text-align: right; margin-top: 50px; font-size: 18px; font-weight: bold;">`;
        printHtml += `वैद्यकीय अधिकारी<br>`;
        printHtml += `प्राथमिक आरोग्य केंद्र भादा<br>`;
        printHtml += `ता. औसा, जि. लातूर`;
        printHtml += `</div>`;

        printHtml += `</div>`;
    });

    let oldFrame = document.getElementById('pdfNoticeFrame'); 
    if (oldFrame) { oldFrame.remove(); }
    
    const iframe = document.createElement('iframe'); 
    iframe.id = 'pdfNoticeFrame'; 
    iframe.style.position = 'fixed'; 
    iframe.style.right = '0'; 
    iframe.style.bottom = '0'; 
    iframe.style.width = '0px'; 
    iframe.style.height = '0px'; 
    iframe.style.border = 'none';
    document.body.appendChild(iframe); 
    
    let doc = iframe.contentWindow.document; 
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>कारणे_दाखवा_नोटीस_${selMonth}</title>
            <style>
                @page { size: A4 portrait; margin: 15mm; }
                body { margin: 0; padding: 0; }
            </style>
        </head>
        <body>${printHtml}</body>
        </html>
    `);
    doc.close(); 
    
    setTimeout(() => { 
        iframe.contentWindow.focus(); 
        iframe.contentWindow.print(); 
    }, 1000);
}

