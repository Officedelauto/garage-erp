export const MESSAGE_TYPES = {
  CLIENT_RESPONSE: {
    label: "Réponse au client",
    instruction:
      "Rédige une réponse professionnelle et rassurante au client qui décrit ce problème. Explique la situation clairement, propose une solution ou une prochaine étape concrète.",
  },
  APOLOGY_GESTURE: {
    label: "Excuses + geste commercial",
    instruction:
      "Rédige un message d'excuses sincère pour ce problème, en proposant un geste commercial raisonnable (remise, prestation offerte, etc. à préciser en termes génériques) pour compenser la gêne occasionnée.",
  },
  PAYMENT_REMINDER: {
    label: "Relance de paiement",
    instruction:
      "Rédige une relance de paiement courtoise mais ferme concernant la situation décrite, en rappelant les modalités de règlement et les conséquences en cas de non-paiement.",
  },
  TECHNICAL_EXPLANATION: {
    label: "Explication technique",
    instruction:
      "Rédige une explication technique claire et pédagogique, compréhensible par un client non-mécanicien, sur le problème décrit et l'intervention réalisée ou à réaliser.",
  },
} as const;

export type SavMessageType = keyof typeof MESSAGE_TYPES;

export const SAV_MESSAGE_TYPE_OPTIONS = Object.entries(MESSAGE_TYPES).map(([value, { label }]) => ({
  value: value as SavMessageType,
  label,
}));
