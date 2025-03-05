
import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
}

export const QRCode = ({
  value,
  size = 200,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  level = 'M',
  includeMargin = false,
  className,
}: QRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: includeMargin ? 4 : 0,
          color: {
            dark: fgColor,
            light: bgColor
          },
          errorCorrectionLevel: level,
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [value, size, bgColor, fgColor, level, includeMargin]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default QRCode;
