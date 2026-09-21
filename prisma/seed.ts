import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    await prisma.company.create({
      data: {
        name: "Mon Garage",
        address: "1 rue de l'Atelier",
        postalCode: "75000",
        city: "Paris",
        siret: "00000000000000",
        vatNumber: "FR00000000000",
        phone: "01 23 45 67 89",
        email: "contact@mongarage.fr",
      },
    });
    console.log("Entreprise créée avec des valeurs par défaut (à modifier dans les réglages).");
  }

  const adminEmail = "admin@garage.local";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("changeme123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Administrateur",
        role: "ADMIN",
      },
    });
    console.log(`Utilisateur admin créé : ${adminEmail} / changeme123 (à changer après connexion)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
