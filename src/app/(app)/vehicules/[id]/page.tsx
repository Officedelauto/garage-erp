import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { VehicleFormWithImport } from "@/components/vehicles/vehicle-form-with-import";
import { VehicleHistory } from "@/components/vehicles/vehicle-history";
import { VehiclePhotos } from "@/components/vehicles/vehicle-photos";
import { VehicleListing } from "@/components/vehicles/vehicle-listing";
import { CarteGriseSimulator } from "@/components/vehicles/carte-grise-simulator";
import { updateVehicle, deleteVehicle, clearVehicleReservation } from "@/lib/actions/vehicles";
import { DeleteButton } from "@/components/shared/delete-button";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientDisplayName, formatDateInput, formatEur, monthsSince, yearsSince } from "@/lib/utils";
import { vehicleStatus, VEHICLE_STATUS_BADGES } from "@/lib/vehicle-status";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  CARTE: "Carte bancaire",
  CHEQUE: "Chèque",
  VIREMENT: "Virement",
  AUTRE: "Autre",
};

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { role } = await verifySession();
  const canViewPurchaseInfo = role === "ADMIN";
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      notesLog: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { createdAt: "asc" } },
      reservedByClient: true,
      reservationOrder: true,
    },
  });
  if (!vehicle) notFound();

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const options = clients.map((c) => ({ id: c.id, label: clientDisplayName(c) }));

  const boundUpdate = updateVehicle.bind(null, vehicle.id);
  const boundDelete = deleteVehicle.bind(null, vehicle.id);
  const boundClearReservation = clearVehicleReservation.bind(null, vehicle.id);

  const status = vehicleStatus(vehicle);

  const margin =
    vehicle.purchasePrice != null && vehicle.salePrice != null
      ? Number(vehicle.salePrice) - Number(vehicle.purchasePrice)
      : null;

  const vehicleAgeYears = yearsSince(vehicle.firstRegistrationDate);
  const ctAgeMonths = monthsSince(vehicle.technicalInspectionDate);
  const ctWarning =
    vehicleAgeYears != null &&
    vehicleAgeYears > 4 &&
    (vehicle.technicalInspectionDate == null || (ctAgeMonths != null && ctAgeMonths > 6));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold text-ink-900">
            {vehicle.plate} — {vehicle.brand} {vehicle.model}
          </h1>
          <Badge variant={VEHICLE_STATUS_BADGES[vehicleStatus(vehicle)].variant}>
            {VEHICLE_STATUS_BADGES[vehicleStatus(vehicle)].label}
          </Badge>
          {ctWarning && <Badge variant="danger">CT &gt; 6 mois — non valide pour la revente</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {status !== "VENDU" && (
            <Link href={`/documents/commandes/new?vehicleId=${vehicle.id}`}>
              <Button variant="outline" size="sm">
                Créer un bon de commande
              </Button>
            </Link>
          )}
          {vehicle.salePrice != null && (
            <Link href={`/vehicules/${vehicle.id}/affiche`} target="_blank">
              <Button variant="outline" size="sm">
                Affiche prix (PDF)
              </Button>
            </Link>
          )}
          <Link href={`/vehicules/${vehicle.id}/cession`} target="_blank">
            <Button variant="outline" size="sm">
              Déclaration de cession
            </Button>
          </Link>
          <DeleteButton action={boundDelete} confirmMessage="Supprimer ce véhicule ?" />
        </div>
      </div>

      {status === "RESERVE" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-amber-900">
              Réservé par {vehicle.reservedByClient ? clientDisplayName(vehicle.reservedByClient) : "—"}
            </p>
            <ConfirmSubmitButton
              action={boundClearReservation}
              confirmMessage="Annuler la réservation de ce véhicule ? Le véhicule redeviendra disponible en stock."
              label="Annuler la réservation"
              variant="destructive"
            />
          </div>
          <div className="flex gap-6 text-amber-800">
            {vehicle.depositAmount != null && (
              <span>
                Acompte : <strong>{formatEur(vehicle.depositAmount.toString())}</strong>
              </span>
            )}
            {vehicle.depositPaymentMethod && (
              <span>Paiement : {PAYMENT_METHOD_LABELS[vehicle.depositPaymentMethod] ?? vehicle.depositPaymentMethod}</span>
            )}
            {vehicle.depositDate && <span>Le {formatDateInput(vehicle.depositDate)}</span>}
          </div>
          {vehicle.reservationOrder && (
            <Link href={`/documents/commandes/${vehicle.reservationOrder.id}`} className="underline text-amber-900">
              Voir le bon de commande {vehicle.reservationOrder.number ?? "(brouillon)"}
            </Link>
          )}
        </div>
      )}

      {canViewPurchaseInfo && margin != null ? (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm inline-flex gap-6">
          <span>
            Achat : <strong>{formatEur(vehicle.purchasePrice!.toString())}</strong>
          </span>
          <span>
            Vente : <strong>{formatEur(vehicle.salePrice!.toString())}</strong>
          </span>
          <span className={margin >= 0 ? "text-green-700" : "text-red-700"}>
            Marge : <strong>{formatEur(margin)}</strong>
          </span>
        </div>
      ) : (
        vehicle.salePrice != null && (
          <div className="rounded-md border border-slate-200 bg-white p-3 text-sm inline-flex gap-6">
            <span>
              Vente : <strong>{formatEur(vehicle.salePrice.toString())}</strong>
            </span>
          </div>
        )
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Photos</h2>
        <VehiclePhotos vehicleId={vehicle.id} photos={vehicle.photos} />
      </div>

      <VehicleFormWithImport
        action={boundUpdate}
        clients={options}
        canViewPurchaseInfo={canViewPurchaseInfo}
        defaults={{
          clientId: vehicle.clientId ?? "",
          plate: vehicle.plate,
          stockNumber: vehicle.stockNumber ?? "",
          brand: vehicle.brand,
          model: vehicle.model,
          trim: vehicle.trim ?? "",
          color: vehicle.color ?? "",
          vin: vehicle.vin ?? "",
          firstRegistrationDate: formatDateInput(vehicle.firstRegistrationDate),
          technicalInspectionDate: formatDateInput(vehicle.technicalInspectionDate),
          fiscalHorsepower: vehicle.fiscalHorsepower?.toString() ?? "",
          co2Emissions: vehicle.co2Emissions?.toString() ?? "",
          mileage: vehicle.mileage?.toString() ?? "",
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission ?? "",
          warranty: vehicle.warranty ?? "",
          purchaseDate: formatDateInput(vehicle.purchaseDate),
          purchasePrice: vehicle.purchasePrice?.toString() ?? "",
          sellerType: vehicle.sellerType ?? "",
          sellerName: vehicle.sellerName ?? "",
          salePrice: vehicle.salePrice?.toString() ?? "",
          saleDate: formatDateInput(vehicle.saleDate),
          options: vehicle.options,
          notes: vehicle.notes ?? "",
        }}
      />

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Annonce de vente (IA)</h2>
        <VehicleListing vehicleId={vehicle.id} adCopy={vehicle.adCopy} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Historique des interventions</h2>
        <VehicleHistory vehicleId={vehicle.id} entries={vehicle.notesLog} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Simulation du prix de la carte grise</h2>
        <CarteGriseSimulator
          fiscalHorsepower={vehicle.fiscalHorsepower}
          firstRegistrationDate={vehicle.firstRegistrationDate}
        />
      </div>
    </div>
  );
}
