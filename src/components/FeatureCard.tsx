import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react"; // Importa el tipo para el icono

// Define los tipos de las props
interface Props {
  href: string;
  titulo: string;
  descripcion: string;
  Icono: LucideIcon;
}

export default function FeatureCard({ href, titulo, descripcion, Icono }: Props) {
  return (
    <a href={href}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-b-4 border-b-emerald-500">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Icono className="w-6 h-6 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">{titulo}</CardTitle>
          </div>
          <CardDescription className="text-base">{descripcion}</CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
}