import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import {
  ArrowLeft, Building2, Copy, Share2, CheckCircle2, AlertTriangle,
  Users, Settings, QrCode, RefreshCw, ToggleLeft, ToggleRight,
  Mail, Phone, Globe, MapPin, Upload, Loader2, AlertCircle,
  Shield, Edit3, Trash2, Clock, Info, UserPlus
} from 'lucide-react';
import {
  Institution, InstitutionMember, getInstitutionByAdminId,
  getInstitutionMembers, getMemberCounts, regenerateCode,
  saveInstitution, removeMember, activateInstitution,
  deactivateInstitution, getDaysUntilExpiry, isCodeExpired,
  getCodeExpiryDate, assignAdmin, GHANA_REGIONS, InstitutionType,
  validateInstitutionCode,
} from '../utils/institution';

interface InstitutionDashboardProps {
  user: User;
  onBack: () => void;
  onRegisterNew: () => void;
  initialInstitution?: Institution;
}

type Tab = 'overview' | 'code' | 'members' | 'settings';

const INSTITUTION_TYPES: InstitutionType[] = ['Primary', 'JHS', 'SHS', 'Tertiary', 'Vocational', 'Other'];

const EXPIRY_OPTIONS = [
  { label: 'Never expires', value: null },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
];

function compressImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png', 0.8));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function InstitutionDashboard({ user, onBack, onRegisterNew, initialInstitution }: InstitutionDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [institution, setInstitution] = useState<Institution | null>(initialInstitution ?? getInstitutionByAdminId(user.id));
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | null>(institution?.codeExpiryDays ?? null);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Settings form state
  const [editName, setEditName] = useState(institution?.name ?? '');
  const [editType, setEditType] = useState<InstitutionType>(institution?.type ?? 'SHS');
  const [editRegion, setEditRegion] = useState(institution?.region ?? 'Greater Accra');
  const [editDistrict, setEditDistrict] = useState(institution?.district ?? '');
  const [editAddress, setEditAddress] = useState(institution?.address ?? '');
  const [editEmail, setEditEmail] = useState(institution?.email ?? '');
  const [editPhone, setEditPhone] = useState(institution?.phone ?? '');
  const [editWebsite, setEditWebsite] = useState(institution?.website ?? '');
  const [editTagline, setEditTagline] = useState(institution?.tagline ?? '');
  const [editAdminName, setEditAdminName] = useState(institution?.adminName ?? '');
  const [editAdminEmail, setEditAdminEmail] = useState(institution?.adminEmail ?? '');
  const [editAdminPhone, setEditAdminPhone] = useState(institution?.adminPhone ?? '');

  // Member search
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'student'>('all');

  useEffect(() => {
    if (institution) {
      const m = getInstitutionMembers(institution.id);
      setMembers(m);
    }
  }, [institution?.id]);

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl text-gray-800 mb-2">No Institution Registered</h2>
            <p className="text-gray-500 text-sm mb-6">Register your school or educational institution to unlock teacher profiles, analytics, and institution code management.</p>
            <Button style={{ backgroundColor: '#5B7DB1' }} onClick={onRegisterNew} className="w-full">
              <Building2 className="w-4 h-4 mr-2" /> Register Your Institution
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full mt-2">Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const counts = getMemberCounts(institution.id);
  const expired = isCodeExpired(institution);
  const daysLeft = getDaysUntilExpiry(institution);
  const expiryDate = getCodeExpiryDate(institution);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(institution.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `Join ${institution.name} on JotMinds!\n\nUse institution code: ${institution.code}\n\nSign up at JotMinds and enter this code to link your account to our school.`;
    if (navigator.share) navigator.share({ title: `${institution.name} — JotMinds Code`, text }).catch(() => {});
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleRegenerate = () => {
    if (!confirmRegenerate) { setConfirmRegenerate(true); return; }
    setRegenerating(true);
    const updated = regenerateCode(institution.id, expiryDays);
    if (updated) { setInstitution(updated); setConfirmRegenerate(false); }
    setRegenerating(false);
  };

  const handleToggleActive = () => {
    if (institution.isActive && !confirmDeactivate) { setConfirmDeactivate(true); return; }
    if (institution.isActive) { deactivateInstitution(institution.id); }
    else { activateInstitution(institution.id); }
    const updated = getInstitutionByAdminId(user.id);
    setInstitution(updated);
    setConfirmDeactivate(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true);
    try {
      const compressed = await compressImage(file);
      const updated = { ...institution, logo: compressed };
      saveInstitution(updated);
      setInstitution(updated);
    } catch { setError('Failed to upload logo.'); }
    finally { setLogoLoading(false); }
  };

  const handleRemoveLogo = () => {
    const updated = { ...institution, logo: undefined };
    saveInstitution(updated);
    setInstitution(updated);
  };

  const handleSaveSettings = () => {
    if (!editName.trim()) return setError('Institution name is required.');
    if (!editEmail.trim() || !editEmail.includes('@')) return setError('Valid email is required.');
    if (!editAdminName.trim()) return setError('Administrator name is required.');
    const updated: Institution = {
      ...institution,
      name: editName.trim(),
      type: editType,
      region: editRegion,
      district: editDistrict.trim(),
      address: editAddress.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      website: editWebsite.trim() || undefined,
      tagline: editTagline.trim() || undefined,
      adminName: editAdminName.trim(),
      adminEmail: editAdminEmail.trim(),
      adminPhone: editAdminPhone.trim(),
      updatedAt: new Date().toISOString(),
    };
    saveInstitution(updated);
    setInstitution(updated);
    setError('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRemoveMember = (userId: string) => {
    if (!window.confirm('Remove this member from the institution?')) return;
    removeMember(institution.id, userId);
    setMembers(getInstitutionMembers(institution.id));
  };

  const filteredMembers = useMemo(() => {
    let list = members;
    if (memberRoleFilter !== 'all') list = list.filter(m => m.role === memberRoleFilter);
    if (memberSearch) list = list.filter(m => m.userName.toLowerCase().includes(memberSearch.toLowerCase()) || m.userEmail.toLowerCase().includes(memberSearch.toLowerCase()) || m.userPhone?.includes(memberSearch));
    return list;
  }, [members, memberRoleFilter, memberSearch]);

  const ROLE_COLORS = { admin: '#5B7DB1', teacher: '#6B4C9A', student: '#1E8A6E' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {institution.logo
              ? <img src={institution.logo} alt="Logo" className="w-8 h-8 object-contain rounded" />
              : <div className="w-8 h-8 rounded bg-[#5B7DB1] flex items-center justify-center text-white text-sm">{institution.name.charAt(0)}</div>}
            <div className="min-w-0">
              <h1 className="text-base text-gray-900 truncate">{institution.name}</h1>
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: institution.isActive ? '#1E8A6E20' : '#DC262620', color: institution.isActive ? '#1E8A6E' : '#DC2626' }} className="text-[10px]">
                  {institution.isActive ? '● Active' : '● Inactive'}
                </Badge>
                <span className="text-xs text-gray-500">{institution.type} · {institution.region}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {([
            ['overview', Building2, 'Overview'],
            ['code', QrCode, 'Code Manager'],
            ['members', Users, 'Members'],
            ['settings', Settings, 'Settings'],
          ] as const).map(([t, Icon, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 shrink-0 transition-colors ${tab === t ? 'border-[#5B7DB1] text-[#5B7DB1]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (<>
          {!institution.isActive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>This institution account is <strong>deactivated</strong>. Teachers and students cannot join using the institution code. Reactivate in Settings.</AlertDescription>
            </Alert>
          )}

          {expired && institution.isActive && (
            <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>The institution code has <strong>expired</strong>. Regenerate it in the Code Manager tab.</AlertDescription></Alert>
          )}

          {/* Institution card */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  {institution.logo
                    ? <img src={institution.logo} alt="Logo" className="w-16 h-16 object-contain rounded-xl border" />
                    : <div className="w-16 h-16 rounded-xl bg-[#5B7DB1] flex items-center justify-center text-white text-2xl font-bold">{institution.name.charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-gray-900 truncate">{institution.name}</h2>
                  {institution.tagline && <p className="text-xs text-gray-500 italic mb-2">{institution.tagline}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{institution.type}</Badge>
                    <Badge variant="secondary" className="text-[10px]"><MapPin className="w-2.5 h-2.5 mr-0.5" />{institution.district}, {institution.region}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t pt-4">
                {[
                  { label: 'Email', icon: <Mail className="w-3.5 h-3.5" />, value: institution.email },
                  { label: 'Phone', icon: <Phone className="w-3.5 h-3.5" />, value: institution.phone },
                  { label: 'Website', icon: <Globe className="w-3.5 h-3.5" />, value: institution.website || '—' },
                  { label: 'Admin', icon: <Shield className="w-3.5 h-3.5" />, value: institution.adminName },
                ].map(row => (
                  <div key={row.label}>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">{row.icon}{row.label}</p>
                    <p className="text-xs text-gray-700 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Members', value: counts.total, color: '#5B7DB1' },
              { label: 'Teachers', value: counts.teachers, color: '#6B4C9A' },
              { label: 'Students', value: counts.students, color: '#1E8A6E' },
            ].map(s => (
              <Card key={s.label}><CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </CardContent></Card>
            ))}
          </div>

          {/* Code quick-view */}
          <Card className={`border-2 ${expired ? 'border-red-200' : 'border-blue-200'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><QrCode className="w-3.5 h-3.5" />Institution Code</p>
                  <div className="text-2xl font-mono tracking-widest text-gray-900">{institution.code}</div>
                  {expired
                    ? <p className="text-xs text-red-500 mt-1">⚠ Code expired — regenerate in Code Manager</p>
                    : daysLeft !== null
                    ? <p className="text-xs text-amber-600 mt-1">⏱ Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                    : <p className="text-xs text-green-600 mt-1">✓ No expiry</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyCode}>{copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}{copied ? 'Copied' : 'Copy'}</Button>
                  <Button size="sm" variant="outline" onClick={handleShare}><Share2 className="w-3.5 h-3.5 mr-1" />Share</Button>
                  <Button size="sm" style={{ backgroundColor: '#5B7DB1' }} onClick={() => setTab('code')}>Manage →</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-gray-400 text-center">Institution ID: {institution.id} · Created {new Date(institution.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </>)}

        {/* ── CODE MANAGER ── */}
        {tab === 'code' && (<>
          {/* Code display */}
          <div className={`rounded-2xl p-6 text-white relative overflow-hidden ${expired ? '' : ''}`} style={{ background: expired ? 'linear-gradient(135deg, #DC2626, #9ca3af)' : 'linear-gradient(135deg, #5B7DB1, #6B4C9A)' }}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,white,transparent)]" />
            <div className="relative">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><QrCode className="w-3.5 h-3.5" />Institution Code</p>
                  <div className="text-4xl font-mono tracking-[0.2em]">{institution.code}</div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {expired
                    ? <Badge className="bg-red-200 text-red-900">⚠ Expired</Badge>
                    : daysLeft !== null
                    ? <Badge className="bg-amber-200 text-amber-900">⏱ {daysLeft}d left</Badge>
                    : <Badge className="bg-green-200 text-green-900">✓ Never expires</Badge>}
                  {!institution.isActive && <Badge className="bg-gray-200 text-gray-900">Inactive account</Badge>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={handleCopyCode} className="bg-white/20 hover:bg-white/30 text-white border-white/30 border">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}{copied ? 'Copied!' : 'Copy Code'}
                </Button>
                <Button size="sm" onClick={handleShare} className="bg-white/20 hover:bg-white/30 text-white border-white/30 border">
                  <Share2 className="w-3.5 h-3.5 mr-1" />Share via...
                </Button>
              </div>
            </div>
          </div>

          {/* Code info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Generated</span><span className="text-gray-700">{new Date(institution.codeGeneratedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Expiry</span><span className={expired ? 'text-red-600' : 'text-gray-700'}>{expiryDate ? expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Never'}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Members joined via code</span><span className="text-gray-700">{counts.total - 1}</span></div>
            </CardContent>
          </Card>

          {/* Expiry settings */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" />Code Expiry</CardTitle><CardDescription>Set how long the current code remains valid</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EXPIRY_OPTIONS.map(opt => (
                  <label key={String(opt.value)} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm transition-all ${expiryDays === opt.value ? 'border-[#5B7DB1] bg-blue-50 text-[#5B7DB1]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="radio" name="expiry" checked={expiryDays === opt.value} onChange={() => setExpiryDays(opt.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
              {expiryDays !== institution.codeExpiryDays && (
                <Button size="sm" className="mt-3" style={{ backgroundColor: '#5B7DB1' }} onClick={() => { saveInstitution({ ...institution, codeExpiryDays: expiryDays }); setInstitution({ ...institution, codeExpiryDays: expiryDays }); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }}>
                  Save Expiry Setting
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Regenerate */}
          <Card className={`border-2 ${confirmRegenerate ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" />Regenerate Code</CardTitle>
              <CardDescription>Create a new institution code. The old code will immediately stop working.</CardDescription>
            </CardHeader>
            <CardContent>
              {confirmRegenerate && (
                <Alert className="mb-3 border-amber-300 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Warning:</strong> The current code <code className="font-mono">{institution.code}</code> will become invalid immediately. All {counts.total - 1} linked members will keep their accounts, but new members will need the new code.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                variant={confirmRegenerate ? 'destructive' : 'outline'}
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {confirmRegenerate ? 'Confirm — Generate New Code' : 'Regenerate Institution Code'}
              </Button>
              {confirmRegenerate && <Button variant="ghost" size="sm" className="ml-2" onClick={() => setConfirmRegenerate(false)}>Cancel</Button>}
            </CardContent>
          </Card>

          {/* Share card */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Share2 className="w-4 h-4" />How to Share the Code</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: '👨‍🏫', title: 'For Teachers', desc: 'During signup, teachers select the "Teacher" role and enter this code in the "School Jots Code" field to link their account to your institution.' },
                { icon: '👩‍🎓', title: 'For Students', desc: 'During signup, students enter this code in the "School Code" field when prompted. Their account will be linked to your institution.' },
                { icon: '📱', title: 'Share via WhatsApp / SMS', desc: 'Click the Share button above to send the code directly via your preferred messaging app.' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div><p className="text-sm font-medium text-gray-800">{item.title}</p><p className="text-xs text-gray-500 mt-0.5">{item.desc}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>)}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (<>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Users className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <Input placeholder="Search by name, email or phone..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1">
              {(['all', 'admin', 'teacher', 'student'] as const).map(r => (
                <button key={r} onClick={() => setMemberRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all capitalize ${memberRoleFilter === r ? 'text-white' : 'bg-white text-gray-600 border'}`}
                  style={memberRoleFilter === r ? { backgroundColor: r === 'all' ? '#5B7DB1' : ROLE_COLORS[r] } : {}}>
                  {r === 'all' ? 'All' : `${r}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: counts.total, color: '#5B7DB1' },
              { label: 'Teachers', value: counts.teachers, color: '#6B4C9A' },
              { label: 'Students', value: counts.students, color: '#1E8A6E' },
            ].map(s => <Card key={s.label}><CardContent className="pt-3 pb-3 text-center"><div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div><p className="text-xs text-gray-500">{s.label}</p></CardContent></Card>)}
          </div>

          {filteredMembers.length === 0 && (
            <Card><CardContent className="py-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{members.length === 0 ? 'No members yet — share your institution code' : 'No members match your search'}</p>
            </CardContent></Card>
          )}

          {filteredMembers.map(m => (
            <Card key={m.userId}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0" style={{ backgroundColor: ROLE_COLORS[m.role] }}>
                      {m.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{m.userName}</p>
                        <Badge style={{ backgroundColor: ROLE_COLORS[m.role] + '20', color: ROLE_COLORS[m.role] }} className="text-[10px] capitalize">{m.role}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{m.userEmail}</p>
                      {m.userPhone && <p className="text-xs text-gray-400">{m.userPhone}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">Joined {new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · via {m.joinedViaCode}</p>
                    </div>
                  </div>
                  {m.role !== 'admin' && (
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(m.userId)} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </>)}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (<>
          {saveSuccess && <Alert className="border-green-300 bg-green-50"><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">Settings saved successfully.</AlertDescription></Alert>}

          {/* Logo */}
          <Card>
            <CardHeader><CardTitle className="text-sm">School Logo</CardTitle></CardHeader>
            <CardContent className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#5B7DB1] transition-all" onClick={() => logoRef.current?.click()}>
                {institution.logo
                  ? <img src={institution.logo} alt="Logo" className="w-full h-full object-contain" />
                  : <Upload className="w-6 h-6 text-gray-300" />}
              </div>
              <div>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={() => logoRef.current?.click()} disabled={logoLoading}>
                    {logoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}{institution.logo ? 'Change' : 'Upload'} Logo
                  </Button>
                  {institution.logo && <Button size="sm" variant="ghost" onClick={handleRemoveLogo} className="text-red-500">Remove</Button>}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Square images, max 200×200px recommended</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </CardContent>
          </Card>

          {/* Institution details */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Institution Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="s-name">Institution Name</Label><Input id="s-name" value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {INSTITUTION_TYPES.map(t => (
                    <label key={t} className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer text-xs transition-all ${editType === t ? 'border-[#5B7DB1] bg-blue-50 text-[#5B7DB1]' : 'border-gray-200 text-gray-600'}`}>
                      <input type="radio" value={t} checked={editType === t} onChange={() => setEditType(t)} className="sr-only" />{t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Region</Label>
                  <select value={editRegion} onChange={e => setEditRegion(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div><Label>District</Label><Input value={editDistrict} onChange={e => setEditDistrict(e.target.value)} className="mt-1" /></div>
              </div>
              <div><Label>Address</Label><textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} rows={2} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><Label>Tagline (optional)</Label><Input value={editTagline} onChange={e => setEditTagline(e.target.value)} maxLength={100} placeholder="e.g. Excellence in Education" className="mt-1" /></div>
            </CardContent>
          </Card>

          {/* Contact details */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="mt-1" /></div>
                <div><Label>Phone</Label><Input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="mt-1" /></div>
              </div>
              <div><Label>Website</Label><Input type="url" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="https://" className="mt-1" /></div>
            </CardContent>
          </Card>

          {/* Administrator */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" />Assigned Administrator</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Administrator Name</Label><Input value={editAdminName} onChange={e => setEditAdminName(e.target.value)} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Admin Email</Label><Input type="email" value={editAdminEmail} onChange={e => setEditAdminEmail(e.target.value)} className="mt-1" /></div>
                <div><Label>Admin Phone</Label><Input type="tel" value={editAdminPhone} onChange={e => setEditAdminPhone(e.target.value)} className="mt-1" /></div>
              </div>
            </CardContent>
          </Card>

          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <Button className="w-full" style={{ backgroundColor: '#5B7DB1' }} onClick={handleSaveSettings}>Save All Changes</Button>

          {/* Activate / Deactivate */}
          <Card className={`border-2 ${institution.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                {institution.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-red-500" />}
                Account Status: {institution.isActive ? 'Active' : 'Deactivated'}
              </CardTitle>
              <CardDescription>
                {institution.isActive
                  ? 'Deactivating prevents new members from joining via the institution code. Existing member accounts are not affected.'
                  : 'Reactivate to allow new teachers and students to join using the institution code.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confirmDeactivate && institution.isActive && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Confirm deactivation? The institution code will stop working immediately for new joiners.</AlertDescription>
                </Alert>
              )}
              <Button
                variant={institution.isActive ? 'destructive' : 'default'}
                onClick={handleToggleActive}
                style={!institution.isActive ? { backgroundColor: '#1E8A6E' } : {}}
              >
                {institution.isActive
                  ? confirmDeactivate ? 'Confirm Deactivate' : 'Deactivate Institution'
                  : 'Reactivate Institution'}
              </Button>
              {confirmDeactivate && <Button variant="ghost" size="sm" className="ml-2" onClick={() => setConfirmDeactivate(false)}>Cancel</Button>}
            </CardContent>
          </Card>
        </>)}
      </div>
    </div>
  );
}
