"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard, Wallet, DollarSign, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentModalProps {
  saleId: string;
  total: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = [
  { value: "CASH", label: "Efectivo", icon: DollarSign },
  { value: "CREDIT_CARD", label: "Tarjeta de Crédito", icon: CreditCard },
  { value: "DEBIT_CARD", label: "Tarjeta de Débito", icon: CreditCard },
  { value: "TRANSFER", label: "Transferencia Bancaria", icon: Wallet },
  { value: "DIGITAL_WALLET", label: "Billetera Digital", icon: Smartphone },
];

export function PaymentModal({ saleId, total, open, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [amount, setAmount] = useState(total);
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isDigitalMethod = ["CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL_WALLET"].includes(paymentMethod);
  const isCash = paymentMethod === "CASH";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload: any = {
        paymentMethod,
        amount: parseFloat(amount.toString()),
        reference: reference || undefined,
      };

      if (isDigitalMethod) {
        payload.transactionCode = transactionCode;
      }

      const res = await fetch(`/api/sales/${saleId}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al procesar el pago");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || "Error al procesar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Cobrar Venta</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Total a cobrar: <span className="font-bold text-lg text-green-600">${total.toFixed(2)}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Método de pago */}
          <div>
            <Label htmlFor="paymentMethod">Método de Pago *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de pago" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Monto */}
          <div>
            <Label htmlFor="amount">Monto a cobrar</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              max={total}
              placeholder={`${total.toFixed(2)}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Monto total: ${total.toFixed(2)}
            </p>
          </div>

          {/* Código de transacción (solo para pagos digitales) */}
          {isDigitalMethod && (
            <div>
              <Label htmlFor="transactionCode">
                Código de Transacción *
                <Badge variant="outline" className="ml-2 text-xs">
                  POSNET / Ticket
                </Badge>
              </Label>
              <Input
                id="transactionCode"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="Ingresa el código del ticket POSNET"
                required={isDigitalMethod}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ingresa el código que aparece en el ticket del POSNET para verificar el pago
              </p>
            </div>
          )}

          {/* Referencia (opcional para todos) */}
          <div>
            <Label htmlFor="reference">Referencia (opcional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Nota adicional sobre el pago"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Información para efectivo */}
          {isCash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <p>✅ El pago en efectivo se registrará directamente.</p>
            </div>
          )}

          {/* Información para pagos digitales */}
          {isDigitalMethod && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
              <p>⚠️ Verifica que el código de transacción coincida con el ticket del POSNET.</p>
              <p className="text-xs mt-1">El código será validado para evitar duplicados.</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!paymentMethod || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cobrar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}