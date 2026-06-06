"use client";

import { useRef, useState, useTransition, type ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { removeAvatar, uploadAvatar } from "@/server/actions/profile";

type Props = {
  name: string;
  initialAvatarPath: string | null;
  badge?: React.ReactNode;
};

export function AvatarUploader({ name, initialAvatarPath, badge }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  const [cacheBuster, setCacheBuster] = useState("");
  useEffect(() => {
    setCacheBuster(`?v=${Date.now()}`);
  }, [initialAvatarPath]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setOverride(base64String);
    };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("avatar", file);
    
    startTransition(async () => {
      const res = await uploadAvatar(fd);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        setOverride(undefined); 
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      
      toast.push({ kind: "success", message: "Gambar profil dikemaskini." });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  const onRemove = () => {
    if (!confirm("Buang gambar profil?")) return;
    
    setOverride(null); 
    
    startTransition(async () => {
      const res = await removeAvatar();
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        setOverride(undefined); 
        return;
      }
      
      toast.push({ kind: "success", message: "Gambar profil dibuang." });
      router.refresh();
    });
  };

  const serverPath = initialAvatarPath ? `${initialAvatarPath}${cacheBuster}` : null;
  const shown = override !== undefined ? override : serverPath;

  return (
    <div className="flex items-start gap-5">
      <div className="relative">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt={name}
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lift"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            onLoad={(e) => {
              e.currentTarget.style.display = 'block';
            }}
          />
        ) : (
          <Avatar name={name} size="2xl" ring />
        )}
        
        {pending && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-slate-900/50">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
        
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          aria-label="Tukar gambar profil"
          className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-ukm-orange text-white shadow-lift transition-all duration-200 ease-spring hover:scale-110 hover:shadow-glow-orange disabled:opacity-50"
        >
          <Camera size={16} />
        </button>
        
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFile}
          className="hidden"
        />
      </div>

      <div className="flex-1 space-y-2">
        {badge}
        <p className="text-xs text-slate-500">
          Klik ikon kamera untuk muat naik gambar baharu. Format PNG/JPG/WEBP sehingga 3MB.
        </p>
        {shown && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs font-medium text-ukm-red hover:underline disabled:opacity-50"
          >
            <Trash2 size={12} /> Buang gambar
          </button>
        )}
      </div>
    </div>
  );
}