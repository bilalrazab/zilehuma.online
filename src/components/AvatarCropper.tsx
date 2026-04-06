import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn } from "lucide-react";

interface AvatarCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropped: (croppedDataUrl: string) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

const AvatarCropper = ({ open, imageSrc, onClose, onCropped }: AvatarCropperProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(centerAspectCrop(naturalWidth, naturalHeight));
  }, []);

  const handleDone = useCallback(() => {
    const image = imgRef.current;
    if (!image || !crop) return;

    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = (crop.unit === "%" ? (crop.x / 100) * image.width : crop.x) * scaleX;
    const cropY = (crop.unit === "%" ? (crop.y / 100) * image.height : crop.y) * scaleY;
    const cropW = (crop.unit === "%" ? (crop.width / 100) * image.width : crop.width) * scaleX;
    const cropH = (crop.unit === "%" ? (crop.height / 100) * image.height : crop.height) * scaleY;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, size, size);

    onCropped(canvas.toDataURL("image/jpeg", 0.85));
  }, [crop, onCropped]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Adjust Photo</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center max-h-[50vh] overflow-hidden rounded-xl bg-muted">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={1}
            circularCrop
            className="max-h-[50vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ transform: `scale(${scale})`, maxHeight: "50vh", transformOrigin: "center" }}
              className="block"
            />
          </ReactCrop>
        </div>

        <div className="flex items-center gap-3 px-2">
          <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            min={100}
            max={300}
            step={5}
            value={[scale * 100]}
            onValueChange={([v]) => setScale(v / 100)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(scale * 100)}%</span>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDone}>Save Photo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropper;
