import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud, Camera, X, Sparkles, Loader2, RotateCw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { predictFreshness, type PredictionResult } from "@/lib/predict.functions";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "./StatusBadge";
import { downloadPredictionPdf } from "@/lib/pdf-report";
import { cn } from "@/lib/utils";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function PredictPanel() {
  const predict = useServerFn(predictFreshness);
  const qc = useQueryClient();
  const [image, setImage] = useState<string | null>(null);
  const [mime, setMime] = useState("image/jpeg");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!/image\/(jpeg|png|jpg|webp)/i.test(f.type)) {
      return toast.error("Please upload a JPG, PNG or WEBP image.");
    }
    if (f.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB.");
    const url = await fileToDataUrl(f);
    setImage(url); setMime(f.type); setResult(null);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = s;
      setCameraOn(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); } }, 50);
    } catch {
      toast.error("Could not access camera.");
    }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null; setCameraOn(false);
  }
  function capture() {
    const v = videoRef.current; if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const url = c.toDataURL("image/jpeg", 0.9);
    setImage(url); setMime("image/jpeg"); setResult(null);
    stopCamera();
  }

  useEffect(() => () => stopCamera(), []);

  async function runPredict() {
    if (!image) return;
    setLoading(true); setResult(null);
    try {
      const r = await predict({ data: { imageBase64: image, mimeType: mime } });
      setResult(r);
      // save
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("predictions").insert({
          user_id: user.id,
          food_name: r.foodName,
          status: r.status,
          freshness_score: r.freshnessScore,
          shelf_life: r.shelfLife,
          storage_recommendation: r.storageRecommendation,
          confidence: r.confidence,
          notes: r.notes,
        });
        if (error) toast.error(`Saved locally: ${error.message}`);
        else { toast.success("Prediction saved"); qc.invalidateQueries({ queryKey: ["predictions"] }); }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() { setImage(null); setResult(null); }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Upload */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <UploadCloud className="size-5 text-primary" /> Upload Food Image
        </h3>

        {cameraOn ? (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            </div>
            <div className="flex gap-2">
              <Button onClick={capture} className="flex-1 gradient-primary text-primary-foreground">
                <Camera className="size-4 mr-2" /> Capture
              </Button>
              <Button onClick={stopCamera} variant="outline"><X className="size-4" /></Button>
            </div>
          </div>
        ) : image ? (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={image} alt="Preview" className="w-full aspect-video object-cover" />
            </div>
            <div className="flex gap-2">
              <Button onClick={runPredict} disabled={loading} className="flex-1 gradient-primary text-primary-foreground shadow-glow">
                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Analyzing…</> : <><Sparkles className="size-4 mr-2" /> Predict Freshness</>}
              </Button>
              <Button onClick={reset} variant="outline"><RotateCw className="size-4" /></Button>
            </div>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                dragOver ? "border-primary bg-primary/10" : "border-border/70 hover:border-primary/60 hover:bg-secondary/30",
              )}
            >
              <div className="mx-auto size-14 rounded-2xl gradient-primary grid place-items-center shadow-glow">
                <UploadCloud className="size-7 text-primary-foreground" />
              </div>
              <p className="mt-4 font-medium">Drag & drop a food photo</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse (JPG, PNG, WEBP · up to 8 MB)</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            <div className="mt-4 text-center">
              <Button onClick={startCamera} variant="outline">
                <Camera className="size-4 mr-2" /> Use Camera Instead
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Result */}
      <div className="glass-card rounded-xl p-6 min-h-[300px]">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" /> Prediction
        </h3>
        {loading ? (
          <div className="h-64 grid place-items-center text-muted-foreground">
            <div className="text-center">
              <Loader2 className="size-8 animate-spin mx-auto text-primary" />
              <p className="mt-3 text-sm">Analyzing image with vision AI…</p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Food Name</div>
              <div className="text-2xl font-bold font-display mt-1">{result.foodName}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={result.status} />
              <span className="text-xs text-muted-foreground">Confidence {result.confidence}%</span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Freshness Score</span>
                <span className="font-semibold">{result.freshnessScore}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    result.status === "Fresh" && "bg-primary",
                    result.status === "Near Expiry" && "bg-warning",
                    result.status === "Spoiled" && "bg-destructive",
                  )}
                  style={{ width: `${result.freshnessScore}%` }}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Estimated Shelf Life</div>
                <div className="text-sm mt-1">{result.shelfLife}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Storage Recommendation</div>
                <div className="text-sm mt-1">{result.storageRecommendation}</div>
              </div>
              {result.notes && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">AI Notes</div>
                  <div className="text-sm mt-1 text-muted-foreground">{result.notes}</div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => downloadPredictionPdf({
                id: crypto.randomUUID(), user_id: "", food_name: result.foodName, status: result.status,
                freshness_score: result.freshnessScore, shelf_life: result.shelfLife,
                storage_recommendation: result.storageRecommendation, confidence: result.confidence,
                notes: result.notes, image_url: null, created_at: new Date().toISOString(),
              })}
            >
              <FileDown className="size-4 mr-2" /> Download PDF report
            </Button>
          </div>
        ) : (
          <div className="h-64 grid place-items-center text-center text-muted-foreground">
            <div>
              <Sparkles className="size-8 mx-auto text-primary/50" />
              <p className="mt-3 text-sm">Upload or capture a food image, then hit Predict Freshness.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
