// Menu Editor logic for admin.html.
// Reads/writes Firestore `menus/{id}` documents and seeds initial data
// from MENU_SEED_DATA (menu-seed-data.js).

document.addEventListener('DOMContentLoaded', () => {
    const menuDb = firebase.firestore();

    const menuSelect = document.getElementById('menuEditorSelect');
    const formContainer = document.getElementById('menuEditorForm');
    const saveButton = document.getElementById('menuEditorSaveButton');
    const reloadButton = document.getElementById('menuEditorReloadButton');
    const seedButton = document.getElementById('menuSeedButton');
    const statusEl = document.getElementById('menuEditorStatus');

    if (!menuSelect) return; // Menu Editor section not present on this page

    let currentDoc = null;

    Object.keys(MENU_LABELS).forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = MENU_LABELS[id];
        menuSelect.appendChild(opt);
    });

    function setStatus(msg, isError) {
        statusEl.textContent = msg;
        statusEl.style.color = isError ? '#b00020' : '#2e7d32';
        statusEl.style.fontWeight = isError ? 'bold' : 'normal';
    }

    // Firestore writes require an authenticated user (security rules reject
    // anonymous writes). Surface that immediately instead of letting saves
    // fail silently with a permission-denied error the admin never sees.
    function isSignedIn() {
        return !!(typeof myAuth !== 'undefined' && myAuth.currentUser);
    }

    // On mobile, Firebase Auth can take a while to resolve (slower network,
    // cold IndexedDB persistence lookup). Loading the editor before auth
    // resolves risks a Firestore read hanging/rejecting with no visible
    // feedback, leaving the admin staring at "Loading..." forever. So the
    // very first load is gated on the initial onAuthStateChanged callback
    // instead of firing unconditionally on DOMContentLoaded.
    let initialLoadDone = false;
    let loadWatchdog = null;

    function startLoadWatchdog() {
        clearTimeout(loadWatchdog);
        loadWatchdog = setTimeout(() => {
            if (!formContainer.querySelector('[data-path]')) {
                formContainer.innerHTML = '<p>Still not loading. Something is stuck.</p>';
                setStatus('⚠️ Timed out loading the menu editor.', true);
                const retryBtn = document.createElement('button');
                retryBtn.type = 'button';
                retryBtn.textContent = 'Reload';
                retryBtn.addEventListener('click', () => window.location.reload());
                formContainer.appendChild(retryBtn);
            }
        }, 8000);
    }

    if (typeof myAuth !== 'undefined') {
        myAuth.onAuthStateChanged(user => {
            if (!user) {
                setStatus('⚠️ Not signed in — log in again to load or save menus.', true);
                clearTimeout(loadWatchdog);
                if (!initialLoadDone) {
                    formContainer.innerHTML = '<p>Please log in to edit menus.</p>';
                }
                return;
            }
            if (!initialLoadDone) {
                initialLoadDone = true;
                menuSelect.value = 'gelato';
                loadMenu('gelato');
            }
        });
    } else {
        // No auth wired up at all (shouldn't happen in production) — fall
        // back to loading immediately rather than hanging forever.
        initialLoadDone = true;
        menuSelect.value = 'gelato';
        loadMenu('gelato');
    }

    async function loadMenu(id) {
        formContainer.innerHTML = '<p>Loading...</p>';
        startLoadWatchdog();
        let doc;
        try {
            const snap = await menuDb.collection('menus').doc(id).get();
            doc = snap.exists ? snap.data() : null;
            if (!snap.exists) {
                setStatus(`No document found for "${id}" yet — showing seed defaults. Save or use "Seed Menu Data" to write them.`, false);
            } else {
                setStatus('');
            }
        } catch (err) {
            console.error('Error loading menu:', err);
            setStatus(`⚠️ Could not load "${id}" from Firestore (${err && err.message ? err.message : err}) — showing seed defaults.`, true);
            doc = null;
        }
        currentDoc = doc || structuredCloneFallback(MENU_SEED_DATA[id]);
        renderForm();
        clearTimeout(loadWatchdog);
    }

    function structuredCloneFallback(obj) {
        return obj ? JSON.parse(JSON.stringify(obj)) : { title: '', sections: [] };
    }

    function fieldRow(label, path, value, type = 'text') {
        return `
            <label class="menu-field">
                <span>${label}</span>
                <input type="${type}" data-path="${path}" value="${escapeAttr(value ?? '')}">
            </label>
        `;
    }

    function escapeAttr(str) {
        return String(str).replace(/"/g, '&quot;');
    }

    function renderForm() {
        if (!currentDoc) return;
        const d = currentDoc;
        let html = '<div class="menu-editor-topfields">';
        ['title', 'subtitle', 'tagline', 'quote', 'bannerText', 'bannerUrl'].forEach(key => {
            if (key in d || key === 'title' || key === 'bannerText' || key === 'bannerUrl') {
                html += fieldRow(key, key, d[key]);
            }
        });
        html += '</div>';

        if (d.featured) {
            html += `
                <fieldset class="menu-editor-section">
                    <legend>Featured item</legend>
                    ${fieldRow('Label', 'featured.label', d.featured.label)}
                    ${fieldRow('Image URL', 'featured.imageUrl', d.featured.imageUrl)}
                </fieldset>
            `;
        }

        (d.sections || []).forEach((section, sIdx) => {
            html += `<fieldset class="menu-editor-section" data-section-idx="${sIdx}">`;
            html += `<legend>${fieldRow('Section title', `sections.${sIdx}.title`, section.title)}</legend>`;
            html += fieldRow('Note (optional)', `sections.${sIdx}.note`, section.note);

            if (section.type === 'matrix') {
                html += '<div class="menu-editor-subtable"><strong>Drink types</strong>';
                (section.drinkTypes || []).forEach((dt, tIdx) => {
                    html += `
                        <div class="menu-editor-item-row" data-remove="sections.${sIdx}.drinkTypes.${tIdx}">
                            ${fieldRow('Name', `sections.${sIdx}.drinkTypes.${tIdx}.name`, dt.name)}
                            ${fieldRow('Cash', `sections.${sIdx}.drinkTypes.${tIdx}.cash`, dt.cash, 'number')}
                            ${fieldRow('Card', `sections.${sIdx}.drinkTypes.${tIdx}.card`, dt.card, 'number')}
                            <button type="button" class="menu-remove-btn" data-remove-target="sections.${sIdx}.drinkTypes.${tIdx}">Remove</button>
                        </div>
                    `;
                });
                html += `<button type="button" class="menu-add-btn" data-add-drinktype="${sIdx}">+ Add Drink Type</button></div>`;

                html += '<div class="menu-editor-subtable"><strong>Flavors</strong>';
                (section.flavors || []).forEach((flavor, fIdx) => {
                    html += `
                        <div class="menu-editor-item-row" data-remove="sections.${sIdx}.flavors.${fIdx}">
                            ${fieldRow('Flavor', `sections.${sIdx}.flavors.${fIdx}`, flavor)}
                            <button type="button" class="menu-remove-btn" data-remove-target="sections.${sIdx}.flavors.${fIdx}">Remove</button>
                        </div>
                    `;
                });
                html += `<button type="button" class="menu-add-btn" data-add-flavor="${sIdx}">+ Add Flavor</button></div>`;
            } else {
                html += '<div class="menu-editor-subtable"><strong>Items</strong>';
                (section.items || []).forEach((item, iIdx) => {
                    html += `
                        <div class="menu-editor-item-row" data-remove="sections.${sIdx}.items.${iIdx}">
                            ${fieldRow('Name', `sections.${sIdx}.items.${iIdx}.name`, item.name)}
                            ${fieldRow('Cash', `sections.${sIdx}.items.${iIdx}.cash`, item.cash, 'number')}
                            ${fieldRow('Card', `sections.${sIdx}.items.${iIdx}.card`, item.card, 'number')}
                            <button type="button" class="menu-remove-btn" data-remove-target="sections.${sIdx}.items.${iIdx}">Remove</button>
                        </div>
                    `;
                });
                html += `<button type="button" class="menu-add-btn" data-add-item="${sIdx}">+ Add Item</button></div>`;
            }

            html += `<button type="button" class="menu-remove-btn menu-remove-section" data-remove-section="${sIdx}">Remove Section</button>`;
            html += '</fieldset>';
        });

        html += '<button type="button" class="menu-add-btn" id="menuAddSectionButton">+ Add Section</button>';

        formContainer.innerHTML = html;
        wireFormEvents();
    }

    // --- path helpers: get/set/delete on currentDoc using dot-notation paths like sections.0.items.2.cash
    function getAtPath(obj, path) {
        const parts = path.split('.');
        let node = obj;
        for (const p of parts) node = node?.[isFinite(p) ? Number(p) : p];
        return node;
    }
    function setAtPath(obj, path, value) {
        const parts = path.split('.');
        let node = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = isFinite(parts[i]) ? Number(parts[i]) : parts[i];
            // Auto-vivify missing intermediate containers instead of throwing,
            // so a stale/mismatched form path can't silently abort the whole save.
            if (node[key] == null) {
                const nextKeyIsIndex = isFinite(parts[i + 1]);
                node[key] = nextKeyIsIndex ? [] : {};
            }
            node = node[key];
        }
        const lastKey = isFinite(parts[parts.length - 1]) ? Number(parts[parts.length - 1]) : parts[parts.length - 1];
        node[lastKey] = value;
    }
    function removeAtPath(obj, path) {
        const parts = path.split('.');
        let node = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = isFinite(parts[i]) ? Number(parts[i]) : parts[i];
            node = node[key];
        }
        const lastKey = isFinite(parts[parts.length - 1]) ? Number(parts[parts.length - 1]) : parts[parts.length - 1];
        if (Array.isArray(node)) node.splice(lastKey, 1);
        else delete node[lastKey];
    }

    function syncFormIntoDoc() {
        formContainer.querySelectorAll('[data-path]').forEach(input => {
            const path = input.dataset.path;
            const raw = input.value;
            const value = input.type === 'number' ? Number(raw) : raw;
            setAtPath(currentDoc, path, value);
        });
    }

    function wireFormEvents() {
        formContainer.querySelectorAll('[data-remove-target]').forEach(btn => {
            btn.addEventListener('click', () => {
                syncFormIntoDoc();
                removeAtPath(currentDoc, btn.dataset.removeTarget);
                renderForm();
            });
        });

        formContainer.querySelectorAll('[data-remove-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                syncFormIntoDoc();
                currentDoc.sections.splice(Number(btn.dataset.removeSection), 1);
                renderForm();
            });
        });

        formContainer.querySelectorAll('[data-add-item]').forEach(btn => {
            btn.addEventListener('click', () => {
                syncFormIntoDoc();
                const sIdx = Number(btn.dataset.addItem);
                (currentDoc.sections[sIdx].items ||= []).push({ name: 'New Item', cash: 0, card: 0 });
                renderForm();
            });
        });

        formContainer.querySelectorAll('[data-add-drinktype]').forEach(btn => {
            btn.addEventListener('click', () => {
                syncFormIntoDoc();
                const sIdx = Number(btn.dataset.addDrinktype);
                (currentDoc.sections[sIdx].drinkTypes ||= []).push({ name: 'New Type', cash: 0, card: 0 });
                renderForm();
            });
        });

        formContainer.querySelectorAll('[data-add-flavor]').forEach(btn => {
            btn.addEventListener('click', () => {
                syncFormIntoDoc();
                const sIdx = Number(btn.dataset.addFlavor);
                (currentDoc.sections[sIdx].flavors ||= []).push('New Flavor');
                renderForm();
            });
        });

        const addSectionBtn = document.getElementById('menuAddSectionButton');
        if (addSectionBtn) {
            addSectionBtn.addEventListener('click', () => {
                syncFormIntoDoc();
                (currentDoc.sections ||= []).push({
                    id: 'section' + Date.now(),
                    title: 'New Section',
                    type: 'list',
                    items: []
                });
                renderForm();
            });
        }
    }

    menuSelect.addEventListener('change', () => {
        if (menuSelect.value) loadMenu(menuSelect.value);
    });

    reloadButton.addEventListener('click', () => {
        if (menuSelect.value) loadMenu(menuSelect.value);
    });

    saveButton.addEventListener('click', async () => {
        if (!menuSelect.value) {
            setStatus('Select a menu first.', true);
            return;
        }
        if (!currentDoc) {
            setStatus('Nothing loaded to save yet — click Reload.', true);
            return;
        }
        if (!isSignedIn()) {
            setStatus('⚠️ Not signed in — log in again before saving (Firestore will reject the write).', true);
            return;
        }

        saveButton.disabled = true;
        setStatus('Saving…', false);

        try {
            // Pull the latest form values into currentDoc, then write it.
            // Both steps are inside this try/catch so any failure — a bad
            // input path, a Firestore permission error, a network error —
            // is caught and shown to the admin instead of failing silently.
            syncFormIntoDoc();

            // .set() (not .update()) so this works whether menus/{id}
            // already exists or is being created for the first time.
            await menuDb.collection('menus').doc(menuSelect.value).set(currentDoc);
            setStatus('✅ Saved — the live menu page will update automatically.', false);
        } catch (err) {
            console.error('Error saving menu:', err);
            const code = err && err.code ? ` (${err.code})` : '';
            setStatus(`❌ Save failed${code}: ${err && err.message ? err.message : err}`, true);
        } finally {
            saveButton.disabled = false;
        }
    });

    seedButton.addEventListener('click', async () => {
        const confirmed = confirm(
            'This will overwrite Gelato, Caffe Caldo, and Caffe Freddo menu documents in Firestore with the built-in defaults. Continue?'
        );
        if (!confirmed) return;
        try {
            const batch = menuDb.batch();
            Object.keys(MENU_SEED_DATA).forEach(id => {
                batch.set(menuDb.collection('menus').doc(id), MENU_SEED_DATA[id]);
            });
            await batch.commit();
            setStatus('Seed data written for all 3 menus.', false);
            if (menuSelect.value) loadMenu(menuSelect.value);
        } catch (err) {
            console.error('Error seeding menu data:', err);
            setStatus('Error seeding: ' + err.message, true);
        }
    });
});
