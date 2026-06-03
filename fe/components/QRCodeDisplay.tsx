import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface QRCodeDisplayProps {
    value: string;
    title?: string;
    subtitle?: string;
    size?: number;
}

export function QRCodeDisplay({ value, title, subtitle, size = 150 }: QRCodeDisplayProps) {
    const qrRef = useRef<SVGSVGElement>(null);

    const handleDownload = () => {
        if (!qrRef.current) return;

        // Create a canvas from SVG to download as PNG
        const svgData = new XMLSerializer().serializeToString(qrRef.current);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            // Add padding and background for better look
            canvas.width = img.width + 40;
            canvas.height = img.height + 40;
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);
            }

            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-${title || value}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    };

    const handlePrint = () => {
        if (!qrRef.current) return;

        const svgData = new XMLSerializer().serializeToString(qrRef.current);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
              .container { text-align: center; border: 1px solid #ccc; padding: 2rem; border-radius: 8px; }
              h2 { margin: 0 0 10px 0; }
              p { margin: 0 0 20px 0; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              ${title ? `<h2>${title}</h2>` : ''}
              ${subtitle ? `<p>${subtitle}</p>` : ''}
              ${svgData}
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); };
            </script>
          </body>
        </html>
      `);
            printWindow.document.close();
        }
    };

    return (
        <Card className="w-fit flex flex-col items-center">
            <CardHeader className="text-center pb-2">
                {title && <CardTitle className="text-lg">{title}</CardTitle>}
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </CardHeader>
            <CardContent className="flex justify-center p-6 bg-white rounded-md m-4">
                <QRCodeSVG
                    ref={qrRef}
                    value={value}
                    size={size}
                    level="H"
                    includeMargin={false}
                />
            </CardContent>
            <CardFooter className="flex gap-2 w-full justify-center">
                <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    In mã
                </Button>
            </CardFooter>
        </Card>
    );
}
