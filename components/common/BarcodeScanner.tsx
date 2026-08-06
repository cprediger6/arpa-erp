// components/common/BarcodeScanner.tsx
"use client";

import { useEffect, useRef } from 'react';
import Quagga from 'quagga';

export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader"]
        }
      }, (err: any) => {
        if (err) {
          console.error(err);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((data: any) => {
        onDetected(data.codeResult.code);
      });
    }

    return () => {
      Quagga.stop();
    };
  }, [onDetected]);

  return <div ref={scannerRef} className="w-full max-w-md mx-auto" />;
}