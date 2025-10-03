import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  return (
    <div className="pt-32 pb-16 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Input type="email" placeholder="correo@ejemplo.com" required />
            <Input type="password" placeholder="Contraseña" required />
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Acceder</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}