// Excel export for the Client Registry.
// One row per company; stakeholders and formats fan out into numbered column sets.

const toDate = (val) => {
    if (!val) return null;
    const d = new Date(val.seconds ? val.seconds * 1000 : val);
    return isNaN(d.getTime()) ? null : d;
};

const buildRows = (clients, contacts) => clients.map(client => {
    const own = contacts.filter(c => c.companyId === client.id);
    // Primary contact first, then alphabetical
    own.sort((a, b) => {
        if (a.id === client.primaryContactId) return -1;
        if (b.id === client.primaryContactId) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    return {
        companyName: client.companyName || '',
        stakeholders: own.map(c => ({
            name: c.name || '',
            position: c.role || '',
            email: c.email || '',
            phone: c.phone || ''
        })),
        country: client.country || '',
        website: client.website || '',
        formats: client.categories || [],
        leadSource: client.leadSource || '',
        leadDate: toDate(client.leadDate) || toDate(client.createdAt),
        status: client.status || ''
    };
});

export const exportClientsToExcel = async (clients, contacts) => {
    const mod = await import('exceljs');
    const ExcelJS = mod.default || mod;

    const rows = buildRows(clients, contacts);
    const formatCount = Math.max(2, ...rows.map(r => r.formats.length));
    const stakeholderCount = Math.max(1, ...rows.map(r => r.stakeholders.length));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Biowearth Dashboard';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Clients', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });

    sheet.columns = [
        { header: 'Company Name', key: 'companyName', width: 28 },
        ...Array.from({ length: stakeholderCount }, (_, i) => ([
            { header: `Name ${i + 1}`, key: `name${i + 1}`, width: 22 },
            { header: `Position ${i + 1}`, key: `position${i + 1}`, width: 20 },
            { header: `Email ${i + 1}`, key: `email${i + 1}`, width: 28 },
            { header: `Phone ${i + 1}`, key: `phone${i + 1}`, width: 18 }
        ])).flat(),
        { header: 'Country', key: 'country', width: 16 },
        { header: 'Website', key: 'website', width: 28 },
        ...Array.from({ length: formatCount }, (_, i) => ({
            header: `Format ${i + 1}`, key: `format${i + 1}`, width: 16
        })),
        { header: 'Lead Source', key: 'leadSource', width: 18 },
        { header: 'Lead Date', key: 'leadDate', width: 14 },
        { header: 'Status', key: 'status', width: 18 }
    ];

    rows.forEach(r => {
        const cells = {};
        for (let i = 0; i < formatCount; i++) cells[`format${i + 1}`] = r.formats[i] || '';
        for (let i = 0; i < stakeholderCount; i++) {
            const s = r.stakeholders[i] || {};
            cells[`name${i + 1}`] = s.name || '';
            cells[`position${i + 1}`] = s.position || '';
            cells[`email${i + 1}`] = s.email || '';
            cells[`phone${i + 1}`] = s.phone || '';
        }
        sheet.addRow({ ...r, ...cells });
    });

    // Applied per cell — a column-level style is not reliably carried into written cells
    const dateCol = sheet.getColumn('leadDate');
    for (let r = 2; r <= sheet.rowCount; r++) {
        sheet.getCell(r, dateCol.number).numFmt = 'dd-mmm-yyyy';
    }

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    header.alignment = { vertical: 'middle' };
    header.height = 20;

    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Client-Registry-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return rows.length;
};
