import Link from "next/link";
import { Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { getActivePersona } from "@/lib/persona";
import { isoDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const photos = await prisma.progressPhoto.findMany({
    where: { personaId: persona.id },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Camera className="h-5 w-5" /> Fotos de evolução
        </h1>
        <p className="text-muted-foreground text-sm">
          Fotos ficam armazenadas localmente em <code className="bg-muted rounded px-1">public/uploads/</code>.
          Use o mesmo enquadramento e iluminação para comparações honestas.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Adicionar foto</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploader personaId={persona.id} />
        </CardContent>
      </Card>

      <PhotoGallery
        photos={photos.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          type: p.type,
          date: isoDate(p.date),
          notes: p.notes,
        }))}
      />
    </div>
  );
}
