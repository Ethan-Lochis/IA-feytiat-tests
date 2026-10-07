import { tool } from 'ai';
import { z } from 'zod';

/**
 * 1. Outil Météo (Simulation d'une API externe météo)
 */
export const weatherTool = tool({
  description: 'Récupère la météo en direct pour une ville donnée.',
  inputSchema: z.object({
    city: z.string().describe('Le nom de la ville (ex: Limoges, Paris, Feytiat, Tokyo)'),
    unit: z
      .enum(['celsius', 'fahrenheit'])
      .default('celsius')
      .describe("L'unité de température désirée"),
  }),
  execute: async ({ city, unit }) => {
    // Simulation de données météorologiques réalistes
    const fakeData: Record<string, { tempC: number; condition: string; humidity: number }> = {
      feytiat: { tempC: 17, condition: 'Nuageux avec éclaircies', humidity: 68 },
      limoges: { tempC: 18, condition: 'Partiellement ensoleillé', humidity: 65 },
      paris: { tempC: 15, condition: 'Pluvieux', humidity: 82 },
      tokyo: { tempC: 22, condition: 'Beau temps ensoleillé', humidity: 55 },
    };

    const key = city.toLowerCase().trim();
    const data = fakeData[key] || {
      tempC: Math.floor(12 + Math.random() * 15),
      condition: 'Variable',
      humidity: Math.floor(50 + Math.random() * 30),
    };

    const temperature =
      unit === 'fahrenheit' ? Math.round((data.tempC * 9) / 5 + 32) : data.tempC;

    return {
      ville: city,
      temperature: `${temperature}°${unit === 'fahrenheit' ? 'F' : 'C'}`,
      meteo: data.condition,
      humidite: `${data.humidity}%`,
    };
  },
});

/**
 * 2. Outil Convertisseur de devises (Calcul fiable & taux de change)
 */
export const currencyConverterTool = tool({
  description: 'Convertit une somme d’argent d’une devise à une autre (EUR, USD, GBP, JPY, CAD, CHF).',
  inputSchema: z.object({
    amount: z.number().positive().describe('Le montant à convertir'),
    from: z
      .enum(['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'CHF'])
      .describe('Code devise de départ (ex: EUR)'),
    to: z
      .enum(['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'CHF'])
      .describe('Code devise de destination (ex: USD)'),
  }),
  execute: async ({ amount, from, to }) => {
    const ratesAgainstEur: Record<string, number> = {
      EUR: 1.0,
      USD: 1.08,
      GBP: 0.85,
      JPY: 164.5,
      CAD: 1.48,
      CHF: 0.96,
    };

    const amountInEur = amount / ratesAgainstEur[from];
    const convertedAmount = Math.round(amountInEur * ratesAgainstEur[to] * 100) / 100;
    const directRate = Math.round((ratesAgainstEur[to] / ratesAgainstEur[from]) * 10000) / 10000;

    return {
      montantInitial: amount,
      deviseOrigine: from,
      montantConverti: convertedAmount,
      deviseCible: to,
      tauxDeChange: directRate,
    };
  },
});

/**
 * 3. Outil Recherche Produits & Stocks (Simulation d'une base de données e-commerce / API Symfony)
 */
export const searchProductsTool = tool({
  description: 'Recherche des articles dans le catalogue magasin et consulte leur stock en temps réel.',
  inputSchema: z.object({
    query: z.string().describe('Nom du produit ou catégorie (ex: clavier, souris, écran, casque)'),
    maxPrice: z.number().optional().describe('Budget maximal en euros'),
  }),
  execute: async ({ query, maxPrice }) => {
    const catalog = [
      { id: 'PROD-01', nom: 'Clavier mécanique sans fil', prix: 89.99, stock: 14, rayon: 'Informatique' },
      { id: 'PROD-02', nom: 'Souris ergonomique RGB', prix: 45.0, stock: 8, rayon: 'Informatique' },
      { id: 'PROD-03', nom: 'Écran 27 pouces 144Hz', prix: 249.9, stock: 3, rayon: 'Écrans' },
      { id: 'PROD-04', nom: 'Casque audio réducteur de bruit', prix: 129.0, stock: 0, rayon: 'Audio' },
      { id: 'PROD-05', nom: 'Tapis de souris XXL', prix: 19.99, stock: 32, rayon: 'Accessoires' },
    ];

    const results = catalog.filter((item) => {
      const matchQuery =
        item.nom.toLowerCase().includes(query.toLowerCase()) ||
        item.rayon.toLowerCase().includes(query.toLowerCase());
      const matchPrice = maxPrice !== undefined ? item.prix <= maxPrice : true;
      return matchQuery && matchPrice;
    });

    return {
      recherche: query,
      resultats: results.map((item) => ({
        ...item,
        disponibilite: item.stock > 0 ? `En stock (${item.stock} dispo)` : 'Rupture temporaire',
      })),
      nbResultats: results.length,
    };
  },
});

/**
 * 4. Outil Suivi de Commande (Simulation d'un appel API métier)
 */
export const checkOrderStatusTool = tool({
  description: 'Vérifie le statut, les articles et la livraison d’une commande à partir de son numéro.',
  inputSchema: z.object({
    orderId: z.string().describe('Le numéro de commande (ex: CMD-1234, CMD-5678)'),
  }),
  execute: async ({ orderId }) => {
    const ordersDb: Record<string, { status: string; client: string; date: string; articles: string[]; livraison: string }> = {
      'CMD-1234': {
        status: 'En cours de livraison',
        client: 'Alice Martin',
        date: '04/10/2026',
        articles: ['Clavier mécanique sans fil', 'Tapis de souris XXL'],
        livraison: 'Livraison estimée demain avant 13h via Colissimo',
      },
      'CMD-5678': {
        status: 'En préparation en entrepôt',
        client: 'Julien Dupont',
        date: '06/10/2026',
        articles: ['Écran 27 pouces 144Hz'],
        livraison: 'Expédition prévue sous 24h',
      },
    };

    const order = ordersDb[orderId.toUpperCase().trim()];

    if (!order) {
      return {
        erreur: `Aucune commande trouvée avec la référence ${orderId}. Vérifiez le format (ex: CMD-1234).`,
      };
    }

    return {
      commandeId: orderId.toUpperCase(),
      ...order,
    };
  },
});
