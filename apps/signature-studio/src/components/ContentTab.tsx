import { useRef } from 'react';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import type { SigData } from './SignatureEditor';

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
    try {
      const { url } = await upload(file);
      updateField(field, [{ url, filename: file.name }]);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error('Upload failed');
    }
  };

  return (
    <div
      className="cursor-pointer rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary/50"
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={isUploading} />
      {currentUrl ? (
        <img src={currentUrl} alt={label} className="mx-auto h-20 max-w-full object-contain" />
      ) : (
        <div className="flex h-20 items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Upload className="h-3 w-3" />
        {isUploading ? 'Uploading…' : `Upload ${label.toLowerCase()}`}
      </p>
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
    <div className="space-y-6">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identity</p>
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
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artwork</p>
        <div className="grid grid-cols-2 gap-3">
          <ImageUploader label="Logo" field="logo" currentUrl={sig.logo?.[0]?.url} updateField={updateField} />
          <ImageUploader label="Banner" field="bannerImage" currentUrl={sig.bannerImage?.[0]?.url} updateField={updateField} />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social Links</p>
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
      </section>
    </div>
  );
}
