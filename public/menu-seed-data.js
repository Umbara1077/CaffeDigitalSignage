// Initial seed data written to Firestore `menus/{id}` by the
// "Seed Menu Data" button in admin.html. Editing this file after the
// first seed has no effect on already-seeded data — use the Menu Editor
// in admin.html to make further changes.

const MENU_SEED_DATA = {
    gelato: {
        title: "GELATO MENU",
        tagline: '"100% NATURAL INGREDIENTS"',
        bannerText: "MOBILE ORDERING",
        bannerUrl: "dolcevitasewell.com",
        sections: [
            {
                id: "cupSizes",
                title: "Cup Sizes",
                type: "list",
                note: "(Panna $2.00)",
                items: [
                    { name: "Bambino", cash: 4.85, card: 5.00 },
                    { name: "Piccola", cash: 6.35, card: 6.60 },
                    { name: "Medio", cash: 8.50, card: 8.80 },
                    { name: "Larga", cash: 9.50, card: 9.80 },
                    { name: "Grande", cash: 13.75, card: 14.20 },
                    { name: "Molto Grande", cash: 16.95, card: 17.50 },
                    { name: "Gigante", cash: 31.75, card: 32.90 },
                    { name: "Pup Cup", cash: 3.15, card: 3.30 }
                ]
            },
            {
                id: "cones",
                title: "Cones",
                type: "list",
                items: [
                    { name: "Vaniglia", cash: 9.95, card: 10.30 },
                    { name: "Cioccolato", cash: 9.95, card: 10.30 },
                    { name: "Bacio Cocco", cash: 10.95, card: 11.33 },
                    { name: "Bacio Fantasia", cash: 9.95, card: 10.30 },
                    { name: "Pistacchio", cash: 12.95, card: 13.40 }
                ]
            }
        ],
        featured: {
            label: "Tiramisu Gelato",
            imageUrl: ""
        }
    },

    caffe_caldo: {
        title: "CAFFE CALDO",
        subtitle: "HOT COFFEE",
        quote: "Coffee beans imported from Naples Italy",
        bannerText: "MOBILE ORDERING",
        bannerUrl: "dolcevitasewell.com",
        sections: [
            {
                id: "tradizionale",
                title: "Tradizionale",
                type: "list",
                items: [
                    { name: "Espresso", cash: 3.00, card: 3.10 },
                    { name: "Macchiato", cash: 3.50, card: 3.60 },
                    { name: "Doppio", cash: 4.25, card: 4.40 },
                    { name: "Americano", cash: 5.35, card: 5.50 },
                    { name: "Caffe Latte", cash: 6.25, card: 6.50 },
                    { name: "Hot Tea", cash: 3.00, card: 3.10 },
                    { name: "Cappuccino", cash: 5.00, card: 5.20 }
                ]
            },
            {
                id: "conDolcezza",
                title: "Caffe Con Dolcezza",
                type: "list",
                items: [
                    { name: "Nocciolino", cash: 8.50, card: 8.80 },
                    { name: "Pistacchietto", cash: 8.50, card: 8.80 },
                    { name: "Nuttella", cash: 8.50, card: 8.80 },
                    { name: "Tartufo", cash: 8.50, card: 8.80 }
                ]
            },
            {
                id: "gustiCappuccinoLatte",
                title: "Gusti di Cappuccini - Latte",
                type: "matrix",
                drinkTypes: [
                    { name: "Cappuccino", cash: 6.00, card: 6.20 },
                    { name: "Latte", cash: 7.25, card: 7.50 }
                ],
                flavors: ["Venezia", "Cioccolato", "Caramello", "Cannella", "Portofino", "Sorrento"]
            },
            {
                id: "conGelato",
                title: "Caffe Con Gelato",
                type: "list",
                items: [
                    { name: "Affogato", cash: 8.75, card: 9.10 },
                    { name: "Gelato Latte", cash: 12.75, card: 13.20 }
                ]
            }
        ]
    },

    caffe_freddo: {
        title: "CAFFE FREDDO",
        subtitle: "COLD COFFEE",
        quote: "Coffee beans imported from Naples Italy",
        bannerText: "MOBILE ORDERING",
        bannerUrl: "dolcevitasewell.com",
        sections: [
            {
                id: "tradizionale",
                title: "Tradizionale",
                type: "list",
                items: [
                    { name: "Iced Americano", cash: 5.75, card: 6.00 },
                    { name: "Iced Latte", cash: 6.75, card: 7.00 },
                    { name: "Shakerato", cash: 7.25, card: 7.50 }
                ]
            },
            {
                id: "gustiFreddoLatte",
                title: "Gusti di Freddo Latte",
                type: "list",
                items: [
                    { name: "Venezia", cash: 7.75, card: 8.00 },
                    { name: "Cioccolato", cash: 7.75, card: 8.00 },
                    { name: "Caramello", cash: 7.75, card: 8.00 },
                    { name: "Cannella", cash: 7.75, card: 8.00 },
                    { name: "Portofino", cash: 7.75, card: 8.00 },
                    { name: "Sorrento", cash: 7.75, card: 8.00 }
                ]
            },
            {
                id: "caffeDolce",
                title: "Caffe Dolce",
                type: "list",
                items: [
                    { name: "Tiramisu", cash: 9.95, card: 10.30 },
                    { name: "Panna Cotta", cash: 6.95, card: 7.20 },
                    { name: "Creme Brulee", cash: 8.95, card: 9.30 }
                ]
            }
        ],
        featured: {
            label: "Caffe Freddo",
            imageUrl: ""
        }
    }
};

const MENU_LABELS = {
    gelato: "Gelato Menu",
    caffe_caldo: "Caffe Caldo (Hot Coffee)",
    caffe_freddo: "Caffe Freddo (Cold Coffee)"
};
