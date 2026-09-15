import { useRef } from 'react';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Upload, Image as ImageIcon, X, User, ImagePlus, Share2 } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import type { SigData } from './SignatureEditor';

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, field, updateField }: { label: string; value: string; field: string; updateField: (k: string, v: any) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value || ''} onChange={e => updateField(field, e.target.value)} className="mt-1" />
    </div>
  );
}

function ImageUploader({ label, field, currentUrl, updateField }: { label: string; field: string; currentUrl?: string; updateField: (k: string, v: any) => void }) {
  const { upload, isUploading } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(`"${file.name}" isn't an image file. Please use a PNG or JPG.`);
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 20) {
      toast.error(`File is ${sizeMB.toFixed(1)} MB — max is 20 MB. Resize it first (signature logos display at ~150px, so a smaller export works great).`);
      return;
    }
    try {
      const { url } = await upload(file);
      updateField(field, [{ url, filename: file.name }]);
      toast.success(`${label} uploaded`);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed — please try a smaller file or different format.');
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateField(field, null);
    toast.success(`${label} removed`);
  };

  return (
    <div
      className="relative cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center transition-all hover:border-primary/50 hover:bg-muted/50"
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={isUploading} />
      {currentUrl ? (
        <>
          <img src={currentUrl} alt={label} className="mx-auto h-20 max-w-full object-contain" />
          <button
            onClick={handleRemove}
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110 hover:bg-destructive/80"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <div className="flex h-20 items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
      <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Upload className="h-3 w-3" />
        {isUploading ? 'Uploading…' : `Upload ${label.toLowerCase()}`}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground/50">PNG or JPG under 20 MB</p>
    </div>
  );
}

const SOCIAL_FIELDS = [
  { field: 'linkedInUrl', label: 'LinkedIn' },
  { field: 'instagramUrl', label: 'Instagram' },
  { field: 'facebookUrl', label: 'Facebook' },
  { field: 'threadsUrl', label: 'Threads' },
  { field: 'xUrl', label: 'X (Twitter)' },
  { field: 'tikTokUrl', label: 'TikTok' },
];

export default function ContentTab({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-5">
      <SectionCard icon={User} title="Identity">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name" value={sig.fullName} field="fullName" updateField={updateField} />
          <Field label="Job title" value={sig.jobTitle} field="jobTitle" updateField={updateField} />
          <Field label="Company" value={sig.company} field="company" updateField={updateField} />
          <Field label="Tagline" value={sig.tagline} field="tagline" updateField={updateField} />
          <Field label="Phone" value={sig.phone} field="phone" updateField={updateField} />
          <Field label="Email" value={sig.emailAddress} field="emailAddress" updateField={updateField} />
          <Field label="Website" value={sig.website} field="website" updateField={updateField} />
          <div className="col-span-2 grid grid-cols-2 gap-3">
            <Field label="Address line 1" value={sig.addressLine1} field="addressLine1" updateField={updateField} />
            <Field label="Address line 2" value={sig.addressLine2} field="addressLine2" updateField={updateField} />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={ImagePlus} title="Artwork">
        <div className="grid grid-cols-2 gap-3">
          <ImageUploader label="Logo" field="logo" currentUrl={sig.logo?.[0]?.url} updateField={updateField} />
          <ImageUploader label="Banner" field="bannerImage" currentUrl={sig.bannerImage?.[0]?.url} updateField={updateField} />
        </div>
      </SectionCard>

      <SectionCard icon={Share2} title="Social Links">
        <div className="space-y-2">
          {SOCIAL_FIELDS.map(s => (
            <div key={s.field}>
              <Label className="text-xs text-muted-foreground">{s.label}</Label>
              <Input
                value={sig[s.field] || ''}
                onChange={e => updateField(s.field, e.target.value)}
                placeholder={`${s.label} URL`}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
