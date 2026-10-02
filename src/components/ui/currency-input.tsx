import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Campo de valor monetário — digita-se da direita pra esquerda, como numa
// maquininha (os dígitos viram centavos), sempre mostrando "R$" e já
// formatado com separador de milhar "." e decimal "," (ex: R$ 1.234,56).
// Evita o <input type="number"> nativo, que não tem máscara de moeda e
// deixa o usuário digitar qualquer coisa sem o padrão visual esperado.

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number; // valor em reais, ex: 1234.56
  onChange: (value: number) => void;
}

function formatarCentavos(digitos: string): string {
  const numero = Number(digitos || "0") / 100;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [digitos, setDigitos] = React.useState(() => String(Math.round((value || 0) * 100)));

    // Ressincroniza quando o valor muda por fora (edição de registro
    // existente, reset de formulário) — sem isso o campo ficaria preso no
    // que foi digitado da última vez, ignorando o valor real do formulário.
    React.useEffect(() => {
      const atual = Number(digitos) / 100;
      if (Math.abs(atual - (value || 0)) > 0.001) {
        setDigitos(String(Math.round((value || 0) * 100)));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const somenteDigitos = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
      setDigitos(somenteDigitos);
      onChange(Number(somenteDigitos || "0") / 100);
    };

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={formatarCentavos(digitos)}
          onChange={handleChange}
          className={cn("pl-9", className)}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
