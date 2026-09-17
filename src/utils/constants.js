// Default message templates (French, formal Vous)
export const DEFAULT_MESSAGES = {
  cat1: `Bonjour {name},\n\nJe suis développeur web spécialisé dans les sites de location de véhicules.\n\nJ'ai remarqué que vous n'avez pas encore de site web pour votre agence. Et si vos clients pouvaient :\n\n• Voir vos véhicules disponibles en temps réel\n• Calculer automatiquement le tarif selon les dates\n• Réserver et recevoir une confirmation instantanée\n• Et bien plus : gestion du parc, fiches clients, confirmations automatiques, etc.\n\nJ'ai tourné une démo de 2 min pour vous montrer. Répondez simplement « OUI » pour la recevoir ici, ou faites-moi signe avec votre WhatsApp si vous préférez que je vous l'envoie là-bas !\n\nBonne journée !`,

  cat2: `Bonjour {name},\n\nJe suis développeur web spécialisé dans les sites de location de véhicules.\n\nJ'ai vu que vous utilisez une plateforme externe pour vos réservations. Vos clients quittent donc votre univers pour finaliser sur un autre site — ce qui peut créer de la confusion et vous coûte un abonnement mensuel.\n\nEt si vous aviez votre propre site avec un système de réservation intégré ? Vos clients restent chez vous, vous ne payez plus d'abonnement, et vous gardez le contrôle total :\n\n• Disponibilités en temps réel\n• Calcul automatique des tarifs\n• Réservation directe avec confirmation instantanée\n• Et bien plus : gestion du parc, fiches clients, confirmations automatiques, etc.\n\nJ'ai tourné une démo de 2 min pour vous montrer. Répondez simplement « OUI » pour la recevoir ici, ou faites-moi signe avec votre WhatsApp si vous préférez que je vous l'envoie là-bas !\n\nBonne journée !`,

  cat3: `Bonjour {name},\n\nJe suis développeur web spécialisé dans les sites de location de véhicules.\n\nJe me permets de vous contacter car j'ai remarqué que votre site web semble rencontrer un problème technique (erreur d'affichage ou page inaccessible).\n\nSi vous le souhaitez, je peux vous proposer un nouveau site clé en main avec un système de réservation intégré :\n\n• Disponibilités en temps réel\n• Calcul automatique des tarifs\n• Réservation directe avec confirmation instantanée\n• Et bien plus : gestion du parc, fiches clients, confirmations automatiques, etc.\n\n(Et si vous préférez simplement corriger le bug de votre site actuel, je peux aussi vous aider.)\n\nJ'ai tourné une démo de 2 min pour vous montrer. Répondez simplement « OUI » pour la recevoir ici, ou faites-moi signe avec votre WhatsApp si vous préférez que je vous l'envoie là-bas !\n\nBonne journée !`,

  cat4: `Bonjour {name},\n\nJe suis développeur web spécialisé dans les sites de location de véhicules.\n\nVotre site est une superbe vitrine, mais j'ai remarqué que vos clients ne peuvent pas encore réserver directement en ligne. Résultat : vous devez vérifier les disponibilités, calculer les prix et répondre par email ou téléphone à chaque demande.\n\nEt si tout ça se faisait automatiquement ? :\n\n• Disponibilités en temps réel\n• Calcul automatique des tarifs\n• Réservation directe avec confirmation instantanée\n• Et bien plus : gestion du parc, fiches clients, confirmations automatiques, etc.\n\nJ'ai tourné une démo de 2 min pour vous montrer. Répondez simplement « OUI » pour la recevoir ici, ou faites-moi signe avec votre WhatsApp si vous préférez que je vous l'envoie là-bas !\n\nBonne journée !`,

  cat6: `Bonjour {name},\n\nJe suis développeur web spécialisé dans les sites de location de véhicules.\n\nJ'ai visité votre site et je vois que vous avez déjà une présence en ligne — c'est super. Mais je pense qu'un design plus moderne et professionnel pourrait vraiment faire passer votre image au niveau supérieur, sans changer vos habitudes de gestion.\n\nJe propose un site clé en main avec :\n\n• Design moderne et responsive\n• Disponibilités en temps réel\n• Calcul automatique des tarifs\n• Réservation directe avec confirmation instantanée\n• Et bien plus : gestion du parc, fiches clients, confirmations automatiques, etc.\n\nJ'ai tourné une démo de 2 min pour vous montrer. Répondez simplement « OUI » pour la recevoir ici, ou faites-moi signe avec votre WhatsApp si vous préférez que je vous l'envoie là-bas !\n\nBonne journée !`
};

export const DEFAULT_SCHEDULE = [
  {
    id: '1',
    localStartTime: '09:00',
    localEndTime: '12:00',
    targetCountry: 'France',
    targetTimezone: 'Europe/Paris'
  }
];

export const DEFAULT_SOCIAL_DOMAINS = [
  'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
  'linkedin.com', 'tiktok.com', 'youtube.com', 'pinterest.com',
  'snapchat.com', 'wa.me', 'whatsapp.com', 't.me', 'telegram.org'
];

export const DEFAULT_SAAS_DOMAINS = [
  'rodeeo.com', 'gestion.teori.fr', 'teori.fr', 'getaround.com',
  'drivy.com', 'ouicar.com', 'turo.com', 'rentacar.fr',
  'fleethand.com', 'myrentcar.com', 'bookingkit.net',
  'rentmanager.com', 'thermeon.com', 'bluebird-auto.com',
  'caag.fr', 'otoqi.com'
];

export const CATEGORY_LABELS = {
  cat1: 'No Website',
  cat2: 'SaaS Redirect',
  cat3: 'Broken Website',
  cat4: 'No Reservation System',
  cat5: 'All Good',
  cat6: 'Needs Redesign',
  not_checked: 'Not Checked'
};

export const CATEGORY_COLORS = {
  cat1: '#e74c3c',
  cat2: '#e67e22',
  cat3: '#c0392b',
  cat4: '#f39c12',
  cat5: '#27ae60',
  cat6: '#8e44ad',
  not_checked: '#95a5a6'
};

export function personalizeMessage(template, name) {
  if (!template) return '';
  return template.replace(/\{name\}/g, name || '');
}
