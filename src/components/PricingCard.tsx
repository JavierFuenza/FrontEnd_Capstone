// src/components/PricingCard.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface Props {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  buttonVariant?: "default" | "outline";
}

export function PricingCard({ title, price, description, features, buttonText, popular = false, buttonVariant = "outline" }: Props) {
  return (
    <Card className={`relative ${popular ? 'border-emerald-200 bg-emerald-50' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">Más popular</span>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="text-3xl font-bold">{price}</div>
        <p className="text-sm text-gray-500">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
        <Button 
          variant={buttonVariant} 
          className={`w-full mt-4 ${buttonVariant === 'default' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-transparent'}`}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}