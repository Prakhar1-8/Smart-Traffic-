import { useEffect, useState } from "react";
import { User, Mail, MapPin, Calendar, Phone, Shield, Edit2, Loader2, Save, X } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
};
import { getProfile, updateProfile } from "@/lib/api";
import { toast } from "sonner";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    location: ""
  });

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.success) {
        setProfile(res.data);
        setFormData({
          full_name: res.data.full_name || "",
          dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : "",
          gender: res.data.gender || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          location: res.data.location || ""
        });
      }
    } catch (err) {
      toast.error("Failed to load profile parameters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res.success) {
        setProfile(res.data);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to save profile changes.");
      }
    } catch (err) {
      toast.error("An error occurred updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-foreground flex items-center justify-center min-h-[50vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return <div className="p-6 text-destructive text-center">Identity resolution failed.</div>;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 text-foreground space-y-8 max-w-[1600px] mx-auto relative overflow-hidden bg-[#0c1324] min-h-[calc(100vh-4rem)]"
    >
      <div className="absolute inset-0 grid-bg pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30"></div>

      <motion.div variants={itemVariants} className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white/60 mb-2 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)] uppercase">
            User Identity Matrix
          </h1>
          <p className="text-xs font-['Inter'] text-white/50 tracking-widest uppercase drop-shadow-sm">Manage your centralized administrative profile metrics globally.</p>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 border border-border text-foreground/70 rounded-lg hover:bg-background-tertiary transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="col-span-1 glass-card border border-white/5 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)] ring-1 ring-primary/40">
             <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.username}</h2>
            <div className="flex items-center justify-center gap-2 text-sm mt-1 text-muted-foreground">
              <Shield className="w-4 h-4" /> Account Tier: <span className="uppercase font-semibold text-primary">{profile.role}</span>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 glass-card border border-white/5 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold border-b border-white/10 pb-3 text-white/90">Personal Parameters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><User className="w-4 h-4"/> Full Name</label>
              {isEditing ? (
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Enter name"/>
              ) : (
                <p className="font-medium text-foreground">{profile.full_name || "Unassigned"}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4"/> Date of Birth</label>
              {isEditing ? (
                <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"/>
              ) : (
                <p className="font-medium text-foreground">{formData.dob || "Unassigned"}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                 <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M12 11v11"/><path d="M8 15h8"/></svg> 
                 Gender Identity
              </label>
              {isEditing ? (
                <select value={formData.gender || ""} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="">Opt out of parameter</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="font-medium text-foreground">{profile.gender || "Unassigned"}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4"/> Email Address</label>
              {isEditing ? (
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="email@example.com"/>
              ) : (
                <p className="font-medium text-foreground">{profile.email || "Unassigned"}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4"/> Phone Number</label>
              {isEditing ? (
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="+1 234 567 8900"/>
              ) : (
                <p className="font-medium text-foreground">{profile.phone || "Unassigned"}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4"/> Location</label>
              {isEditing ? (
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="City, Region"/>
              ) : (
                <p className="font-medium text-foreground">{profile.location || "Unassigned"}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
