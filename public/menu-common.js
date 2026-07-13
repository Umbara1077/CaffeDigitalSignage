// Shared Firestore + rendering helpers for the TV signage menu pages.
// Requires firebaseConfig.js (defines `db`) to be loaded first.

function formatPrice(n) {
    const num = Number(n);
    return '$' + (isNaN(num) ? '0.00' : num.toFixed(2));
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function renderListSection(section) {
    if (!section) return '';
    const rows = (section.items || []).map(item => `
        <tr>
            <td class="name">${escapeHtml(item.name)}</td>
            <td class="price">${formatPrice(item.cash)}</td>
            <td class="price">${formatPrice(item.card)}</td>
        </tr>
    `).join('');

    return `
        <h2 class="menu-section-title">${escapeHtml(section.title)}</h2>
        <table class="price-table">
            <thead><tr><th></th><th>Cash</th><th>Card</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        ${section.note ? `<div class="menu-note">${escapeHtml(section.note)}</div>` : ''}
    `;
}

function renderMatrixSection(section) {
    if (!section) return '';
    const types = section.drinkTypes || [];
    const flavors = section.flavors || [];
    const headerCells = types.map(t => `<th colspan="2">${escapeHtml(t.name)}</th>`).join('');
    const subHeaderCells = types.map(() => `<th>Cash</th><th>Card</th>`).join('');
    const rows = flavors.map(flavor => {
        const cells = types.map(t => `<td class="price">${formatPrice(t.cash)}</td><td class="price">${formatPrice(t.card)}</td>`).join('');
        return `<tr><td class="name">${escapeHtml(flavor)}</td>${cells}</tr>`;
    }).join('');

    return `
        <h2 class="menu-section-title">${escapeHtml(section.title)}</h2>
        <table class="price-table matrix-table">
            <thead>
                <tr><th></th>${headerCells}</tr>
                <tr><th></th>${subHeaderCells}</tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        ${section.note ? `<div class="menu-note">${escapeHtml(section.note)}</div>` : ''}
    `;
}

function renderSection(section) {
    if (!section) return '';
    return section.type === 'matrix' ? renderMatrixSection(section) : renderListSection(section);
}

function sectionById(doc, id) {
    return (doc.sections || []).find(s => s.id === id);
}

// Renders a dashed-border placeholder box, or a real <img> once imageUrl is set in Firestore.
function renderPhotoPlaceholder(imageUrl, altText, placeholderText) {
    if (imageUrl) {
        return `<div class="menu-photo-placeholder has-image"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(altText || '')}"></div>`;
    }
    return `<div class="menu-photo-placeholder">${escapeHtml(placeholderText || 'Photo')}</div>`;
}

// Subscribes to menus/{docId} and invokes onData(data) on every update.
// Calls onMissing() if the document does not exist yet (not seeded).
function listenMenu(docId, onData, onMissing) {
    return db.collection('menus').doc(docId).onSnapshot(snap => {
        if (!snap.exists) {
            console.warn(`No menu document found for "${docId}" — seed it from the admin panel.`);
            if (onMissing) onMissing();
            return;
        }
        onData(snap.data());
    }, err => {
        console.error(`Error listening to menu "${docId}":`, err);
    });
}
